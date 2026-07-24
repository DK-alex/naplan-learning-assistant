import React from "react";
import { createRoot } from "react-dom/client";
import { DesktopAppCanvas } from "./DesktopAppCanvas.jsx";
import { DesktopWindowChrome } from "./DesktopWindowChrome.jsx";
import "./desktop-window.css";

const examMode = window.location.pathname.toLowerCase().startsWith("/exam");
const desktopCanvasMode = Boolean(window.desktopWindow) && !examMode;
document.documentElement.classList.toggle("desktop-fixed-canvas", desktopCanvasMode);
window.desktopWindow?.setExamMode(examMode);
const appModules = Promise.all(
  examMode
    ? [
        import("../../naplan-ui-clone/src/App.jsx"),
        import("../../naplan-ui-clone/src/styles.css"),
      ]
    : [
        import("./App.jsx"),
        import("./styles.css"),
      ],
);

appModules.then(([{ App }]) => {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <DesktopWindowChrome />
      {desktopCanvasMode ? (
        <DesktopAppCanvas>
          <App />
        </DesktopAppCanvas>
      ) : (
        <App />
      )}
    </React.StrictMode>,
  );
});
