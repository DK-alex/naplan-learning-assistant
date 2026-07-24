import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getWritingPromptCatalog, WRITING_PROMPT_RESEARCH } from "../content/naplan-bank/scripts/writing-prompt-catalog.mjs";

const YEARS = [3, 5, 7, 9];
const PUBLIC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

test("writing catalog contains 100 complete prompts for every year", () => {
  for (const year of YEARS) {
    const prompts = getWritingPromptCatalog(year);
    assert.equal(prompts.length, 100);
    assert.equal(prompts.filter((item) => item.genre === "narrative").length, 50);
    assert.equal(prompts.filter((item) => item.genre === "persuasive").length, 50);
    assert.equal(new Set(prompts.map((item) => item.title)).size, 100);

    for (const item of prompts) {
      assert.ok(item.task.length >= 45, `${item.catalog_id} task is incomplete`);
      assert.ok(item.context.length >= 120, `${item.catalog_id} context is incomplete`);
      assert.ok(item.instructions.length >= 60, `${item.catalog_id} year guidance is incomplete`);
      assert.equal(item.idea_starters.length, 4, `${item.catalog_id} needs four idea starters`);
      assert.ok(item.remember.length >= 5, `${item.catalog_id} needs an editing checklist`);
      assert.match(item.image.src, new RegExp(`/year-${year}/.+\\.webp$`));
      assert.ok(item.image.alt_text.length >= 40);
      assert.ok(item.image.generation_prompt.length >= 180);
      assert.match(item.image.generation_prompt, /No words, letters, numbers, logos, watermarks/);
      assert.equal(item.image.generation_method, "built-in image_gen");
      assert.equal(item.image.status, "generated");
      const imagePath = path.join(PUBLIC_ROOT, item.image.src.replace(/^\//, ""));
      assert.ok(existsSync(imagePath), `${item.catalog_id} image is missing: ${imagePath}`);
      assert.ok(statSync(imagePath).size >= 30 * 1024, `${item.catalog_id} image file is unexpectedly small`);
    }
  }
});

test("writing demand and wording change at every year level", () => {
  const byYear = Object.fromEntries(YEARS.map((year) => [year, getWritingPromptCatalog(year)]));

  for (let index = 0; index < 100; index += 1) {
    const family = YEARS.map((year) => byYear[year][index]);
    assert.equal(new Set(family.map((item) => item.title)).size, 4);
    assert.equal(new Set(family.map((item) => item.task)).size, 4);
    assert.equal(new Set(family.map((item) => item.context)).size, 4);
    assert.equal(new Set(family.map((item) => item.instructions)).size, 4);
    assert.equal(new Set(family.map((item) => item.idea_starters.join("|"))).size, 4);
  }

  assert.match(byYear[3][0].instructions, /clear events in order/i);
  assert.match(byYear[9][0].instructions, /thematic meaning/i);
  assert.match(byYear[3][50].instructions, /clear conclusion/i);
  assert.match(byYear[9][50].instructions, /qualify claims/i);
});

test("all 400 image bindings are unique and traceable to the official structural research", () => {
  const prompts = YEARS.flatMap((year) => getWritingPromptCatalog(year));
  assert.equal(new Set(prompts.map((item) => item.image.asset_id)).size, 400);
  assert.equal(new Set(prompts.map((item) => item.image.src)).size, 400);
  assert.match(WRITING_PROMPT_RESEARCH.official_source, /^https:\/\/www\.acara\.edu\.au\//);
  assert.equal(WRITING_PROMPT_RESEARCH.reviewed_prompt_sets.length, 7);
  assert.ok(WRITING_PROMPT_RESEARCH.design_principles.some((principle) => /do not reproduce/i.test(principle)));
});
