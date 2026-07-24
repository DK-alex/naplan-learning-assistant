import {
  ArrowClockwise,
  CheckCircle,
  Flag,
  Printer,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { getAiProvider } from "../shared/ai-config.js";
import { useI18n } from "./i18n.jsx";

function renderAnnotatedText(text, annotations) {
  const placements = [];
  for (const annotation of annotations || []) {
    if (!annotation.quote) continue;
    const start = text.indexOf(annotation.quote);
    if (start >= 0) placements.push({ ...annotation, start, end: start + annotation.quote.length });
  }
  placements.sort((left, right) => left.start - right.start || right.end - left.end);

  const selected = [];
  let cursor = -1;
  for (const placement of placements) {
    if (placement.start >= cursor) {
      selected.push(placement);
      cursor = placement.end;
    }
  }

  const nodes = [];
  cursor = 0;
  selected.forEach((placement, index) => {
    if (placement.start > cursor) nodes.push(text.slice(cursor, placement.start));
    nodes.push(
      <mark
        className={`annotation-highlight ${placement.tone}`}
        title={placement.comment}
        key={`${placement.start}-${placement.end}`}
      >
        {text.slice(placement.start, placement.end)}
        <sup>{index + 1}</sup>
      </mark>,
    );
    cursor = placement.end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return { nodes, placements: selected };
}

function ReportPage({ children, className = "" }) {
  return <section className={`writing-report-page ${className}`}>{children}</section>;
}

function ReportPageHeading({ eyebrow, title, number }) {
  return (
    <header className="report-page-heading">
      <span>{eyebrow}</span>
      <div><b>{number}</b><h2>{title}</h2></div>
    </header>
  );
}

export function WritingReport({ reportRecord, studentName, onRegenerate }) {
  const { t, locale } = useI18n();
  const { report } = reportRecord;
  const provider = getAiProvider(reportRecord.provider);
  const { nodes, placements } = renderAnnotatedText(reportRecord.student_text, report.annotations);
  const generatedAt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(reportRecord.generated_at));
  const scorePercent = report.total_score === null
    ? 0
    : Math.round((report.total_score / report.maximum_score) * 100);
  const errors = Object.entries(report.error_patterns || {}).flatMap(([category, items]) =>
    (items || []).map((item) => ({ category, ...item })),
  );

  return (
    <div className="writing-report-shell">
      <div className="report-toolbar no-print">
        <div>
          <strong>{t("作文批改报告")}</strong>
          <span>{provider.name} · {reportRecord.model} · {generatedAt}</span>
        </div>
        <button type="button" className="feature-secondary" onClick={onRegenerate}>
          <ArrowClockwise />{t("重新批改")}
        </button>
        <button type="button" className="feature-primary" onClick={() => window.print()}>
          <Printer />{t("打印 / 导出 PDF")}
        </button>
      </div>

      <div className="print-report-header">
        <img src="/assets/naplan-app-icon.png" alt="" />
        <span>NAPLAN Learning Assistant · {t("形成性写作报告")}</span>
      </div>
      <div className="print-report-footer">
        <span>{t("练习用途 · 非官方 NAPLAN 成绩")}</span>
        <span>{generatedAt}</span>
      </div>

      <ReportPage className="report-cover">
        <div className="report-watermark">PRACTICE<br />REPORT</div>
        <img src="/assets/naplan-app-icon.png" alt="" className="report-cover-logo" />
        <span className="report-cover-kicker">NAPLAN LEARNING ASSISTANT</span>
        <h1>{t("写作批改与成长报告")}</h1>
        <p>{t("基于公开评分框架的形成性练习反馈")}</p>
        <div className="report-cover-rule" />
        <dl>
          <div><dt>{t("学生")}</dt><dd>{studentName || t("学生")}</dd></div>
          <div><dt>{t("年级")}</dt><dd>Year {reportRecord.year_level}</dd></div>
          <div><dt>{t("写作类型")}</dt><dd>{report.genre}</dd></div>
          <div><dt>{t("题目")}</dt><dd>{reportRecord.prompt_title}</dd></div>
          <div><dt>{t("生成时间")}</dt><dd>{generatedAt}</dd></div>
          <div><dt>{t("评分模型")}</dt><dd>{provider.name} · {reportRecord.model}</dd></div>
        </dl>
        <aside><WarningCircle weight="fill" />{t("此报告用于练习反馈，不是官方 NAPLAN 成绩，也不包含官方量表分或熟练度等级。")}</aside>
      </ReportPage>

      <ReportPage>
        <ReportPageHeading eyebrow={t("总览")} number="01" title={t("评分与核心反馈")} />
        <div className="report-score-overview">
          <div className="report-score-ring" style={{ "--score-progress": `${scorePercent * 3.6}deg` }}>
            <span><b>{report.total_score ?? "—"}</b><small>/ {report.maximum_score}</small></span>
          </div>
          <div>
            <span className={`report-status ${report.status}`}>{report.status.replaceAll("_", " ")}</span>
            <h3>{report.overall_summary}</h3>
            <p>{t("置信度")}：{report.confidence}</p>
          </div>
        </div>
        <div className="report-two-column">
          <section>
            <h3><Sparkle weight="fill" />{t("主要优点")}</h3>
            {report.strengths.map((item, index) => (
              <article className="report-feedback-item strength" key={index}>
                <strong>{item.title}</strong>
                <q>{item.evidence}</q>
                <p>{item.impact}</p>
              </article>
            ))}
          </section>
          <section>
            <h3><Flag weight="fill" />{t("优先改进")}</h3>
            {report.priorities.slice(0, 3).map((item, index) => (
              <article className="report-feedback-item priority" key={index}>
                <strong>{index + 1}. {item.issue}</strong>
                <p>{item.action}</p>
                <small>{item.micro_example}</small>
              </article>
            ))}
          </section>
        </div>
        <div className="report-parent-summary">
          <strong>{t("给家长的摘要")}</strong>
          <p>{report.parent_summary}</p>
        </div>
      </ReportPage>

      <ReportPage>
        <ReportPageHeading eyebrow={t("原文批注")} number="02" title={reportRecord.prompt_title} />
        {reportRecord.prompt_instructions && <div className="report-prompt"><strong>{t("写作要求")}</strong><p>{reportRecord.prompt_instructions}</p></div>}
        <div className="annotated-writing">{nodes}</div>
        <div className="annotation-legend">
          <span className="strength">{t("优点")}</span>
          <span className="improve">{t("可改进")}</span>
          <span className="error">{t("语言错误")}</span>
        </div>
        <div className="annotation-notes">
          {placements.map((annotation, index) => (
            <article key={`${annotation.start}-${index}`} className={annotation.tone}>
              <b>{index + 1}</b>
              <div><strong>{annotation.criterion.replaceAll("_", " ")}</strong><p>{annotation.comment}</p></div>
            </article>
          ))}
        </div>
      </ReportPage>

      <ReportPage>
        <ReportPageHeading eyebrow={t("评分依据")} number="03" title={t("十项评分规则逐项说明")} />
        <div className="criteria-report-table">
          {report.criteria.map((criterion) => (
            <article key={criterion.key}>
              <div className="criterion-score">
                <span>{criterion.label}</span>
                <b>{criterion.score ?? "—"}<small>/{criterion.max_score}</small></b>
              </div>
              <div className="criterion-meter"><i style={{ width: `${((criterion.score || 0) / criterion.max_score) * 100}%` }} /></div>
              <p>{criterion.rationale}</p>
              {criterion.evidence?.length > 0 && <q>{criterion.evidence.join(" · ")}</q>}
              <small><ArrowClockwise />{criterion.next_step}</small>
            </article>
          ))}
        </div>
      </ReportPage>

      <ReportPage>
        <ReportPageHeading eyebrow={t("修改计划")} number="04" title={t("从反馈到下一稿")} />
        <div className="revision-plan">
          {report.revision_plan.map((item) => (
            <article key={item.step}>
              <b>{item.step}</b>
              <div><strong>{item.minutes} min</strong><p>{item.task}</p></div>
            </article>
          ))}
        </div>
        <h3 className="report-section-title">{t("语言错误模式")}</h3>
        {errors.length ? (
          <div className="error-pattern-table">
            {errors.map((item, index) => (
              <article key={`${item.category}-${index}`}>
                <span>{item.category}</span>
                <del>{item.original}</del>
                <strong>{item.suggestion}</strong>
                <p>{item.pattern}</p>
              </article>
            ))}
          </div>
        ) : <p>{t("本次没有发现需要列为重复模式的语言错误。")}</p>}
        <div className="student-message">
          <CheckCircle weight="fill" />
          <div><strong>{t("给学生的话")}</strong><p>{report.student_message}</p></div>
        </div>
        {report.safeguarding_note && <div className="safeguarding-note"><WarningCircle />{report.safeguarding_note}</div>}
      </ReportPage>

      <ReportPage>
        <ReportPageHeading eyebrow={t("满分范本")} number="05" title={report.exemplar.title} />
        <div className="exemplar-disclaimer">{t("以下为 AI 针对同一题目新写的高分示例，不是学生原文，也不应当作唯一答案。")}</div>
        <div className="exemplar-text">{report.exemplar.text}</div>
        <h3 className="report-section-title">{t("为什么这是满分示范")}</h3>
        <ul className="exemplar-reasons">
          {report.exemplar.why_full_mark.map((reason, index) => <li key={index}>{reason}</li>)}
        </ul>
        <div className="report-limitations">
          <strong>{t("报告边界")}</strong>
          {report.limitations.map((item, index) => <p key={index}>{item}</p>)}
        </div>
      </ReportPage>
    </div>
  );
}
