import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  FilePdf,
  SpinnerGap,
  Translate,
  WarningCircle,
} from "@phosphor-icons/react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import { useEffect, useMemo, useRef, useState } from "react";
import { languageOptions, useI18n } from "./i18n.jsx";

GlobalWorkerOptions.workerPort = new PdfWorker();

const copyByLanguage = {
  "zh-CN": {
    back: "返回",
    comparison: "原版与译文对照",
    copyrightBlocked: "此 PDF 属于 ACARA 排除材料。软件会保留并显示官方原版，但版权条件不允许生成翻译或其他改编版本。",
    emptyText: "这一页没有可提取的文字，可能是扫描页或以图片为主。左侧官方原页仍可正常阅读。",
    fetchError: "无法载入官方 PDF。请检查网络连接，或使用“打开官方原文”。",
    layout: "官方 PDF 原版排版",
    machineTranslation: "机器辅助译文",
    next: "下一页",
    openOriginal: "打开官方原文",
    original: "英文原文转录",
    page: "第 {current} / {total} 页",
    previous: "上一页",
    sourceNote: "左侧始终是官方 PDF 原页；译文仅帮助理解，核对内容请以英文原文为准。",
    textLoading: "正在提取本页文字…",
    title: "PDF 对照阅读器",
    translating: "正在生成本页译文…",
    translationError: "本页译文暂时不可用。官方原页未受影响，可以稍后重试。",
    translationLanguage: "译文语言",
  },
  "zh-TW": {
    back: "返回",
    comparison: "原版與譯文對照",
    copyrightBlocked: "此 PDF 屬於 ACARA 排除材料。軟體會保留並顯示官方原版，但版權條件不允許產生翻譯或其他改編版本。",
    emptyText: "這一頁沒有可擷取的文字，可能是掃描頁或以圖片為主。左側官方原頁仍可正常閱讀。",
    fetchError: "無法載入官方 PDF。請檢查網路連線，或使用「開啟官方原文」。",
    layout: "官方 PDF 原版排版",
    machineTranslation: "機器輔助譯文",
    next: "下一頁",
    openOriginal: "開啟官方原文",
    original: "英文原文轉錄",
    page: "第 {current} / {total} 頁",
    previous: "上一頁",
    sourceNote: "左側始終是官方 PDF 原頁；譯文僅協助理解，核對內容請以英文原文為準。",
    textLoading: "正在擷取本頁文字…",
    title: "PDF 對照閱讀器",
    translating: "正在產生本頁譯文…",
    translationError: "本頁譯文暫時無法使用。官方原頁未受影響，可以稍後重試。",
    translationLanguage: "譯文語言",
  },
  ko: {
    back: "뒤로",
    comparison: "원본과 번역문 비교",
    copyrightBlocked: "이 PDF는 ACARA 제외 자료입니다. 공식 원본은 그대로 표시하지만 저작권 조건상 번역 또는 각색본을 만들 수 없습니다.",
    emptyText: "이 페이지에서 추출할 수 있는 텍스트가 없습니다. 스캔 페이지이거나 이미지 중심일 수 있습니다. 왼쪽 공식 원본은 그대로 읽을 수 있습니다.",
    fetchError: "공식 PDF를 불러올 수 없습니다. 인터넷 연결을 확인하거나 ‘공식 원문 열기’를 사용하세요.",
    layout: "공식 PDF 원본 레이아웃",
    machineTranslation: "기계 보조 번역",
    next: "다음 페이지",
    openOriginal: "공식 원문 열기",
    original: "영문 원문 전사",
    page: "{current} / {total}페이지",
    previous: "이전 페이지",
    sourceNote: "왼쪽은 항상 공식 PDF 원본입니다. 번역은 이해를 돕기 위한 것이며 확인은 영문 원본을 기준으로 하세요.",
    textLoading: "이 페이지의 텍스트를 추출하는 중…",
    title: "PDF 비교 리더",
    translating: "이 페이지를 번역하는 중…",
    translationError: "현재 이 페이지의 번역을 사용할 수 없습니다. 공식 원본은 영향을 받지 않으며 나중에 다시 시도할 수 있습니다.",
    translationLanguage: "번역 언어",
  },
  en: {
    back: "Back",
    comparison: "Original and translation",
    copyrightBlocked: "This PDF is ACARA excluded material. The official original remains available in the app, but its copyright conditions do not permit a translated or otherwise adapted version.",
    emptyText: "No selectable text was found on this page. It may be scanned or image-based. The official page remains readable on the left.",
    fetchError: "The official PDF could not be loaded. Check the internet connection or use “Open official source”.",
    layout: "Official PDF layout",
    machineTranslation: "Machine-assisted translation",
    next: "Next page",
    openOriginal: "Open official source",
    original: "English text transcript",
    page: "Page {current} of {total}",
    previous: "Previous page",
    sourceNote: "The left pane is always the official PDF page. Translations are for understanding only; verify details against the English original.",
    textLoading: "Extracting this page’s text…",
    title: "PDF comparison reader",
    translating: "Translating this page…",
    translationError: "The translation for this page is temporarily unavailable. The official page is unaffected; try again later.",
    translationLanguage: "Translation language",
  },
};

