import assert from "node:assert/strict";
import test from "node:test";
import {
  getWritingRubricGuide,
  WRITING_RUBRIC_SOURCES,
} from "../src/data/writing-rubric-guide.js";

const languages = ["zh-CN", "en", "zh-TW", "ko"];

test("writing rubric guide supplies ten detailed criteria in every language", () => {
  for (const language of languages) {
    for (const [genre, maximum, uniqueKey] of [
      ["narrative", 47, "character_and_setting"],
      ["persuasive", 48, "persuasive_devices"],
    ]) {
      const guide = getWritingRubricGuide(language, genre);
      assert.equal(guide.maximum, maximum);
      assert.equal(guide.criteria.length, 10);
      assert.equal(guide.criteria.filter((criterion) => criterion.unique).length, 1);
      assert.ok(guide.criteria.some((criterion) => criterion.key === uniqueKey));
      assert.ok(guide.languageTitle);
      assert.ok(guide.sourceBody);
      for (const criterion of guide.criteria) {
        assert.ok(criterion.label);
        assert.ok(Number.isInteger(criterion.maximum));
        assert.ok(criterion.description.length > 35);
        assert.ok(criterion.higher.length >= 35);
      }
    }
  }
});

test("rubric citations point to official NAP source pages and guides", () => {
  assert.equal(WRITING_RUBRIC_SOURCES.length, 4);
  for (const source of WRITING_RUBRIC_SOURCES) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.ok(["www.nap.edu.au", "nap.edu.au"].includes(url.hostname));
  }
  assert.ok(WRITING_RUBRIC_SOURCES.some((source) => source.url.endsWith("/narrative-writing-marking-guide.pdf")));
  assert.ok(WRITING_RUBRIC_SOURCES.some((source) => source.url.endsWith("/persuasive-writing-marking-guide.pdf")));
});
