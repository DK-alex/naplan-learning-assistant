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
  return Array.isArray(reports) ? reports : [];
}

export function saveWritingReport(reportRecord) {
  const reports = readWritingReports().filter((item) => item.practice_id !== reportRecord.practice_id);
  window.localStorage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify([reportRecord, ...reports].slice(0, 20)),
  );
}

export function getWritingReport(practiceId) {
  return readWritingReports().find((item) => item.practice_id === practiceId) || null;
}

export async function requestWritingReview({ settings, practiceRecord, apiKey }) {
  const writing = practiceRecord.writing;
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
      input: {
        year_level: Number(practiceRecord.year_level),
        genre: String(writing.genre || "").toLowerCase(),
        prompt_title: writing.title || "Writing task",
        prompt_instructions: writing.prompt_instructions || writing.prompt || "",
        student_text: writing.response || "",
        response_entry_method: writing.entry_method || "student_typed",
        report_language: settings.reportLanguage,
      },
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
  return {
    practice_id: practiceRecord.id,
    prompt_title: writing.title || "Writing task",
    prompt_instructions: writing.prompt_instructions || writing.prompt || "",
    student_text: writing.response || "",
    response_entry_method: writing.entry_method || "student_typed",
    word_count: writing.word_count,
    year_level: practiceRecord.year_level,
    provider: payload.meta.provider,
    model: payload.meta.model,
    generated_at: payload.meta.generated_at,
    report: payload.report,
  };
}
