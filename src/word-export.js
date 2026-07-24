import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  LevelFormat,
  LineRuleType,
  PageBreak,
  PageNumber,
  Paragraph,
  Packer,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const PAGE_MARGIN = 1134;
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);
const TABLE_INDENT = 120;
const COLORS = {
  ink: "243746",
  muted: "677682",
  orange: "E87324",
  orangeSoft: "FFF1E5",
  teal: "169B83",
  tealSoft: "EAF8F4",
  blue: "2472C8",
  border: "DCE5EA",
  soft: "F5F8FA",
  white: "FFFFFF",
};

const COPY = {
  "zh-CN": {
    title: "写作批改与成长报告",
    subtitle: "基于公开评分框架的形成性练习反馈",
    student: "学生",
    year: "年级",
    genre: "写作类型",
    prompt: "题目",
    generated: "生成时间",
    model: "评分模型",
    language: "报告语言",
    disclaimer: "此报告用于练习反馈，不是官方 NAPLAN 成绩，也不包含官方量表分或熟练度等级。",
    overview: "1. 评分与核心反馈",
    score: "练习分数",
    confidence: "置信度",
    strengths: "主要优点",
    priorities: "优先改进",
    parentSummary: "给家长的摘要",
    writing: "2. 学生原文与批注",
    instructions: "写作要求",
    annotations: "批注清单",
    noAnnotations: "本次报告没有可显示的原文批注。",
    criteria: "3. 十项评分规则逐项说明",
    criterion: "评分项",
    rationale: "评分依据",
    nextStep: "下一步",
    revision: "4. 修改计划",
    minutes: "分钟",
    errors: "语言错误模式",
    category: "类别",
    original: "原文",
    suggestion: "建议",
    pattern: "模式",
    noErrors: "本次没有发现需要列为重复模式的语言错误。",
    studentMessage: "给学生的话",
    exemplar: "5. 同题高分示例",
    exemplarNotice: "以下为 AI 针对同一题目新写的高分示例，不是学生原文，也不应当作唯一答案。",
    why: "为什么这是高分示例",
    limitations: "报告边界",
    practice: "练习用途 · 非官方 NAPLAN 成绩",
  },
  "zh-TW": {
    title: "寫作批改與成長報告",
    subtitle: "依據公開評分框架的形成性練習回饋",
    student: "學生",
    year: "年級",
    genre: "寫作類型",
    prompt: "題目",
    generated: "產生時間",
    model: "評分模型",
    language: "報告語言",
    disclaimer: "此報告用於練習回饋，不是官方 NAPLAN 成績，也不包含官方量表分或能力等級。",
    overview: "1. 評分與核心回饋",
    score: "練習分數",
    confidence: "信心程度",
    strengths: "主要優點",
    priorities: "優先改進",
    parentSummary: "給家長的摘要",
    writing: "2. 學生原文與批註",
    instructions: "寫作要求",
    annotations: "批註清單",
    noAnnotations: "本次報告沒有可顯示的原文批註。",
    criteria: "3. 十項評分規則逐項說明",
    criterion: "評分項",
    rationale: "評分依據",
    nextStep: "下一步",
    revision: "4. 修改計畫",
    minutes: "分鐘",
    errors: "語言錯誤模式",
    category: "類別",
    original: "原文",
    suggestion: "建議",
    pattern: "模式",
    noErrors: "本次沒有發現需要列為重複模式的語言錯誤。",
    studentMessage: "給學生的話",
    exemplar: "5. 同題高分範例",
    exemplarNotice: "以下為 AI 針對同一題目新寫的高分範例，不是學生原文，也不應當作唯一答案。",
    why: "為什麼這是高分範例",
    limitations: "報告界線",
    practice: "練習用途 · 非官方 NAPLAN 成績",
  },
  en: {
    title: "Writing Review & Growth Report",
    subtitle: "Formative practice feedback based on the published assessment framework",
    student: "Student",
    year: "Year level",
    genre: "Writing type",
    prompt: "Prompt",
    generated: "Generated",
    model: "Assessment model",
    language: "Report language",
    disclaimer: "This report is for practice feedback. It is not an official NAPLAN result and contains no official scaled score or proficiency level.",
    overview: "1. Score and key feedback",
    score: "Practice score",
    confidence: "Confidence",
    strengths: "Key strengths",
    priorities: "Priority improvements",
    parentSummary: "Summary for parents",
    writing: "2. Student writing and annotations",
    instructions: "Task instructions",
    annotations: "Annotation notes",
    noAnnotations: "There are no visible in-text annotations in this report.",
    criteria: "3. Criterion-by-criterion rationale",
    criterion: "Criterion",
    rationale: "Rationale and evidence",
    nextStep: "Next step",
    revision: "4. Revision plan",
    minutes: "minutes",
    errors: "Language error patterns",
    category: "Category",
    original: "Original",
    suggestion: "Suggestion",
    pattern: "Pattern",
    noErrors: "No repeated language-error pattern was identified in this report.",
    studentMessage: "Message for the student",
    exemplar: "5. High-scoring exemplar",
    exemplarNotice: "The following exemplar was newly written by AI for the same prompt. It is not the student's work and is not the only valid response.",
    why: "Why this is a high-scoring exemplar",
    limitations: "Report limitations",
    practice: "Practice use · Not an official NAPLAN result",
  },
  ko: {
    title: "글쓰기 첨삭 및 성장 보고서",
    subtitle: "공개 평가 프레임워크에 기반한 형성적 연습 피드백",
    student: "학생",
    year: "학년",
    genre: "글 유형",
    prompt: "주제",
    generated: "생성 시간",
    model: "평가 모델",
    language: "보고서 언어",
    disclaimer: "이 보고서는 연습 피드백용이며 공식 NAPLAN 성적, 공식 척도 점수 또는 숙달 수준을 포함하지 않습니다.",
    overview: "1. 점수 및 핵심 피드백",
    score: "연습 점수",
    confidence: "신뢰도",
    strengths: "주요 강점",
    priorities: "우선 개선",
    parentSummary: "보호자 요약",
    writing: "2. 학생 글 및 본문 주석",
    instructions: "쓰기 지시",
    annotations: "주석 목록",
    noAnnotations: "이 보고서에는 표시할 본문 주석이 없습니다.",
    criteria: "3. 기준별 평가 근거",
    criterion: "평가 기준",
    rationale: "평가 근거",
    nextStep: "다음 단계",
    revision: "4. 수정 계획",
    minutes: "분",
    errors: "언어 오류 패턴",
    category: "범주",
    original: "원문",
    suggestion: "제안",
    pattern: "패턴",
    noErrors: "반복 패턴으로 분류할 언어 오류가 없습니다.",
    studentMessage: "학생에게 전하는 말",
    exemplar: "5. 같은 주제의 고득점 예시",
    exemplarNotice: "다음 글은 같은 주제로 AI가 새로 작성한 고득점 예시입니다. 학생 원문이 아니며 유일한 정답도 아닙니다.",
    why: "고득점 예시인 이유",
    limitations: "보고서 한계",
    practice: "연습용 · 공식 NAPLAN 성적 아님",
  },
};

