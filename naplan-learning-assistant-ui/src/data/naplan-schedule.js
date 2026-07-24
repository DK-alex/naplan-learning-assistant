export const NAPLAN_KEY_DATES_URL = "https://www.nap.edu.au/naplan/key-dates";

export const OFFICIAL_NAPLAN_WINDOWS = Object.freeze([
  {
    year: 2026,
    start: "2026-03-11T00:00:00+11:00",
    end: "2026-03-23T23:59:59+11:00",
    dateLabel: "2026-03-11~23",
    fullDateLabel: "2026年3月11日 – 3月23日",
    title: "NAPLAN 2026 考试窗口",
  },
  {
    year: 2027,
    start: "2027-03-10T00:00:00+11:00",
    end: "2027-03-22T23:59:59+11:00",
    dateLabel: "2027-03-10~22",
    fullDateLabel: "2027年3月10日 – 3月22日",
    title: "NAPLAN 2027 考试窗口",
  },
  {
    year: 2028,
    start: "2028-03-15T00:00:00+11:00",
    end: "2028-03-27T23:59:59+11:00",
    dateLabel: "2028-03-15~27",
    fullDateLabel: "2028年3月15日 – 3月27日",
    title: "NAPLAN 2028 考试窗口",
  },
  {
    year: 2029,
    start: "2029-03-14T00:00:00+11:00",
    end: "2029-03-26T23:59:59+11:00",
    dateLabel: "2029-03-14~26",
    fullDateLabel: "2029年3月14日 – 3月26日",
    title: "NAPLAN 2029 考试窗口",
  },
]);

export function getFutureNaplanWindows(now = new Date()) {
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return OFFICIAL_NAPLAN_WINDOWS.filter((window) => new Date(window.end).getTime() >= timestamp);
}

export function getNextNaplanWindow(now = new Date()) {
  return getFutureNaplanWindows(now)[0] ?? null;
}

export function getCountdownParts(target, now = new Date()) {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
  const targetTime = target instanceof Date ? target.getTime() : new Date(target).getTime();
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  let remaining = Math.max(0, targetTime - nowTime);
  const days = Math.floor(remaining / 86_400_000);
  remaining -= days * 86_400_000;
  const hours = Math.floor(remaining / 3_600_000);
  remaining -= hours * 3_600_000;
  const minutes = Math.floor(remaining / 60_000);
  remaining -= minutes * 60_000;
  return {
    days,
    hours,
    minutes,
    seconds: Math.floor(remaining / 1_000),
    complete: targetTime <= nowTime,
  };
}
