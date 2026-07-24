import React from "react";
import { createRoot } from "react-dom/client";
import { DesktopWindowChrome } from "./DesktopWindowChrome.jsx";
import "./desktop-window.css";

const examMode = window.location.pathname.toLowerCase().startsWith("/exam");
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
      <App />
    </React.StrictMode>,
  );
});
