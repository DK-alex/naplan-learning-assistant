const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopWindow", {
  minimize() {
    ipcRenderer.send("desktop-window:minimize");
  },
  toggleMaximize() {
    ipcRenderer.send("desktop-window:toggle-maximize");
  },
  setExamMode(enabled) {
    ipcRenderer.send("desktop-window:set-exam-mode", Boolean(enabled));
  },
  close() {
    ipcRenderer.send("desktop-window:close");
  },
});
