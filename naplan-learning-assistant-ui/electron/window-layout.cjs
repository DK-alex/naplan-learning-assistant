const APP_ASPECT_RATIO = 16 / 9;
const DEFAULT_WINDOW_WIDTH = 1440;
const DEFAULT_WINDOW_HEIGHT = Math.round(DEFAULT_WINDOW_WIDTH / APP_ASPECT_RATIO);
const MINIMUM_WINDOW_WIDTH = 1024;
const MINIMUM_WINDOW_HEIGHT = Math.round(MINIMUM_WINDOW_WIDTH / APP_ASPECT_RATIO);

function fitAspectRatioWithin(bounds, aspectRatio = APP_ASPECT_RATIO) {
  let width = bounds.width;
  let height = Math.floor(width / aspectRatio);

  if (height > bounds.height) {
    height = bounds.height;
    width = Math.floor(height * aspectRatio);
  }

  return {
    x: bounds.x + Math.floor((bounds.width - width) / 2),
    y: bounds.y + Math.floor((bounds.height - height) / 2),
    width,
    height,
  };
}

module.exports = {
  APP_ASPECT_RATIO,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MINIMUM_WINDOW_HEIGHT,
  MINIMUM_WINDOW_WIDTH,
  fitAspectRatioWithin,
};
