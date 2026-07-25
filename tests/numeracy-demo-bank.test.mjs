import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spreadNumeracyDemoTypes } from "../src/exam/questionBank.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedTypes = { 3: 11, 5: 13, 7: 14, 9: 14 };

function readJsonLines(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function demoType(item) {
  return item.tags?.find((tag) => /^Y[3579]-\d{2}-/.test(tag));
}

test("official-demo numeracy catalogue records every reviewed item slot", () => {
  const document = JSON.parse(fs.readFileSync(
    path.join(root, "content", "naplan-bank", "numeracy-demo-type-catalog.json"),
    "utf8",
  ));
  const catalogue = document.types;

  assert.equal(document.total_demo_items_reviewed, 52);
  assert.equal(document.variants_per_type, 40);
  assert.equal(catalogue.length, 52);
  for (const [year, count] of Object.entries(expectedTypes)) {
    const rows = catalogue.filter((entry) => entry.year === Number(year));
    assert.equal(rows.length, count);
    assert.deepEqual(rows.map((entry) => entry.demo_item), Array.from({ length: count }, (_, index) => index + 1));
  }
  assert.ok(catalogue.every((entry) => entry.variants_required === 40));
  assert.ok(catalogue.every((entry) => entry.skill && entry.interaction && entry.visual_pattern));
});

test("each reviewed numeracy type has exactly 40 original visual questions", () => {
  for (const year of Object.keys(expectedTypes)) {
    const questions = readJsonLines(path.join(
      root,
      "content",
      "naplan-bank",
      "questions",
      `year-${year}.jsonl`,
    )).filter((item) => item.domain === "numeracy");

    const counts = new Map();
    for (const item of questions) {
      const type = demoType(item);
      assert.ok(type, `${item.id} should identify its reviewed demo type`);
      counts.set(type, (counts.get(type) ?? 0) + 1);
      assert.equal(item.provenance.original_item, true);
      assert.equal(item.provenance.official_item, false);
      assert.ok(item.stimulus?.visual?.answer_critical, `${item.id} should include an answer-critical visual`);
      assert.ok(item.media?.some((asset) => asset.answer_critical), `${item.id} should expose accessible visual media`);
      assert.ok(item.accessibility?.keyboard_complete, `${item.id} should be keyboard complete`);
    }

    assert.equal(counts.size, expectedTypes[year]);
    assert.ok([...counts.values()].every((count) => count === 40));
  }
});

test("rebuilt numeracy bank preserves a broad mix of response interactions", () => {
  const interactions = new Set();
  for (const year of Object.keys(expectedTypes)) {
    const questions = readJsonLines(path.join(
      root,
      "content",
      "naplan-bank",
      "questions",
      `year-${year}.jsonl`,
    )).filter((item) => item.domain === "numeracy");
    questions.forEach((item) => interactions.add(item.answer.type));
  }

  assert.deepEqual(
    [...interactions].sort(),
    ["drag_drop", "matrix", "multiple_select", "single_choice", "text"].sort(),
  );
});

test("Years 7 and 9 retain distinct non-calculator and calculator pools", () => {
  for (const year of [7, 9]) {
    const questions = readJsonLines(path.join(
      root,
      "content",
      "naplan-bank",
      "questions",
      `year-${year}.jsonl`,
    )).filter((item) => item.domain === "numeracy");

    assert.ok(questions.some((item) => item.calculator === "not_allowed"));
    assert.ok(questions.some((item) => item.calculator === "allowed"));
    assert.ok(questions
      .filter((item) => item.calculator === "not_allowed")
      .every((item) => Number(demoType(item).slice(3, 5)) <= 4));
  }
});

test("practice ordering exhausts a full type round before repeating a type", () => {
  const items = ["A", "B", "C", "D"].flatMap((type) => (
    Array.from({ length: 3 }, (_, index) => ({
      id: `${type}-${index}`,
      skill: type,
      tags: [`Y3-0${"ABCD".indexOf(type) + 1}-${type}`],
    }))
  ));

  const ordered = spreadNumeracyDemoTypes(items, 271828);
  for (let offset = 0; offset < ordered.length; offset += 4) {
    const round = ordered.slice(offset, offset + 4).map(demoType);
    assert.equal(new Set(round).size, round.length);
  }
  for (let index = 1; index < ordered.length; index += 1) {
    assert.notEqual(demoType(ordered[index]), demoType(ordered[index - 1]));
  }
});

test("Year 3 picture-count matching uses four small original pictogram groups", () => {
  const questions = readJsonLines(path.join(
    root,
    "content",
    "naplan-bank",
    "questions",
    "year-3.jsonl",
  )).filter((item) => demoType(item) === "Y3-06-match-collections-to-numbers");

  assert.equal(questions.length, 40);
  for (const item of questions) {
    const parameters = item.stimulus.visual.parameters;
    assert.equal(parameters.scene, "collection_rows");
    assert.equal(parameters.counts.length, 4);
    assert.equal(new Set(parameters.counts).size, 4);
    assert.ok(parameters.counts.every((count) => count >= 2 && count <= 9));
    assert.equal(parameters.row_objects.length, 4);
    assert.equal(new Set(parameters.row_objects).size, 4);
    assert.equal(item.answer.targets.length, 4);
    assert.equal(item.options.length, 4);
  }
});

test("Year 3 informal-unit comparison shows two measured objects and a sentence choice", () => {
  const questions = readJsonLines(path.join(
    root,
    "content",
    "naplan-bank",
    "questions",
    "year-3.jsonl",
  )).filter((item) => demoType(item) === "Y3-08-compare-lengths-uniform-units");

  assert.equal(questions.length, 40);
  const relationships = new Set();
  for (const item of questions) {
    const parameters = item.stimulus.visual.parameters;
    relationships.add(item.answer.display);
    assert.equal(item.item_type, "inline_choice");
    assert.equal(parameters.scene, "informal_units");
    assert.ok(parameters.a >= 4 && parameters.a <= 10);
    assert.ok(parameters.b >= 4 && parameters.b <= 10);
    assert.ok(parameters.left_label.includes("'s"));
    assert.ok(parameters.right_label.includes("'s"));
    assert.ok(["paperclips", "blocks", "buttons", "tiles"].includes(parameters.unit));
    assert.deepEqual(
      item.options.map((option) => option.text).sort(),
      ["longer than", "shorter than", "the same length as"].sort(),
    );
  }
  assert.deepEqual(
    [...relationships].sort(),
    ["longer than", "shorter than", "the same length as"].sort(),
  );
});

test("Year 3 composite-shape questions use clickable seven-piece mosaics", () => {
  const questions = readJsonLines(path.join(
    root,
    "content",
    "naplan-bank",
    "questions",
    "year-3.jsonl",
  )).filter((item) => demoType(item) === "Y3-10-identify-shapes-in-composite");

  assert.equal(questions.length, 40);
  assert.deepEqual(
    [...new Set(questions.map((item) => item.stimulus.visual.parameters.layout))].sort(),
    ["bird", "house", "rocket", "sailboat"],
  );
  for (const item of questions) {
    const parameters = item.stimulus.visual.parameters;
    assert.equal(item.item_type, "multiple_select");
    assert.equal(parameters.scene, "tangram_puzzle");
    assert.equal(parameters.pieces.length, 7);
    assert.equal(parameters.pieces.filter((piece) => piece.shape === "triangle").length, 5);
    assert.equal(parameters.pieces.filter((piece) => piece.shape === "square").length, 1);
    assert.equal(parameters.pieces.filter((piece) => piece.shape === "parallelogram").length, 1);
    assert.equal(item.answer.values.length, 5);
    assert.equal(item.interaction.max_selections, 5);
  }
});

test("Year 3 complement pairing uses six dice and three total-seven pairs", () => {
  const questions = readJsonLines(path.join(
    root,
    "content",
    "naplan-bank",
    "questions",
    "year-3.jsonl",
  )).filter((item) => demoType(item) === "Y3-11-pair-complements-to-target");

  assert.equal(questions.length, 40);
  for (const item of questions) {
    const parameters = item.stimulus.visual.parameters;
    assert.equal(item.item_type, "drag_and_drop");
    assert.equal(parameters.scene, "dice_pairing");
    assert.deepEqual(parameters.faces, [1, 2, 3, 4, 5, 6]);
    assert.equal(parameters.target, 7);
    assert.equal(item.options.length, 6);
    assert.equal(item.answer.targets.length, 6);
    assert.equal(Object.keys(item.answer.placements).length, 6);
    const optionById = new Map(item.options.map((option) => [option.id, Number(option.text)]));
    for (let pair = 0; pair < 3; pair += 1) {
      const left = optionById.get(item.answer.placements[`target_${pair * 2 + 1}`]);
      const right = optionById.get(item.answer.placements[`target_${pair * 2 + 2}`]);
      assert.equal(left + right, 7);
    }
  }
});
