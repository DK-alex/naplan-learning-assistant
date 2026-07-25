const os = require("node:os");

const APP_ASPECT_RATIO = 16 / 9;
const DEFAULT_WINDOW_WIDTH = 1440;
const DEFAULT_WINDOW_HEIGHT = Math.round(DEFAULT_WINDOW_WIDTH / APP_ASPECT_RATIO);
const MINIMUM_WINDOW_WIDTH = 1024;
const MINIMUM_WINDOW_HEIGHT = Math.round(MINIMUM_WINDOW_WIDTH / APP_ASPECT_RATIO);
const RESTORED_WINDOW_CORNER_RADIUS = 14;

function isNativeRoundedWindowSupported(
  platform = process.platform,
  release = os.release(),
) {
  if (platform !== "win32") return true;
  const windowsBuild = Number.parseInt(String(release).split(".")[2] || "0", 10);
  return Number.isFinite(windowsBuild) && windowsBuild >= 22000;
}

function buildRoundedWindowShape(
  width,
  height,
  radius = RESTORED_WINDOW_CORNER_RADIUS,
) {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const safeRadius = Math.max(
    0,
    Math.min(Math.floor(radius), Math.floor(safeWidth / 2), Math.floor(safeHeight / 2)),
  );

  if (safeRadius === 0) {
    return [{ x: 0, y: 0, width: safeWidth, height: safeHeight }];
  }

  const topBands = [];
  let bandStart = 0;
  let bandInset = null;

  for (let y = 0; y < safeRadius; y += 1) {
    const distanceFromCentre = safeRadius - y - 0.5;
    const inset = Math.max(
      0,
      Math.ceil(
        safeRadius
        - Math.sqrt(Math.max(0, (safeRadius ** 2) - (distanceFromCentre ** 2))),
      ),
    );

    if (bandInset === null) {
      bandInset = inset;
      bandStart = y;
    } else if (inset !== bandInset) {
      topBands.push({
        x: bandInset,
        y: bandStart,
        width: safeWidth - (bandInset * 2),
        height: y - bandStart,
      });
      bandInset = inset;
      bandStart = y;
    }
  }

  topBands.push({
    x: bandInset,
    y: bandStart,
    width: safeWidth - (bandInset * 2),
    height: safeRadius - bandStart,
  });

  const shape = [...topBands];
  const middleHeight = safeHeight - (safeRadius * 2);
  if (middleHeight > 0) {
    shape.push({
      x: 0,
      y: safeRadius,
      width: safeWidth,
      height: middleHeight,
    });
  }

  for (let index = topBands.length - 1; index >= 0; index -= 1) {
    const band = topBands[index];
    shape.push({
      x: band.x,
      y: safeHeight - band.y - band.height,
      width: band.width,
      height: band.height,
    });
  }

  return shape;
}

function syncRoundedWindowShape(
  targetWindow,
  {
    platform = process.platform,
    release = os.release(),
    radius = RESTORED_WINDOW_CORNER_RADIUS,
  } = {},
) {
  if (
    platform !== "win32"
    || isNativeRoundedWindowSupported(platform, release)
    || typeof targetWindow?.setShape !== "function"
  ) {
    return false;
  }

  if (targetWindow.isFullScreen()) {
    targetWindow.setShape([]);
    return true;
  }

  const [width, height] = targetWindow.getSize();
  targetWindow.setShape(buildRoundedWindowShape(width, height, radius));
  return true;
}

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
  RESTORED_WINDOW_CORNER_RADIUS,
  buildRoundedWindowShape,
  isNativeRoundedWindowSupported,
  syncRoundedWindowShape,
  toggleFullscreenWindow,
};