function format(copy, key, values = {}) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    copy[key],
  );
}

function isSafeExternalUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function translationCacheKey(fingerprint, sourceUrl, pageNumber, language) {
  return `naplan.pdf.translation.v1:${fingerprint || hashString(sourceUrl)}:${pageNumber}:${language}`;
}

function joinLineItems(items) {
  const sorted = [...items].sort((left, right) => left.x - right.x);
  let text = "";
  let previousEnd = null;
  let previousHeight = 0;
  for (const item of sorted) {
    const gap = previousEnd === null ? 0 : item.x - previousEnd;
    if (text && gap > Math.max(previousHeight, item.height, 8) * 0.2) text += " ";
    text += item.text;
    previousEnd = item.x + item.width;
    previousHeight = item.height;
  }
  return text.replace(/\s+/g, " ").trim();
}

export function extractPdfParagraphs(textContent) {
  const items = (textContent?.items || [])
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => ({
      height: Math.abs(item.height || item.transform?.[3] || 10),
      text: item.str.trim(),
      width: Math.abs(item.width || 0),
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
    }))
    .sort((left, right) => Math.abs(right.y - left.y) > 2.5 ? right.y - left.y : left.x - right.x);

  const lines = [];
  for (const item of items) {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(2.5, item.height * 0.25));
    if (line) {
      line.items.push(item);
      line.height = Math.max(line.height, item.height);
    } else {
      lines.push({ height: item.height, items: [item], y: item.y });
    }
  }
  lines.sort((left, right) => right.y - left.y);

  const paragraphs = [];
  let paragraph = [];
  let previousLine = null;
  for (const line of lines) {
    const text = joinLineItems(line.items);
    if (!text) continue;
    const verticalGap = previousLine ? previousLine.y - line.y : 0;
    if (
      paragraph.length &&
      (
        verticalGap > Math.max(previousLine.height, line.height) * 1.65 ||
        previousLine.text.endsWith(":")
      )
    ) {
      paragraphs.push(paragraph.join(" "));
      paragraph = [];
    }
    paragraph.push(text);
    previousLine = { ...line, text };
  }
  if (paragraph.length) paragraphs.push(paragraph.join(" "));
  return paragraphs;
}

