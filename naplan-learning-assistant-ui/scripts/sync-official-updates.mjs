#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const updatesPath = path.join(root, "src", "data", "official-updates.json");
const pagesPath = path.join(root, "src", "data", "official-pages.json");
const updates = JSON.parse(await readFile(updatesPath, "utf8"));

const allowedHosts = new Set(["www.nap.edu.au", "nap.edu.au", "www.acara.edu.au", "acara.edu.au"]);
const uniqueUrls = [...new Set(updates.items.map((item) => item.url))];

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    laquo: "«",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: "\"",
    raquo: "»",
    rdquo: "”",
    rsquo: "’",
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanInline(value) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " "),
  ).trim();
}

function extractMainText(html) {
  const main =
    html.match(/<section\b[^>]*class=["'][^"']*main-content-text[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] ??
    html.match(/<div\b[^>]*id=["']contentmain["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] ??
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;

  const reduced = main
    .replace(/<(script|style|noscript|svg|form|nav|footer|header|aside|iframe|video)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n# ${cleanInline(text)}\n`)
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n## ${cleanInline(text)}\n`)
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n### ${cleanInline(text)}\n`)
    .replace(/<h[4-6]\b[^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_, text) => `\n#### ${cleanInline(text)}\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${cleanInline(text)}`)
    .replace(/<\/t[hd]>/gi, " | ")
    .replace(/<\/(p|div|section|ul|ol|table|tbody|thead|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(reduced)
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line && !["top", "Print Page", "Email Page"].includes(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTitle(html, fallback) {
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return cleanInline(heading || title || fallback).replace(/\s*[-|]\s*(NAP|ACARA).*$/i, "").trim();
}

const pages = [];
for (const url of uniqueUrls) {
  const parsed = new URL(url);
  if (!allowedHosts.has(parsed.hostname)) throw new Error(`Refusing non-official host: ${parsed.hostname}`);

  if (parsed.pathname.toLowerCase().endsWith(".pdf")) {
    pages.push({
      url,
      source: parsed.hostname.includes("acara") ? "ACARA" : "NAP",
      content_type: "application/pdf",
      status: "linked-not-mirrored",
      note: "PDFs and excluded materials remain linked to the official source.",
    });
    continue;
  }

  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "NAPLAN-Learning-Assistant/1.0 (+local educational information sync)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);

  const html = await response.text();
  const text = extractMainText(html);
  const fallbackTitle = updates.items.find((item) => item.url === url)?.title?.en || url;
  pages.push({
    url,
    source: parsed.hostname.includes("acara") ? "ACARA" : "NAP",
    content_type: response.headers.get("content-type") || "text/html",
    status: "stored",
    title_en: extractTitle(html, fallbackTitle),
    fetched_at: new Date().toISOString(),
    last_modified: response.headers.get("last-modified"),
    content_hash: createHash("sha256").update(text).digest("hex"),
    character_count: text.length,
    text_en: text,
  });
}

const syncedAt = new Date().toISOString();
updates.synced_at = syncedAt;
for (const item of updates.items) {
  const page = pages.find((candidate) => candidate.url === item.url);
  item.source_snapshot = page
    ? {
        status: page.status,
        title_en: page.title_en ?? null,
        fetched_at: page.fetched_at ?? syncedAt,
        last_modified: page.last_modified ?? null,
        content_hash: page.content_hash ?? null,
        character_count: page.character_count ?? null,
      }
    : null;
}

await writeFile(updatesPath, `${JSON.stringify(updates, null, 2)}\n`, "utf8");
await writeFile(
  pagesPath,
  `${JSON.stringify(
    {
      schema_version: 1,
      synced_at: syncedAt,
      attribution:
        "© Australian Curriculum, Assessment and Reporting Authority (ACARA) 2011 to present, unless otherwise indicated. Source material from the National Assessment Program and ACARA websites, accessed at the fetched_at dates, used under CC BY 4.0. This independent product is not endorsed by or affiliated with ACARA.",
      licence_url: "https://www.nap.edu.au/copyright",
      excluded_materials:
        "Logos, photographs, videos, past/example NAPLAN questions, writing prompts, reading stimuli, writing marking guides, online demonstration tests, SSSR guides and example ISRs are not mirrored.",
      pages,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Synced ${pages.filter((page) => page.status === "stored").length} official HTML pages.`);
console.log(`Linked ${pages.filter((page) => page.status !== "stored").length} non-HTML or excluded resources.`);
