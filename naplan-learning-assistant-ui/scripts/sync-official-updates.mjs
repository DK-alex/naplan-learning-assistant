#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const updatesPath = path.join(root, "src", "data", "official-updates.json");
const pagesPath = path.join(root, "src", "data", "official-pages.json");
const updates = JSON.parse(await readFile(updatesPath, "utf8"));

const allowedHosts = new Set(["www.nap.edu.au", "nap.edu.au", "www.acara.edu.au", "acara.edu.au"]);
const uniqueUrls = [...new Set(updates.items.map((item) => item.url))];
const blockElements = new Set([
  "address",
  "article",
  "aside",
  "audio",
  "blockquote",
  "details",
  "div",
  "dl",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "iframe",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
  "video",
]);

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function resolveLink(value, baseUrl) {
  const raw = String(value || "").trim();
  if (!raw || /^javascript:/i.test(raw) || /^data:/i.test(raw)) return "";
  try {
    const resolved = new URL(raw, baseUrl);
    if (!["http:", "https:", "mailto:", "tel:"].includes(resolved.protocol)) return "";
    return resolved.href;
  } catch {
    return "";
  }
}

function resolveRemoteMedia(value, baseUrl) {
  const resolved = resolveLink(value, baseUrl);
  if (!resolved) return "";
  try {
    return new URL(resolved).protocol === "https:" ? resolved : "";
  } catch {
    return "";
  }
}

function sameMarks(left = [], right = []) {
  return left.length === right.length && left.every((mark, index) => mark === right[index]);
}

function appendRun(runs, run) {
  const text = cleanText(run.text);
  if (!text) return;
  const previous = runs.at(-1);
  if (
    previous &&
    previous.type === run.type &&
    previous.href === run.href &&
    sameMarks(previous.marks, run.marks)
  ) {
    previous.text += text;
    return;
  }
  runs.push({ ...run, text });
}

function extractRuns($, nodes, context, inherited = {}) {
  const runs = [];

  function visit(node, state) {
    if (!node) return;
    if (node.type === "text") {
      appendRun(runs, {
        type: state.href ? "link" : "text",
        text: node.data,
        href: state.href || undefined,
        marks: state.marks.length ? state.marks : undefined,
      });
      return;
    }
    if (node.type !== "tag") return;

    const tag = node.tagName?.toLowerCase();
    if (!tag || ["script", "style", "noscript", "svg", "iframe", "video", "audio", "img"].includes(tag)) {
      return;
    }
    if (tag === "br") {
      appendRun(runs, {
        type: state.href ? "link" : "text",
        text: "\n",
        href: state.href || undefined,
        marks: state.marks.length ? state.marks : undefined,
      });
      return;
    }
    if (["ul", "ol", "table"].includes(tag)) return;

    const marks = [...state.marks];
    if (["b", "strong"].includes(tag) && !marks.includes("strong")) marks.push("strong");
    if (["em", "i"].includes(tag) && !marks.includes("emphasis")) marks.push("emphasis");
    if (tag === "code" && !marks.includes("code")) marks.push("code");
    if (tag === "sup" && !marks.includes("superscript")) marks.push("superscript");
    if (tag === "sub" && !marks.includes("subscript")) marks.push("subscript");

    const href = tag === "a" ? resolveLink($(node).attr("href"), context.baseUrl) : state.href;
    for (const child of node.children || []) visit(child, { href: href || state.href, marks });
  }

  const initial = {
    href: inherited.href || "",
    marks: inherited.marks || [],
  };
  for (const node of nodes) visit(node, initial);

  while (runs.length && !runs[0].text.trim()) runs.shift();
  while (runs.length && !runs.at(-1).text.trim()) runs.pop();
  if (runs.length) {
    runs[0].text = runs[0].text.trimStart();
    runs.at(-1).text = runs.at(-1).text.trimEnd();
  }

  return runs
    .filter((run) => run.text)
    .map((run) => {
      if (!run.text.trim()) {
        return {
          type: "text",
          text: run.text,
          id: `w${String(++context.whitespaceCounter).padStart(5, "0")}`,
        };
      }
      return {
        ...run,
        id: `s${String(++context.stringCounter).padStart(5, "0")}`,
      };
    });
}

