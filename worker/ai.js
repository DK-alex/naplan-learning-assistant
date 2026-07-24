import {
  getAiProvider,
  isAllowedProviderBaseUrl,
  normaliseBaseUrl,
} from "../shared/ai-config.js";
import {
  buildWritingReportTranslationSystemPrompt,
  buildWritingReportTranslationUserPrompt,
  buildWritingReviewSystemPrompt,
  buildWritingReviewUserPrompt,
  validateTranslatedWritingReport,
  validateWritingInput,
  validateWritingReport,
  WRITING_REPORT_SCHEMA,
} from "../shared/writing-review-contract.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function extractOpenAiText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" || item.type === "text")
    .map((item) => item.text || "")
    .join("");
}

function extractGeminiText(payload) {
  return (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("");
}

function extractChatText(payload) {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((item) => item.text || item.content || "").join("");
  return "";
}

function parseModelJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

function safeProviderError(payload, status) {
  const raw = payload?.error?.message || payload?.message || `Provider request failed (${status})`;
  return String(raw)
    .replace(/\b(?:sk|AIza|ds)-[A-Za-z0-9_-]{8,}\b/g, "[redacted]")
    .slice(0, 280);
}

function createProviderRequest({ providerId, baseUrl, model, apiKey, systemPrompt, userPrompt }) {
  if (providerId === "openai") {
    return {
      url: `${baseUrl}/responses`,
      init: {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: systemPrompt,
          input: userPrompt,
          reasoning: { effort: "medium" },
          text: {
            format: {
              type: "json_schema",
              name: "naplan_writing_report",
              strict: true,
              schema: WRITING_REPORT_SCHEMA,
            },
          },
          max_output_tokens: 12000,
        }),
      },
      extractText: extractOpenAiText,
    };
  }

  if (providerId === "google") {
    return {
      url: `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`,
      init: {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: WRITING_REPORT_SCHEMA,
            maxOutputTokens: 12000,
          },
        }),
      },
      extractText: extractGeminiText,
    };
  }

  return {
    url: `${baseUrl}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt}\nReturn one valid JSON object only.` },
        ],
        response_format: { type: "json_object" },
        max_tokens: 12000,
        temperature: 0.2,
      }),
    },
    extractText: extractChatText,
  };
}

export async function handleAiReviewRequest(request, { fetchImpl = fetch } = {}) {
  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, 405);
  }

  const apiKey = String(request.headers.get("x-ai-api-key") || "").trim();
  if (!apiKey || apiKey.length > 500) {
    return jsonResponse({ error: { code: "API_KEY_REQUIRED", message: "API Key is required." } }, 400);
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > 120000) throw new Error("Request is too large");
    body = JSON.parse(text);
  } catch (error) {
    return jsonResponse({ error: { code: "INVALID_JSON", message: error.message } }, 400);
  }

  const providerId = String(body.provider || "");
  const provider = getAiProvider(providerId);
  if (provider.id !== providerId) {
    return jsonResponse({ error: { code: "INVALID_PROVIDER", message: "Unsupported AI provider." } }, 400);
  }

  const model = String(body.model || "").trim();
  const baseUrl = normaliseBaseUrl(body.baseUrl || provider.defaultBaseUrl);
  if (!model || model.length > 120) {
    return jsonResponse({ error: { code: "INVALID_MODEL", message: "A valid model name is required." } }, 400);
  }
  if (!isAllowedProviderBaseUrl(providerId, baseUrl)) {
    return jsonResponse(
      { error: { code: "INVALID_BASE_URL", message: "The API address is not an approved endpoint for this provider." } },
      400,
    );
  }

  const input = body.input || {};
  const inputErrors = validateWritingInput(input);
  if (inputErrors.length) {
    return jsonResponse({ error: { code: "INVALID_INPUT", message: inputErrors.join("; ") } }, 400);
  }

  const mode = body.mode || "review";
  if (!["review", "translate_report"].includes(mode)) {
    return jsonResponse({ error: { code: "INVALID_MODE", message: "Unsupported review mode." } }, 400);
  }

  const sourceReport = mode === "translate_report" ? body.source_report : null;
  if (mode === "translate_report") {
    const sourceErrors = validateWritingReport(sourceReport, {
      ...input,
      report_language: sourceReport?.report_language,
    });
    if (sourceErrors.length) {
      return jsonResponse(
        { error: { code: "INVALID_SOURCE_REPORT", message: sourceErrors.join("; ") } },
        400,
      );
    }
  }

  const systemPrompt = mode === "translate_report"
    ? buildWritingReportTranslationSystemPrompt(input.report_language)
    : buildWritingReviewSystemPrompt(input.report_language);
  const userPrompt = mode === "translate_report"
    ? buildWritingReportTranslationUserPrompt(input, sourceReport)
    : buildWritingReviewUserPrompt(input);
  const providerRequest = createProviderRequest({
    providerId,
    baseUrl,
    model,
    apiKey,
    systemPrompt,
    userPrompt,
  });

  let providerResponse;
  try {
    providerResponse = await fetchImpl(providerRequest.url, providerRequest.init);
  } catch {
    return jsonResponse(
      { error: { code: "PROVIDER_UNREACHABLE", message: "The selected AI service could not be reached." } },
      502,
    );
  }

  let providerPayload;
  try {
    providerPayload = await providerResponse.json();
  } catch {
    return jsonResponse(
      { error: { code: "INVALID_PROVIDER_RESPONSE", message: "The AI service returned an unreadable response." } },
      502,
    );
  }

  if (!providerResponse.ok) {
    return jsonResponse(
      {
        error: {
          code: "PROVIDER_ERROR",
          message: safeProviderError(providerPayload, providerResponse.status),
        },
      },
      providerResponse.status === 401 || providerResponse.status === 403 ? 401 : 502,
    );
  }

  let report;
  try {
    report = parseModelJson(providerRequest.extractText(providerPayload));
  } catch {
    return jsonResponse(
      { error: { code: "INVALID_MODEL_OUTPUT", message: "The model did not return valid report JSON." } },
      422,
    );
  }

  const reportErrors = mode === "translate_report"
    ? validateTranslatedWritingReport(report, sourceReport, input)
    : validateWritingReport(report, input);
  if (reportErrors.length) {
    return jsonResponse(
      {
        error: {
          code: "REPORT_VALIDATION_FAILED",
          message: "The model report did not pass rubric validation.",
          details: reportErrors.slice(0, 8),
        },
      },
      422,
    );
  }

  return jsonResponse({
    report,
    meta: {
      provider: providerId,
      model,
      generated_at: new Date().toISOString(),
    },
  });
}
