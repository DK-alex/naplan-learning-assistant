#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesPath = path.join(root, "src", "data", "official-pages.json");
const translationsPath = path.join(root, "src", "data", "official-page-translations.json");
const pages = JSON.parse(await readFile(pagesPath, "utf8"));
const targets = ["zh-CN", "zh-TW", "ko"];
const maxBatchLength = 3_200;
const concurrency = 4;
const generatorRevision = 2;
const preferredTranslations = {
  Domain: { "zh-CN": "领域", "zh-TW": "領域", ko: "영역" },
  Developing: { "zh-CN": "发展中", "zh-TW": "發展中", ko: "발달 중" },
  Exceeding: { "zh-CN": "超出标准", "zh-TW": "超出標準", ko: "기대 초과" },
  "Grammar and Punctuation": { "zh-CN": "语法与标点", "zh-TW": "文法與標點", ko: "문법 및 구두점" },
  "Needs additional support": { "zh-CN": "需要额外支持", "zh-TW": "需要額外支援", ko: "추가 지원 필요" },
  Numeracy: { "zh-CN": "数学", "zh-TW": "數學", ko: "수리력" },
  Reading: { "zh-CN": "阅读", "zh-TW": "閱讀", ko: "읽기" },
  Scales: { "zh-CN": "量表", "zh-TW": "量表", ko: "척도" },
  Spelling: { "zh-CN": "拼写", "zh-TW": "拼字", ko: "철자" },
  Strong: { "zh-CN": "达到标准", "zh-TW": "達到標準", ko: "기대 충족" },
  Writing: { "zh-CN": "写作", "zh-TW": "寫作", ko: "쓰기" },
  Year: { "zh-CN": "年级", "zh-TW": "年級", ko: "학년" },
  "transcript (PDF 130 KB)": {
    "zh-CN": "文字稿（PDF 130 KB）",
    "zh-TW": "文字稿（PDF 130 KB）",
    ko: "대본 (PDF 130 KB)",
  },
};

let existing = { pages: [] };
try {
  existing = JSON.parse(await readFile(translationsPath, "utf8"));
} catch {
  // The first structured translation run starts without a cache.
}

function collectRuns(block, output) {
  for (const key of ["runs", "title_runs", "caption_runs", "summary_runs", "term_runs"]) {
    if (Array.isArray(block[key])) output.push(...block[key]);
  }
  if (Array.isArray(block.description_runs)) {
    for (const runs of block.description_runs) output.push(...runs);
  }
  if (Array.isArray(block.items)) {
    for (const item of block.items) {
      output.push(...(item.runs || []));
      for (const child of item.children || []) collectRuns(child, output);
    }
  }
  if (Array.isArray(block.rows)) {
    for (const row of block.rows) {
      for (const cell of row) output.push(...(cell.runs || []));
    }
  }
  if (Array.isArray(block.entries)) {
    for (const entry of block.entries) {
      output.push(...(entry.term_runs || []));
      for (const runs of entry.description_runs || []) output.push(...runs);
    }
  }
  for (const child of block.blocks || []) collectRuns(child, output);
}

function getSourceStrings(page) {
  const runs = [];
  for (const block of page.document?.blocks || []) collectRuns(block, runs);
  return runs
    .filter((run) => run.id && run.text?.trim())
    .map((run) => ({ id: run.id, text: run.text }));
}

function marker(id) {
  return `[[[${id}]]]`;
}

function createBatches(units) {
  const batches = [];
  let current = [];
  let currentLength = 0;

  for (const unit of units) {
    const encodedLength = marker(unit.id).length + unit.text.length + 2;
    if (current.length && currentLength + encodedLength > maxBatchLength) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(unit);
    currentLength += encodedLength;
  }
  if (current.length) batches.push(current);
  return batches;
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

function parseTranslatedBatch(translated, batch) {
  const expectedIds = new Set(batch.map((unit) => unit.id));
  const values = {};
  const expression = /\[\[\[(s\d{5})\]\]\]\s*([\s\S]*?)(?=\[\[\[s\d{5}\]\]\]|$)/g;
  for (const match of translated.matchAll(expression)) {
    if (!expectedIds.has(match[1])) continue;
    const value = match[2].trim();
    if (value) values[match[1]] = value;
  }
  return values;
}

async function translateBatch(batch, target) {
  const input = batch.map((unit) => `${marker(unit.id)}\n${unit.text}`).join("\n");
  const translated = await translateChunk(input, target);
  const parsed = parseTranslatedBatch(translated, batch);

  for (const unit of batch) {
    if (parsed[unit.id]) continue;
    parsed[unit.id] = (await translateChunk(unit.text, target)).trim();
  }
  return parsed;
}

async function translateStrings(units, target) {
  const output = {};
  const toTranslate = [];
  for (const unit of units) {
    const preferred = preferredTranslations[unit.text]?.[target];
    if (preferred) {
      output[unit.id] = preferred;
    } else if (!/[A-Za-z]/.test(unit.text)) {
      output[unit.id] = unit.text;
    } else {
      toTranslate.push(unit);
    }
  }
  for (const batch of createBatches(toTranslate)) {
    Object.assign(output, await translateBatch(batch, target));
  }
  return output;
}

function hasCompleteCache(strings, sourceUnits) {
  return (
    strings &&
    sourceUnits.length > 0 &&
    sourceUnits.every((unit) => typeof strings[unit.id] === "string" && strings[unit.id].trim())
  );
}

const jobs = [];
const outputByUrl = new Map();
for (const page of pages.pages.filter((candidate) => candidate.status === "stored")) {
  const sourceUnits = getSourceStrings(page);
  if (!sourceUnits.length) throw new Error(`No translatable strings in ${page.url}`);

  const cached = existing.pages?.find(
    (candidate) =>
      candidate.url === page.url &&
      candidate.source_hash === page.content_hash &&
      candidate.generator_revision === generatorRevision,
  );
  const output = {
    url: page.url,
    source_hash: page.content_hash,
    generator_revision: generatorRevision,
    generated_at: cached?.generated_at || null,
    strings: { ...(cached?.strings || {}) },
  };
  outputByUrl.set(page.url, output);

  for (const target of targets) {
    if (hasCompleteCache(output.strings[target], sourceUnits)) continue;
    jobs.push(async () => {
      output.strings[target] = await translateStrings(sourceUnits, target);
      output.generated_at = new Date().toISOString();
      console.log(`Translated ${page.title_en} → ${target} (${sourceUnits.length} strings)`);
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

for (const page of pages.pages.filter((candidate) => candidate.status === "stored")) {
  const translated = outputByUrl.get(page.url);
  const sourceUnits = getSourceStrings(page);
  for (const target of targets) {
    if (!hasCompleteCache(translated.strings[target], sourceUnits)) {
      throw new Error(`Missing ${target} structured translations for ${page.url}`);
    }
  }
}

await writeFile(
  translationsPath,
  `${JSON.stringify(
    {
      schema_version: 2,
      generator_revision: generatorRevision,
      generated_at: new Date().toISOString(),
      source_snapshot: "official-pages.json",
      method:
        "Machine translation generated for the visible text units in the stored structured English source snapshot. Link targets and remote media URLs are never translated.",
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

console.log(`Stored structured translations for ${translatedPages.length} official pages.`);
