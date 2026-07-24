import assert from "node:assert/strict";
import test from "node:test";
import { Packer } from "docx";
import {
  buildWritingReportDocument,
  createWritingReportFileName,
} from "../src/word-export.js";

const report = {
  rubric_version: "naplan-writing-practice-v1",
  status: "scorable",
  year_level: 5,
  genre: "narrative",
  score_type: "practice_only_not_official",
  report_language: "zh-CN",
  total_score: 33,
  maximum_score: 47,
  confidence: "medium",
  overall_summary: "文章结构清楚，下一步应扩展冲突并校对标点。",
  criteria: [
    {
      key: "ideas",
      label: "Ideas",
      score: 4,
      max_score: 5,
      evidence: ["The message blinked"],
      rationale: "开头迅速建立情境。",
      next_step: "加入更多感官细节。",
    },
  ],
  strengths: [
    { title: "清楚开端", evidence: "The message blinked", impact: "快速建立情境。" },
  ],
  priorities: [
    {
      criterion: "ideas",
      issue: "细节较少",
      evidence: "I opened it slowly.",
      why_it_matters: "限制情节发展。",
      action: "加入感官细节。",
      micro_example: "The cold light filled the room.",
    },
  ],
  annotations: [
    { quote: "The message blinked", criterion: "ideas", tone: "strength", comment: "开场直接。" },
  ],
  error_patterns: { spelling: [], punctuation: [], grammar: [] },
  revision_plan: [{ step: 1, minutes: 5, task: "扩展冲突。" }],
  parent_summary: "学生能清楚开始故事，下一步应扩展情节。",
  student_message: "继续保持清楚的开头。",
  safeguarding_note: null,
  limitations: ["这是形成性练习评分。"],
  exemplar: {
    title: "The message",
    text: "The screen flashed at midnight, and the message changed everything.",
    why_full_mark: ["结构完整"],
  },
};

const record = {
  id: "review-fixture",
  prompt_title: "The unexpected message",
  prompt_instructions: "Write a narrative.",
  student_text: "The message blinked on the screen. I opened it slowly.",
  year_level: 5,
  generated_at: "2026-07-24T10:00:00.000Z",
  provider: "openai",
  model: "gpt-5.6-sol",
};

test("builds an editable Word package and a safe .docx file name", async () => {
  const document = buildWritingReportDocument({
    reportRecord: record,
    report,
    studentName: "William",
    language: "zh-CN",
  });
  const buffer = await Packer.toBuffer(document);

  assert.equal(buffer.subarray(0, 2).toString(), "PK");
  assert.ok(buffer.length > 5_000);
  assert.match(
    createWritingReportFileName({ studentName: "William", reportRecord: record, language: "zh-CN" }),
    /^NAPLAN-Writing-Report-William-Year-5-The-unexpected-message-\d{4}-\d{2}-\d{2}-zh-CN\.docx$/,
  );
});
