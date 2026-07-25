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
  RESTORED_WINDOW_CORNER_RADIUS,
  buildRoundedWindowShape,
  isNativeRoundedWindowSupported,
  syncRoundedWindowShape,
  toggleFullscreenWindow,
} = require("../electron/window-layout.cjs");

test("default and minimum desktop window sizes are 16:9", () => {
  assert.equal(DEFAULT_WINDOW_WIDTH, 1440);
  assert.equal(DEFAULT_WINDOW_HEIGHT, 810);
  assert.equal(MINIMUM_WINDOW_WIDTH, 1024);
  assert.equal(MINIMUM_WINDOW_HEIGHT, 576);
  assert.equal(APP_ASPECT_RATIO, 16 / 9);
});

test("restored desktop windows use native corners on Windows 11", () => {
  assert.equal(RESTORED_WINDOW_CORNER_RADIUS, 14);
  assert.equal(isNativeRoundedWindowSupported("win32", "10.0.22631"), true);
  assert.equal(isNativeRoundedWindowSupported("win32", "10.0.19045"), false);
  assert.equal(isNativeRoundedWindowSupported("darwin", "23.0.0"), true);
});

test("Windows 10 fallback shape rounds the outer corners and preserves the centre", () => {
  const shape = buildRoundedWindowShape(1440, 810);
  const topBand = shape[0];
  const centreBand = shape.find((rect) => rect.x === 0 && rect.y === 14);
  const bottomBand = shape.at(-1);

  assert.ok(topBand.x > 0);
  assert.equal(topBand.y, 0);
  assert.ok(topBand.width < 1440);
  assert.deepEqual(centreBand, { x: 0, y: 14, width: 1440, height: 782 });
  assert.equal(bottomBand.x, topBand.x);
  assert.equal(bottomBand.y + bottomBand.height, 810);
  assert.equal(bottomBand.width, topBand.width);
});

test("Windows 10 fallback shape is removed in fullscreen and restored afterwards", () => {
  const shapes = [];
  const targetWindow = {
    fullscreen: true,
    getSize: () => [1440, 810],
    isFullScreen() {
      return this.fullscreen;
    },
    setShape(shape) {
      shapes.push(shape);
    },
  };

  assert.equal(
    syncRoundedWindowShape(targetWindow, {
      platform: "win32",
      release: "10.0.19045",
    }),
    true,
  );
  assert.deepEqual(shapes[0], []);

  targetWindow.fullscreen = false;
  syncRoundedWindowShape(targetWindow, {
    platform: "win32",
    release: "10.0.19045",
  });
  assert.ok(shapes[1].length > 1);
});

test("desktop maximise toggles true fullscreen without a framed work-area window", () => {
  const states = [];
  const targetWindow = {
    fullscreen: false,
    isFullScreen() {
      return this.fullscreen;
    },
    setFullScreen(enabled) {
      this.fullscreen = enabled;
      states.push(enabled);
    },
  };

  assert.equal(toggleFullscreenWindow(targetWindow), true);
  assert.equal(toggleFullscreenWindow(targetWindow), false);
  assert.deepEqual(states, [true, false]);
});
