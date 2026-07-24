import assert from "node:assert/strict";
import test from "node:test";
import { handleAiReviewRequest } from "../worker/ai.js";
import {
  buildWritingReportTranslationSystemPrompt,
  buildWritingReviewUserPrompt,
  RUBRIC_VERSION,
  RUBRICS,
  validateTranslatedWritingReport,
  validateWritingInput,
} from "../shared/writing-review-contract.js";

const input = {
  year_level: 5,
  genre: "narrative",
  prompt_title: "The unexpected message",
  prompt_instructions: "Write a narrative.",
  student_text: "The message blinked on the screen. I opened it slowly.",
  report_language: "zh-CN",
};

function createValidReport() {
  const criteria = RUBRICS.narrative.map(([key, label, maximum]) => ({
    key,
    label,
    score: maximum,
    max_score: maximum,
    evidence: ["The message blinked"],
    rationale: "证据与该项要求一致。",
    next_step: "继续保持全篇控制。",
  }));
  return {
    rubric_version: RUBRIC_VERSION,
    status: "scorable",
    year_level: 5,
    genre: "narrative",
    score_type: "practice_only_not_official",
    report_language: "zh-CN",
    total_score: 47,
    maximum_score: 47,
    confidence: "medium",
    overall_summary: "文章清楚并能吸引读者。",
    criteria,
    strengths: [
      { title: "清楚开端", evidence: "The message blinked", impact: "快速建立情境。" },
      { title: "句子完整", evidence: "I opened it slowly.", impact: "动作清楚。" },
    ],
    priorities: [
      { criterion: "ideas", issue: "细节较少", evidence: "I opened it slowly.", why_it_matters: "影响发展", action: "加入感官细节", micro_example: "The screen felt cold." },
      { criterion: "cohesion", issue: "篇幅较短", evidence: "The message blinked", why_it_matters: "限制推进", action: "补充事件", micro_example: "Then..." },
      { criterion: "vocabulary", issue: "词汇简单", evidence: "opened", why_it_matters: "效果有限", action: "选择精准动词", micro_example: "tapped" },
    ],
    annotations: [
      { quote: "The message blinked", criterion: "ideas", tone: "strength", comment: "开场直接。" },
    ],
    error_patterns: { spelling: [], punctuation: [], grammar: [] },
    revision_plan: [
      { step: 1, minutes: 5, task: "扩展冲突。" },
      { step: 2, minutes: 8, task: "加入细节。" },
      { step: 3, minutes: 5, task: "校对。" },
    ],
    parent_summary: "学生能清楚开始故事，下一步应扩展情节。",
    student_message: "继续保持清楚的开头，并加入更多细节。",
    safeguarding_note: null,
    limitations: ["这是形成性练习评分。", "不推断官方量表分。"],
    exemplar: {
      title: "The message",
      text: "The screen flashed at midnight, and the message changed everything.",
      why_full_mark: ["结构完整", "细节持续", "语言准确"],
    },
  };
}

function reviewRequest(provider, model, baseUrl, withKey = true, bodyOverrides = {}) {
  return new Request("https://example.test/api/ai/review", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withKey ? { "x-ai-api-key": "test-key-not-secret" } : {}),
    },
    body: JSON.stringify({ provider, model, baseUrl, input, ...bodyOverrides }),
  });
}

test("requires a session API key", async () => {
  const response = await handleAiReviewRequest(
    reviewRequest("openai", "gpt-5.6-sol", "https://api.openai.com/v1", false),
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "API_KEY_REQUIRED");
});

