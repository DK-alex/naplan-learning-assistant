import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Books,
  CalendarBlank,
  CalendarCheck,
  CaretDown,
  Check,
  CheckCircle,
  ClipboardText,
  Clock,
  FileMagnifyingGlass,
  FileText,
  Gear,
  HandWaving,
  House,
  Eye,
  EyeSlash,
  Key,
  Lightbulb,
  ListChecks,
  Medal,
  Megaphone,
  Minus,
  NotePencil,
  Notebook,
  PencilLine,
  Plus,
  Robot,
  Sparkle,
  Star,
  Target,
  Translate,
  TrendUp,
  UsersThree,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import {
  DEFAULT_REPORT_LANGUAGE,
  DEFAULT_UI_LANGUAGE,
  getLanguageLabel,
  getLocale,
  I18nProvider,
  languageOptions,
  useI18n,
} from "./i18n.jsx";
import officialPages from "./data/official-pages.json";
import officialUpdates from "./data/official-updates.json";
import { getExamGuide } from "./data/exam-guide.js";
import { getWritingRubricGuide } from "./data/writing-rubric-guide.js";
import { getLatestWritingReportSummary } from "./data/writing-report-summary.js";
import {
  calculateLearningProgress,
  LEARNING_GOAL_DOMAINS,
  normaliseLearningGoal,
  readLearningGoal,
  saveLearningGoal,
  splitLearningDuration,
} from "./data/learning-goals.js";
import {
  getCountdownParts,
  getFutureNaplanWindows,
  getNextNaplanWindow,
  NAPLAN_KEY_DATES_URL,
} from "./data/naplan-schedule.js";
import {
  LIVE_MISTAKES_EVENT,
  readLivePracticeMistakes,
} from "../../naplan-ui-clone/src/practiceSession.js";
import {
  AI_PROVIDERS,
  createDefaultAiSettings,
  getAiProvider,
  isAllowedProviderBaseUrl,
} from "../shared/ai-config.js";
import {
  getSessionApiKey,
  getWritingReport,
  readWritingReports,
  requestWritingReview,
  saveWritingReport,
  setSessionApiKey,
} from "./ai/client.js";
import { WritingReport } from "./WritingReport.jsx";

const navItems = [
  { label: "首页", icon: House },
  { label: "时间表 & 倒计时", icon: CalendarCheck },
  { label: "最新动向", icon: Megaphone },
  { label: "考试指南", icon: BookOpen },
  { label: "评分规则", icon: Star },
  { label: "复习重点", icon: ListChecks, proOnly: true },
  { label: "模拟练习", icon: NotePencil },
  { label: "AI 批改 & 报告", icon: FileMagnifyingGlass },
  { label: "学习记录", icon: Notebook },
  { label: "错题本", icon: Books },
  { label: "设置", icon: Gear },
];

const progressItems = [
  { label: "阅读", en: "Reading", value: 76, warmValue: 65, color: "#16b66a", icon: BookOpen },
  { label: "写作", en: "Writing", value: 65, warmValue: 78, color: "#ff9418", icon: NotePencil },
  { label: "语言", en: "Spelling", value: 70, warmValue: 70, color: "#7058e8", icon: ListChecks },
  { label: "语法", en: "Grammar & Punctuation", value: 62, warmValue: 62, color: "#ff6847", icon: Megaphone },
  { label: "数学", en: "Numeracy", value: 78, warmValue: 76, color: "#19b9b6", icon: TrendUp },
];

const quickItems = [
  { title: "模拟练习", subtitle: "开启全真模拟考试", warmSubtitle: "历年真题练习", icon: PencilLine, tone: "indigo" },
  { title: "AI 批改作文", subtitle: "智能批改及建议", warmSubtitle: "智能评分反馈", icon: Robot, tone: "cyan" },
  { title: "复习重点", subtitle: "高频考点解析", warmSubtitle: "知识点精讲", icon: FileText, tone: "amber" },
  { title: "评分规则", subtitle: "了解评分标准", warmSubtitle: "了解评分标准", icon: ListChecks, tone: "violet" },
  { title: "错题本", subtitle: "专项错题分析", warmSubtitle: "巩固薄弱知识", icon: Notebook, tone: "blue" },
  { title: "学习记录", subtitle: "查看学习进度", warmSubtitle: "查看学习进度", icon: Medal, tone: "green", warmOnly: true },
];

const featureAliases = {
  "考试倒计时": "时间表 & 倒计时",
  "完整时间表": "时间表 & 倒计时",
  "编辑学习目标": "设置",
  "设置学习目标": "设置",
  "全部最新动向": "最新动向",
  "AI 作文批改": "AI 批改 & 报告",
  "AI 批改作文": "AI 批改 & 报告",
  "AI 作文详细报告": "AI 批改 & 报告",
  "家长账号": "设置",
  "AI 助学建议": "复习重点",
};

function readPracticeHistory() {
  try {
    const value = JSON.parse(window.localStorage.getItem("naplan-practice-history") || "[]");
    if (!Array.isArray(value)) return [];

    const qaCleanupKey = "naplan-qa-cleanup:year3-parent-entry:2026-07-24";
    if (!window.localStorage.getItem(qaCleanupKey)) {
      const qaResponse = "One day i found a map. it was old and torn.\n\nI followd it to the creek and saw a box under a tree.";
      const cleaned = value.filter((record) => record.writing?.response !== qaResponse);
      if (cleaned.length !== value.length) {
        window.localStorage.setItem("naplan-practice-history", JSON.stringify(cleaned));
      }
      window.localStorage.setItem(qaCleanupKey, "done");
      return cleaned;
    }

    return value;
  } catch {
    return [];
  }
}

function deletePracticeRecord(recordId) {
  const nextHistory = readPracticeHistory().filter((record) => record.id !== recordId);
  window.localStorage.setItem("naplan-practice-history", JSON.stringify(nextHistory));
  return nextHistory;
}

function readParentSettings() {
  const aiDefaults = createDefaultAiSettings();
  try {
    const value = JSON.parse(window.localStorage.getItem("naplan-parent-settings") || "{}");
    return {
      studentName: value.studentName || "Alex",
      yearLevel: value.yearLevel || "5",
      uiLanguage: value.uiLanguage || DEFAULT_UI_LANGUAGE,
      reportLanguage: value.reportLanguage || DEFAULT_REPORT_LANGUAGE,
      aiProvider: value.aiProvider || aiDefaults.aiProvider,
      aiModel: value.aiModel || aiDefaults.aiModel,
      aiBaseUrl: value.aiBaseUrl || aiDefaults.aiBaseUrl,
    };
  } catch {
    return {
      studentName: "Alex",
      yearLevel: "5",
      uiLanguage: DEFAULT_UI_LANGUAGE,
      reportLanguage: DEFAULT_REPORT_LANGUAGE,
      ...aiDefaults,
    };
  }
}

function formatCompletedAt(value, locale) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Sidebar({ variant, active, onNavigate }) {
  const isWarm = variant === "warm";
  const items = navItems.filter((item) => !item.proOnly || !isWarm);
  const { t } = useI18n();

  return (
    <aside className="sidebar">
      <button className="brand" type="button" onClick={() => onNavigate("首页")}>
        <img src="/assets/naplan-app-icon.png" alt="" className="app-brand-mark" />
        <span className="brand-copy">
          <strong>NAPLAN</strong>
          <small>{t("学习助手")}</small>
        </span>
      </button>

      <nav className="side-nav" aria-label={t("主要导航")}>
        {items.map(({ label, icon: Icon }) => (
          <button
            type="button"
            key={label}
            className={label === active ? "active" : ""}
            onClick={() => onNavigate(label)}
          >
            <Icon size={isWarm ? 25 : 23} weight={label === active ? "fill" : "regular"} />
            <span>{t(label)}</span>
          </button>
        ))}
      </nav>

      {isWarm ? (
        <div className="warm-side-art" aria-hidden="true">
          <img src="/assets/warm-koala.png" alt="" />
        </div>
      ) : (
        <button className="ai-tip" type="button" onClick={() => onNavigate("AI 助学建议")}>
          <Sparkle size={23} weight="fill" />
          <span>
            <strong>{t("AI 助力学习更高效")}</strong>
            <small>{t("智能批改、个性化推荐，精准提升每一步！")}</small>
          </span>
        </button>
      )}
    </aside>
  );
}

function useCurrentTime(refreshMs = 1_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);
  return now;
}