const LANGUAGE_LABELS = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  ko: "한국어",
};

const ENUM_LABELS = {
  "zh-CN": {
    status: { scorable: "可评分", not_scorable: "暂不可评分" },
    confidence: { low: "低", medium: "中", high: "高" },
    genre: { narrative: "记叙文", persuasive: "议论文" },
    category: { spelling: "拼写", punctuation: "标点", grammar: "语法" },
    criterion: {
      audience: "读者意识",
      text_structure: "篇章结构",
      ideas: "内容与观点",
      character_and_setting: "人物与场景",
      persuasive_devices: "说服手法",
      vocabulary: "词汇",
      cohesion: "衔接",
      paragraphing: "分段",
      sentence_structure: "句子结构",
      punctuation: "标点",
      spelling: "拼写",
    },
  },
  "zh-TW": {
    status: { scorable: "可評分", not_scorable: "暫不可評分" },
    confidence: { low: "低", medium: "中", high: "高" },
    genre: { narrative: "記敘文", persuasive: "議論文" },
    category: { spelling: "拼字", punctuation: "標點", grammar: "文法" },
    criterion: {
      audience: "讀者意識",
      text_structure: "篇章結構",
      ideas: "內容與觀點",
      character_and_setting: "人物與場景",
      persuasive_devices: "說服手法",
      vocabulary: "詞彙",
      cohesion: "銜接",
      paragraphing: "分段",
      sentence_structure: "句子結構",
      punctuation: "標點",
      spelling: "拼字",
    },
  },
  en: {
    status: { scorable: "Scorable", not_scorable: "Not yet scorable" },
    confidence: { low: "Low", medium: "Medium", high: "High" },
    genre: { narrative: "Narrative", persuasive: "Persuasive" },
    category: { spelling: "Spelling", punctuation: "Punctuation", grammar: "Grammar" },
    criterion: {},
  },
  ko: {
    status: { scorable: "채점 가능", not_scorable: "현재 채점 불가" },
    confidence: { low: "낮음", medium: "보통", high: "높음" },
    genre: { narrative: "서사문", persuasive: "설득문" },
    category: { spelling: "철자", punctuation: "문장 부호", grammar: "문법" },
    criterion: {
      audience: "독자 고려",
      text_structure: "글 구조",
      ideas: "내용과 생각",
      character_and_setting: "인물과 배경",
      persuasive_devices: "설득 기법",
      vocabulary: "어휘",
      cohesion: "응집성",
      paragraphing: "문단 구성",
      sentence_structure: "문장 구조",
      punctuation: "문장 부호",
      spelling: "철자",
    },
  },
};

