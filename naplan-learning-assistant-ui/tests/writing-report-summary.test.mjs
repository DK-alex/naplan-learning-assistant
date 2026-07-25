import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getLatestWritingReportSummary } from "../src/data/writing-report-summary.js";

const stylesPath = fileURLToPath(new URL("../src/styles.css", import.meta.url));

function reportRecord({
  id,
  generatedAt,
  total,
  maximum = 47,
  genre = "narrative",
}) {
  return {
    practice_id: id,
    generated_at: generatedAt,
    report: {
      status: "scorable",
      genre,
      total_score: total,
      maximum_score: maximum,
      criteria: [
        ["audience", 4, 6],
        ["text_structure", 3, 4],
        ["ideas", 4, 5],
        ["character_and_setting", 3, 4],
        ["vocabulary", 4, 5],
        ["cohesion", 3, 4],
        ["paragraphing", 2, 2],
        ["sentence_structure", 5, 6],
        ["punctuation", 4, 5],
        ["spelling", 5, 6],
      ].map(([key, score, maxScore]) => ({ key, score, max_score: maxScore })),
    },
  };
}

test("latest writing summary is selected by generation time", () => {
  const summary = getLatestWritingReportSummary([
    reportRecord({ id: "older", generatedAt: "2026-07-20T10:00:00Z", total: 30 }),
    reportRecord({ id: "latest", generatedAt: "2026-07-24T10:00:00Z", total: 36 }),
  ]);

  assert.equal(summary.record.practice_id, "latest");
  assert.equal(summary.report.total_score, 36);
  assert.equal(summary.scoreDelta, 6);
  assert.deepEqual(summary.criteria.map((criterion) => criterion.key), [
    "ideas",
    "text_structure",
    "vocabulary",
    "sentence_structure",
    "punctuation",
    "spelling",
  ]);
});

test("comparison is omitted when the previous report uses another rubric maximum", () => {
  const summary = getLatestWritingReportSummary([
    reportRecord({ id: "persuasive", generatedAt: "2026-07-24T10:00:00Z", total: 36, maximum: 48, genre: "persuasive" }),
    reportRecord({ id: "narrative", generatedAt: "2026-07-23T10:00:00Z", total: 35 }),
  ]);

  assert.equal(summary.scoreDelta, null);
  assert.equal(summary.previousComparable, undefined);
});

test("empty or invalid report collections return no summary", () => {
  assert.equal(getLatestWritingReportSummary([]), null);
  assert.equal(getLatestWritingReportSummary([{ generated_at: "2026-07-24T10:00:00Z" }]), null);
});

test("dashboard writing report action keeps breathing room above the card edge", () => {
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(
    styles,
    /\.report-card-footer \.report-action\s*\{\s*margin-bottom:\s*12px;\s*\}/,
  );
});
