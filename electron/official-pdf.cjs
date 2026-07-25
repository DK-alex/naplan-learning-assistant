const OFFICIAL_HOST_SUFFIXES = [".acara.edu.au", ".nap.edu.au"];
const MAX_PDF_BYTES = 40 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TRANSLATION_TARGETS = new Set(["zh-CN", "zh-TW", "ko"]);

const EXCLUDED_MATERIAL_PATTERNS = [
  /\bdemonstration\b/,
  /\bdemo(?:nstration)?[-_\s]?test\b/,
  /\bexample[-_\s]?(?:question|test|prompt|stimulus|isr)\b/,
  /\bsample[-_\s]?(?:question|test|prompt|stimulus|isr)\b/,
  /\bpractice[-_\s]?test\b/,
  /\bpast[-_\s]?test[-_\s]?papers?\b/,
  /\btest[-_\s]?papers?\b/,
  /\bwriting[-_\s]?(?:prompt|stimulus|marking[-_\s]?guide)\b/,
  /\bmarking[-_\s]?guide\b/,
  /\bhow[-_\s]?to[-_\s]?interpret[-_\s]?(?:the[-_\s]?)?sssr\b/,
  /\bindividual[-_\s]?student[-_\s]?report\b/,
  /\bisr[-_\s]?(?:yr\d*|year\d*|example|sample)\b/,
];

const pdfMemoryCache = new Map();
let cachedPdfBytes = 0;

function isOfficialHost(hostname) {
  const value = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return (
    value === "acara.edu.au" ||
    value === "nap.edu.au" ||
    OFFICIAL_HOST_SUFFIXES.some((suffix) => value.endsWith(suffix))
  );
}

function parseOfficialPdfUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("INVALID_PDF_URL");
  }
  if (url.protocol !== "https:" || !isOfficialHost(url.hostname)) {
    throw new Error("PDF_SOURCE_NOT_ALLOWED");
  }
  if (!/\.pdf$/i.test(url.pathname)) {
    throw new Error("PDF_SOURCE_NOT_PDF");
  }
  url.hash = "";
  return url;
}

function classifyOfficialPdfPolicy(value, title = "") {
  const url = parseOfficialPdfUrl(value);
  const searchable = decodeURIComponent(`${url.pathname} ${title}`)
    .toLowerCase()
    .replace(/[–—]/g, "-");
  const excluded = EXCLUDED_MATERIAL_PATTERNS.some((pattern) => pattern.test(searchable));
  return {
    sourceUrl: url.href,
    canTranslate: !excluded,
    policy: excluded ? "original-only" : "general-information",
    reason: excluded
      ? "ACARA_EXCLUDED_MATERIAL"
      : "MACHINE_TRANSLATION_ALLOWED_WITH_SOURCE_WARNING",
  };
}

async function readPdfResponse(response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_PDF_BYTES) throw new Error("PDF_TOO_LARGE");

  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_PDF_BYTES) throw new Error("PDF_TOO_LARGE");
    chunks.push(buffer);
  }
  const pdf = Buffer.concat(chunks);
  if (pdf.length < 5 || pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("PDF_RESPONSE_INVALID");
  }
  return pdf;
}

function rememberPdf(url, buffer) {
  const previous = pdfMemoryCache.get(url);
  if (previous) cachedPdfBytes -= previous.length;
  pdfMemoryCache.delete(url);
  pdfMemoryCache.set(url, buffer);
  cachedPdfBytes += buffer.length;

  while (pdfMemoryCache.size > 3 || cachedPdfBytes > 70 * 1024 * 1024) {
    const oldestKey = pdfMemoryCache.keys().next().value;
    const oldest = pdfMemoryCache.get(oldestKey);
    pdfMemoryCache.delete(oldestKey);
    cachedPdfBytes -= oldest?.length || 0;
  }
}

