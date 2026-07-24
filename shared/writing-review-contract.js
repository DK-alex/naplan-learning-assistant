export const RUBRIC_VERSION = "2026.2";

export const RUBRICS = {
  narrative: [
    ["audience", "Audience", 6],
    ["text_structure", "Text structure", 4],
    ["ideas", "Ideas", 5],
    ["character_and_setting", "Character and setting", 4],
    ["vocabulary", "Vocabulary", 5],
    ["cohesion", "Cohesion", 4],
    ["paragraphing", "Paragraphing", 2],
    ["sentence_structure", "Sentence structure", 6],
    ["punctuation", "Punctuation", 5],
    ["spelling", "Spelling", 6],
  ],
  persuasive: [
    ["audience", "Audience", 6],
    ["text_structure", "Text structure", 4],
    ["ideas", "Ideas", 5],
    ["persuasive_devices", "Persuasive devices", 4],
    ["vocabulary", "Vocabulary", 5],
    ["cohesion", "Cohesion", 4],
    ["paragraphing", "Paragraphing", 3],
    ["sentence_structure", "Sentence structure", 6],
    ["punctuation", "Punctuation", 5],
    ["spelling", "Spelling", 6],
  ],
};

export const REPORT_LANGUAGE_NAMES = {
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  en: "English",
  ko: "Korean",
};

const criterionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["key", "label", "score", "max_score", "evidence", "rationale", "next_step"],
  properties: {
    key: {
      type: "string",
      enum: [
        "audience",
        "text_structure",
        "ideas",
        "character_and_setting",
        "persuasive_devices",
        "vocabulary",
        "cohesion",
        "paragraphing",
        "sentence_structure",
        "punctuation",
        "spelling",
      ],
    },
    label: { type: "string" },
    score: { type: ["integer", "null"] },
    max_score: { type: "integer" },
    evidence: { type: "array", items: { type: "string" }, maxItems: 3 },
    rationale: { type: "string" },
    next_step: { type: "string" },
  },
};

const errorItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["original", "suggestion", "pattern"],
  properties: {
    original: { type: "string" },
    suggestion: { type: "string" },
    pattern: { type: "string" },
  },
};

export const WRITING_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "rubric_version",
    "status",
    "year_level",
    "genre",
    "score_type",
    "report_language",
    "total_score",
    "maximum_score",
    "confidence",
    "overall_summary",
    "criteria",
    "strengths",
    "priorities",
    "annotations",
    "error_patterns",
    "revision_plan",
    "parent_summary",
    "student_message",
    "safeguarding_note",
    "limitations",
    "exemplar",
  ],
  properties: {
    rubric_version: { type: "string", enum: [RUBRIC_VERSION] },
    status: { type: "string", enum: ["scorable", "partially_scorable", "not_scorable"] },
    year_level: { type: "integer", enum: [3, 5, 7, 9] },
    genre: { type: "string", enum: ["narrative", "persuasive"] },
    score_type: { type: "string", enum: ["practice_only_not_official"] },
    report_language: { type: "string", enum: ["zh-CN", "zh-TW", "en", "ko"] },
    total_score: { type: ["integer", "null"] },
    maximum_score: { type: "integer", enum: [47, 48] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    overall_summary: { type: "string" },
    criteria: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: criterionSchema,
    },
    strengths: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "evidence", "impact"],
        properties: {
          title: { type: "string" },
          evidence: { type: "string" },
          impact: { type: "string" },
        },
      },
    },
    priorities: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "issue", "evidence", "why_it_matters", "action", "micro_example"],
        properties: {
          criterion: { type: "string" },
          issue: { type: "string" },
          evidence: { type: "string" },
          why_it_matters: { type: "string" },
          action: { type: "string" },
          micro_example: { type: "string" },
        },
      },
    },
    annotations: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote", "criterion", "tone", "comment"],
        properties: {
          quote: { type: "string" },
          criterion: { type: "string" },
          tone: { type: "string", enum: ["strength", "improve", "error"] },
          comment: { type: "string" },
        },
      },
    },
    error_patterns: {
      type: "object",
      additionalProperties: false,
      required: ["spelling", "punctuation", "grammar"],
      properties: {
        spelling: { type: "array", maxItems: 8, items: errorItemSchema },
        punctuation: { type: "array", maxItems: 8, items: errorItemSchema },
        grammar: { type: "array", maxItems: 8, items: errorItemSchema },
      },
    },
    revision_plan: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step", "minutes", "task"],
        properties: {
          step: { type: "integer" },
          minutes: { type: "integer" },
          task: { type: "string" },
        },
      },
    },
    parent_summary: { type: "string" },
    student_message: { type: "string" },
    safeguarding_note: { type: ["string", "null"] },
    limitations: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    exemplar: {
      type: "object",
      additionalProperties: false,
      required: ["title", "text", "why_full_mark"],
      properties: {
        title: { type: "string" },
        text: { type: "string" },
        why_full_mark: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: { type: "string" },
        },
      },
    },
  },
};

