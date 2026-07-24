import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  APP_ASPECT_RATIO,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MINIMUM_WINDOW_HEIGHT,
  MINIMUM_WINDOW_WIDTH,
  fitAspectRatioWithin,
} = require("../electron/window-layout.cjs");

test("default and minimum desktop window sizes are 16:9", () => {
  assert.equal(DEFAULT_WINDOW_WIDTH, 1440);
  assert.equal(DEFAULT_WINDOW_HEIGHT, 810);
  assert.equal(MINIMUM_WINDOW_WIDTH, 1024);
  assert.equal(MINIMUM_WINDOW_HEIGHT, 576);
  assert.equal(APP_ASPECT_RATIO, 16 / 9);
});

test("desktop maximise fits a centred 16:9 window inside the work area", () => {
  assert.deepEqual(
    fitAspectRatioWithin({ x: 0, y: 0, width: 1920, height: 1040 }),
    { x: 36, y: 0, width: 1848, height: 1040 },
  );
  assert.deepEqual(
    fitAspectRatioWithin({ x: 200, y: 100, width: 1440, height: 960 }),
    { x: 200, y: 175, width: 1440, height: 810 },
  );
});
