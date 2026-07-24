import test from "node:test";
import assert from "node:assert/strict";

import {
  getCountdownParts,
  getFutureNaplanWindows,
  getNextNaplanWindow,
} from "../src/data/naplan-schedule.js";

test("the dashboard excludes NAPLAN windows that have already ended", () => {
  const windows = getFutureNaplanWindows(new Date("2026-07-24T12:00:00+10:00"));
  assert.deepEqual(windows.map((window) => window.year), [2027, 2028, 2029]);
  assert.equal(getNextNaplanWindow(new Date("2026-07-24T12:00:00+10:00")).year, 2027);
});

test("the current test window remains visible until its final day ends", () => {
  const windows = getFutureNaplanWindows(new Date("2027-03-20T12:00:00+11:00"));
  assert.equal(windows[0].year, 2027);
});

test("an empty future state is returned after the last published window", () => {
  assert.deepEqual(getFutureNaplanWindows(new Date("2030-01-01T00:00:00+11:00")), []);
});

test("countdown parts are calculated from the next official start date", () => {
  const countdown = getCountdownParts(
    "2027-03-10T00:00:00+11:00",
    new Date("2027-03-08T22:58:59+11:00"),
  );
  assert.deepEqual(countdown, {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    complete: false,
  });
});
