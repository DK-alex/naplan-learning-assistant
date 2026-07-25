import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getWritingReportTemplateById,
  WRITING_REPORT_TEMPLATE_ASSET,
  WRITING_REPORT_TEMPLATE_ID,
  WRITING_REPORT_TEMPLATE_RECORD,
} from "../src/data/writing-report-template.js";

test("bundles the William Year 3 writing report as a non-progress template", () => {
  const { report } = WRITING_REPORT_TEMPLATE_RECORD;
  const total = report.criteria.reduce((sum, criterion) => sum + criterion.score, 0);
  const maximum = report.criteria.reduce((sum, criterion) => sum + criterion.max_score, 0);

  assert.equal(WRITING_REPORT_TEMPLATE_RECORD.is_template, true);
  assert.equal(WRITING_REPORT_TEMPLATE_RECORD.student_name, "William");
  assert.equal(WRITING_REPORT_TEMPLATE_RECORD.prompt_title, "One Minute Too Late");
  assert.equal(report.criteria.length, 10);
  assert.equal(report.annotations.length, 6);
  assert.equal(report.revision_plan.length, 5);
  assert.equal(total, 45);
  assert.equal(maximum, 47);
  assert.equal(report.total_score, total);
  assert.equal(report.maximum_score, maximum);
  assert.equal(getWritingReportTemplateById(WRITING_REPORT_TEMPLATE_ID), WRITING_REPORT_TEMPLATE_RECORD);
  assert.equal(getWritingReportTemplateById("not-a-template"), null);
});

test("bundles the original Word example without changing its bytes", async () => {
  const file = await readFile(new URL(`../public${WRITING_REPORT_TEMPLATE_ASSET}`, import.meta.url));
  const digest = createHash("sha256").update(file).digest("hex").toUpperCase();

  assert.equal(file.subarray(0, 2).toString(), "PK");
  assert.equal(digest, "D7F61E1D5D9B96E4FD865ABBCA9E12C538AE3F0F4F0099841AC5EDC025BEBE99");
});
