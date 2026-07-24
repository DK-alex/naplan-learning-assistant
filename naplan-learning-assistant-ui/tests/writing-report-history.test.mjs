import assert from "node:assert/strict";
import test from "node:test";
import {
  getWritingReportById,
  getWritingReportVersion,
  readWritingReports,
  saveWritingReport,
} from "../src/ai/client.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

function createRecord(index, overrides = {}) {
  const language = overrides.language || "zh-CN";
  return {
    id: `review-${index}`,
    practice_id: "writing-practice-1",
    prompt_title: `Writing review ${index}`,
    year_level: 5,
    generated_at: new Date(Date.UTC(2026, 6, 1, 0, index)).toISOString(),
    report: {
      report_language: language,
      genre: "narrative",
      total_score: index,
      maximum_score: 47,
    },
    ...overrides,
  };
}

test.beforeEach(() => {
  globalThis.window = {
    localStorage: createStorage(),
    sessionStorage: createStorage(),
  };
});

test.after(() => {
  delete globalThis.window;
});

test("keeps every review attempt even when many reports use the same practice record", () => {
  for (let index = 0; index < 25; index += 1) {
    saveWritingReport(createRecord(index));
  }

  const reports = readWritingReports();
  assert.equal(reports.length, 25);
  assert.equal(reports[0].id, "review-24");
  assert.equal(reports.at(-1).id, "review-0");
  assert.equal(getWritingReportById("review-12").prompt_title, "Writing review 12");
});

test("stores configured-language and English reports on the same history item", () => {
  const record = createRecord(1);
  const saved = saveWritingReport({
    ...record,
    report_versions: {
      "zh-CN": record.report,
      en: { ...record.report, report_language: "en" },
    },
  });

  assert.equal(getWritingReportVersion(saved, "zh-CN").report_language, "zh-CN");
  assert.equal(getWritingReportVersion(saved, "en").report_language, "en");
  assert.equal(readWritingReports().length, 1);
});
