#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesPath = path.join(root, "src", "data", "official-pages.json");
const translationsPath = path.join(root, "src", "data", "official-page-translations.json");
const pages = JSON.parse(await readFile(pagesPath, "utf8"));
const targets = ["zh-CN", "zh-TW", "ko"];
const maxChunkLength = 3_500;
const concurrency = 4;

let existing = { pages: [] };
try {
  existing = JSON.parse(await readFile(translationsPath, "utf8"));
} catch {
  // The first translation run starts without a cache.
}

function splitText(text) {
  const lines = text.split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= maxChunkLength) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);
    if (line.length <= maxChunkLength) {
      current = line;
      continue;
    }

    for (let index = 0; index < line.length; index += maxChunkLength) {
      chunks.push(line.slice(index, index + maxChunkLength));
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk, target) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", chunk);

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "NAPLAN-Learning-Assistant/1.0 (static translation build)" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const payload = await response.json();
      const translated = payload?.[0]?.map((segment) => segment?.[0] || "").join("") || "";
      if (!translated.trim()) throw new Error("Translation response was empty.");
      return translated;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function translateText(text, target) {
  const chunks = splitText(text);
  const output = [];
  for (const chunk of chunks) output.push(await translateChunk(chunk, target));
  return output.join("\n");
}

function applyEditorialCorrections(text, target) {
  const replacements = {
    "zh-CN": [
      ["## NAPLAN 测试将于 2026 年结束", "## 2026 年 NAPLAN 测试顺利结束"],
      ["读写和算数技能", "读写与计算能力"],
    ],
    "zh-TW": [
      ["## NAPLAN 測試將於 2026 年結束", "## 2026 年 NAPLAN 測試順利結束"],
      ["讀寫和算數技能", "讀寫與計算能力"],
    ],
    ko: [
      ["## NAPLAN 테스트는 2026년에 종료됩니다", "## 2026년 NAPLAN 시험 종료"],
    ],
  };

  return (replacements[target] || []).reduce(
    (output, [source, replacement]) => output.replaceAll(source, replacement),
    text,
  );
}

const jobs = [];
const outputByUrl = new Map();
for (const page of pages.pages.filter((candidate) => candidate.status === "stored")) {
  const cached = existing.pages?.find(
    (candidate) => candidate.url === page.url && candidate.source_hash === page.content_hash,
  );
  const output = {
    url: page.url,
    source_hash: page.content_hash,
    generated_at: cached?.generated_at || null,
    text: { ...(cached?.text || {}) },
  };
  outputByUrl.set(page.url, output);

  for (const target of targets) {
    if (output.text[target]?.trim()) continue;
    jobs.push(async () => {
      output.text[target] = await translateText(page.text_en, target);
      output.generated_at = new Date().toISOString();
      console.log(`Translated ${page.title_en} → ${target}`);
    });
  }
}

let cursor = 0;
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor];
    cursor += 1;
    await job();
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length || 1) }, () => worker()));

const translatedPages = pages.pages
  .filter((page) => page.status === "stored")
  .map((page) => outputByUrl.get(page.url));

for (const page of translatedPages) {
  for (const target of targets) {
    page.text[target] = applyEditorialCorrections(page.text[target], target);
    const translated = page.text[target];
    if (!translated || translated.length < 100) {
      throw new Error(`Missing or unexpectedly short ${target} translation for ${page.url}`);
    }
  }
}

await writeFile(
  translationsPath,
  `${JSON.stringify(
    {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      source_snapshot: "official-pages.json",
      method: "Machine translation generated from the stored English source snapshot.",
      notice:
        "Translations are provided for convenience. The stored English source and the linked official NAP or ACARA page remain authoritative.",
      languages: targets,
      pages: translatedPages,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Stored translations for ${translatedPages.length} official pages.`);
