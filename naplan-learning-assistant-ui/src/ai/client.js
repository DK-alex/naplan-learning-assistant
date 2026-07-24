const API_KEY_STORAGE_KEY = "naplan-ai-session-keys";
const REPORT_STORAGE_KEY = "naplan-writing-reports";

function readJson(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key) || "");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function getSessionApiKey(provider) {
  if (typeof window === "undefined") return "";
  const keys = readJson(window.sessionStorage, API_KEY_STORAGE_KEY, {});
  return typeof keys[provider] === "string" ? keys[provider] : "";
}

export function setSessionApiKey(provider, apiKey) {
  const keys = readJson(window.sessionStorage, API_KEY_STORAGE_KEY, {});
  if (apiKey.trim()) keys[provider] = apiKey.trim();
  else delete keys[provider];
  window.sessionStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(keys));
}

export function readWritingReports() {
  if (typeof window === "undefined") return [];
  const reports = readJson(window.localStorage, REPORT_STORAGE_KEY, []);
  return (Array.isArray(reports) ? reports : [])
    .map(normaliseWritingReportRecord)
    .sort((left, right) => (
      new Date(right.generated_at).getTime() - new Date(left.generated_at).getTime()
    ));
}

export function normaliseWritingReportRecord(reportRecord) {
  if (!reportRecord || typeof reportRecord !== "object") return reportRecord;
  const primaryLanguage = reportRecord.report?.report_language || "en";
  const reportVersions = {
    ...(reportRecord.report_versions || {}),
    ...(reportRecord.report ? { [primaryLanguage]: reportRecord.report } : {}),
  };
  return {
    ...reportRecord,
    id: reportRecord.id || `${reportRecord.practice_id}:${reportRecord.generated_at}`,
    report_versions: reportVersions,
  };
}

export function saveWritingReport(reportRecord) {
  const normalised = normaliseWritingReportRecord(reportRecord);
  const reports = readWritingReports().filter((item) => item.id !== normalised.id);
  window.localStorage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify([normalised, ...reports]),
  );
  return normalised;
}

export function getWritingReport(practiceId) {
  return readWritingReports().find((item) => item.practice_id === practiceId) || null;
}

export function getWritingReportById(reportId) {
  return readWritingReports().find((item) => item.id === reportId) || null;
}

export function getWritingReportVersion(reportRecord, reportLanguage) {
  const normalised = normaliseWritingReportRecord(reportRecord);
  return normalised?.report_versions?.[reportLanguage] || null;
}

async function sendReviewRequest({ settings, input, apiKey, mode = "review", sourceReport = null }) {
  const response = await fetch("/api/ai/review", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ai-api-key": apiKey,
    },
    body: JSON.stringify({
      provider: settings.aiProvider,
      model: settings.aiModel,
      baseUrl: settings.aiBaseUrl,
      mode,
      input,
      ...(sourceReport ? { source_report: sourceReport } : {}),
    }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The review service returned an unreadable response.");
  }
  if (!response.ok) {
    const detail = payload?.error?.details?.length ? ` ${payload.error.details.join("; ")}` : "";
    const error = new Error(`${payload?.error?.message || "Writing review failed."}${detail}`);
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

function createWritingInput(practiceRecord, reportLanguage) {
  const writing = practiceRecord.writing;
  return {
    year_level: Number(practiceRecord.year_level),
    genre: String(writing.genre || "").toLowerCase(),
    prompt_title: writing.title || "Writing task",
    prompt_instructions: writing.prompt_instructions || writing.prompt || "",
    student_text: writing.response || "",
    response_entry_method: writing.entry_method || "student_typed",
    report_language: reportLanguage,
  };
}

export async function requestWritingReview({ settings, practiceRecord, apiKey }) {
  const writing = practiceRecord.writing;
  const payload = await sendReviewRequest({
    settings,
    input: createWritingInput(practiceRecord, settings.reportLanguage),
    apiKey,
  });
  const generatedAt = payload.meta.generated_at;
  const reportId = globalThis.crypto?.randomUUID?.()
    || `${practiceRecord.id}:${generatedAt}:${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: reportId,
    practice_id: practiceRecord.id,
    prompt_title: writing.title || "Writing task",
    prompt_instructions: writing.prompt_instructions || writing.prompt || "",
    student_text: writing.response || "",
    response_entry_method: writing.entry_method || "student_typed",
    word_count: writing.word_count,
    year_level: practiceRecord.year_level,
    provider: payload.meta.provider,
    model: payload.meta.model,
    generated_at: generatedAt,
    report: payload.report,
    report_versions: {
      [payload.report.report_language]: payload.report,
    },
  };
}

export async function requestWritingReportTranslation({
  settings,
  reportRecord,
  targetLanguage,
  apiKey,
}) {
  const sourceReport = reportRecord.report;
  const input = {
    year_level: Number(reportRecord.year_level),
    genre: String(sourceReport.genre || "").toLowerCase(),
    prompt_title: reportRecord.prompt_title || "Writing task",
    prompt_instructions: reportRecord.prompt_instructions || "",
    student_text: reportRecord.student_text || "",
    response_entry_method: reportRecord.response_entry_method || "student_typed",
    report_language: targetLanguage,
  };
  const payload = await sendReviewRequest({
    settings,
    input,
    apiKey,
    mode: "translate_report",
    sourceReport,
  });
  return {
    report: payload.report,
    generated_at: payload.meta.generated_at,
  };
}