test("rejects provider endpoints outside the allowlist", async () => {
  const response = await handleAiReviewRequest(
    reviewRequest("openai", "gpt-5.6-sol", "https://example.com/v1"),
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_BASE_URL");
});

test("carries the Year 3 parent-transcription method into the scoring prompt", () => {
  const year3Input = {
    ...input,
    year_level: 3,
    response_entry_method: "parent_transcription",
  };
  const prompt = JSON.parse(buildWritingReviewUserPrompt(year3Input));

  assert.equal(prompt.response_entry_method, "parent_transcription");
  assert.deepEqual(validateWritingInput(year3Input), []);
  assert.deepEqual(
    validateWritingInput({ ...year3Input, response_entry_method: "ocr_guess" }),
    ["response_entry_method is invalid"],
  );
});

for (const providerCase of [
  {
    provider: "openai",
    model: "gpt-5.6-sol",
    baseUrl: "https://api.openai.com/v1",
    expectedPath: "/v1/responses",
    payload: (text) => ({ output: [{ content: [{ type: "output_text", text }] }] }),
    assertBody: (body) => assert.equal(body.text.format.type, "json_schema"),
  },
  {
    provider: "google",
    model: "gemini-3.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    expectedPath: "/v1beta/models/gemini-3.5-flash:generateContent",
    payload: (text) => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    assertBody: (body) => assert.equal(body.generationConfig.responseMimeType, "application/json"),
  },
  {
    provider: "qwen",
    model: "qwen3.6-plus",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    expectedPath: "/compatible-mode/v1/chat/completions",
    payload: (text) => ({ choices: [{ message: { content: text } }] }),
    assertBody: (body) => assert.equal(body.response_format.type, "json_object"),
  },
  {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    baseUrl: "https://api.deepseek.com",
    expectedPath: "/chat/completions",
    payload: (text) => ({ choices: [{ message: { content: text } }] }),
    assertBody: (body) => assert.equal(body.response_format.type, "json_object"),
  },
]) {
  test(`maps and validates ${providerCase.provider} review responses`, async () => {
    let outbound;
    const report = createValidReport();
    const response = await handleAiReviewRequest(
      reviewRequest(providerCase.provider, providerCase.model, providerCase.baseUrl),
      {
        fetchImpl: async (url, init) => {
          outbound = { url, init };
          return Response.json(providerCase.payload(JSON.stringify(report)));
        },
      },
    );
    assert.equal(response.status, 200);
    assert.equal(new URL(outbound.url).pathname, providerCase.expectedPath);
    providerCase.assertBody(JSON.parse(outbound.init.body));
    const payload = await response.json();
    assert.equal(payload.report.total_score, 47);
    assert.equal(payload.meta.provider, providerCase.provider);
  });
}

test("rejects a model report whose total does not equal the criterion sum", async () => {
  const report = createValidReport();
  report.total_score = 46;
  const response = await handleAiReviewRequest(
    reviewRequest("deepseek", "deepseek-v4-pro", "https://api.deepseek.com"),
    {
      fetchImpl: async () => Response.json({
        choices: [{ message: { content: JSON.stringify(report) } }],
      }),
    },
  );
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error.code, "REPORT_VALIDATION_FAILED");
});

test("accepts a translated report only when scores and student evidence are unchanged", () => {
  const source = createValidReport();
  const translated = structuredClone(source);
  translated.report_language = "en";
  translated.overall_summary = "The writing is clear and engages the reader.";
  translated.parent_summary = "The student opens clearly and should now develop the plot.";
  translated.student_message = "Keep the clear opening and add more detail.";
  translated.criteria = translated.criteria.map((criterion) => ({
    ...criterion,
    rationale: "The quoted evidence meets this criterion.",
    next_step: "Maintain this control across the whole response.",
  }));
  const translationInput = { ...input, report_language: "en" };

  assert.match(buildWritingReportTranslationSystemPrompt("en"), /translate/i);
  assert.deepEqual(validateTranslatedWritingReport(translated, source, translationInput), []);

  translated.criteria[0].score -= 1;
  assert.ok(
    validateTranslatedWritingReport(translated, source, translationInput)
      .some((message) => message.includes("changed during translation")),
  );
});

test("translation mode returns the validated English version through the same provider route", async () => {
  const source = createValidReport();
  const translated = structuredClone(source);
  translated.report_language = "en";
  translated.overall_summary = "The writing is clear and engages the reader.";

  let outboundBody;
  const response = await handleAiReviewRequest(
    reviewRequest(
      "openai",
      "gpt-5.6-sol",
      "https://api.openai.com/v1",
      true,
      {
        mode: "translate_report",
        input: { ...input, report_language: "en" },
        source_report: source,
      },
    ),
    {
      fetchImpl: async (_url, init) => {
        outboundBody = JSON.parse(init.body);
        return Response.json({
          output: [{ content: [{ type: "output_text", text: JSON.stringify(translated) }] }],
        });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.match(outboundBody.instructions, /translate/i);
  assert.equal((await response.json()).report.report_language, "en");
});