function Countdown({ variant, onOpen }) {
  const warm = variant === "warm";
  const { t } = useI18n();
  const now = useCurrentTime();
  const nextWindow = getNextNaplanWindow(now);
  const countdown = getCountdownParts(nextWindow?.start, now);
  const twoDigits = (value) => String(value).padStart(2, "0");
  return (
    <button
      type="button"
      className={`countdown-card card ${warm ? "warm-countdown" : "pro-countdown"}`}
      onClick={() => onOpen("考试倒计时")}
    >
      {warm && <div className="warm-hero-image" aria-hidden="true" />}
      <div className="countdown-content">
        <p>{t(nextWindow ? "下一场 NAPLAN 考试还有" : "官方尚未公布更晚的 NAPLAN 测试日期。")}</p>
        <div className="day-count">
          <strong>{nextWindow ? countdown.days : "—"}</strong>
          <span>{t("天")}</span>
        </div>
        <div className="countdown-clock">
          <span><strong>{twoDigits(countdown.hours)}</strong><small>{t("时")}</small></span>
          <b>:</b>
          <span><strong>{twoDigits(countdown.minutes)}</strong><small>{t("分")}</small></span>
          <b>:</b>
          <span><strong>{twoDigits(countdown.seconds)}</strong><small>{t("秒")}</small></span>
        </div>
        <div className="countdown-meta">
          <span>{nextWindow ? t("考试时间：{date}", { date: t(nextWindow.fullDateLabel) }) : t("等待 NAP 官方更新")}</span>
          <span>{t("考试年级： Year 3, 5, 7, 9")}</span>
        </div>
      </div>
    </button>
  );
}