function fontForLanguage(language) {
  if (language === "zh-CN") return "Microsoft YaHei";
  if (language === "zh-TW") return "Microsoft JhengHei";
  if (language === "ko") return "Malgun Gothic";
  return "Arial";
}

function run(text, options = {}) {
  return new TextRun({
    text: String(text ?? ""),
    color: options.color || COLORS.ink,
    bold: options.bold,
    italics: options.italics,
    size: options.size,
    font: options.font,
  });
}

function bodyParagraph(text, options = {}) {
  return new Paragraph({
    children: [run(text, options)],
    alignment: options.alignment,
    spacing: {
      before: options.before ?? 0,
      after: options.after ?? 120,
      line: options.line ?? 290,
      lineRule: LineRuleType.AUTO,
    },
    keepNext: options.keepNext,
  });
}

function heading(text, level = 1) {
  return new Paragraph({
    style: level === 1 ? "ReportHeading1" : "ReportHeading2",
    children: [run(text, { bold: true })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function tableCell(text, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: options.fill
      ? { type: ShadingType.CLEAR, fill: options.fill, color: "auto" }
      : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [run(text, {
          bold: options.bold,
          color: options.color,
          size: options.size,
        })],
        alignment: options.alignment,
        spacing: { before: 0, after: 0, line: 280, lineRule: LineRuleType.AUTO },
      }),
    ],
  });
}

function fixedTable(rows, widths, options = {}) {
  const border = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: options.borderColor || COLORS.border,
  };
  return new Table({
    rows,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    indent: { size: TABLE_INDENT, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  });
}

function metadataTable(rows) {
  const widths = [1900, CONTENT_WIDTH - 1900];
  return fixedTable(
    rows.map(([label, value], index) => new TableRow({
      children: [
        tableCell(label, widths[0], {
          bold: true,
          color: COLORS.muted,
          fill: index % 2 === 0 ? COLORS.soft : COLORS.white,
        }),
        tableCell(value, widths[1], { fill: index % 2 === 0 ? COLORS.soft : COLORS.white }),
      ],
      cantSplit: true,
    })),
    widths,
  );
}

function listParagraph(text, reference) {
  return new Paragraph({
    numbering: { reference, level: 0 },
    children: [run(text)],
    spacing: { before: 0, after: 100, line: 290, lineRule: LineRuleType.AUTO },
  });
}

function sectionHeader(iconData) {
  const children = [];
  if (iconData) {
    children.push(new ImageRun({
      data: iconData,
      transformation: { width: 22, height: 22 },
      type: "png",
    }));
    children.push(run("  "));
  }
  children.push(run("NAPLAN Learning Assistant", { bold: true, color: COLORS.muted, size: 18 }));
  return new Header({
    children: [
      new Paragraph({
        children,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border } },
        spacing: { after: 80 },
      }),
    ],
  });
}