const RUBRIC_DETAILS = `
Narrative /47: audience 0-6; text_structure 0-4; ideas 0-5;
character_and_setting 0-4; vocabulary 0-5; cohesion 0-4; paragraphing 0-2;
sentence_structure 0-6; punctuation 0-5; spelling 0-6.

Persuasive /48: audience 0-6; text_structure 0-4; ideas 0-5;
persuasive_devices 0-4; vocabulary 0-5; cohesion 0-4; paragraphing 0-3;
sentence_structure 0-6; punctuation 0-5; spelling 0-6.
`;

export function buildWritingReviewSystemPrompt(reportLanguage) {
  const languageName = REPORT_LANGUAGE_NAMES[reportLanguage] || REPORT_LANGUAGE_NAMES["zh-CN"];
  return `You are a cautious, consistent, evidence-based Australian English writing assessor.
Assess original NAPLAN-style practice writing for formative feedback only. This is not an
official ACARA scoring engine. Never infer or output a scaled score, proficiency level,
percentile, band, or national ranking.

Use exactly the ten criteria for the supplied genre. Score each criterion independently
before calculating the total. Use only integer scores within the allowed range. Do not
reward or penalise the student's opinion, culture or chosen topic. Judge sustained control,
purpose, effect and complexity rather than length or isolated sophisticated words.
${RUBRIC_DETAILS}

Year calibration:
- Year 3: complete ideas, clear sequence, basic sentence boundaries, common spelling and detail.
- Year 5: paragraph organisation, expanded detail, sentence variety, cohesion and internal punctuation.
- Year 7: sustained development, complex sentence control, voice, evidence and structural choices.
- Year 9: conceptual depth, logical hierarchy, reader awareness, precise language and whole-text control.

Evidence and report rules:
- Quote the student exactly; never silently correct a quotation.
- A response_entry_method of "parent_transcription" means a parent typed a Year 3 paper
  response exactly as written. Assess the supplied text as the student's original work;
  do not reward or penalise the entry method and do not assume OCR was used.
- Give 2-4 strengths, 3-5 priorities, exact-quote annotations, and a practical revision plan.
- For spelling, punctuation and grammar, distinguish isolated slips from repeated patterns.
- If the text is very short or evidence is limited, reduce confidence.
- If not scorable, use null scores for all criteria and total_score, and do not invent evidence.
- If real-world safeguarding concerns appear, continue neutral writing feedback and flag adult review.
- Produce a polished full-mark exemplar for the same prompt and genre, calibrated to the year level.
  It must be newly written, preserve no private details, and not pretend to be the student's work.
- Write every explanatory field in ${languageName}. Keep exact student quotations in their original English.
- Return JSON only, with no Markdown fences or commentary. Follow the supplied JSON schema exactly.
- Set rubric_version to "${RUBRIC_VERSION}" and score_type to "practice_only_not_official".`;
}