function PdfCanvasPage({ onInternalNavigate, onPageText, pageNumber, pdf }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageSize, setPageSize] = useState({ height: 0, width: 0 });
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const update = () => setContainerWidth(container.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let renderTask;
    async function renderPage() {
      if (!pdf || !containerWidth || !canvasRef.current) return;
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const cssScale = Math.max(0.2, Math.min((containerWidth - 28) / baseViewport.width, 1.7));
      const cssViewport = page.getViewport({ scale: cssScale });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
      const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${cssViewport.width}px`;
      canvas.style.height = `${cssViewport.height}px`;
      if (active) setPageSize({ height: cssViewport.height, width: cssViewport.width });
      renderTask = page.render({ canvasContext: context, viewport: renderViewport });
      await renderTask.promise;

      const textContent = await page.getTextContent();
      let pageAnnotations = [];
      try {
        pageAnnotations = await page.getAnnotations({ intent: "display" });
      } catch {
        // A malformed annotation must not block the original page or its text transcript.
      }
      if (!active) return;
      const interactiveAnnotations = await Promise.all(
        pageAnnotations.map(async (annotation, index) => {
          try {
            if (!annotation.rect) return null;
            const rectangle = cssViewport.convertToViewportRectangle(annotation.rect);
            const geometry = {
              height: Math.abs(rectangle[3] - rectangle[1]),
              id: `${pageNumber}-${index}`,
              left: Math.min(rectangle[0], rectangle[2]),
              top: Math.min(rectangle[1], rectangle[3]),
              width: Math.abs(rectangle[2] - rectangle[0]),
            };
            if (annotation.url && isSafeExternalUrl(annotation.url)) {
              return { ...geometry, href: annotation.url, kind: "external" };
            }
            if (annotation.dest) {
              const destination = typeof annotation.dest === "string"
                ? await pdf.getDestination(annotation.dest)
                : annotation.dest;
              const reference = destination?.[0];
              const destinationIndex = Number.isInteger(reference)
                ? reference
                : await pdf.getPageIndex(reference);
              if (Number.isInteger(destinationIndex)) {
                return {
                  ...geometry,
                  destinationPage: destinationIndex + 1,
                  kind: "internal",
                };
              }
            }
          } catch {
            return null;
          }
          return null;
        }),
      );
      if (!active) return;
      setAnnotations(interactiveAnnotations.filter(Boolean));
      onPageText(extractPdfParagraphs(textContent));
    }
    renderPage().catch((error) => {
      if (active && error?.name !== "RenderingCancelledException") onPageText([]);
    });
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [containerWidth, onPageText, pageNumber, pdf]);

  return (
    <div className="official-pdf-canvas-scroll" ref={containerRef}>
      <div
        className="official-pdf-page"
        style={{ height: pageSize.height || undefined, width: pageSize.width || undefined }}
      >
        <canvas aria-label={`PDF page ${pageNumber}`} ref={canvasRef} />
        <div className="official-pdf-annotations">
          {annotations.map((annotation) => {
            const style = {
              height: annotation.height,
              left: annotation.left,
              top: annotation.top,
              width: annotation.width,
            };
            if (annotation.kind === "internal") {
              return (
                <button
                  aria-label={`Go to PDF page ${annotation.destinationPage}`}
                  key={annotation.id}
                  onClick={() => onInternalNavigate(annotation.destinationPage)}
                  style={style}
                  type="button"
                />
              );
            }
            return (
              <a
                aria-label={annotation.href}
                href={annotation.href}
                key={annotation.id}
                rel="noreferrer"
                style={style}
                target="_blank"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TranslationPane({
  canTranslate,
  copy,
  language,
  paragraphs,
  status,
  translatedParagraphs,
}) {
  if (!canTranslate && language !== "en") {
    return (
      <div className="official-pdf-message restricted">
        <WarningCircle size={34} weight="duotone" />
        <p>{copy.copyrightBlocked}</p>
      </div>
    );
  }
  if (status === "extracting") {
    return <div className="official-pdf-message"><SpinnerGap className="spin" size={30} /><p>{copy.textLoading}</p></div>;
  }
  if (!paragraphs.length) {
    return <div className="official-pdf-message"><FilePdf size={34} weight="duotone" /><p>{copy.emptyText}</p></div>;
  }
  if (status === "translating") {
    return <div className="official-pdf-message"><SpinnerGap className="spin" size={30} /><p>{copy.translating}</p></div>;
  }
  if (status === "translation-error") {
    return <div className="official-pdf-message error"><WarningCircle size={34} weight="duotone" /><p>{copy.translationError}</p></div>;
  }

  const visibleParagraphs = language === "en" ? paragraphs : translatedParagraphs;
  return (
    <article className="official-pdf-translation" lang={language}>
      {visibleParagraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </article>
  );
}

export default function OfficialPdfReader({ sourceUrl, title, onBack }) {
  const { language } = useI18n();
  const copy = copyByLanguage[language] || copyByLanguage.en;
  const [readerLanguage, setReaderLanguage] = useState(language);
  const [pdf, setPdf] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageParagraphs, setPageParagraphs] = useState({});
  const [translations, setTranslations] = useState({});
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const proxyUrl = useMemo(
    () => `/api/official-pdf?url=${encodeURIComponent(sourceUrl)}`,
    [sourceUrl],
  );
  const totalPages = pdf?.numPages || 0;
  const paragraphs = pageParagraphs[pageNumber] || [];
  const translationKey = `${pageNumber}:${readerLanguage}`;
  const translatedParagraphs = translations[translationKey] || [];

  useEffect(() => setReaderLanguage(language), [language, sourceUrl]);

  useEffect(() => {
    let active = true;
    let loadingTask;
    async function load() {
      setError("");
      setStatus("loading");
      setPdf(null);
      setPolicy(null);
      setPageNumber(1);
      setPageParagraphs({});
      setTranslations({});
      try {
        const metaResponse = await fetch(
          `/api/official-pdf/meta?url=${encodeURIComponent(sourceUrl)}&title=${encodeURIComponent(title || "")}`,
        );
        if (!metaResponse.ok) throw new Error("PDF_META_FAILED");
        const meta = await metaResponse.json();
        if (active) setPolicy(meta);

        loadingTask = getDocument({
          disableAutoFetch: true,
          disableRange: true,
          disableStream: true,
          url: proxyUrl,
        });
        const document = await loadingTask.promise;
        if (!active) {
          await document.destroy();
          return;
        }
        setPdf(document);
        setStatus("extracting");
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || "PDF_LOAD_FAILED");
        setStatus("error");
      }
    }
    load();
    return () => {
      active = false;
      loadingTask?.destroy();
    };
  }, [proxyUrl, sourceUrl, title]);

  const handlePageText = useMemo(
    () => (nextParagraphs) => {
      setPageParagraphs((current) => (
        current[pageNumber]
          ? current
          : { ...current, [pageNumber]: nextParagraphs }
      ));
      setStatus("ready");
    },
    [pageNumber],
  );

  useEffect(() => {
    if (!pdf || !policy || !Object.hasOwn(pageParagraphs, pageNumber)) return undefined;
    if (readerLanguage === "en" || !policy.canTranslate || paragraphs.length === 0) {
      setStatus("ready");
      return undefined;
    }
    if (translatedParagraphs.length) {
      setStatus("ready");
      return undefined;
    }

    const cacheKey = translationCacheKey(
      pdf.fingerprints?.[0],
      sourceUrl,
      pageNumber,
      readerLanguage,
    );
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (Array.isArray(cached) && cached.length === paragraphs.length) {
        setTranslations((current) => ({ ...current, [translationKey]: cached }));
        setStatus("ready");
        return undefined;
      }
    } catch {
      localStorage.removeItem(cacheKey);
    }

    let active = true;
    const controller = new AbortController();
    setStatus("translating");
    fetch("/api/official-pdf/translate", {
      body: JSON.stringify({
        sourceUrl,
        strings: paragraphs,
        target: readerLanguage,
        title,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.code || "PDF_TRANSLATION_FAILED");
        return payload.translations;
      })
      .then((nextTranslations) => {
        if (!active) return;
        setTranslations((current) => ({ ...current, [translationKey]: nextTranslations }));
        setStatus("ready");
        try {
          localStorage.setItem(cacheKey, JSON.stringify(nextTranslations));
        } catch {
          // Translation remains available for this session when local storage is full.
        }
      })
      .catch((translationError) => {
        if (!active || translationError?.name === "AbortError") return;
        setStatus("translation-error");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    pageNumber,
    pageParagraphs,
    paragraphs,
    pdf,
    policy,
    readerLanguage,
    sourceUrl,
    title,
    translatedParagraphs.length,
    translationKey,
  ]);

  function changePage(nextPage) {
    if (!pdf) return;
    setStatus(Object.hasOwn(pageParagraphs, nextPage) ? "ready" : "extracting");
    setPageNumber(Math.min(Math.max(nextPage, 1), pdf.numPages));
  }

  return (
    <section className="feature-card feature-card-wide official-pdf-reader">
      <div className="official-pdf-heading">
        <button type="button" className="feature-back inline-back" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" /> {copy.back}
        </button>
        <div>
          <span className="feature-kicker"><FilePdf size={17} weight="duotone" /> {copy.title}</span>
          <h2>{title}</h2>
          <p>{copy.sourceNote}</p>
        </div>
        <button
          type="button"
          className="feature-primary"
          onClick={() => window.open(sourceUrl, "_blank", "noopener,noreferrer")}
        >
          {copy.openOriginal} <ArrowSquareOut size={16} weight="bold" />
        </button>
      </div>

      <div className="official-pdf-toolbar">
        <div className="official-pdf-pagination">
          <button
            aria-label={copy.previous}
            disabled={!pdf || pageNumber <= 1}
            onClick={() => changePage(pageNumber - 1)}
            type="button"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <strong>{format(copy, "page", { current: pageNumber, total: totalPages || "…" })}</strong>
          <button
            aria-label={copy.next}
            disabled={!pdf || pageNumber >= totalPages}
            onClick={() => changePage(pageNumber + 1)}
            type="button"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
        <div className="official-pdf-language">
          <span><Translate size={17} /> {copy.translationLanguage}</span>
          <div>
            {languageOptions.map((option) => (
              <button
                className={readerLanguage === option.value ? "active" : ""}
                key={option.value}
                onClick={() => setReaderLanguage(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="official-pdf-load-error">
          <WarningCircle size={42} weight="duotone" />
          <strong>{copy.fetchError}</strong>
          <small>{error}</small>
        </div>
      ) : (
        <div className="official-pdf-comparison">
          <section>
            <header><FilePdf size={18} weight="duotone" /><strong>{copy.layout}</strong></header>
            {pdf ? (
              <PdfCanvasPage
                key={`${pdf.fingerprints?.[0] || "pdf"}-${pageNumber}`}
                onInternalNavigate={changePage}
                onPageText={handlePageText}
                pageNumber={pageNumber}
                pdf={pdf}
              />
            ) : (
              <div className="official-pdf-message"><SpinnerGap className="spin" size={34} /><p>{copy.textLoading}</p></div>
            )}
          </section>
          <section>
            <header>
              <Translate size={18} weight="duotone" />
              <strong>{readerLanguage === "en" ? copy.original : copy.machineTranslation}</strong>
            </header>
            <div className="official-pdf-translation-scroll">
              <TranslationPane
                canTranslate={policy?.canTranslate !== false}
                copy={copy}
                language={readerLanguage}
                paragraphs={paragraphs}
                status={status}
                translatedParagraphs={translatedParagraphs}
              />
            </div>
          </section>
        </div>
      )}

      <footer className="official-pdf-footer">
        <span><WarningCircle size={16} weight="fill" /> {copy.sourceNote}</span>
        {totalPages > 1 && (
          <button
            disabled={pageNumber >= totalPages}
            onClick={() => changePage(pageNumber + 1)}
            type="button"
          >
            {copy.next} <ArrowRight size={15} weight="bold" />
          </button>
        )}
      </footer>
    </section>
  );
}