function nextBlockId(context) {
  return `b${String(++context.blockCounter).padStart(4, "0")}`;
}

function mediaProvider(src) {
  const hostname = new URL(src).hostname.toLowerCase();
  if (hostname === "www.youtube.com" || hostname === "youtube.com" || hostname === "www.youtube-nocookie.com") {
    return "youtube";
  }
  if (hostname === "player.vimeo.com" || hostname === "vimeo.com" || hostname === "www.vimeo.com") {
    return "vimeo";
  }
  return "remote";
}

function mediaBlock($, element, context) {
  const tag = element.tagName?.toLowerCase();
  if (!["iframe", "video", "audio", "img"].includes(tag)) return null;

  const sourceValue =
    $(element).attr("src") ||
    $(element).find("source[src]").first().attr("src") ||
    $(element).attr("data-src");
  const src = resolveRemoteMedia(sourceValue, context.baseUrl);
  if (!src) return null;

  const title =
    $(element).attr("title") ||
    $(element).attr("aria-label") ||
    $(element).attr("alt") ||
    (tag === "img" ? "Official source image" : tag === "audio" ? "Online audio" : "Online video");
  const titleRuns = [
    {
      type: "text",
      text: cleanText(title).trim(),
      id: `s${String(++context.stringCounter).padStart(5, "0")}`,
    },
  ];
  const provider = tag === "iframe" ? mediaProvider(src) : "direct";
  const playableInline =
    tag === "video" ||
    tag === "audio" ||
    (tag === "iframe" && ["youtube", "vimeo"].includes(provider));

  return {
    id: nextBlockId(context),
    type: "media",
    media_kind:
      tag === "img" ? "image-reference" : tag === "audio" ? "audio" : tag === "video" ? "video" : "video-embed",
    provider,
    src,
    title_runs: titleRuns,
    width: Number.parseInt($(element).attr("width"), 10) || null,
    height: Number.parseInt($(element).attr("height"), 10) || null,
    playable_inline: playableInline,
    stored_locally: false,
  };
}

function extractList($, element, context) {
  const items = [];
  $(element)
    .children("li")
    .each((_, item) => {
      const inlineNodes = (item.children || []).filter(
        (node) => node.type !== "tag" || !["ul", "ol"].includes(node.tagName?.toLowerCase()),
      );
      const runs = extractRuns($, inlineNodes, context);
      const children = [];
      $(item)
        .children("ul, ol")
        .each((__, nested) => children.push(extractList($, nested, context)));
      if (runs.length || children.length) {
        items.push({
          id: `li${String(items.length + 1).padStart(3, "0")}`,
          runs,
          children,
        });
      }
    });

  return {
    id: nextBlockId(context),
    type: "list",
    ordered: element.tagName?.toLowerCase() === "ol",
    items,
  };
}

function extractTable($, element, context) {
  const captionElement = $(element).children("caption").first();
  const captionRuns = captionElement.length
    ? extractRuns($, captionElement.contents().toArray(), context)
    : [];
  const rows = [];
  $(element)
    .find("tr")
    .each((_, row) => {
      const cells = [];
      $(row)
        .children("th, td")
        .each((__, cell) => {
          const tag = cell.tagName?.toLowerCase();
          const runs = extractRuns($, $(cell).contents().toArray(), context);
          cells.push({
            header: tag === "th",
            scope: $(cell).attr("scope") || null,
            col_span: Number.parseInt($(cell).attr("colspan"), 10) || 1,
            row_span: Number.parseInt($(cell).attr("rowspan"), 10) || 1,
            runs,
          });
        });
      if (cells.length) rows.push(cells);
    });

  return {
    id: nextBlockId(context),
    type: "table",
    caption_runs: captionRuns,
    rows,
  };
}

function flushInlineBuffer($, buffer, context, blocks) {
  if (!buffer.length) return;
  const runs = extractRuns($, buffer.splice(0), context);
  if (runs.length) {
    blocks.push({
      id: nextBlockId(context),
      type: "paragraph",
      runs,
    });
  }
}

