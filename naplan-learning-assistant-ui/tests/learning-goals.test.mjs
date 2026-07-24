import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLearningProgress,
  normaliseLearningGoal,
  splitLearningDuration,
} from "../src/data/learning-goals.js";

test("learning goals are normalised to supported values", () => {
  assert.deepEqual(normaliseLearningGoal({
    weeklyTarget: 99,
    focusDomains: ["Reading", "Reading", "Unsupported"],
  }), {
    weeklyTarget: 20,
    focusDomains: ["Reading"],
  });
  assert.equal(normaliseLearningGoal({ weeklyTarget: 0 }).weeklyTarget, 1);
});

test("weekly progress uses Monday boundaries and selected domains", () => {
  const now = new Date(2026, 6, 24, 12);
  const history = [
    { completed_at: new Date(2026, 6, 20, 9).toISOString(), domain: "Reading", duration_seconds: 900 },
    { completed_at: new Date(2026, 6, 22, 9).toISOString(), domain: "Writing", duration_seconds: 1200 },
    { completed_at: new Date(2026, 6, 19, 9).toISOString(), domain: "Reading", duration_seconds: 600 },
  ];
  const progress = calculateLearningProgress(history, {
    weeklyTarget: 3,
    focusDomains: ["Reading"],
  }, now);

  assert.equal(progress.weeklyCompleted, 1);
  assert.equal(progress.weeklyPercent, 33);
  assert.equal(progress.totalDurationSeconds, 2700);
});

test("streak accepts activity today or yesterday and counts consecutive local dates", () => {
  const now = new Date(2026, 6, 24, 12);
  const history = [23, 22, 21].map((day) => ({
    completed_at: new Date(2026, 6, day, 18).toISOString(),
    domain: "Reading",
  }));
  assert.equal(calculateLearningProgress(history, { weeklyTarget: 5 }, now).streakDays, 3);
});

test("duration is split into display hours and minutes", () => {
  assert.deepEqual(splitLearningDuration(18 * 3600 + 36 * 60 + 12), {
    hours: 18,
    minutes: 36,
  });
});
