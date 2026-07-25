export const ACTIVE_SESSION_KEY = "naplan-active-practice-session";
export const LIVE_MISTAKES_KEY = "naplan-live-practice-mistakes";
export const LIVE_MISTAKES_EVENT = "naplan-live-mistakes-updated";

function resolveStorage(storage) {
  return storage ?? globalThis.window?.localStorage ?? null;
}

function readJson(key, fallback, storage) {
  const target = resolveStorage(storage);
  if (!target) return fallback;
  try {
    return JSON.parse(target.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function practiceSessionId(year, domain, writingTask = "") {
  return [year, domain, domain === "Writing" ? writingTask : ""].join(":");
}

export function practiceProgressKey(year, domain, writingTask = "") {
  return `naplan-practice:${practiceSessionId(year, domain, writingTask)}`;
}

export function readActivePracticeSession(storage) {
  const value = readJson(ACTIVE_SESSION_KEY, null, storage);
  if (!value || !Number.isFinite(Number(value.year)) || !value.domain) return null;
  return value;
}

export function saveActivePracticeSession(session, storage) {
  const target = resolveStorage(storage);
  if (!target) return null;
  const value = {
    year: Number(session.year),
    domain: session.domain,
    writingTask: session.writingTask || "Narrative Task",
    formSeed: Number(session.formSeed) || 0,
    updatedAt: new Date().toISOString(),
  };
  target.setItem(ACTIVE_SESSION_KEY, JSON.stringify(value));
  return value;
}

export function clearActivePracticeSession(storage) {
  resolveStorage(storage)?.removeItem(ACTIVE_SESSION_KEY);
}

export function readLivePracticeMistakes(storage) {
  const value = readJson(LIVE_MISTAKES_KEY, [], storage);
  return Array.isArray(value) ? value : [];
}

export function replaceLivePracticeMistakes(sessionId, mistakes, storage) {
  const target = resolveStorage(storage);
  if (!target) return [];
  const retained = readLivePracticeMistakes(target).filter((item) => item.session_id !== sessionId);
  const next = [
    ...mistakes.map((item) => ({
      ...item,
      session_id: sessionId,
      live: true,
      updated_at: new Date().toISOString(),
    })),
    ...retained,
  ].slice(0, 500);
  target.setItem(LIVE_MISTAKES_KEY, JSON.stringify(next));
  return next;
}

export function clearLivePracticeMistakes(sessionId, storage) {
  return replaceLivePracticeMistakes(sessionId, [], storage);
}

export function notifyLiveMistakesChanged() {
  globalThis.window?.dispatchEvent(new CustomEvent(LIVE_MISTAKES_EVENT));
}
