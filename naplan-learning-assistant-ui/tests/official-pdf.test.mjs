import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  classifyOfficialPdfPolicy,
  fetchOfficialPdf,
  parseOfficialPdfUrl,
  translateOfficialPdfStrings,
} = require("../electron/official-pdf.cjs");

const GENERAL_PDF =
  "https://www.acara.edu.au/docs/default-source/media-releases/2026-naplan-update.pdf";

test("official PDF URLs are restricted to HTTPS NAP and ACARA hosts", () => {
  assert.equal(parseOfficialPdfUrl(GENERAL_PDF).hostname, "www.acara.edu.au");
  assert.throws(
    () => parseOfficialPdfUrl("http://www.acara.edu.au/report.pdf"),
    /PDF_SOURCE_NOT_ALLOWED/,
  );
  assert.throws(
    () => parseOfficialPdfUrl("https://acara.edu.au.evil.example/report.pdf"),
    /PDF_SOURCE_NOT_ALLOWED/,
  );
  assert.throws(
    () => parseOfficialPdfUrl("https://www.nap.edu.au/not-a-pdf"),
    /PDF_SOURCE_NOT_PDF/,
  );
});

test("copyright-excluded PDFs remain original-only", () => {
  const examples = [
    "https://www.nap.edu.au/docs/default-source/resources/how-to-interpret-the-sssr.pdf",
    "https://www.nap.edu.au/docs/default-source/resources/2026-isr-yr3-without-school-mean-example.pdf",
    "https://www.acara.edu.au/docs/default-source/assessment-and-reporting-publications/naplan-writing-marking-guide.pdf",
    "https://www.acara.edu.au/docs/default-source/assessment-and-reporting-publications/naplan-2012-2016-test-papers.pdf",
  ];
  for (const url of examples) {
    assert.equal(classifyOfficialPdfPolicy(url).canTranslate, false, url);
  }
  assert.equal(classifyOfficialPdfPolicy(GENERAL_PDF, "Media release").canTranslate, true);
});

test("official PDF fetch rejects a redirect leaving the allowlist", async () => {
  const fetchImpl = async () => new Response(null, {
    headers: { location: "https://example.com/stolen.pdf" },
    status: 302,
  });
  await assert.rejects(
    fetchOfficialPdf("https://www.nap.edu.au/docs/report.pdf", fetchImpl),
    /PDF_SOURCE_NOT_ALLOWED/,
  );
});

test("official PDF fetch validates the PDF signature", async () => {
  const fetchImpl = async () => new Response(Buffer.from("%PDF-1.7\nmock"), {
    headers: { "content-type": "application/pdf" },
    status: 200,
  });
  const result = await fetchOfficialPdf(
    "https://www.nap.edu.au/docs/test-fetch-report.pdf",
    fetchImpl,
  );
  assert.equal(result.buffer.subarray(0, 5).toString("ascii"), "%PDF-");
});

test("PDF translation preserves non-language strings and source order", async () => {
  const fetchImpl = async (url) => {
    const query = new URL(url).searchParams.get("q");
    return new Response(JSON.stringify([[[query.replace("Results", "结果"), "Results"]]]), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  };
  const result = await translateOfficialPdfStrings(
    {
      sourceUrl: GENERAL_PDF,
      strings: ["Results", "2026 · 45%"],
      target: "zh-CN",
      title: "Media release",
    },
    fetchImpl,
  );
  assert.deepEqual(result.translations, ["结果", "2026 · 45%"]);
});

test("PDF translation is denied for excluded material", async () => {
  await assert.rejects(
    translateOfficialPdfStrings({
      sourceUrl: "https://www.nap.edu.au/docs/example-writing-prompt.pdf",
      strings: ["Write a story."],
      target: "zh-CN",
    }),
    (error) => error.code === "PDF_TRANSLATION_NOT_PERMITTED",
  );
});
