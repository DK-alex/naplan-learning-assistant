import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Packer } from "docx";
import { buildWritingReportDocument } from "../src/word-export.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.resolve(process.argv[2] || path.join(root, "artifacts", "word-report-qa"));
const iconData = new Uint8Array(await readFile(path.join(root, "public", "assets", "naplan-app-icon.png")));

const criterionDefinitions = [
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
];

const record = {
  id: "word-render-fixture",
  practice_id: "writing-render-fixture",
  prompt_title: "The unexpected message",
  prompt_instructions: "Write a narrative about a message that changes what happens next. Plan, draft and edit your response.",
  student_text: [
    "The message blinked on the screen just after midnight. William stared at the three words: DO NOT OPEN.",
    "He reached for the keyboard, but a cold wind pushed through the locked window. The curtains lifted like pale hands and the screen flashed again.",
    "This time the message read, LOOK BEHIND YOU. William held his breath, turned slowly, and saw only his schoolbag. Then the zip began to move.",
  ].join("\n\n"),
  response_entry_method: "student_typed",
  word_count: 69,
  year_level: 5,
  provider: "openai",
  model: "gpt-5.6-sol",
  generated_at: "2026-07-24T10:00:00.000Z",
};

function reportFor(language) {
  const english = language === "en";
  return {
    rubric_version: "naplan-writing-practice-v1",
    status: "scorable",
    year_level: 5,
    genre: "narrative",
    score_type: "practice_only_not_official",
    report_language: language,
    total_score: 36,
    maximum_score: 47,
    confidence: "medium",
    overall_summary: english
      ? "The response creates suspense quickly and controls the sequence clearly. The next step is to develop the ending and proofread dialogue and sentence punctuation."
      : "文章很快营造出悬念，事件顺序也很清楚。下一步应扩展结尾，并重点校对对话和句子标点。",
    criteria: criterionDefinitions.map(([key, label, maximum], index) => ({
      key,
      label,
      score: Math.max(1, maximum - (index % 3 === 0 ? 1 : 2)),
      max_score: maximum,
      evidence: index % 2 === 0 ? ["LOOK BEHIND YOU"] : ["The zip began to move."],
      rationale: english
        ? "The quoted evidence supports a clear, controlled narrative choice, although development is not yet sustained across the whole response."
        : "引用证据体现了清楚、受控的叙事选择，但这种效果还没有在全文持续发展。",
      next_step: english
        ? "Apply the same control in the ending and check each sentence during editing."
        : "在结尾继续保持这种控制，并在修改时逐句检查。",
    })),
    strengths: [
      {
        title: english ? "Immediate suspense" : "迅速建立悬念",
        evidence: "DO NOT OPEN.",
        impact: english ? "The short warning creates an immediate question for the reader." : "简短的警告立刻引发读者疑问。",
      },
      {
        title: english ? "Controlled sequence" : "事件推进清楚",
        evidence: "Then the zip began to move.",
        impact: english ? "The final action advances the plot and creates a strong stopping point." : "最后的动作推动情节，并形成有力的停顿。",
      },
    ],
    priorities: [
      {
        criterion: "ideas",
        issue: english ? "The ending stops before the central problem develops." : "结尾在核心问题展开前就停止了。",
        evidence: "Then the zip began to move.",
        why_it_matters: english ? "A developed complication gives the narrative a satisfying shape." : "展开冲突能让故事结构更完整。",
        action: english ? "Add one consequence and a deliberate resolution." : "补充一个后果，并安排有意识的解决方式。",
        micro_example: "The bag opened, but the message was written in William's own handwriting.",
      },
      {
        criterion: "sentence_structure",
        issue: english ? "Sentence openings could vary more." : "句子开头还可以更有变化。",
        evidence: "He reached ... William held ...",
        why_it_matters: english ? "Varied openings improve rhythm and emphasis." : "变化句首能改善节奏和重点。",
        action: english ? "Use an adverbial or dependent clause to open one sentence." : "用状语或从句来开启一个句子。",
        micro_example: "Before he could move, the zip began to open.",
      },
      {
        criterion: "punctuation",
        issue: english ? "The capitalised message needs a consistent presentation choice." : "大写消息的呈现方式需要保持一致。",
        evidence: "LOOK BEHIND YOU.",
        why_it_matters: english ? "Consistent formatting helps the reader distinguish screen text." : "一致的格式能帮助读者识别屏幕文字。",
        action: english ? "Use quotation marks or italics consistently for every message." : "所有消息统一使用引号或斜体。",
        micro_example: "The screen read, “Look behind you.”",
      },
    ],
    annotations: [
      {
        quote: "The curtains lifted like pale hands",
        criterion: "vocabulary",
        tone: "strength",
        comment: english ? "The comparison adds a visual and unsettling detail." : "这个比喻增加了画面感和不安感。",
      },
      {
        quote: "Then the zip began to move.",
        criterion: "ideas",
        tone: "next_step",
        comment: english ? "Keep this strong turning point, then show its consequence." : "保留这个有力转折，再写出它带来的后果。",
      },
    ],
    error_patterns: {
      spelling: [],
      punctuation: [
        {
          original: "the message read, LOOK BEHIND YOU.",
          suggestion: "the message read, “Look behind you.”",
          pattern: english ? "Formatting direct screen text consistently" : "屏幕文字的格式需要保持一致",
        },
      ],
      grammar: [],
    },
    revision_plan: [
      { step: 1, minutes: 4, task: english ? "Plan the consequence and resolution." : "规划事件后果和解决方式。" },
      { step: 2, minutes: 8, task: english ? "Write two developed ending paragraphs." : "写出两个展开充分的结尾段落。" },
      { step: 3, minutes: 4, task: english ? "Check message formatting and sentence punctuation." : "检查消息格式和句子标点。" },
    ],
    parent_summary: english
      ? "William can establish suspense and control the order of events. Ask him to explain what happens after the schoolbag opens, then use that oral plan to develop the ending."
      : "William 能营造悬念并清楚安排事件顺序。可以先让他口头说明书包打开后发生什么，再根据这个口头计划扩展结尾。",
    student_message: english
      ? "Your opening makes the reader want to continue. Give the final surprise enough space, then read the ending aloud once to check the punctuation."
      : "你的开头让读者很想继续读。给最后的惊喜留出足够篇幅，然后朗读一次结尾来检查标点。",
    safeguarding_note: null,
    limitations: english
      ? ["This is formative practice feedback, not an official NAPLAN result.", "The response is short, so confidence is medium."]
      : ["这是形成性练习反馈，不是官方 NAPLAN 成绩。", "原文篇幅较短，因此本次判断的置信度为中等。"],
    exemplar: {
      title: english ? "The message in the bag" : "书包里的消息",
      text: [
        "The zip opened by itself. Inside the bag lay a folded page covered in William's handwriting, although he had never seen it before.",
        "At the top, one sentence had been underlined twice: When the lights go out, do not let the door close.",
        "The room went dark.",
      ].join("\n\n"),
      why_full_mark: english
        ? ["The complication develops from the same mysterious message.", "Sentence length is varied to control pace.", "The ending resolves one question while sustaining tension."]
        : ["冲突从同一条神秘消息自然发展。", "句子长短有变化，能控制节奏。", "结尾解决一个疑问，同时保留悬念。"],
    },
  };
}

await mkdir(outputDirectory, { recursive: true });
for (const language of ["zh-CN", "en"]) {
  const document = buildWritingReportDocument({
    reportRecord: record,
    report: reportFor(language),
    studentName: "William",
    language,
    iconData,
  });
  const outputPath = path.join(outputDirectory, `writing-report-${language}.docx`);
  await writeFile(outputPath, await Packer.toBuffer(document));
  process.stdout.write(`${outputPath}\n`);
}
