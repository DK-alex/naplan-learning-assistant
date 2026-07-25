import {
  ArrowSquareOut,
  ImageSquare,
  PlayCircle,
  SpeakerHigh,
} from "@phosphor-icons/react";
import { useState } from "react";

const mediaCopy = {
  "zh-CN": {
    audio: "在线音频",
    image: "官网图片",
    network: "需要联网播放；软件不会下载或保存媒体文件。",
    open: "在浏览器中打开",
    play: "在软件中播放",
    unavailable: "此媒体来源不支持在软件内嵌播放。",
    video: "在线视频",
  },
  "zh-TW": {
    audio: "線上音訊",
    image: "官網圖片",
    network: "需要連線播放；軟體不會下載或儲存媒體檔案。",
    open: "在瀏覽器中開啟",
    play: "在軟體中播放",
    unavailable: "此媒體來源不支援在軟體內嵌播放。",
    video: "線上影片",
  },
  ko: {
    audio: "온라인 오디오",
    image: "공식 웹사이트 이미지",
    network: "재생하려면 인터넷 연결이 필요하며 미디어 파일은 기기에 저장되지 않습니다.",
    open: "브라우저에서 열기",
    play: "앱에서 재생",
    unavailable: "이 미디어 제공업체는 앱 내 재생을 지원하지 않습니다.",
    video: "온라인 동영상",
  },
  en: {
    audio: "Online audio",
    image: "Official website image",
    network: "An internet connection is required. Media files are not downloaded or stored.",
    open: "Open in browser",
    play: "Play in app",
    unavailable: "This media provider does not support playback inside the app.",
    video: "Online video",
  },
};