function extractBlocksFromNodes($, nodes, context) {
  const blocks = [];
  const inlineBuffer = [];

  for (const node of nodes) {
    const tag = node.type === "tag" ? node.tagName?.toLowerCase() : "";
    const isBlock = tag && blockElements.has(tag);
    if (!isBlock) {
      inlineBuffer.push(node);
      continue;
    }

    flushInlineBuffer($, inlineBuffer, context, blocks);

    if (/^h[1-6]$/.test(tag)) {
      const runs = extractRuns($, $(node).contents().toArray(), context);
      if (!runs.length) continue;
      const anchor =
        $(node).attr("id") ||
        $(node).children("a[id], a[name]").first().attr("id") ||
        $(node).children("a[id], a[name]").first().attr("name") ||
        null;
      blocks.push({
        id: nextBlockId(context),
        type: "heading",
        level: Number(tag.slice(1)),
        anchor,
        runs,
      });
      continue;
    }

    if (tag === "p" || tag === "address" || tag === "pre") {
      const paragraphNodes = [];
      for (const child of node.children || []) {
        const childTag = child.type === "tag" ? child.tagName?.toLowerCase() : "";
        if (["iframe", "video", "audio", "img"].includes(childTag)) {
          flushInlineBuffer($, paragraphNodes, context, blocks);
          const media = mediaBlock($, child, context);
          if (media) blocks.push(media);
        } else {
          paragraphNodes.push(child);
        }
      }
      flushInlineBuffer($, paragraphNodes, context, blocks);
      if (tag === "pre" && blocks.at(-1)?.type === "paragraph") blocks.at(-1).type = "preformatted";
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const list = extractList($, node, context);
      if (list.items.length) blocks.push(list);
      continue;
    }

    if (tag === "table") {
      const table = extractTable($, node, context);
      if (table.rows.length) blocks.push(table);
      continue;
    }

    if (tag === "blockquote") {
      const quoteBlocks = extractBlocksFromNodes($, node.children || [], context);
      if (quoteBlocks.length) {
        blocks.push({
          id: nextBlockId(context),
          type: "blockquote",
          blocks: quoteBlocks,
        });
      }
      continue;
    }

    if (tag === "details") {
      const summary = $(node).children("summary").first();
      const summaryRuns = summary.length
        ? extractRuns($, summary.contents().toArray(), context)
        : [];
      const detailNodes = (node.children || []).filter(
        (child) => child.type !== "tag" || child.tagName?.toLowerCase() !== "summary",
      );
      const detailBlocks = extractBlocksFromNodes($, detailNodes, context);
      if (summaryRuns.length || detailBlocks.length) {
        blocks.push({
          id: nextBlockId(context),
          type: "details",
          summary_runs: summaryRuns,
          blocks: detailBlocks,
        });
      }
      continue;
    }

    if (tag === "dl") {
      const entries = [];
      let current = null;
      $(node)
        .children("dt, dd")
        .each((_, entry) => {
          const runs = extractRuns($, $(entry).contents().toArray(), context);
          if (entry.tagName?.toLowerCase() === "dt") {
            current = { term_runs: runs, description_runs: [] };
            entries.push(current);
          } else if (current) {
            current.description_runs.push(runs);
          }
        });
      if (entries.length) {
        blocks.push({
          id: nextBlockId(context),
          type: "description-list",
          entries,
        });
      }
      continue;
    }

    if (tag === "figure") {
      const caption = $(node).children("figcaption").first();
      for (const mediaElement of $(node).find("iframe, video, audio, img").toArray()) {
        const media = mediaBlock($, mediaElement, context);
        if (!media) continue;
        media.caption_runs = caption.length
          ? extractRuns($, caption.contents().toArray(), context)
          : [];
        blocks.push(media);
      }
      continue;
    }

    if (["iframe", "video", "audio", "img"].includes(tag)) {
      const media = mediaBlock($, node, context);
      if (media) blocks.push(media);
      continue;
    }

    if (tag === "hr") {
      blocks.push({ id: nextBlockId(context), type: "divider" });
      continue;
    }

    if (["header", "footer", "nav", "aside"].includes(tag)) continue;
    blocks.push(...extractBlocksFromNodes($, node.children || [], context));
  }

  flushInlineBuffer($, inlineBuffer, context, blocks);
  return blocks;
}