export function buildWritingReviewUserPrompt(input) {
  return JSON.stringify({
    task: "Assess this NAPLAN-style practice writing and generate the complete report JSON.",
    year_level: Number(input.year_level),
    genre: String(input.genre || "").toLowerCase(),
    prompt_title: input.prompt_title || "Untitled writing task",
    prompt_instructions: input.prompt_instructions || "",
    student_text: input.student_text || "",
    response_entry_method: input.response_entry_method || "student_typed",
    report_language: input.report_language || "zh-CN",
    student_context: {
      language_background: "unknown",
      accessibility_adjustments: [],
    },
  });
}

export function validateWritingInput(input) {
  const errors = [];
  if (![3, 5, 7, 9].includes(Number(input?.year_level))) errors.push("year_level must be 3, 5, 7 or 9");
  if (!["narrative", "persuasive"].includes(String(input?.genre || "").toLowerCase())) {
    errors.push("genre must be narrative or persuasive");
  }
  if (typeof input?.student_text !== "string" || !input.student_text.trim()) errors.push("student_text is required");
  if (String(input?.student_text || "").length > 30000) errors.push("student_text is too long");
  if (input?.response_entry_method && !["student_typed", "parent_transcription"].includes(input.response_entry_method)) {
    errors.push("response_entry_method is invalid");
  }
  if (!REPORT_LANGUAGE_NAMES[input?.report_language]) errors.push("report_language is invalid");
  return errors;
}

export function validateWritingReport(report, input) {
  const errors = [];
  const genre = String(input.genre).toLowerCase();
  const rubric = RUBRICS[genre];
  const expectedMaximum = rubric.reduce((sum, [, , maximum]) => sum + maximum, 0);
  if (!report || typeof report !== "object" || Array.isArray(report)) return ["Report must be a JSON object"];
  if (report.rubric_version !== RUBRIC_VERSION) errors.push("rubric_version is invalid");
  if (report.score_type !== "practice_only_not_official") errors.push("score_type is invalid");
  if (report.genre !== genre) errors.push("genre does not match the submission");
  if (report.year_level !== Number(input.year_level)) errors.push("year_level does not match the submission");
  if (report.report_language !== input.report_language) errors.push("report_language does not match the request");
  if (report.maximum_score !== expectedMaximum) errors.push("maximum_score is invalid");
  if (!Array.isArray(report.criteria) || report.criteria.length !== rubric.length) {
    errors.push("criteria must contain exactly 10 entries");
  } else {
    let scoreSum = 0;
    rubric.forEach(([key, , maximum], index) => {
      const criterion = report.criteria[index];
      if (criterion?.key !== key) errors.push(`criterion ${index + 1} must be ${key}`);
      if (criterion?.max_score !== maximum) errors.push(`${key} max_score must be ${maximum}`);
      if (report.status === "not_scorable") {
        if (criterion?.score !== null) errors.push(`${key} score must be null when not_scorable`);
      } else if (!Number.isInteger(criterion?.score) || criterion.score < 0 || criterion.score > maximum) {
        errors.push(`${key} score is outside its allowed range`);
      } else {
        scoreSum += criterion.score;
      }
    });
    if (report.status === "not_scorable") {
      if (report.total_score !== null) errors.push("total_score must be null when not_scorable");
    } else if (report.total_score !== scoreSum) {
      errors.push("total_score does not equal the criterion sum");
    }
  }
  if (!Array.isArray(report.strengths) || report.strengths.length < 2) errors.push("At least two strengths are required");
  if (!Array.isArray(report.priorities) || report.priorities.length < 3) errors.push("At least three priorities are required");
  if (!report.exemplar?.text || !report.exemplar?.title) errors.push("A full-mark exemplar is required");
  if (Array.isArray(report.annotations)) {
    for (const annotation of report.annotations) {
      if (annotation.quote && !String(input.student_text).includes(annotation.quote)) {
        errors.push(`Annotation quote is not exact: ${annotation.quote.slice(0, 40)}`);
      }
    }
  }
  return errors;
}
