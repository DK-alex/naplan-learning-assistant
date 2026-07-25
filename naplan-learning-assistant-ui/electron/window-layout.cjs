const APP_ASPECT_RATIO = 16 / 9;
const DEFAULT_WINDOW_WIDTH = 1440;
const DEFAULT_WINDOW_HEIGHT = Math.round(DEFAULT_WINDOW_WIDTH / APP_ASPECT_RATIO);
const MINIMUM_WINDOW_WIDTH = 1024;
const MINIMUM_WINDOW_HEIGHT = Math.round(MINIMUM_WINDOW_WIDTH / APP_ASPECT_RATIO);

function toggleFullscreenWindow(targetWindow) {
  const nextState = !targetWindow.isFullScreen();
  targetWindow.setFullScreen(nextState);
  return nextState;
}

module.exports = {
  APP_ASPECT_RATIO,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MINIMUM_WINDOW_HEIGHT,
  MINIMUM_WINDOW_WIDTH,
  toggleFullscreenWindow,
};