function selectContentRoot($, pageUrl) {
  const url = new URL(pageUrl);
  const section = url.searchParams.get("section");
  if (section) {
    const sectionAnchor = $(`a[name="${section.replace(/"/g, '\\"')}"]`).first();
    if (sectionAnchor.length && sectionAnchor.parent().length) {
      return { element: sectionAnchor.parent(), selector: `a[name="${section}"] parent` };
    }
  }

  const selectors = [
    ".main-content-text",
    "#contentmain",
    "main article",
    "article",
    "[role='main']",
    "main",
    "body",
  ];
  for (const selector of selectors) {
    const candidate = $(selector).first();
    if (candidate.length && candidate.text().trim().length > 40) {
      return { element: candidate, selector };
    }
  }
  return { element: $.root(), selector: "document" };
}

function collectRuns(block, output) {
  for (const key of ["runs", "title_runs", "caption_runs", "summary_runs", "term_runs"]) {
    if (Array.isArray(block[key])) output.push(...block[key]);
  }
  if (Array.isArray(block.description_runs)) {
    for (const runs of block.description_runs) output.push(...runs);
  }
  if (Array.isArray(block.items)) {
    for (const item of block.items) {
      output.push(...(item.runs || []));
      for (const child of item.children || []) collectRuns(child, output);
    }
  }
  if (Array.isArray(block.rows)) {
    for (const row of block.rows) {
      for (const cell of row) output.push(...(cell.runs || []));
    }
  }
  if (Array.isArray(block.entries)) {
    for (const entry of block.entries) {
      output.push(...(entry.term_runs || []));
      for (const runs of entry.description_runs || []) output.push(...runs);
    }
  }
  for (const child of block.blocks || []) collectRuns(child, output);
}

function runsText(runs = []) {
  return runs.map((run) => run.text).join("");
}

function blockPlainText(block, depth = 0) {
  if (block.type === "heading") return `${"#".repeat(block.level)} ${runsText(block.runs)}`;
  if (["paragraph", "preformatted"].includes(block.type)) return runsText(block.runs);
  if (block.type === "list") {
    return block.items
      .map((item, index) => {
        const marker = block.ordered ? `${index + 1}.` : "-";
        const nested = (item.children || [])
          .map((child) => blockPlainText(child, depth + 1))
          .filter(Boolean)
          .join("\n");
        return `${"  ".repeat(depth)}${marker} ${runsText(item.runs)}${nested ? `\n${nested}` : ""}`;
      })
      .join("\n");
  }
  if (block.type === "table") {
    const caption = runsText(block.caption_runs);
    const rows = block.rows.map((row) => row.map((cell) => runsText(cell.runs)).join(" | ")).join("\n");
    return [caption, rows].filter(Boolean).join("\n");
  }
  if (block.type === "description-list") {
    return block.entries
      .map((entry) =>
        [runsText(entry.term_runs), ...(entry.description_runs || []).map(runsText)].filter(Boolean).join("\n"),
      )
      .join("\n");
  }
  if (["blockquote", "details"].includes(block.type)) {
    const summary = runsText(block.summary_runs);
    const body = (block.blocks || []).map((child) => blockPlainText(child, depth)).filter(Boolean).join("\n");
    return [summary, body].filter(Boolean).join("\n");
  }
  if (block.type === "media") return runsText(block.title_runs);
  return "";
}

