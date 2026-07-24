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

test("full official HTML pages are stored with provenance", () => {
  const stored = pages.pages.filter((page) => page.status === "stored");
  assert.ok(stored.length >= 10);
  assert.ok(stored.reduce((total, page) => total + page.character_count, 0) >= 100_000);
  for (const page of stored) {
    assert.ok(page.text_en.length === page.character_count);
    assert.match(page.content_hash, /^[a-f0-9]{64}$/);
    assert.ok(page.fetched_at);
  }
  assert.match(pages.attribution, /ACARA/);
  assert.match(pages.licence_url, /nap\.edu\.au\/copyright/);
});

test("stored official pages have current machine translations in every supported reader language", () => {
  const stored = pages.pages.filter((page) => page.status === "stored");
  assert.equal(translations.pages.length, stored.length);

  for (const page of stored) {
    const translated = translations.pages.find((candidate) => candidate.url === page.url);
    assert.ok(translated, `Missing translations for ${page.url}`);
    assert.equal(translated.source_hash, page.content_hash, `Stale translations for ${page.url}`);
    for (const language of ["zh-CN", "zh-TW", "ko"]) {
      assert.ok(translated.text[language]?.length >= 100, `${page.url} ${language}`);
    }
  }
});