function sectionFooter(copy) {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          run(copy.practice, { color: COLORS.muted, size: 17 }),
          run("    |    ", { color: COLORS.border, size: 17 }),
          run("Page ", { color: COLORS.muted, size: 17 }),
          new TextRun({ children: [PageNumber.CURRENT], color: COLORS.muted, size: 17 }),
          run(" of ", { color: COLORS.muted, size: 17 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: COLORS.muted, size: 17 }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ],
  });
}

function formatDate(value, language) {
  const locale = language === "zh-CN" ? "zh-CN"
    : language === "zh-TW" ? "zh-TW"
      : language === "ko" ? "ko-KR"
        : "en-AU";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value || "");
  }
}

function errorRows(report, copy) {
  return Object.entries(report.error_patterns || {}).flatMap(([category, items]) => (
    (items || []).map((item) => [category, item.original, item.suggestion, item.pattern])
  ));
}

function enumLabel(language, group, value, fallback = value) {
  return ENUM_LABELS[language]?.[group]?.[value] || fallback;
}

function reportStyles(font) {
  return {
    default: {
      document: {
        run: { font, size: 22, color: COLORS.ink },
        paragraph: {
          spacing: { before: 0, after: 120, line: 290, lineRule: LineRuleType.AUTO },
        },
      },
    },
    paragraphStyles: [
      {
        id: "ReportTitle",
        name: "Report Title",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font, size: 52, bold: true, color: COLORS.ink },
        paragraph: { spacing: { before: 0, after: 120 }, keepNext: true },
      },
      {
        id: "ReportSubtitle",
        name: "Report Subtitle",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font, size: 26, color: COLORS.muted },
        paragraph: { spacing: { before: 0, after: 300 }, keepNext: true },
      },
      {
        id: "ReportHeading1",
        name: "Report Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font, size: 32, bold: true, color: COLORS.orange },
        paragraph: { spacing: { before: 320, after: 160 }, keepNext: true },
      },
      {
        id: "ReportHeading2",
        name: "Report Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font, size: 25, bold: true, color: COLORS.teal },
        paragraph: { spacing: { before: 220, after: 100 }, keepNext: true },
      },
    ],
  };
}

