import { useEffect, useState } from "react";

const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 900;

function readViewport() {
  return {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
  };
}

export function DesktopAppCanvas({ children }) {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const updateViewport = () => setViewport(readViewport());
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const scale = Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT);
  const frameWidth = DESIGN_WIDTH * scale;
  const frameHeight = DESIGN_HEIGHT * scale;

  return (
    <div className="desktop-app-viewport">
      <div
        className="desktop-app-frame"
        style={{ width: `${frameWidth}px`, height: `${frameHeight}px` }}
      >
        <div
          className="desktop-app-canvas"
          style={{
            width: `${DESIGN_WIDTH}px`,
            height: `${DESIGN_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