function isSafeLink(value) {
  try {
    return ["http:", "https:", "mailto:", "tel:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isOfficialPdfLink(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const officialHost =
      hostname === "nap.edu.au" ||
      hostname.endsWith(".nap.edu.au") ||
      hostname === "acara.edu.au" ||
      hostname.endsWith(".acara.edu.au");
    return url.protocol === "https:" && officialHost && /\.pdf$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function isSafeRemoteMedia(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeEmbed(value) {
  if (!isSafeRemoteMedia(value)) return false;
  const hostname = new URL(value).hostname.toLowerCase();
  return [
    "youtube.com",
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
    "vimeo.com",
    "www.vimeo.com",
  ].includes(hostname);
}

function localiseRun(run, language, translations) {
  if (language === "en") return run.text;
  return translations?.[language]?.[run.id]?.trim() || run.text;
}

function MarkedText({ marks = [], children }) {
  return marks.reduce((content, mark) => {
    if (mark === "strong") return <strong>{content}</strong>;
    if (mark === "emphasis") return <em>{content}</em>;
    if (mark === "code") return <code>{content}</code>;
    if (mark === "superscript") return <sup>{content}</sup>;
    if (mark === "subscript") return <sub>{content}</sub>;
    return content;
  }, children);
}

function OfficialRuns({ runs = [], language, onOpenPdf, translations }) {
  return runs.map((run, index) => {
    const text = localiseRun(run, language, translations);
    const content = <MarkedText marks={run.marks}>{text}</MarkedText>;
    if (run.type === "link" && isSafeLink(run.href)) {
      return (
        <a
          className="official-inline-link"
          href={run.href}
          key={`${run.id}-${index}`}
          onClick={(event) => {
            if (!onOpenPdf || !isOfficialPdfLink(run.href)) return;
            event.preventDefault();
            onOpenPdf({ sourceUrl: run.href, title: text });
          }}
          rel="noreferrer"
          target="_blank"
        >
          {content}
          <ArrowSquareOut aria-hidden="true" size={13} weight="bold" />
        </a>
      );
    }
    return <span className="official-inline-text" key={`${run.id}-${index}`}>{content}</span>;
  });
}

function OfficialList({ block, language, onOpenPdf, translations }) {
  const ListTag = block.ordered ? "ol" : "ul";
  return (
    <ListTag className="official-document-list">
      {block.items.map((item, index) => (
        <li key={`${block.id}-${item.id}-${index}`}>
          <OfficialRuns
            runs={item.runs}
            language={language}
            onOpenPdf={onOpenPdf}
            translations={translations}
          />
          {item.children?.map((child) => (
            <OfficialList
              block={child}
              key={child.id}
              language={language}
              onOpenPdf={onOpenPdf}
              translations={translations}
            />
          ))}
        </li>
      ))}
    </ListTag>
  );
}

function OfficialMedia({ block, language, translations }) {
  const [embedActive, setEmbedActive] = useState(false);
  const copy = mediaCopy[language] || mediaCopy.en;
  const title = block.title_runs
    ?.map((run) => localiseRun(run, language, translations))
    .join("")
    .trim();
  const caption = block.caption_runs
    ?.map((run) => localiseRun(run, language, translations))
    .join("")
    .trim();
  const safeSource = isSafeRemoteMedia(block.src);
  const isImage = block.media_kind === "image-reference";
  const isAudio = block.media_kind === "audio";
  const label = isImage ? copy.image : isAudio ? copy.audio : copy.video;
  const Icon = isImage ? ImageSquare : isAudio ? SpeakerHigh : PlayCircle;

  return (
    <figure className={`official-media official-media-${block.media_kind}`}>
      <figcaption>
        <span className="official-media-icon"><Icon size={22} weight="duotone" /></span>
        <span>
          <strong>{title || label}</strong>
          <small>{copy.network}</small>
        </span>
        {safeSource && (
          <a href={block.src} rel="noreferrer" target="_blank">
            {copy.open}<ArrowSquareOut size={14} weight="bold" />
          </a>
        )}
      </figcaption>
      {block.media_kind === "video-embed" && block.playable_inline && isSafeEmbed(block.src) && !embedActive && (
        <div className="official-video-frame official-video-gate">
          <button type="button" onClick={() => setEmbedActive(true)}>
            <PlayCircle size={48} weight="fill" />
            <strong>{copy.play}</strong>
            <small>{copy.network}</small>
          </button>
        </div>
      )}
      {block.media_kind === "video-embed" && block.playable_inline && isSafeEmbed(block.src) && embedActive && (
        <div className="official-video-frame">
          <iframe
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            src={block.src}
            title={title || label}
          />
        </div>
      )}
      {block.media_kind === "video" && block.playable_inline && safeSource && (
        <video controls preload="metadata" src={block.src}>
          {copy.unavailable}
        </video>
      )}
      {block.media_kind === "audio" && block.playable_inline && safeSource && (
        <audio controls preload="metadata" src={block.src}>
          {copy.unavailable}
        </audio>
      )}
      {!isImage && (!block.playable_inline || (block.media_kind === "video-embed" && !isSafeEmbed(block.src))) && (
        <p className="official-media-fallback">{copy.unavailable}</p>
      )}
      {caption && <p className="official-media-caption">{caption}</p>}
    </figure>
  );
}

function OfficialBlock({ block, language, onOpenPdf, translations }) {
  if (block.type === "heading") {
    const HeadingTag = `h${Math.min(Math.max(block.level, 1), 6)}`;
    return (
      <HeadingTag id={block.anchor ? `official-${block.anchor}` : undefined}>
        <OfficialRuns
          runs={block.runs}
          language={language}
          onOpenPdf={onOpenPdf}
          translations={translations}
        />
      </HeadingTag>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p>
        <OfficialRuns
          runs={block.runs}
          language={language}
          onOpenPdf={onOpenPdf}
          translations={translations}
        />
      </p>
    );
  }

  if (block.type === "preformatted") {
    return (
      <pre>
        <OfficialRuns
          runs={block.runs}
          language={language}
          onOpenPdf={onOpenPdf}
          translations={translations}
        />
      </pre>
    );
  }

  if (block.type === "list") {
    return (
      <OfficialList
        block={block}
        language={language}
        onOpenPdf={onOpenPdf}
        translations={translations}
      />
    );
  }

  if (block.type === "table") {
    return (
      <div className="official-table-scroll">
        <table>
          {block.caption_runs?.length > 0 && (
            <caption>
              <OfficialRuns
                runs={block.caption_runs}
                language={language}
                onOpenPdf={onOpenPdf}
                translations={translations}
              />
            </caption>
          )}
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${block.id}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => {
                  const CellTag = cell.header ? "th" : "td";
                  return (
                    <CellTag
                      colSpan={cell.col_span}
                      key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                      rowSpan={cell.row_span}
                      scope={cell.scope || undefined}
                    >
                      <OfficialRuns
                        runs={cell.runs}
                        language={language}
                        onOpenPdf={onOpenPdf}
                        translations={translations}
                      />
                    </CellTag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "blockquote") {
    return (
      <blockquote>
        {block.blocks.map((child) => (
          <OfficialBlock
            block={child}
            key={child.id}
            language={language}
            onOpenPdf={onOpenPdf}
            translations={translations}
          />
        ))}
      </blockquote>
    );
  }

  if (block.type === "details") {
    return (
      <details>
        <summary>
          <OfficialRuns
            runs={block.summary_runs}
            language={language}
            onOpenPdf={onOpenPdf}
            translations={translations}
          />
        </summary>
        {block.blocks.map((child) => (
          <OfficialBlock
            block={child}
            key={child.id}
            language={language}
            onOpenPdf={onOpenPdf}
            translations={translations}
          />
        ))}
      </details>
    );
  }

  if (block.type === "description-list") {
    return (
      <dl>
        {block.entries.map((entry, index) => (
          <div key={`${block.id}-entry-${index}`}>
            <dt>
              <OfficialRuns
                runs={entry.term_runs}
                language={language}
                onOpenPdf={onOpenPdf}
                translations={translations}
              />
            </dt>
            {entry.description_runs.map((runs, descriptionIndex) => (
              <dd key={`${block.id}-description-${index}-${descriptionIndex}`}>
                <OfficialRuns
                  runs={runs}
                  language={language}
                  onOpenPdf={onOpenPdf}
                  translations={translations}
                />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    );
  }

  if (block.type === "media") {
    return <OfficialMedia block={block} language={language} translations={translations} />;
  }

  if (block.type === "divider") {
    return <hr />;
  }

  return null;
}

export function getOfficialDocumentCharacterCount(document, language, translations) {
  const runs = [];
  function collect(block) {
    for (const key of ["runs", "title_runs", "caption_runs", "summary_runs", "term_runs"]) {
      if (Array.isArray(block[key])) runs.push(...block[key]);
    }
    for (const descriptionRuns of block.description_runs || []) runs.push(...descriptionRuns);
    for (const item of block.items || []) {
      runs.push(...(item.runs || []));
      for (const child of item.children || []) collect(child);
    }
    for (const row of block.rows || []) for (const cell of row) runs.push(...(cell.runs || []));
    for (const entry of block.entries || []) {
      runs.push(...(entry.term_runs || []));
      for (const descriptionRuns of entry.description_runs || []) runs.push(...descriptionRuns);
    }
    for (const child of block.blocks || []) collect(child);
  }
  for (const block of document?.blocks || []) collect(block);
  return runs.reduce(
    (total, run) => total + localiseRun(run, language, translations).length,
    0,
  );
}

export default function OfficialDocument({
  document,
  language = "en",
  onOpenPdf,
  translations = {},
}) {
  return (
    <article className="official-document" lang={language}>
      {document?.blocks?.map((block) => (
        <OfficialBlock
          block={block}
          key={block.id}
          language={language}
          onOpenPdf={onOpenPdf}
          translations={translations}
        />
      ))}
    </article>
  );
}