async function fetchOfficialPdf(value, fetchImpl = fetch) {
  const initialUrl = parseOfficialPdfUrl(value);
  const cached = pdfMemoryCache.get(initialUrl.href);
  if (cached) {
    pdfMemoryCache.delete(initialUrl.href);
    pdfMemoryCache.set(initialUrl.href, cached);
    return { buffer: cached, sourceUrl: initialUrl.href };
  }

  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchImpl(currentUrl, {
      headers: {
        accept: "application/pdf",
        "user-agent": "NAPLAN-Learning-Assistant/1.0 (official PDF reader)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("PDF_REDIRECT_INVALID");
      currentUrl = parseOfficialPdfUrl(new URL(location, currentUrl).href);
      continue;
    }
    if (!response.ok) throw new Error(`PDF_FETCH_${response.status}`);

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (contentType && !contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      throw new Error("PDF_RESPONSE_INVALID");
    }
    const buffer = await readPdfResponse(response);
    rememberPdf(initialUrl.href, buffer);
    return { buffer, sourceUrl: currentUrl.href };
  }
  throw new Error("PDF_REDIRECT_INVALID");
}

function marker(index) {
  return `[[[p${String(index).padStart(4, "0")}]]]`;
}

function createTranslationBatches(units, maximumLength = 3500) {
  const batches = [];
  let current = [];
  let currentLength = 0;
  for (const unit of units) {
    const nextLength = marker(unit.index).length + unit.text.length + 2;
    if (current.length && currentLength + nextLength > maximumLength) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(unit);
    currentLength += nextLength;
  }
  if (current.length) batches.push(current);
  return batches;
}

async function translateChunk(text, target, fetchImpl = fetch) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { "user-agent": "NAPLAN-Learning-Assistant/1.0 (PDF translation)" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`TRANSLATION_${response.status}`);
      const payload = await response.json();
      const translated = payload?.[0]?.map((segment) => segment?.[0] || "").join("") || "";
      if (!translated.trim()) throw new Error("TRANSLATION_EMPTY");
      return translated;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

function parseTranslationBatch(translated, batch) {
  const expected = new Set(batch.map((unit) => unit.index));
  const parsed = new Map();
  const expression = /\[\[\[p(\d{4})\]\]\]\s*([\s\S]*?)(?=\[\[\[p\d{4}\]\]\]|$)/g;
  for (const match of translated.matchAll(expression)) {
    const index = Number(match[1]);
    const text = match[2].trim();
    if (expected.has(index) && text) parsed.set(index, text);
  }
  return parsed;
}

async function translateOfficialPdfStrings(
  { sourceUrl, title = "", target, strings },
  fetchImpl = fetch,
) {
  const policy = classifyOfficialPdfPolicy(sourceUrl, title);
  if (!policy.canTranslate) {
    const error = new Error("PDF_TRANSLATION_NOT_PERMITTED");
    error.code = "PDF_TRANSLATION_NOT_PERMITTED";
    error.policy = policy;
    throw error;
  }
  if (!TRANSLATION_TARGETS.has(target)) throw new Error("TRANSLATION_TARGET_INVALID");
  if (!Array.isArray(strings) || strings.length === 0 || strings.length > 160) {
    throw new Error("TRANSLATION_INPUT_INVALID");
  }
  const normalised = strings.map((value) => String(value || "").trim());
  if (normalised.some((value) => value.length > 1800)) throw new Error("TRANSLATION_INPUT_INVALID");
  if (normalised.reduce((total, value) => total + value.length, 0) > 60_000) {
    throw new Error("TRANSLATION_INPUT_TOO_LARGE");
  }

  const output = [...normalised];
  const units = normalised
    .map((text, index) => ({ index, text }))
    .filter((unit) => /[A-Za-z]/.test(unit.text));

  for (const batch of createTranslationBatches(units)) {
    const input = batch.map((unit) => `${marker(unit.index)}\n${unit.text}`).join("\n");
    const parsed = parseTranslationBatch(
      await translateChunk(input, target, fetchImpl),
      batch,
    );
    for (const unit of batch) {
      output[unit.index] = parsed.get(unit.index) ||
        (await translateChunk(unit.text, target, fetchImpl)).trim();
    }
  }
  return { policy, translations: output };
}

module.exports = {
  MAX_PDF_BYTES,
  classifyOfficialPdfPolicy,
  fetchOfficialPdf,
  isOfficialHost,
  parseOfficialPdfUrl,
  translateOfficialPdfStrings,
};