function Timeline({ variant, onOpen }) {
  const warm = variant === "warm";
  const { t } = useI18n();
  const now = useCurrentTime(60_000);
  const rows = getFutureNaplanWindows(now);

  return (
    <section className={`timeline-card future-timeline card ${warm ? "warm-card" : ""}`}>
      <div className="card-title">
        {warm && <CalendarBlank size={24} weight="fill" />}
        <h2>{t(warm ? "时间表" : "时间表概览")}</h2>
      </div>
      {rows.length > 0 ? <div className="timeline-list">
        {rows.map((item, index) => (
          <div className="timeline-row" key={item.year}>
            <span className={`timeline-dot dot-${index}`} />
            <div>
              <strong>{t(item.dateLabel)}</strong>
              <p>{t(item.title)}</p>
            </div>
          </div>
        ))}
      </div> : (
        <p className="timeline-empty">{t("官方尚未公布更晚的 NAPLAN 测试日期。")}</p>
      )}
      {warm && (
        <button type="button" className="warm-text-action" onClick={() => onOpen("完整时间表")}>
          {t("查看完整时间表")} <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}

function ProgressCard({ variant, onOpen }) {
  const warm = variant === "warm";
  const { t } = useI18n();
  const items = warm
    ? [progressItems[1], progressItems[0], ...progressItems.slice(2)]
    : progressItems;
  return (
    <section className={`progress-card card ${warm ? "warm-card" : ""}`}>
      <div className="card-title">
        {warm && <Target size={24} weight="fill" />}
        <h2>{t(warm ? "学习目标" : "学习进度")}</h2>
        {warm && <button type="button" className="mini-action" onClick={() => onOpen("编辑学习目标")}>{t("编辑目标")}</button>}
      </div>
      <div className="progress-list">
        {items.map(({ label, en, value, warmValue, color, icon: Icon }) => {
          const display = warm ? warmValue : value;
          return (
            <div className="progress-row" key={en}>
              <span className="subject-icon" style={{ "--subject-color": color }}>
                <Icon size={16} weight="fill" />
              </span>
              <div className="subject-name">
                <strong>{t(label)}</strong>
                <small>{en}</small>
              </div>
              <div className="progress-track" aria-label={`${t(label)} ${display}%`}>
                <span style={{ width: `${display}%`, backgroundColor: color }} />
              </div>
              <b>{display}%</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuickEntry({ variant, onOpen }) {
  const warm = variant === "warm";
  const items = quickItems.filter((item) => warm || !item.warmOnly);
  const { t } = useI18n();
  return (
    <section className={`quick-card card ${warm ? "warm-card" : ""}`}>
      <div className="card-title">
        {warm && <RocketMark />}
        <h2>{t(warm ? "快速入口 – 开始练习" : "快捷入口")}</h2>
      </div>
      <div className="quick-grid">
        {items.map(({ title, subtitle, warmSubtitle, icon: Icon, tone }) => (
          <button type="button" className={`quick-item tone-${tone}`} key={title} onClick={() => onOpen(title)}>
            <span className="quick-icon">
              <Icon size={34} weight="fill" />
            </span>
            <strong>{t(title)}</strong>
            <small>{t(warm ? warmSubtitle : subtitle)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function RocketMark() {
  return (
    <span className="rocket-mark" aria-hidden="true">
      <TrendUp size={22} weight="fill" />
    </span>
  );
}

function NewsCard({ variant, onOpen }) {
  const warm = variant === "warm";
  const { t, language, locale } = useI18n();
  const items = officialUpdates.items.filter((item) => item.featured).slice(0, 3);
  return (
    <section className={`news-card card ${warm ? "warm-card" : ""}`}>
      <div className="card-title">
        {warm && <Megaphone size={24} weight="fill" />}
        <h2>{t("最新动向")}</h2>
        <button type="button" className="link-action" onClick={() => onOpen("全部最新动向")}>
          {t("查看全部官方资讯")} <ArrowRight size={16} />
        </button>
      </div>
      <div className="news-list">
        {items.map((item) => (
          <button type="button" className="news-row" key={item.id} onClick={() => onOpen("全部最新动向")}>
            {warm && <time>{new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(`${item.date}T00:00:00`))}</time>}
            <span>
              <strong>{item.title[language] || item.title.en}</strong>
              {warm && <small>{item.summary[language] || item.summary.en}</small>}
            </span>
            {!warm && <time>{item.date}</time>}
            {warm && <ArrowRight size={18} />}
          </button>
        ))}
      </div>
    </section>
  );
}

function GoalCard({ goal, history, onEdit }) {
  const { t } = useI18n();
  const progress = useMemo(
    () => calculateLearningProgress(history, goal),
    [goal, history],
  );
  const duration = splitLearningDuration(progress.totalDurationSeconds);
  const durationLabel = duration.hours > 0
    ? t("{hours} 小时 {minutes} 分钟", duration)
    : t("{minutes} 分钟", duration);
  return (
    <section className="goal-card card warm-card">
      <div className="card-title">
        <Target size={24} weight="fill" />
        <h2>{t("我的目标进度")}</h2>
        <button type="button" className="link-action" onClick={onEdit}>
          {t("设置目标")} <ArrowRight size={16} />
        </button>
      </div>
      <div className="goal-body">
        <small>{t("本周学习目标")}</small>
        <p><strong>{progress.weeklyCompleted} / {progress.weeklyTarget}</strong> {t("已完成")}</p>
        <div
          className="goal-track"
          role="progressbar"
          aria-label={t("本周目标完成度")}
          aria-valuemin="0"
          aria-valuemax={progress.weeklyTarget}
          aria-valuenow={Math.min(progress.weeklyCompleted, progress.weeklyTarget)}
        >
          <span style={{ width: `${progress.weeklyPercent}%` }} />
        </div>
        <div className="goal-stats">
          <span><small>{t("连续学习天数")}</small><strong><CheckCircle size={18} weight="fill" /> {t("{count} 天", { count: progress.streakDays })}</strong></span>
          <span><small>{t("累计学习时长")}</small><strong><Clock size={18} weight="fill" /> {durationLabel}</strong></span>
        </div>
      </div>
      <img className="goal-character" src="/assets/warm-goal.png" alt="" />
    </section>
  );
}

const reportCriterionLabels = {
  ideas: ["观点与内容", "Ideas"],
  text_structure: ["文本结构", "Text structure"],
  vocabulary: ["词汇", "Vocabulary"],
  sentence_structure: ["句子结构", "Sentence structure"],
  punctuation: ["标点", "Punctuation"],
  spelling: ["拼写", "Spelling"],
};

const reportStatusLabels = {
  scorable: "可评分",
  partially_scorable: "部分可评分",
  not_scorable: "无法评分",
};

const reportConfidenceLabels = {
  high: "高置信度",
  medium: "中等置信度",
  low: "低置信度",
};

function ReportCard({ onOpen }) {
  const { t, locale } = useI18n();
  const summary = useMemo(
    () => getLatestWritingReportSummary(readWritingReports()),
    [],
  );

  if (!summary) {
    return (
      <section className="report-card report-card-empty card warm-card">
        <div className="card-title">
          <Sparkle size={24} weight="fill" />
          <h2>{t("AI 作文批改摘要")}</h2>
          <span className="fresh-pill pending">{t("等待评分")}</span>
        </div>
        <div className="report-empty-state">
          <FileMagnifyingGlass size={48} weight="duotone" />
          <strong>{t("还没有真实批改报告")}</strong>
          <p>{t("完成 Writing 模拟并生成 AI 批改报告后，这里会显示最近一次真实评分。")}</p>
          <small>{t("不会显示示例分数或推测成绩。")}</small>
        </div>
        <button type="button" className="report-action" onClick={() => onOpen("AI 作文批改")}>
          {t("开始作文批改")} <ArrowRight size={16} />
        </button>
        <img className="report-character" src="/assets/warm-rabbit.png" alt="" />
      </section>
    );
  }

  const { record, report, criteria, scorePercent, scoreDelta } = summary;
  const generatedAt = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(record.generated_at));
  const provider = getAiProvider(record.provider);
  const deltaLabel = scoreDelta === null
    ? t("暂无可比报告")
    : scoreDelta === 0
      ? t("与上次持平")
      : t("{value} 分", { value: scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta });

  return (
    <section className="report-card card warm-card">
      <div className="card-title">
        <Sparkle size={24} weight="fill" />
        <h2>{t("AI 作文批改摘要")}</h2>
        <span className="fresh-pill">{t("最近评分")}</span>
      </div>
      <div className="report-summary">
        <div className="score-ring" style={{ "--summary-score-progress": `${scorePercent * 3.6}deg` }}>
          <strong>{report.total_score ?? "—"}</strong>
          <small>/{report.maximum_score}</small>
        </div>
        <div>
          <p>{t("评分状态：")}<strong>{t(reportStatusLabels[report.status] || report.status)}</strong></p>
          <p>
            {t("与上次同类作文相比：")}
            <strong className={scoreDelta < 0 ? "score-down" : ""}>{deltaLabel}</strong>
            {scoreDelta > 0 && <TrendUp size={18} weight="bold" />}
          </p>
          <small className="report-real-meta">
            Year {record.year_level} · {provider.name} · {generatedAt}<br />
            {t(reportConfidenceLabels[report.confidence] || report.confidence)}
          </small>
        </div>
      </div>
      <div className="rubric-list">
        {criteria.map((criterion) => {
          const [sourceLabel, englishLabel] = reportCriterionLabels[criterion.key] || [criterion.label, criterion.label];
          const value = criterion.score === null ? 0 : Math.round((criterion.score / criterion.max_score) * 100);
          return (
          <div className="rubric-row" key={criterion.key}>
            <span>{t(sourceLabel)} <small>({englishLabel})</small></span>
            <div><i style={{ width: `${value}%` }} /></div>
            <b>{criterion.score ?? "—"}/{criterion.max_score}</b>
          </div>
          );
        })}
      </div>
      <p className="report-boundary">{t("练习评分 · 非官方 NAPLAN 成绩")}</p>
      <button type="button" className="report-action" onClick={() => onOpen("AI 作文详细报告")}>
        {t("查看详细报告")} <ArrowRight size={16} />
      </button>
      <img className="report-character" src="/assets/warm-rabbit.png" alt="" />
    </section>
  );
}

function LearningAdvice({ onOpen }) {
  const { t } = useI18n();
  return (
    <section className="advice-card">
      <div className="advice-copy">
        <span className="advice-icon"><Lightbulb size={38} weight="fill" /></span>
        <div>
          <h2>{t("今日学习建议")}</h2>
          <p>{t("建议今天完成一套阅读模拟练习，重点提升信息检索和推理能力。")}</p>
        </div>
      </div>
      <button type="button" onClick={() => onOpen("AI 作文批改")}>
        <PencilLine size={36} weight="fill" />
        <span><strong>{t("AI 作文批改")}</strong><small>{t("智能批改作文")}<br />{t("获取个性化建议")}</small></span>
        <ArrowRight size={20} />
      </button>
      <button type="button" onClick={() => onOpen("1:1 模拟做题")}>
        <UsersThree size={38} weight="fill" />
        <span><strong>{t("1:1 模拟做题")}</strong><small>{t("还原真实考试场景")}<br />{t("精准评估水平")}</small></span>
        <ArrowRight size={20} />
      </button>
    </section>
  );
}

function WarmDashboard({ onOpen, studentName, goal, history, onEditGoal }) {
  const { t, locale } = useI18n();
  const todayLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return (
    <div className="dashboard warm-dashboard">
      <header className="warm-header">
        <div>
          <h1>{t("Hi，{name} 家长！", { name: studentName })} <HandWaving size={31} weight="fill" /></h1>
          <p>{t("今天是 {date}，一起加油吧！", { date: todayLabel })}</p>
        </div>
        <img src="/assets/warm-greeting.png" alt="" />
      </header>
      <div className="warm-grid">
        <Countdown variant="warm" onOpen={onOpen} />
        <Timeline variant="warm" onOpen={onOpen} />
        <ProgressCard variant="warm" onOpen={onOpen} />
        <QuickEntry variant="warm" onOpen={onOpen} />
        <NewsCard variant="warm" onOpen={onOpen} />
        <GoalCard goal={goal} history={history} onEdit={onEditGoal} />
        <ReportCard onOpen={onOpen} />
      </div>
      <div className="warm-footer">
        <Check size={16} weight="bold" />
        {t("每一步努力，都在让孩子的未来更美好！ 加油！")}
      </div>
    </div>
  );
}

function ProfessionalDashboard({ onOpen, notificationOpen, setNotificationOpen, studentName }) {
  const { t, locale } = useI18n();
  const todayLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return (
    <div className="dashboard pro-dashboard">
      <header className="pro-header">
        <div>
          <h1>{t("首页")}</h1>
          <h2>{t("下午好，{name} 家长！", { name: studentName })} <HandWaving size={27} weight="fill" /></h2>
          <p>{t("今天是 {date}，祝学习顺利！", { date: todayLabel })}</p>
        </div>
        <div className="profile-actions">
          <button type="button" className="bell-button" aria-label={t("通知")} onClick={() => setNotificationOpen((value) => !value)}>
            <Bell size={28} />
            <span />
          </button>
          <button type="button" className="profile-button" onClick={() => onOpen("家长账号")}>
            <img src="/assets/pro-avatar.png" alt={t("{name} 家长头像", { name: studentName })} />
            <strong>{t("{name} 家长", { name: studentName })}</strong>
            <CaretDown size={17} />
          </button>
          {notificationOpen && (
            <div className="notification-popover">
              <strong>{t("2 条新通知")}</strong>
              <p>{t("新的模拟练习已解锁")}</p>
              <p>{t("本周学习报告已生成")}</p>
            </div>
          )}
        </div>
      </header>
      <div className="pro-grid">
        <Countdown variant="professional" onOpen={onOpen} />
        <Timeline variant="professional" onOpen={onOpen} />
        <ProgressCard variant="professional" onOpen={onOpen} />
        <QuickEntry variant="professional" onOpen={onOpen} />
        <NewsCard variant="professional" onOpen={onOpen} />
        <LearningAdvice onOpen={onOpen} />
      </div>
    </div>
  );
}

function FeatureHeader({ title, description, onHome }) {
  const { t } = useI18n();
  return (
    <header className="feature-header">
      <div>
        <button type="button" className="feature-back" onClick={onHome}>{t("← 返回首页")}</button>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
    </header>
  );
}

function ScheduleWorkspace() {
  const { t } = useI18n();
  const now = useCurrentTime(60_000);
  const futureWindows = getFutureNaplanWindows(now);
  const nextWindow = futureWindows[0] ?? null;
  const countdown = getCountdownParts(nextWindow?.start, now);
  return (
    <div className="feature-grid two-columns">
      <section className="feature-card countdown-detail">
        <span className="feature-kicker">{t("NAPLAN 官方日期")}</span>
        <h2>{t("下一考试周期")}</h2>
        <strong>{nextWindow ? t(nextWindow.fullDateLabel) : t("等待 NAP 官方更新")}</strong>
        <p>{t(nextWindow ? "时间表只显示从今天起尚未结束的官方测试窗口。" : "官方尚未公布更晚的 NAPLAN 测试日期。")}</p>
        <a className="feature-secondary official-date-link" href={NAPLAN_KEY_DATES_URL} target="_blank" rel="noreferrer">
          {t("查看 NAP 官方日期")} <ArrowRight size={16} />
        </a>
        <div className="detail-stat-row">
          <span><b>{nextWindow ? countdown.days : "—"}</b><small>{t("距开始天数")}</small></span>
          <span><b>9</b><small>{t("测试日")}</small></span>
          <span><b>4</b><small>{t("参加年级")}</small></span>
        </div>
      </section>
      <section className="feature-card">
        <h2>{t("未来官方考试时间")}</h2>
        <p className="future-schedule-note">{t("以下仅显示尚未结束的官方 NAPLAN 测试窗口。")}</p>
        {futureWindows.length > 0 ? <div className="workspace-timeline future-window-list">
          {futureWindows.map((item) => (
            <div key={item.year}>
              <i />
              <span><strong>{t(item.dateLabel)}</strong><p>{t(item.title)}</p></span>
              <b>{t("官方")}</b>
            </div>
          ))}
        </div> : <div className="schedule-empty-state">{t("官方尚未公布更晚的 NAPLAN 测试日期。")}</div>}
      </section>
    </div>
  );
}

function ExamGuideWorkspace({ onStartPractice }) {
  const { language, locale } = useI18n();
  const guide = getExamGuide(language);
  const [resourceLanguage, setResourceLanguage] = useState(language);
  const resourceCopy = getExamGuide(resourceLanguage).resources;
  const domainIcons = [NotePencil, BookOpen, ListChecks, TrendUp];
  const featureIcons = [Target, ListChecks, CalendarBlank, UsersThree, CheckCircle, FileText];

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setResourceLanguage(language);
  }, [language]);

  return (
    <div className="guide-page feature-card-wide">
      <section className="guide-hero">
        <div className="guide-hero-copy">
          <span className="feature-kicker">{guide.hero.eyebrow}</span>
          <h2>{guide.hero.title}</h2>
          <p>{guide.hero.body}</p>
          <span className="guide-verified"><CheckCircle size={18} weight="fill" />{guide.hero.status}</span>
        </div>
        <div className="guide-date-panel">
          <div><small>{guide.hero.currentLabel}</small><strong>{guide.hero.currentDate}</strong></div>
          <div><small>{guide.hero.nextLabel}</small><strong>{guide.hero.nextDate}</strong></div>
          <div><small>{guide.hero.yearsLabel}</small><strong>{guide.hero.years}</strong></div>
        </div>
      </section>

      <nav className="guide-section-nav" aria-label={guide.hero.title}>
        {guide.sectionNav.map(([id, label]) => (
          <button type="button" key={id} onClick={() => scrollToSection(id)}>{label}</button>
        ))}
      </nav>

      <section className="guide-section" id="guide-overview">
        <header className="guide-section-heading">
          <span>01</span>
          <div><h2>{guide.overview.title}</h2><p>{guide.overview.body}</p></div>
        </header>
        <div className="guide-domain-grid">
          {guide.overview.domains.map(([title, description], index) => {
            const Icon = domainIcons[index];
            return (
              <article className={`guide-domain-card domain-${index + 1}`} key={title}>
                <Icon size={28} weight="fill" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="guide-section" id="guide-schedule">
        <header className="guide-section-heading">
          <span>02</span>
          <div><h2>{guide.schedule.title}</h2><p>{guide.schedule.body}</p></div>
        </header>
        <div className="guide-table-wrap">
          <table className="guide-schedule-table">
            <thead><tr>{guide.schedule.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {guide.schedule.rows.map((row) => (
                <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}>{cell}</th> : <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="guide-note"><CalendarCheck size={20} weight="fill" />{guide.schedule.note}</p>
      </section>

      <section className="guide-section" id="guide-online">
        <header className="guide-section-heading">
          <span>03</span>
          <div><h2>{guide.online.title}</h2><p>{guide.online.body}</p></div>
        </header>
        <div className="guide-feature-grid">
          {guide.online.features.map(([title, description], index) => {
            const Icon = featureIcons[index];
            return (
              <article key={title}>
                <Icon size={23} weight="fill" />
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="guide-section" id="guide-results">
        <header className="guide-section-heading">
          <span>04</span>
          <div><h2>{guide.results.title}</h2><p>{guide.results.body}</p></div>
        </header>
        <div className="guide-level-grid">
          {guide.results.levels.map(([title, description, tone]) => (
            <article className={`guide-level-card ${tone}`} key={title}>
              <strong>{title}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <div className="guide-report-explainer">
          <FileText size={32} weight="fill" />
          <div><h3>{guide.results.reportTitle}</h3><p>{guide.results.reportBody}</p></div>
        </div>
        <p className="guide-caution"><Star size={20} weight="fill" />{guide.results.caution}</p>
      </section>

      <section className="guide-section" id="guide-prepare">
        <header className="guide-section-heading">
          <span>05</span>
          <div><h2>{guide.prepare.title}</h2><p>{guide.prepare.body}</p></div>
        </header>
        <div className="guide-prepare-layout">
          <ol className="guide-checklist">
            {guide.prepare.checklist.map((item) => <li key={item}><Check size={18} weight="bold" /><span>{item}</span></li>)}
          </ol>
          <aside className="guide-practice-cta">
            <NotePencil size={42} weight="fill" />
            <strong>{guide.prepare.cta}</strong>
            <button type="button" onClick={onStartPractice}>{guide.prepare.cta}<ArrowRight size={18} /></button>
          </aside>
        </div>
      </section>

      <section className="guide-section" id="guide-resources">
        <header className="guide-section-heading">
          <span>06</span>
          <div><h2>{guide.resources.title}</h2><p>{guide.resources.body}</p></div>
        </header>
        <div className="guide-resource-language">
          <Translate size={24} weight="duotone" />
          <div>
            <strong>{guide.resources.languageTitle}</strong>
            <p>{guide.resources.languageBody}</p>
          </div>
          <div className="guide-resource-language-options" role="group" aria-label={guide.resources.languageTitle}>
            {languageOptions.map((option) => (
              <button
                type="button"
                className={resourceLanguage === option.value ? "active" : ""}
                aria-pressed={resourceLanguage === option.value}
                onClick={() => setResourceLanguage(option.value)}
                key={option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="guide-resource-list">
          {resourceCopy.items.map((resource, index) => (
            <article key={resource.id}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div className="guide-resource-copy">
                <span className="guide-resource-translation-badge">{guide.resources.translatedBadge} · {getLanguageLabel(resourceLanguage)}</span>
                <strong>{resource.title}</strong>
                <small>{resource.description}</small>
                <span className="guide-resource-official-title">{resource.officialTitle}</span>
                <div className="guide-resource-meta">
                  <i>{resource.publisher}</i>
                  <i>{resource.type === "pdf" ? guide.resources.pdfDocument : guide.resources.webPage}</i>
                  <i>{guide.resources.originalLanguage}</i>
                </div>
              </div>
              <a href={resource.url} target="_blank" rel="noreferrer" aria-label={`${guide.resources.officialOriginal}: ${resource.officialTitle}`}>
                {guide.resources.officialOriginal}<ArrowRight size={16} />
              </a>
            </article>
          ))}
        </div>
        <footer className="guide-source-note">
          <CheckCircle size={19} weight="fill" />
          <span>{guide.resources.sourceNote}<small>© Australian Curriculum, Assessment and Reporting Authority (ACARA) · CC BY 4.0 · {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date("2026-07-24T00:00:00+10:00"))}</small></span>
        </footer>
      </section>
    </div>
  );
}

function NewsWorkspace() {
  const { t, language, locale } = useI18n();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("");
  const [readerLanguage, setReaderLanguage] = useState(language);
  const [pageTranslations, setPageTranslations] = useState({ pages: [] });
  const categories = [
    ["all", "全部"],
    ["news", "官方新闻"],
    ["dates", "关键日期"],
    ["tests", "考试内容"],
    ["results", "成绩与报告"],
    ["parents", "家长指南"],
    ["accessibility", "无障碍支持"],
    ["administration", "考试管理"],
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const items = officialUpdates.items.filter((item) => {
    const categoryMatches = category === "all" || item.category === category;
    const searchable = `${item.title[language] || item.title.en} ${item.summary[language] || item.summary.en} ${item.source}`.toLocaleLowerCase(locale);
    return categoryMatches && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const selectedPage = officialPages.pages.find((page) => page.url === selectedUrl);
  const selectedItem = officialUpdates.items.find((item) => item.url === selectedUrl);
  const selectedTranslation = pageTranslations.pages.find(
    (page) => page.url === selectedUrl && page.source_hash === selectedPage?.content_hash,
  );

  useEffect(() => {
    let mounted = true;
    import("./data/official-page-translations.json").then((module) => {
      if (mounted) setPageTranslations(module.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setReaderLanguage(language);
  }, [language, selectedUrl]);

  if (selectedPage && selectedItem) {
    const translatedText = selectedTranslation?.text?.[readerLanguage];
    const fullText = readerLanguage === "en" ? selectedPage.text_en : translatedText || selectedPage.text_en;
    const showingTranslation = readerLanguage !== "en" && Boolean(translatedText);
    const translationMissing = readerLanguage !== "en" && !translatedText;
    const fetchedAt = selectedPage.fetched_at
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedPage.fetched_at))
      : t("未保存正文");
    return (
      <section className="feature-card feature-card-wide official-reader">
        <button type="button" className="feature-back inline-back" onClick={() => setSelectedUrl("")}>{t("← 返回资讯列表")}</button>
        <div className="official-reader-heading">
          <div>
            <span className="feature-kicker">{selectedItem.source} · {t("官网同步")}</span>
            <h2>{selectedItem.title[readerLanguage] || selectedItem.title.en}</h2>
            <p>{selectedItem.summary[readerLanguage] || selectedItem.summary.en}</p>
          </div>
          <button type="button" className="feature-primary" onClick={() => window.open(selectedItem.url, "_blank", "noopener,noreferrer")}>{t("打开官网原文")}</button>
        </div>
        <div className="official-reader-meta">
          <span>{t("抓取时间")}：{fetchedAt}</span>
          <span>{t("正文字符")}：{(fullText?.length || 0).toLocaleString(locale)}</span>
          <span>SHA-256：{selectedPage.content_hash?.slice(0, 12) || "—"}</span>
        </div>
        {selectedPage.status === "stored" ? (
          <>
            <div className="reader-language-toolbar">
              <span>{t("正文语言")}</span>
              <div>
                {languageOptions.map((option) => (
                  <button
                    type="button"
                    className={readerLanguage === option.value ? "active" : ""}
                    key={option.value}
                    onClick={() => setReaderLanguage(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="reader-language-note">
              <CheckCircle size={20} weight="fill" />
              <span>
                <strong>{t(showingTranslation ? "当前显示机器辅助译文" : translationMissing ? "所选语言译文暂不可用" : "当前显示官网英文原文")}</strong>
                <small>{t(translationMissing ? "此页面暂无所选语言译文，已回退到英文原文。" : showingTranslation ? "译文用于理解，内容核对请以官网英文原文为准。" : "英文正文来自已保存的官网页面快照。")}</small>
              </span>
            </div>
            <pre className="official-full-text" lang={readerLanguage}>{fullText}</pre>
          </>
        ) : (
          <div className="empty-workspace compact"><FileText size={42} /><strong>{t("此资源仅保留官方链接")}</strong><p>{t("PDF 或排除材料不会在软件中镜像。")}</p></div>
        )}
        <footer className="official-attribution">
          <strong>{t("授权与署名")}</strong>
          <p>{officialPages.attribution}</p>
          <a href={officialPages.licence_url} target="_blank" rel="noreferrer">CC BY 4.0 · NAP copyright</a>
        </footer>
      </section>
    );
  }

  return (
    <section className="feature-card feature-card-wide">
      <div className="workspace-title-row">
        <div><span className="feature-kicker">{t("官网同步")}</span><h2>{t("NAPLAN 官方资讯库")}</h2><p>{t("已保存 {count} 条四语摘要和 {pages} 个官网正文页面。", { count: officialUpdates.items.length, pages: officialPages.pages.filter((page) => page.status === "stored").length })}</p></div>
        <button type="button" className="feature-primary" onClick={() => window.open("https://www.nap.edu.au/naplan", "_blank", "noopener,noreferrer")}>{t("打开 NAP 官网")}</button>
      </div>
      <div className="official-news-toolbar">
        <label>
          <span>{t("搜索资讯")}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("搜索标题、摘要或来源")} />
        </label>
        <div className="official-category-tabs">
          {categories.map(([value, label]) => (
            <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>
              {t(label)}
              <small>{value === "all" ? officialUpdates.items.length : officialUpdates.items.filter((item) => item.category === value).length}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="official-news-list">
        {items.map((item) => {
          const page = officialPages.pages.find((candidate) => candidate.url === item.url);
          return (
            <article key={item.id} className={item.featured ? "featured" : ""}>
              <div className="official-news-meta">
                <time>{new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${item.date}T00:00:00`))}</time>
                <span>{t(categories.find(([value]) => value === item.category)?.[1] || "官方资料")}</span>
                <b>{item.source}</b>
              </div>
              <div className="official-news-copy">
                <h3>{item.title[language] || item.title.en}</h3>
                <p>{item.summary[language] || item.summary.en}</p>
              </div>
              <div className="official-news-actions">
                <button type="button" onClick={() => setSelectedUrl(item.url)} disabled={!page}>{page?.status === "stored" ? t("读取完整正文") : t("查看资源说明")}</button>
                <button type="button" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}>{t("官网原文")} <ArrowRight size={16} /></button>
              </div>
            </article>
          );
        })}
        {items.length === 0 && <div className="empty-workspace compact"><FileMagnifyingGlass size={42} /><strong>{t("没有匹配的官方资讯")}</strong><p>{t("请更换分类或搜索词。")}</p></div>}
      </div>
      <footer className="official-attribution compact-attribution">
        <span>{t("最近抓取")}：{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(officialUpdates.synced_at))}</span>
        <span>© ACARA · CC BY 4.0 · {t("非官方关联产品")}</span>
      </footer>
    </section>
  );
}

function RulesWorkspace() {
  const [genre, setGenre] = useState("narrative");
  const { t, language } = useI18n();
  const [rubricLanguage, setRubricLanguage] = useState(language);
  const interfaceGuide = getWritingRubricGuide(language, genre);
  const rubricGuide = getWritingRubricGuide(rubricLanguage, genre);

  useEffect(() => {
    setRubricLanguage(language);
  }, [language]);

  return (
    <div className="writing-rubric-page feature-card-wide">
      <div className="feature-grid rules-layout">
        <section className="feature-card rubric-summary-card">
          <span className="feature-kicker">Writing rubric</span>
          <h2>{t("作文评分规则")}</h2>
          <div className="segmented-control">
            <button type="button" className={genre === "narrative" ? "active" : ""} onClick={() => setGenre("narrative")}>Narrative</button>
            <button type="button" className={genre === "persuasive" ? "active" : ""} onClick={() => setGenre("persuasive")}>Persuasive</button>
          </div>
          <div className="rubric-total"><strong>{rubricGuide.maximum}</strong><span>{t("最高练习分")}</span></div>
          <p>{rubricGuide.practiceBoundary}</p>
        </section>
        <section className="feature-card rubric-official-intro">
          <span className="feature-kicker">{rubricGuide.eyebrow}</span>
          <h2>{rubricGuide.title}</h2>
          <p>{rubricGuide.intro}</p>
          <div><CheckCircle size={22} weight="fill" /><span><strong>{rubricGuide.tenCriteria}</strong><small>{rubricGuide.sharedNote}</small></span></div>
          <div><FileText size={22} weight="fill" /><span><strong>{rubricGuide.translatedSummary}</strong><small>{rubricGuide.descriptorNote}</small></span></div>
        </section>
      </div>

      <section className="feature-card rubric-language-panel">
        <Translate size={25} weight="duotone" />
        <div><strong>{interfaceGuide.languageTitle}</strong><p>{interfaceGuide.languageBody}</p></div>
        <div className="rubric-language-options" role="group" aria-label={interfaceGuide.languageTitle}>
          {languageOptions.map((option) => (
            <button
              type="button"
              className={rubricLanguage === option.value ? "active" : ""}
              aria-pressed={rubricLanguage === option.value}
              onClick={() => setRubricLanguage(option.value)}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="feature-card rubric-details-section">
        <div className="workspace-title-row">
          <div>
            <span className="feature-kicker">{genre.toUpperCase()} · {rubricGuide.maximum} POINTS</span>
            <h2>{rubricGuide.tenCriteria}</h2>
            <p>{rubricGuide.descriptorNote}</p>
          </div>
        </div>
        <div className="rubric-detail-grid">
          {rubricGuide.criteria.map((criterion, index) => (
            <article className={`rubric-detail-card ${criterion.unique ? "unique" : ""}`} key={criterion.key}>
              <header>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div><h3>{criterion.label}</h3><span>{criterion.unique ? rubricGuide.uniqueCriterion : rubricGuide.commonCriterion}</span></div>
                <strong>0–{criterion.maximum}</strong>
              </header>
              <div>
                <span>{rubricGuide.whatAssesses}</span>
                <p>{criterion.description}</p>
              </div>
              <div className="higher-performance">
                <span>{rubricGuide.higherPerformance}</span>
                <p>{criterion.higher}</p>
              </div>
              <footer>NAPLAN {genre === "narrative" ? "Narrative" : "Persuasive"} writing marking guide · {rubricGuide.translatedSummary}</footer>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-card rubric-sources-section">
        <div className="workspace-title-row">
          <div><span className="feature-kicker">NAP / ACARA</span><h2>{rubricGuide.sourceTitle}</h2><p>{rubricGuide.sourceBody}</p></div>
        </div>
        <div className="rubric-source-grid">
          {rubricGuide.sources.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>
              <FileText size={24} weight="duotone" />
              <span><strong>{source.title}</strong><small>{source.publisher} · {source.type === "pdf" ? interfaceGuide.officialPdf : interfaceGuide.officialWeb}</small></span>
              <em>{interfaceGuide.openOfficial}<ArrowRight size={15} /></em>
            </a>
          ))}
        </div>
        <footer className="rubric-attribution">
          <CheckCircle size={18} weight="fill" />
          <span>{rubricGuide.attribution} <a href="https://www.nap.edu.au/copyright" target="_blank" rel="noreferrer">Copyright and terms of use</a></span>
        </footer>
      </section>
    </div>
  );
}

function FocusWorkspace({ history, onStartPractice }) {
  const { t } = useI18n();
  const skillCounts = new Map();
  history.flatMap((record) => record.mistakes || []).forEach((mistake) => {
    const key = mistake.skill || mistake.subdomain || t("综合能力");
    skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
  });
  const priorities = [...skillCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5);
  const fallback = [["Reading inference", 4], ["Spelling patterns", 3], ["Number operations", 2]];
  return (
    <div className="feature-grid two-columns">
      <section className="feature-card">
        <span className="feature-kicker">{t("个性化建议")}</span>
        <h2>{t("本周复习重点")}</h2>
        <div className="focus-list">
          {(priorities.length ? priorities : fallback).map(([skill, count], index) => (
            <div key={skill}>
              <b>{index + 1}</b>
              <span><strong>{skill}</strong><small>{priorities.length ? t("{count} 道错题关联此能力", { count }) : t("完成一次模拟后会自动更新")}</small></span>
              <i style={{ width: `${Math.max(36, 88 - index * 12)}%` }} />
            </div>
          ))}
        </div>
      </section>
      <section className="feature-card practice-cta">
        <Target size={52} weight="fill" />
        <h2>{t("从真实错题开始")}</h2>
        <p>{t("下一套试卷会按年级加载题库，并自动记录答案、标记与错题。")}</p>
        <button type="button" className="feature-primary" onClick={onStartPractice}>{t("开始模拟练习")} <ArrowRight size={18} /></button>
      </section>
    </div>
  );
}

function RecordsWorkspace({ history, onStartPractice, onDeleteRecord }) {
  const { t, locale } = useI18n();
  return (
    <section className="feature-card feature-card-wide">
      <div className="workspace-title-row">
        <div><span className="feature-kicker">{t("自动同步")}</span><h2>{t("学习记录")}</h2></div>
        <button type="button" className="feature-primary" onClick={onStartPractice}>{t("开始新练习")}</button>
      </div>
      {history.length === 0 ? (
        <div className="empty-workspace"><Notebook size={44} /><strong>{t("还没有练习记录")}</strong><p>{t("提交第一套模拟卷后，成绩会自动出现在这里。")}</p></div>
      ) : (
        <div className="records-table">
          <div className="records-head"><span>{t("完成时间")}</span><span>{t("年级 / 科目")}</span><span>{t("题量")}</span><span>{t("结果")}</span><span>{t("状态")}</span></div>
          {history.map((record) => (
            <div key={record.id}>
              <span>{formatCompletedAt(record.completed_at, locale)}</span>
              <strong>Year {record.year_level} · {record.domain}</strong>
              <span>{record.question_count}</span>
              <b>{record.writing ? `${record.writing.word_count} words` : `${record.correct}/${record.question_count} · ${record.percentage}%`}</b>
              <span className="record-status-actions">
                <i>{t(record.writing ? "待 AI 批改" : "已完成")}</i>
                <button type="button" aria-label={t("删除此记录")} onClick={() => onDeleteRecord(record.id)}><X size={14} weight="bold" /></button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MistakesWorkspace({ history, liveMistakes, onStartPractice }) {
  const mistakes = [
    ...liveMistakes,
    ...history.flatMap((record) => record.mistakes || []),
  ].filter((mistake, index, all) => (
    all.findIndex((item) => (
      item.id === mistake.id
      && item.year_level === mistake.year_level
      && item.domain === mistake.domain
    )) === index
  )).slice(0, 30);
  const { t } = useI18n();
  return (
    <section className="feature-card feature-card-wide">
      <div className="workspace-title-row">
        <div><span className="feature-kicker">{t("自动归档")}</span><h2>{t("错题本")}</h2></div>
        <button type="button" className="feature-primary" onClick={onStartPractice}>{t("再练一套")}</button>
      </div>
      {mistakes.length === 0 ? (
        <div className="empty-workspace"><Books size={44} /><strong>{t("错题本是空的")}</strong><p>{t("作答后会立即批改，答错的题会连同解析一起保存。")}</p></div>
      ) : (
        <div className="mistake-list">
          {mistakes.map((mistake, index) => (
            <details key={`${mistake.id}-${index}`}>
              <summary><b>Year {mistake.year_level}</b><span>{mistake.skill}</span><small>{t(mistake.live ? "即时错题" : "答错")}</small></summary>
              <div><strong>{mistake.prompt}</strong><p>{t("你的答案：")}{mistake.responseDisplay}</p><p>{t("正确答案：")}{mistake.answer}</p><em>{mistake.explanation}</em></div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function AiReportWorkspace({ history, onStartWriting, onNavigate, settings }) {
  const writingRecords = history.filter((record) => record.writing);
  const latestSavedReport = getLatestWritingReportSummary(readWritingReports())?.record;
  const initialWritingId = writingRecords.some((record) => record.id === latestSavedReport?.practice_id)
    ? latestSavedReport.practice_id
    : writingRecords[0]?.id || "";
  const [selectedId, setSelectedId] = useState(initialWritingId);
  const writingRecord = writingRecords.find((record) => record.id === selectedId) || writingRecords[0];
  const [reportRecord, setReportRecord] = useState(() => writingRecord ? getWritingReport(writingRecord.id) : null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();
  const isYear3 = String(settings.yearLevel) === "3";

  useEffect(() => {
    setReportRecord(writingRecord ? getWritingReport(writingRecord.id) : null);
    setError("");
  }, [writingRecord?.id]);

  const provider = getAiProvider(settings.aiProvider);
  const apiKeyReady = Boolean(getSessionApiKey(settings.aiProvider));
  const generateReport = async () => {
    if (!writingRecord || !apiKeyReady) return;
    setGenerating(true);
    setError("");
    try {
      const nextReport = await requestWritingReview({
        settings,
        practiceRecord: writingRecord,
        apiKey: getSessionApiKey(settings.aiProvider),
      });
      saveWritingReport(nextReport);
      setReportRecord(nextReport);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGenerating(false);
    }
  };

  if (reportRecord) {
    return (
      <WritingReport
        reportRecord={reportRecord}
        studentName={settings.studentName}
        onRegenerate={() => {
          setReportRecord(null);
          window.setTimeout(generateReport, 0);
        }}
      />
    );
  }

  return (
    <div className="feature-grid report-layout">
      <section className="feature-card">
        <span className="feature-kicker">AI writing review</span>
        <h2>{t("作文批改与报告")}</h2>
        {isYear3 && (
          <aside className="year3-writing-assistant-note">
            <FileText size={27} weight="duotone" />
            <div>
              <strong>{t("Year 3 写作说明")}</strong>
              <p>{t("NAPLAN Year 3 写作在纸上完成。本软件目前不使用手写 OCR；孩子写完后，请家长将原文逐字输入，不要修正拼写、标点、分段或措辞，以免影响 AI 评分。")}</p>
              <span>
                <button type="button" onClick={onStartWriting}>{t("进入 Year 3 纸笔写作练习")}<ArrowRight size={15} /></button>
                <a href="https://www.nap.edu.au/naplan/whats-in-the-tests" target="_blank" rel="noreferrer">{t("查看官方说明")}</a>
              </span>
            </div>
          </aside>
        )}
        {writingRecord ? (
          <>
            <div className="writing-record-summary">
              <strong>{writingRecord.writing.title}</strong>
              <span>Year {writingRecord.year_level} · {writingRecord.writing.genre}</span>
              <b>{writingRecord.writing.word_count} words</b>
              {writingRecord.writing.entry_method === "parent_transcription" && <em>{t("家长录入纸笔原文")}</em>}
            </div>
            {writingRecords.length > 1 && (
              <label className="writing-record-picker">
                {t("选择作文")}
                <select value={writingRecord.id} onChange={(event) => setSelectedId(event.target.value)}>
                  {writingRecords.map((record) => (
                    <option value={record.id} key={record.id}>
                      Year {record.year_level} · {record.writing.title} · {formatCompletedAt(record.completed_at, "en-AU")}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p>{t("作文已经从模拟考试同步。模型会按照 10 项 rubric 生成逐项证据、原文批注、改进计划和同题满分范本。")}</p>
          </>
        ) : (
          <div className="empty-workspace compact"><Robot size={42} /><strong>{t("还没有作文作答")}</strong><p>{t("先完成一篇 Writing 模拟题。")}</p></div>
        )}
        <div className="ai-report-actions">
          <button type="button" className="feature-primary" onClick={writingRecord ? generateReport : onStartWriting} disabled={generating || (writingRecord && !apiKeyReady)}>
            {generating ? t("正在生成完整报告…") : t(writingRecord ? "生成批改报告" : "开始 Writing 模拟")}
          </button>
          {writingRecord && <button type="button" className="feature-secondary" onClick={onStartWriting}>{t("再写一篇")}</button>}
        </div>
        {!apiKeyReady && writingRecord && (
          <button type="button" className="inline-settings-link" onClick={() => onNavigate("设置")}>
            <Key />{t("先到设置输入 API Key")}
          </button>
        )}
        {error && <div className="ai-request-error"><X weight="bold" />{error}</div>}
      </section>
      <section className="feature-card ai-status-card">
        <h2>{t("批改链路状态")}</h2>
        <div><CheckCircle size={22} weight="fill" /><span><strong>{t("评分标准")}</strong><small>Narrative /47 · Persuasive /48</small></span></div>
        <div><CheckCircle size={22} weight="fill" /><span><strong>{t("作文同步")}</strong><small>{t(writingRecord ? "最近一篇已就绪" : "等待作文提交")}</small></span></div>
        <div><CheckCircle size={22} weight="fill" /><span><strong>{t("报告输出语言")}</strong><small>{t("作文报告将使用：{language}", { language: getLanguageLabel(settings.reportLanguage) })}</small></span></div>
        <div className={apiKeyReady ? "" : "pending"}>{apiKeyReady ? <CheckCircle size={22} weight="fill" /> : <Clock size={22} weight="fill" />}<span><strong>{provider.name} · {settings.aiModel}</strong><small>{t(apiKeyReady ? "API Key 已在当前会话中配置" : "需要在设置中输入 API Key")}</small></span></div>
        <p>{t("当前不会伪造 AI 分数，也不会把练习结果标记为官方 NAPLAN 成绩。")}</p>
      </section>
    </div>
  );
}

function SettingsWorkspace({ settings, onUpdateSettings }) {
  const [studentName, setStudentName] = useState(settings.studentName);
  const [yearLevel, setYearLevel] = useState(settings.yearLevel);
  const [providerId, setProviderId] = useState(settings.aiProvider);
  const [model, setModel] = useState(settings.aiModel);
  const [baseUrl, setBaseUrl] = useState(settings.aiBaseUrl);
  const [apiKey, setApiKey] = useState(() => getSessionApiKey(settings.aiProvider));
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configError, setConfigError] = useState("");
  const { t } = useI18n();
  const provider = getAiProvider(providerId);

  const changeProvider = (nextProviderId) => {
    const nextProvider = getAiProvider(nextProviderId);
    setProviderId(nextProviderId);
    setModel(nextProvider.defaultModel);
    setBaseUrl(nextProvider.defaultBaseUrl);
    setApiKey(getSessionApiKey(nextProviderId));
    setConfigError("");
  };

  const markSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const saveProfile = () => {
    onUpdateSettings({ ...settings, studentName, yearLevel });
    markSaved();
  };
  const saveAiConfig = () => {
    if (!isAllowedProviderBaseUrl(providerId, baseUrl)) {
      setConfigError(t("API 地址与所选供应商不匹配，请使用官方 HTTPS 地址。"));
      return;
    }
    setSessionApiKey(providerId, apiKey);
    onUpdateSettings({
      ...settings,
      studentName,
      yearLevel,
      aiProvider: providerId,
      aiModel: model.trim(),
      aiBaseUrl: baseUrl.trim().replace(/\/+$/, ""),
    });
    setConfigError("");
    markSaved();
  };
  return (
    <div className="feature-grid two-columns settings-layout">
      <section className="feature-card settings-card">
        <span className="feature-kicker">{t("家庭资料")}</span>
        <h2>{t("学习设置")}</h2>
        <label>{t("学生称呼")}<input value={studentName} onChange={(event) => setStudentName(event.target.value)} /></label>
        <label>{t("当前年级")}<select value={yearLevel} onChange={(event) => setYearLevel(event.target.value)}><option value="3">Year 3</option><option value="5">Year 5</option><option value="7">Year 7</option><option value="9">Year 9</option></select></label>
        <label>{t("界面语言")}<select value={settings.uiLanguage} onChange={(event) => onUpdateSettings({ ...settings, uiLanguage: event.target.value })}>{languageOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <label>{t("作文批改输出语言")}<select value={settings.reportLanguage} onChange={(event) => onUpdateSettings({ ...settings, reportLanguage: event.target.value })}>{languageOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <p className="settings-help">{t("界面会立即切换；模拟练习始终保持英文。")}</p>
        <button type="button" className="feature-primary" onClick={saveProfile}>{t(saved ? "已保存" : "保存设置")}</button>
      </section>
      <section className="feature-card settings-card ai-config-card">
        <span className="feature-kicker">AI PROVIDER</span>
        <h2>{t("作文批改模型")}</h2>
        <div className="provider-selector" role="group" aria-label={t("选择 AI 供应商")}>
          {Object.values(AI_PROVIDERS).map((item) => (
            <button
              type="button"
              className={item.id === providerId ? "active" : ""}
              onClick={() => changeProvider(item.id)}
              key={item.id}
            >
              <Robot weight={item.id === providerId ? "fill" : "regular"} />
              <span>{item.name}</span>
              {item.id === providerId && <CheckCircle weight="fill" />}
            </button>
          ))}
        </div>
        <label>{t("模型")}
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            {provider.models.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>{t("API 地址")}
          <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} spellCheck="false" inputMode="url" />
        </label>
        <label>{t("API Key")}
          <span className="api-key-field">
            <input
              value={apiKey}
              type={showKey ? "text" : "password"}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={t("留空，之后再输入")}
              autoComplete="off"
              spellCheck="false"
            />
            <button type="button" onClick={() => setShowKey((value) => !value)} aria-label={t(showKey ? "隐藏 API Key" : "显示 API Key")}>
              {showKey ? <EyeSlash /> : <Eye />}
            </button>
          </span>
        </label>
        <div className="session-key-note"><ShieldCheck weight="fill" /><p><strong>{t("仅保存在当前会话")}</strong><span>{t("API Key 不会写入项目文件或永久设置；关闭浏览器标签后会清除。")}</span></p></div>
        {configError && <div className="ai-request-error"><X weight="bold" />{configError}</div>}
        <button type="button" className="feature-primary" onClick={saveAiConfig} disabled={!model.trim()}>{t(saved ? "已保存" : "保存模型设置")}</button>
      </section>
      <section className="feature-card settings-data-card">
        <h2>{t("数据说明")}</h2>
        <div className="privacy-list">
          <p><CheckCircle size={20} weight="fill" />{t("练习进度保存在当前设备浏览器中。")}</p>
          <p><CheckCircle size={20} weight="fill" />{t("题库内容为原创练习材料。")}</p>
          <p><CheckCircle size={20} weight="fill" />{t("练习分数不是官方 NAPLAN 成绩。")}</p>
          <p><CheckCircle size={20} weight="fill" />{t("作文原文仅在生成报告时发送给当前选择的模型供应商。")}</p>
        </div>
      </section>
    </div>
  );
}

function FeatureWorkspace({
  active,
  variant,
  onNavigate,
  onStartPractice,
  onStartWriting,
  onDeletePracticeRecord,
  settings,
  onUpdateSettings,
  history,
  liveMistakes,
}) {
  const descriptions = {
    "时间表 & 倒计时": "把学校安排、模拟练习和家庭复习节奏放在同一条时间线上。",
    "最新动向": "集中查看 NAPLAN 官方信息入口和家长需要关注的变化。",
    "考试指南": "了解考试领域、正式时长、在线作答、成绩等级和家长常用官方资料。",
    "评分规则": "查看写作十项评分维度、满分结构和练习结果边界。",
    "复习重点": "根据模拟练习的错题自动识别优先能力。",
    "AI 批改 & 报告": "接收 Writing 模拟作答，并准备生成逐项批改报告。",
    "学习记录": "所有已提交模拟卷的成绩和作文记录。",
    "错题本": "即时保存答错题目、正确答案和解析；改对后会自动移除。",
    "设置": "管理学生年级、称呼、界面语言和作文报告语言。",
  };
  return (
    <div className={`feature-workspace ${variant}`}>
      <FeatureHeader title={active} description={descriptions[active]} onHome={() => onNavigate("首页")} />
      {active === "时间表 & 倒计时" && <ScheduleWorkspace />}
      {active === "最新动向" && <NewsWorkspace />}
      {active === "考试指南" && <ExamGuideWorkspace onStartPractice={onStartPractice} />}
      {active === "评分规则" && <RulesWorkspace />}
      {active === "复习重点" && <FocusWorkspace history={history} onStartPractice={onStartPractice} />}
      {active === "AI 批改 & 报告" && <AiReportWorkspace history={history} onStartWriting={onStartWriting} onNavigate={onNavigate} settings={settings} />}
      {active === "学习记录" && <RecordsWorkspace history={history} onStartPractice={onStartPractice} onDeleteRecord={onDeletePracticeRecord} />}
      {active === "错题本" && <MistakesWorkspace history={history} liveMistakes={liveMistakes} onStartPractice={onStartPractice} />}
      {active === "设置" && <SettingsWorkspace settings={settings} onUpdateSettings={onUpdateSettings} />}
    </div>
  );
}

const goalDomainLabels = {
  Writing: "写作",
  Reading: "阅读",
  "Conventions of language": "语言",
  Numeracy: "数学",
};

function GoalSettingsModal({ goal, history, variant, onSave, onClose }) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState(() => normaliseLearningGoal(goal));
  const progress = useMemo(
    () => calculateLearningProgress(history, draft),
    [draft, history],
  );
  const dateRange = `${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(progress.weekStart)} – ${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(progress.weekEnd)}`;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const changeTarget = (amount) => {
    setDraft((current) => normaliseLearningGoal({
      ...current,
      weeklyTarget: current.weeklyTarget + amount,
    }));
  };

  const toggleDomain = (domain) => {
    setDraft((current) => {
      const selected = current.focusDomains.includes(domain)
        ? current.focusDomains.filter((item) => item !== domain)
        : [...current.focusDomains, domain];
      return { ...current, focusDomains: selected };
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className={`goal-settings-modal ${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <button type="button" className="modal-close" aria-label={t("关闭")} onClick={onClose}><X size={20} /></button>
        <header>
          <span><Target size={25} weight="fill" /></span>
          <div>
            <small>{t("学习计划")}</small>
            <h2 id="goal-settings-title">{t("设置每周学习目标")}</h2>
            <p>{t("目标会根据已提交的模拟练习自动更新，练习计时只累计考试界面实际打开的时间。")}</p>
          </div>
        </header>

        <section className="goal-live-summary" aria-live="polite">
          <div>
            <span>{t("本周进度")}</span>
            <strong>{progress.weeklyCompleted} / {progress.weeklyTarget}</strong>
            <small>{dateRange}</small>
          </div>
          <div className="goal-live-track"><span style={{ width: `${progress.weeklyPercent}%` }} /></div>
        </section>

        <section className="goal-form-section">
          <label id="weekly-target-label">{t("每周练习次数")}</label>
          <p>{t("每提交一套模拟练习，计为完成一次。")}</p>
          <div className="goal-number-stepper" role="group" aria-labelledby="weekly-target-label">
            <button type="button" onClick={() => changeTarget(-1)} disabled={draft.weeklyTarget <= 1} aria-label={t("减少每周练习次数")}><Minus size={18} weight="bold" /></button>
            <input
              type="number"
              min="1"
              max="20"
              value={draft.weeklyTarget}
              onChange={(event) => setDraft((current) => normaliseLearningGoal({
                ...current,
                weeklyTarget: event.target.value,
              }))}
              aria-labelledby="weekly-target-label"
            />
            <span>{t("次 / 周")}</span>
            <button type="button" onClick={() => changeTarget(1)} disabled={draft.weeklyTarget >= 20} aria-label={t("增加每周练习次数")}><Plus size={18} weight="bold" /></button>
          </div>
        </section>

        <section className="goal-form-section">
          <label>{t("计入目标的科目")}</label>
          <p>{t("选择重点科目；选择“全部科目”时，任何已提交练习都会计入。")}</p>
          <div className="goal-domain-options">
            <button
              type="button"
              className={draft.focusDomains.length === 0 ? "active" : ""}
              aria-pressed={draft.focusDomains.length === 0}
              onClick={() => setDraft((current) => ({ ...current, focusDomains: [] }))}
            >
              {draft.focusDomains.length === 0 && <Check size={15} weight="bold" />}
              {t("全部科目")}
            </button>
            {LEARNING_GOAL_DOMAINS.map((domain) => {
              const active = draft.focusDomains.includes(domain);
              return (
                <button
                  type="button"
                  className={active ? "active" : ""}
                  aria-pressed={active}
                  onClick={() => toggleDomain(domain)}
                  key={domain}
                >
                  {active && <Check size={15} weight="bold" />}
                  {t(goalDomainLabels[domain])}
                </button>
              );
            })}
          </div>
        </section>

        <footer>
          <button type="button" className="goal-cancel" onClick={onClose}>{t("取消")}</button>
          <button type="submit" className="goal-save"><CheckCircle size={19} weight="fill" />{t("保存目标")}</button>
        </footer>
      </form>
    </div>
  );
}

function ActionModal({ title, variant, onClose }) {
  const { t } = useI18n();
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`action-modal ${variant}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" aria-label={t("关闭")} onClick={onClose}><X size={20} /></button>
        <span className="modal-icon"><CheckCircle size={40} weight="fill" /></span>
        <h2 id="modal-title">{t(title)}</h2>
        <p>{t("功能入口已连接。这里会进入对应的学习流程，并自动保存孩子的练习进度。")}</p>
        <button type="button" className="modal-primary" onClick={onClose}>{t("知道了")}</button>
      </section>
    </div>
  );
}

function LocalizedApp({ settings, onUpdateSettings }) {
  const variant = useMemo(() => (window.location.pathname.toLowerCase().includes("professional") ? "professional" : "warm"), []);
  const { t } = useI18n();
  const [active, setActive] = useState(() =>
    window.location.pathname.toLowerCase().includes("/guide") ? "考试指南" : "首页",
  );
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [goal, setGoal] = useState(() => readLearningGoal());
  const [history, setHistory] = useState(() => readPracticeHistory());
  const [liveMistakes, setLiveMistakes] = useState(() => readLivePracticeMistakes());

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelector(".feature-workspace")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [active]);

  useEffect(() => {
    const refreshHistory = () => {
      setHistory(readPracticeHistory());
      setLiveMistakes(readLivePracticeMistakes());
    };
    const handleStorage = (event) => {
      if (event.key === "naplan-practice-history") refreshHistory();
      if (event.key === "naplan-live-practice-mistakes") setLiveMistakes(readLivePracticeMistakes());
    };
    window.addEventListener("focus", refreshHistory);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(LIVE_MISTAKES_EVENT, refreshHistory);
    return () => {
      window.removeEventListener("focus", refreshHistory);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LIVE_MISTAKES_EVENT, refreshHistory);
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const openFeature = (label) => {
    if (label === "模拟练习" || label === "1:1 模拟做题") {
      window.location.assign("/exam");
      return;
    }
    if (label === "设置学习目标" || label === "编辑学习目标") {
      setGoalEditorOpen(true);
      return;
    }
    const target = featureAliases[label] || label;
    const featureLabels = new Set(navItems.map((item) => item.label));
    if (featureLabels.has(target)) {
      setActive(target);
    } else {
      setModal(label);
    }
  };

  const handleNavigate = (label) => {
    if (label === "模拟练习") {
      window.location.assign("/exam");
      return;
    }
    setActive(label === "首页" ? "首页" : label);
  };

  return (
    <main className={`app-stage ${variant}`}>
      <section className={`app-shell ${variant}-shell`}>
        <Sidebar variant={variant} active={active} onNavigate={handleNavigate} />
        {active !== "首页" ? (
          <FeatureWorkspace
            active={active}
            variant={variant}
            onNavigate={handleNavigate}
            onStartPractice={() => window.location.assign("/exam")}
            onStartWriting={() => window.location.assign(`/exam?year=${settings.yearLevel}&domain=Writing`)}
            onDeletePracticeRecord={(recordId) => setHistory(deletePracticeRecord(recordId))}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            history={history}
            liveMistakes={liveMistakes}
          />
        ) : variant === "warm" ? (
          <WarmDashboard
            onOpen={openFeature}
            studentName={settings.studentName}
            goal={goal}
            history={history}
            onEditGoal={() => setGoalEditorOpen(true)}
          />
        ) : (
          <ProfessionalDashboard
            onOpen={openFeature}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
            studentName={settings.studentName}
          />
        )}
      </section>
      {modal && <ActionModal title={modal} variant={variant} onClose={() => setModal("")} />}
      {goalEditorOpen && (
        <GoalSettingsModal
          goal={goal}
          history={history}
          variant={variant}
          onClose={() => setGoalEditorOpen(false)}
          onSave={(nextGoal) => {
            setGoal(saveLearningGoal(nextGoal));
            setGoalEditorOpen(false);
            showToast(t("目标已保存"));
          }}
        />
      )}
      {toast && <div className={`toast ${variant}`}>{toast}</div>}
    </main>
  );
}

export function App() {
  const [settings, setSettings] = useState(() => readParentSettings());

  useEffect(() => {
    window.localStorage.setItem("naplan-parent-settings", JSON.stringify(settings));
    document.documentElement.lang = getLocale(settings.uiLanguage);
  }, [settings]);

  return (
    <I18nProvider language={settings.uiLanguage}>
      <LocalizedApp settings={settings} onUpdateSettings={setSettings} />
    </I18nProvider>
  );
}