export function buildWritingReportDocument({
  reportRecord,
  report,
  studentName,
  language,
  iconData = null,
}) {
  const copy = COPY[language] || COPY.en;
  const font = fontForLanguage(language);
  const providerLabel = `${reportRecord.provider || "AI"} · ${reportRecord.model || ""}`.trim();
  const generatedAt = formatDate(reportRecord.generated_at, language);
  const score = report.total_score === null ? "—" : `${report.total_score} / ${report.maximum_score}`;
  const docChildren = [
    new Paragraph({
      style: "ReportTitle",
      children: [run(copy.title, { font, bold: true })],
    }),
    new Paragraph({
      style: "ReportSubtitle",
      children: [run(copy.subtitle, { font, color: COLORS.muted })],
    }),
    metadataTable([
      [copy.student, studentName || copy.student],
      [copy.year, `Year ${reportRecord.year_level}`],
      [copy.genre, enumLabel(language, "genre", report.genre)],
      [copy.prompt, reportRecord.prompt_title],
      [copy.generated, generatedAt],
      [copy.model, providerLabel],
      [copy.language, LANGUAGE_LABELS[language] || language],
    ]),
    bodyParagraph(copy.disclaimer, {
      bold: true,
      color: "8A5A2B",
      before: 220,
      after: 180,
      line: 300,
    }),
    pageBreak(),
    heading(copy.overview),
    fixedTable([
      new TableRow({
        children: [
          tableCell(copy.score, 2200, { bold: true, fill: COLORS.orangeSoft }),
          tableCell(score, 1800, {
            bold: true,
            color: COLORS.orange,
            fill: COLORS.orangeSoft,
            alignment: AlignmentType.CENTER,
            size: 30,
          }),
          tableCell(`${enumLabel(language, "status", report.status)} · ${copy.confidence}: ${enumLabel(language, "confidence", report.confidence)}`, CONTENT_WIDTH - 4000, {
            fill: COLORS.orangeSoft,
          }),
        ],
        cantSplit: true,
      }),
    ], [2200, 1800, CONTENT_WIDTH - 4000], { borderColor: "F2CBAA" }),
    bodyParagraph(report.overall_summary, { bold: true, size: 25, before: 180, after: 180, line: 310 }),
    heading(copy.strengths, 2),
    ...(report.strengths || []).map((item) => listParagraph(
      `${item.title}: “${item.evidence}” — ${item.impact}`,
      "report-bullets",
    )),
    heading(copy.priorities, 2),
    ...(report.priorities || []).map((item) => listParagraph(
      `${item.issue}: ${item.action} (${item.micro_example})`,
      "priority-numbers",
    )),
    heading(copy.parentSummary, 2),
    bodyParagraph(report.parent_summary, { color: COLORS.ink, line: 310 }),
    pageBreak(),
    heading(copy.writing),
    ...(reportRecord.prompt_instructions
      ? [
          heading(copy.instructions, 2),
          bodyParagraph(reportRecord.prompt_instructions, { color: COLORS.muted }),
        ]
      : []),
    ...(String(reportRecord.student_text || "").split(/\n+/).filter(Boolean).map((paragraph) => (
      bodyParagraph(paragraph, { after: 160, line: 310 })
    ))),
    heading(copy.annotations, 2),
  ];

  if ((report.annotations || []).length) {
    const widths = [700, 2600, CONTENT_WIDTH - 3300];
    docChildren.push(fixedTable([
      new TableRow({
        tableHeader: true,
        children: [
          tableCell("#", widths[0], { bold: true, fill: COLORS.tealSoft, alignment: AlignmentType.CENTER }),
          tableCell(copy.original, widths[1], { bold: true, fill: COLORS.tealSoft }),
          tableCell(copy.annotations, widths[2], { bold: true, fill: COLORS.tealSoft }),
        ],
      }),
      ...(report.annotations || []).map((annotation, index) => new TableRow({
        cantSplit: true,
        children: [
          tableCell(String(index + 1), widths[0], { alignment: AlignmentType.CENTER }),
          tableCell(annotation.quote, widths[1]),
          tableCell(`${enumLabel(language, "criterion", annotation.criterion, annotation.criterion.replaceAll("_", " "))}: ${annotation.comment}`, widths[2]),
        ],
      })),
    ], widths));
  } else {
    docChildren.push(bodyParagraph(copy.noAnnotations, { color: COLORS.muted }));
  }

  const criteriaWidths = [1900, 1100, 3900, CONTENT_WIDTH - 6900];
  docChildren.push(
    pageBreak(),
    heading(copy.criteria),
    fixedTable([
      new TableRow({
        tableHeader: true,
        children: [
          tableCell(copy.criterion, criteriaWidths[0], { bold: true, fill: COLORS.orangeSoft }),
          tableCell(copy.score, criteriaWidths[1], { bold: true, fill: COLORS.orangeSoft, alignment: AlignmentType.CENTER }),
          tableCell(copy.rationale, criteriaWidths[2], { bold: true, fill: COLORS.orangeSoft }),
          tableCell(copy.nextStep, criteriaWidths[3], { bold: true, fill: COLORS.orangeSoft }),
        ],
      }),
      ...(report.criteria || []).map((criterion) => new TableRow({
        cantSplit: true,
        children: [
          tableCell(enumLabel(language, "criterion", criterion.key, criterion.label), criteriaWidths[0], { bold: true }),
          tableCell(`${criterion.score ?? "—"}/${criterion.max_score}`, criteriaWidths[1], {
            alignment: AlignmentType.CENTER,
            color: COLORS.orange,
            bold: true,
          }),
          tableCell([
            criterion.rationale,
            ...(criterion.evidence?.length ? [`Evidence: ${criterion.evidence.join(" · ")}`] : []),
          ].join("\n"), criteriaWidths[2]),
          tableCell(criterion.next_step, criteriaWidths[3]),
        ],
      })),
    ], criteriaWidths),
    pageBreak(),
    heading(copy.revision),
    ...(report.revision_plan || []).map((item) => listParagraph(
      `${item.task} (${item.minutes} ${copy.minutes})`,
      "revision-numbers",
    )),
    heading(copy.errors, 2),
  );

  const errors = errorRows(report, copy);
  if (errors.length) {
    const errorWidths = [1600, 1800, 1800, CONTENT_WIDTH - 5200];
    docChildren.push(fixedTable([
      new TableRow({
        tableHeader: true,
        children: [
          tableCell(copy.category, errorWidths[0], { bold: true, fill: COLORS.tealSoft }),
          tableCell(copy.original, errorWidths[1], { bold: true, fill: COLORS.tealSoft }),
          tableCell(copy.suggestion, errorWidths[2], { bold: true, fill: COLORS.tealSoft }),
          tableCell(copy.pattern, errorWidths[3], { bold: true, fill: COLORS.tealSoft }),
        ],
      }),
      ...errors.map(([category, original, suggestion, pattern]) => new TableRow({
        cantSplit: true,
        children: [
          tableCell(enumLabel(language, "category", category), errorWidths[0], { bold: true }),
          tableCell(original, errorWidths[1], { color: "A94C43" }),
          tableCell(suggestion, errorWidths[2], { color: COLORS.teal, bold: true }),
          tableCell(pattern, errorWidths[3]),
        ],
      })),
    ], errorWidths));
  } else {
    docChildren.push(bodyParagraph(copy.noErrors, { color: COLORS.muted }));
  }

  docChildren.push(
    heading(copy.studentMessage, 2),
    bodyParagraph(report.student_message, { bold: true, color: COLORS.teal, line: 310 }),
    ...(report.safeguarding_note
      ? [bodyParagraph(report.safeguarding_note, { bold: true, color: "8A5A2B" })]
      : []),
    pageBreak(),
    heading(copy.exemplar),
    bodyParagraph(copy.exemplarNotice, { color: "8A5A2B", bold: true, line: 300 }),
    heading(report.exemplar.title, 2),
    ...String(report.exemplar.text || "").split(/\n+/).filter(Boolean).map((paragraph) => (
      bodyParagraph(paragraph, { after: 160, line: 310 })
    )),
    heading(copy.why, 2),
    ...(report.exemplar.why_full_mark || []).map((item) => listParagraph(item, "report-bullets")),
    heading(copy.limitations, 2),
    ...(report.limitations || []).map((item) => listParagraph(item, "report-bullets")),
  );

  return new Document({
    creator: "NAPLAN Learning Assistant",
    title: `${copy.title} - ${reportRecord.prompt_title}`,
    subject: copy.practice,
    description: copy.disclaimer,
    styles: reportStyles(font),
    numbering: {
      config: [
        {
          reference: "report-bullets",
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 540, hanging: 270 },
                spacing: { after: 100, line: 290, lineRule: LineRuleType.AUTO },
              },
              run: { font },
            },
          }],
        },
        {
          reference: "priority-numbers",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 540, hanging: 270 },
                spacing: { after: 100, line: 290, lineRule: LineRuleType.AUTO },
              },
              run: { font },
            },
          }],
        },
        {
          reference: "revision-numbers",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 540, hanging: 270 },
                spacing: { after: 100, line: 290, lineRule: LineRuleType.AUTO },
              },
              run: { font },
            },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: {
            top: PAGE_MARGIN,
            right: PAGE_MARGIN,
            bottom: PAGE_MARGIN,
            left: PAGE_MARGIN,
            header: 600,
            footer: 600,
          },
        },
      },
      headers: { default: sectionHeader(iconData) },
      footers: { default: sectionFooter(copy) },
      children: docChildren,
    }],
  });
}

export function createWritingReportFileName({ reportRecord, studentName, language }) {
  const safe = (value) => String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const date = String(reportRecord.generated_at || "").slice(0, 10) || "report";
  return [
    "NAPLAN-Writing-Report",
    safe(studentName || "Student"),
    `Year-${reportRecord.year_level}`,
    safe(reportRecord.prompt_title || "Writing"),
    date,
    language,
  ].join("-") + ".docx";
}

export async function createWritingReportBlob(options) {
  return Packer.toBlob(buildWritingReportDocument(options));
}

export async function downloadWritingReportWord(options) {
  let iconData = null;
  try {
    const response = await fetch("/assets/naplan-app-icon.png");
    if (response.ok) iconData = new Uint8Array(await response.arrayBuffer());
  } catch {
    iconData = null;
  }
  const blob = await createWritingReportBlob({ ...options, iconData });
  const fileName = createWritingReportFileName(options);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
