export const LEARNING_GOAL_STORAGE_KEY = "naplan-learning-goal";

export const LEARNING_GOAL_DOMAINS = [
  "Writing",
  "Reading",
  "Conventions of language",
  "Numeracy",
];

export const DEFAULT_LEARNING_GOAL = Object.freeze({
  weeklyTarget: 5,
  focusDomains: [],
});

function clampWeeklyTarget(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LEARNING_GOAL.weeklyTarget;
  return Math.min(20, Math.max(1, parsed));
}

export function normaliseLearningGoal(value = {}) {
  const focusDomains = Array.isArray(value.focusDomains)
    ? [...new Set(value.focusDomains.filter((domain) => LEARNING_GOAL_DOMAINS.includes(domain)))]
    : [];

  return {
    weeklyTarget: clampWeeklyTarget(value.weeklyTarget),
    focusDomains,
  };
}

export function readLearningGoal(storage = globalThis.localStorage) {
  if (!storage) return { ...DEFAULT_LEARNING_GOAL };
  try {
    return normaliseLearningGoal(JSON.parse(storage.getItem(LEARNING_GOAL_STORAGE_KEY) || "{}"));
  } catch {
    return { ...DEFAULT_LEARNING_GOAL };
  }
}

export function saveLearningGoal(goal, storage = globalThis.localStorage) {
  const normalised = normaliseLearningGoal(goal);
  storage?.setItem(LEARNING_GOAL_STORAGE_KEY, JSON.stringify(normalised));
  return normalised;
}

function startOfLocalDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function localDayKey(value) {
  const date = startOfLocalDay(value);
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfMondayWeek(value) {
  const date = startOfLocalDay(value);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

function isCountedDomain(record, focusDomains) {
  return focusDomains.length === 0 || focusDomains.includes(record.domain);
}

export function calculateLearningProgress(history, goal, now = new Date()) {
  const safeHistory = Array.isArray(history) ? history : [];
  const safeGoal = normaliseLearningGoal(goal);
  const weekStart = startOfMondayWeek(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const weeklyCompleted = safeHistory.filter((record) => {
    const completedAt = new Date(record?.completed_at);
    return (
      !Number.isNaN(completedAt.getTime())
      && completedAt >= weekStart
      && completedAt < nextWeekStart
      && isCountedDomain(record, safeGoal.focusDomains)
    );
  }).length;

  const activeDays = new Set(
    safeHistory
      .map((record) => localDayKey(record?.completed_at))
      .filter(Boolean),
  );
  const today = startOfLocalDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let cursor = activeDays.has(localDayKey(today)) ? today : yesterday;
  let streakDays = 0;
  while (activeDays.has(localDayKey(cursor))) {
    streakDays += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  const totalDurationSeconds = safeHistory.reduce((total, record) => {
    const duration = Number(record?.duration_seconds);
    return total + (Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0);
  }, 0);

  return {
    weeklyCompleted,
    weeklyTarget: safeGoal.weeklyTarget,
    weeklyPercent: Math.min(100, Math.round((weeklyCompleted / safeGoal.weeklyTarget) * 100)),
    streakDays,
    totalDurationSeconds,
    weekStart,
    weekEnd: new Date(nextWeekStart.getTime() - 1),
  };
}

export function splitLearningDuration(totalDurationSeconds) {
  const safeSeconds = Math.max(0, Math.round(Number(totalDurationSeconds) || 0));
  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
  };
}
