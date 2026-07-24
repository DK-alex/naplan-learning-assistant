const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopWindow", {
  minimize() {
    ipcRenderer.send("desktop-window:minimize");
  },
  toggleMaximize() {
    ipcRenderer.send("desktop-window:toggle-maximize");
  },
  close() {
    ipcRenderer.send("desktop-window:close");
  },
});