function extractDocument(html, pageUrl) {
  const $ = cheerio.load(html);
  const selected = selectContentRoot($, pageUrl);
  selected.element
    .find("script, style, noscript, svg, form, nav, footer, header, aside, [aria-hidden='true']")
    .remove();
  const context = {
    baseUrl: pageUrl,
    blockCounter: 0,
    stringCounter: 0,
    whitespaceCounter: 0,
  };
  const blocks = extractBlocksFromNodes($, selected.element.contents().toArray(), context);
  const strings = [];
  for (const block of blocks) collectRuns(block, strings);
  const translatableStrings = strings.filter((run) => run.id?.startsWith("s"));
  const links = strings.filter((run) => run.type === "link" && run.href);
  const media = blocks.filter((block) => block.type === "media");
  const text = blocks
    .map((block) => blockPlainText(block))
    .filter((line) => line && !["top", "Print Page", "Email Page"].includes(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    document: {
      schema_version: 1,
      source_root: selected.selector,
      blocks,
      string_count: translatableStrings.length,
      link_count: links.length,
      media_count: media.length,
    },
    text,
  };
}

function extractTitle(html, fallback, pageUrl) {
  const $ = cheerio.load(html);
  const selected = selectContentRoot($, pageUrl);
  const heading = selected.element.find("h1, h2").first().text();
  const title = $("title").first().text();
  return cleanText(heading || title || fallback)
    .replace(/\s*[-|]\s*(NAP|ACARA).*$/i, "")
    .trim();
}

const pages = [];
for (const url of uniqueUrls) {
  const parsed = new URL(url);
  if (!allowedHosts.has(parsed.hostname)) throw new Error(`Refusing non-official host: ${parsed.hostname}`);

  if (parsed.pathname.toLowerCase().endsWith(".pdf")) {
    pages.push({
      url,
      source: parsed.hostname.includes("acara") ? "ACARA" : "NAP",
      content_type: "application/pdf",
      status: "linked-not-mirrored",
      note: "PDFs and excluded materials remain linked to the official source.",
    });
    continue;
  }

  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "NAPLAN-Learning-Assistant/1.0 (+local educational information sync)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);

  const html = await response.text();
  const { document, text } = extractDocument(html, url);
  if (document.blocks.length < 2 || text.length < 40) {
    throw new Error(`Structured extraction produced too little content: ${url}`);
  }
  const fallbackTitle = updates.items.find((item) => item.url === url)?.title?.en || url;
  const canonicalDocument = JSON.stringify(document);
  pages.push({
    url,
    source: parsed.hostname.includes("acara") ? "ACARA" : "NAP",
    content_type: response.headers.get("content-type") || "text/html",
    status: "stored",
    title_en: extractTitle(html, fallbackTitle, url),
    fetched_at: new Date().toISOString(),
    last_modified: response.headers.get("last-modified"),
    content_hash: createHash("sha256").update(canonicalDocument).digest("hex"),
    character_count: text.length,
    block_count: document.blocks.length,
    link_count: document.link_count,
    media_count: document.media_count,
    text_en: text,
    document,
  });
}

const syncedAt = new Date().toISOString();
updates.synced_at = syncedAt;
for (const item of updates.items) {
  const page = pages.find((candidate) => candidate.url === item.url);
  item.source_snapshot = page
    ? {
        status: page.status,
        title_en: page.title_en ?? null,
        fetched_at: page.fetched_at ?? syncedAt,
        last_modified: page.last_modified ?? null,
        content_hash: page.content_hash ?? null,
        character_count: page.character_count ?? null,
        block_count: page.block_count ?? null,
        link_count: page.link_count ?? null,
        media_count: page.media_count ?? null,
      }
    : null;
}

await writeFile(updatesPath, `${JSON.stringify(updates, null, 2)}\n`, "utf8");
await writeFile(
  pagesPath,
  `${JSON.stringify(
    {
      schema_version: 2,
      synced_at: syncedAt,
      attribution:
        "© Australian Curriculum, Assessment and Reporting Authority (ACARA) 2011 to present, unless otherwise indicated. Source material from the National Assessment Program and ACARA websites, accessed at the fetched_at dates, used under CC BY 4.0. This independent product is not endorsed by or affiliated with ACARA.",
      licence_url: "https://www.nap.edu.au/copyright",
      excluded_materials:
        "Logos, photographs, video files, past/example NAPLAN questions, writing prompts, reading stimuli, writing marking guides, online demonstration tests, SSSR guides and example ISRs are not stored locally. Official embedded video and audio entries retain only their remote HTTPS playback URL.",
      pages,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Synced ${pages.filter((page) => page.status === "stored").length} official HTML pages.`);
console.log(`Linked ${pages.filter((page) => page.status !== "stored").length} non-HTML or excluded resources.`);
console.log(
  `Preserved ${pages.reduce((total, page) => total + (page.link_count || 0), 0)} links and ` +
    `${pages.reduce((total, page) => total + (page.media_count || 0), 0)} remote media entries.`,
);
