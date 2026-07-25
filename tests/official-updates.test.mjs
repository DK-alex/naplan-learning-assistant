import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const updates = JSON.parse(await readFile(new URL("src/data/official-updates.json", root), "utf8"));
const pages = JSON.parse(await readFile(new URL("src/data/official-pages.json", root), "utf8"));
const translations = JSON.parse(
  await readFile(new URL("src/data/official-page-translations.json", root), "utf8"),
);
const languages = ["zh-CN", "en", "zh-TW", "ko"];
const allowedHosts = new Set(["www.nap.edu.au", "nap.edu.au", "www.acara.edu.au", "acara.edu.au"]);

function collectDocumentContent(block, output) {
  output.blocks.push(block);
  for (const key of ["runs", "title_runs", "caption_runs", "summary_runs", "term_runs"]) {
    if (Array.isArray(block[key])) output.runs.push(...block[key]);
  }
  for (const runs of block.description_runs || []) output.runs.push(...runs);
  for (const item of block.items || []) {
    output.runs.push(...(item.runs || []));
    for (const child of item.children || []) collectDocumentContent(child, output);
  }
  for (const row of block.rows || []) {
    for (const cell of row) output.runs.push(...(cell.runs || []));
  }
  for (const entry of block.entries || []) {
    output.runs.push(...(entry.term_runs || []));
    for (const runs of entry.description_runs || []) output.runs.push(...runs);
  }
  for (const child of block.blocks || []) collectDocumentContent(child, output);
}

function getDocumentContent(page) {
  const output = { blocks: [], runs: [] };
  for (const block of page.document?.blocks || []) collectDocumentContent(block, output);
  return output;
}

test("official update cards are localised and point only to official hosts", () => {
  assert.ok(updates.items.length >= 15);
  for (const item of updates.items) {
    assert.ok(allowedHosts.has(new URL(item.url).hostname), item.url);
    for (const language of languages) {
      assert.ok(item.title[language]?.trim(), `${item.id} title ${language}`);
      assert.ok(item.summary[language]?.trim(), `${item.id} summary ${language}`);
    }
  }
});

test("every update has a stored page snapshot or an explicit link-only record", () => {
  for (const item of updates.items) {
    const page = pages.pages.find((candidate) => candidate.url === item.url);
    assert.ok(page, `Missing source snapshot for ${item.id}`);
    assert.ok(["stored", "linked-not-mirrored"].includes(page.status));
  }
});

test("full official HTML pages are stored as structured documents with provenance", () => {
  assert.equal(pages.schema_version, 2);
  const stored = pages.pages.filter((page) => page.status === "stored");
  assert.ok(stored.length >= 10);
  assert.ok(stored.reduce((total, page) => total + page.character_count, 0) >= 100_000);

  for (const page of stored) {
    const content = getDocumentContent(page);
    assert.equal(page.document.schema_version, 1);
    assert.ok(page.document.source_root);
    assert.ok(content.blocks.length >= 2, page.url);
    assert.equal(page.block_count, page.document.blocks.length, `${page.url} top-level block count`);
    assert.equal(
      content.runs.filter((run) => run.id?.startsWith("s")).length,
      page.document.string_count,
      `${page.url} string count`,
    );
    assert.equal(new Set(content.runs.map((run) => run.id)).size, content.runs.length, `${page.url} string ids`);
    assert.match(page.content_hash, /^[a-f0-9]{64}$/);
    assert.ok(page.fetched_at);
    assert.equal(page.text_en.length, page.character_count);
  }
  assert.match(pages.attribution, /ACARA/);
  assert.match(pages.licence_url, /nap\.edu\.au\/copyright/);
  assert.match(pages.excluded_materials, /not stored locally/i);
});

test("official layout semantics, translated link labels and original link targets are retained", () => {
  const resultsPage = pages.pages.find((page) => page.url.endsWith("/naplan/results-and-reports"));
  assert.ok(resultsPage);
  const content = getDocumentContent(resultsPage);
  const headingText = content.blocks
    .filter((block) => block.type === "heading")
    .map((block) => (block.runs || []).map((run) => run.text).join(""));
  assert.ok(resultsPage.character_count > 10_000);
  assert.ok(content.blocks.some((block) => block.type === "heading" && block.level === 2));
  assert.ok(content.blocks.some((block) => block.type === "list"));
  assert.ok(content.blocks.some((block) => block.type === "table"));
  assert.ok(headingText.includes("NAPLAN 2026 results"));
  assert.ok(headingText.includes("NAPLAN technical reports"));
  assert.ok(headingText.includes("Past NAPLAN national reports"));

  const links = content.runs.filter((run) => run.type === "link");
  assert.ok(links.length >= 70);
  for (const link of links) {
    assert.ok(["http:", "https:", "mailto:", "tel:"].includes(new URL(link.href).protocol));
  }

  const translated = translations.pages.find((page) => page.url === resultsPage.url);
  const nationalResultsLink = links.find((link) => /NAPLAN national results/i.test(link.text));
  assert.ok(nationalResultsLink);
  assert.ok(translated.strings["zh-CN"][nationalResultsLink.id]);
  assert.notEqual(translated.strings["zh-CN"][nationalResultsLink.id], nationalResultsLink.text);
  assert.match(nationalResultsLink.href, /^https?:\/\//);
});

test("embedded video keeps only its remote playback URL and is marked for in-app playback", () => {
  const resultsPage = pages.pages.find((page) => page.url.endsWith("/naplan/results-and-reports"));
  const media = getDocumentContent(resultsPage).blocks.filter((block) => block.type === "media");
  const video = media.find((block) => block.media_kind === "video-embed");
  assert.ok(video, "Expected the official individual student report video");
  assert.equal(video.provider, "youtube");
  assert.equal(video.playable_inline, true);
  assert.equal(video.stored_locally, false);
  assert.match(video.src, /^https:\/\/www\.youtube\.com\/embed\//);
  assert.doesNotMatch(video.src, /^(file:|data:|blob:)/);

  for (const page of pages.pages.filter((candidate) => candidate.status === "stored")) {
    const allMedia = getDocumentContent(page).blocks.filter((block) => block.type === "media");
    for (const entry of allMedia) {
      assert.equal(entry.stored_locally, false);
      assert.match(entry.src, /^https:\/\//);
    }
  }
});

test("stored official pages have current structured translations for every visible string", () => {
  assert.equal(translations.schema_version, 2);
  const stored = pages.pages.filter((page) => page.status === "stored");
  assert.equal(translations.pages.length, stored.length);

  for (const page of stored) {
    const translated = translations.pages.find((candidate) => candidate.url === page.url);
    const sourceRuns = getDocumentContent(page).runs.filter((run) => run.id?.startsWith("s"));
    assert.ok(translated, `Missing translations for ${page.url}`);
    assert.equal(translated.source_hash, page.content_hash, `Stale translations for ${page.url}`);
    for (const language of ["zh-CN", "zh-TW", "ko"]) {
      assert.equal(
        Object.keys(translated.strings[language]).length,
        sourceRuns.length,
        `${page.url} ${language} string count`,
      );
      for (const run of sourceRuns) {
        assert.ok(translated.strings[language][run.id]?.trim(), `${page.url} ${language} ${run.id}`);
        if (!/[A-Za-z]/.test(run.text)) {
          assert.equal(
            translated.strings[language][run.id],
            run.text,
            `${page.url} ${language} preserves non-language value ${run.id}`,
          );
        }
      }
    }
  }
  assert.match(translations.method, /Link targets and remote media URLs are never translated/);
});
