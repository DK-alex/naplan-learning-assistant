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
  toggleFullscreenWindow,
} = require("../electron/window-layout.cjs");

test("default and minimum desktop window sizes are 16:9", () => {
  assert.equal(DEFAULT_WINDOW_WIDTH, 1440);
  assert.equal(DEFAULT_WINDOW_HEIGHT, 810);
  assert.equal(MINIMUM_WINDOW_WIDTH, 1024);
  assert.equal(MINIMUM_WINDOW_HEIGHT, 576);
  assert.equal(APP_ASPECT_RATIO, 16 / 9);
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
