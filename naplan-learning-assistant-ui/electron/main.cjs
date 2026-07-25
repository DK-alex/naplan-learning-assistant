const { app, BrowserWindow, dialog, ipcMain, Menu, screen, shell } = require("electron");
const { createReadStream, promises: fs } = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  APP_ASPECT_RATIO,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MINIMUM_WINDOW_HEIGHT,
  MINIMUM_WINDOW_WIDTH,
  fitAspectRatioWithin,
} = require("./window-layout.cjs");
const {
  classifyOfficialPdfPolicy,
  fetchOfficialPdf,
  translateOfficialPdfStrings,
} = require("./official-pdf.cjs");

const APP_PORT = 37821;
const APP_ORIGIN = `http://127.0.0.1:${APP_PORT}`;
const CLIENT_ROOT = path.join(__dirname, "..", "dist", "client");
const INDEX_FILE = path.join(CLIENT_ROOT, "index.html");
const ICON_FILE = path.join(__dirname, "..", "packaging", "icons", "app-icon.ico");
const MAX_API_BODY_BYTES = 150_000;

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

let mainWindow;
let localServer;
let aiHandlerPromise;
let restoredMainWindowBounds;
let isAspectMaximized = false;

function getAiHandler() {
  if (!aiHandlerPromise) {
    const moduleUrl = pathToFileURL(path.join(__dirname, "..", "worker", "ai.js")).href;
    aiHandlerPromise = import(moduleUrl).then((module) => module.handleAiReviewRequest);
  }
  return aiHandlerPromise;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_API_BODY_BYTES) throw new Error("REQUEST_TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function serveAiRequest(request, response) {
  let body;
  try {
    body = await readRequestBody(request);
  } catch {
    sendJson(response, 413, {
      error: { code: "REQUEST_TOO_LARGE", message: "The review request is too large." },
    });
    return;
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }

  const webRequest = new Request(`${APP_ORIGIN}${request.url}`, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
  });

  try {
    const handleAiReviewRequest = await getAiHandler();
    const webResponse = await handleAiReviewRequest(webRequest);
    const responseHeaders = {};
    webResponse.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    response.writeHead(webResponse.status, responseHeaders);
    response.end(Buffer.from(await webResponse.arrayBuffer()));
  } catch {
    sendJson(response, 500, {
      error: { code: "LOCAL_SERVICE_ERROR", message: "The local review service could not start." },
    });
  }
}

function mapOfficialPdfError(error) {
  const code = error?.code || error?.message || "PDF_SERVICE_ERROR";
  if (code === "PDF_TRANSLATION_NOT_PERMITTED") {
    return {
      status: 451,
      payload: {
        error: {
          code,
          message: "This official PDF can be shown in its original form but cannot be adapted or translated.",
        },
        policy: error.policy,
      },
    };
  }
  if (
    [
      "INVALID_PDF_URL",
      "PDF_SOURCE_NOT_ALLOWED",
      "PDF_SOURCE_NOT_PDF",
      "TRANSLATION_INPUT_INVALID",
      "TRANSLATION_INPUT_TOO_LARGE",
      "TRANSLATION_TARGET_INVALID",
    ].includes(code)
  ) {
    return {
      status: 400,
      payload: { error: { code, message: "The official PDF request is invalid." } },
    };
  }
  if (code === "PDF_TOO_LARGE") {
    return {
      status: 413,
      payload: { error: { code, message: "The official PDF is too large to open safely in the app." } },
    };
  }
  return {
    status: 502,
    payload: {
      error: {
        code,
        message: "The official PDF could not be retrieved or translated. Check the internet connection and try again.",
      },
    },
  };
}

async function serveOfficialPdfMeta(response, url) {
  try {
    sendJson(response, 200, classifyOfficialPdfPolicy(
      url.searchParams.get("url") || "",
      url.searchParams.get("title") || "",
    ));
  } catch (error) {
    const mapped = mapOfficialPdfError(error);
    sendJson(response, mapped.status, mapped.payload);
  }
}

async function serveOfficialPdf(request, response, url) {
  if (!["GET", "HEAD"].includes(request.method)) {
    sendJson(response, 405, {
      error: { code: "METHOD_NOT_ALLOWED", message: "Only GET and HEAD are supported." },
    });
    return;
  }
  try {
    const { buffer, sourceUrl } = await fetchOfficialPdf(
      url.searchParams.get("url") || "",
    );
    response.writeHead(200, {
      "content-type": "application/pdf",
      "content-length": buffer.length,
      "content-disposition": "inline",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-naplan-pdf-source": encodeURIComponent(sourceUrl),
    });
    if (request.method === "HEAD") response.end();
    else response.end(buffer);
  } catch (error) {
    const mapped = mapOfficialPdfError(error);
    sendJson(response, mapped.status, mapped.payload);
  }
}

async function serveOfficialPdfTranslation(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, {
      error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." },
    });
    return;
  }

  let body;
  try {
    body = JSON.parse((await readRequestBody(request)).toString("utf8"));
  } catch (error) {
    const mapped = mapOfficialPdfError(
      error?.message === "REQUEST_TOO_LARGE"
        ? Object.assign(new Error("TRANSLATION_INPUT_TOO_LARGE"), { code: "TRANSLATION_INPUT_TOO_LARGE" })
        : new Error("TRANSLATION_INPUT_INVALID"),
    );
    sendJson(response, mapped.status, mapped.payload);
    return;
  }

  try {
    sendJson(response, 200, await translateOfficialPdfStrings(body));
  } catch (error) {
    const mapped = mapOfficialPdfError(error);
    sendJson(response, mapped.status, mapped.payload);
  }
}

function resolveStaticFile(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const candidate = path.resolve(CLIENT_ROOT, relativePath);
  const allowedPrefix = `${path.resolve(CLIENT_ROOT)}${path.sep}`;
  return candidate.startsWith(allowedPrefix) ? candidate : null;
}

async function serveStaticRequest(request, response, url) {
  const candidate = resolveStaticFile(url.pathname);
  const acceptsHtml = String(request.headers.accept || "").includes("text/html");
  let filePath = candidate;

  try {
    if (!filePath || !(await fs.stat(filePath)).isFile()) {
      if (!acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      filePath = INDEX_FILE;
    }
  } catch {
    if (!acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    filePath = INDEX_FILE;
  }

  const extension = path.extname(filePath).toLowerCase();
  const immutableAsset = filePath.includes(`${path.sep}assets${path.sep}`);
  response.writeHead(200, {
    "content-type": CONTENT_TYPES[extension] || "application/octet-stream",
    "cache-control": immutableAsset ? "public, max-age=31536000, immutable" : "no-cache",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

async function handleLocalRequest(request, response) {
  const url = new URL(request.url, APP_ORIGIN);
  if (url.pathname === "/api/ai/review") {
    await serveAiRequest(request, response);
    return;
  }
  if (url.pathname === "/api/official-pdf/meta") {
    await serveOfficialPdfMeta(response, url);
    return;
  }
  if (url.pathname === "/api/official-pdf/translate") {
    await serveOfficialPdfTranslation(request, response);
    return;
  }
  if (url.pathname === "/api/official-pdf") {
    await serveOfficialPdf(request, response, url);
    return;
  }
  await serveStaticRequest(request, response, url);
}

function startLocalServer() {
  return new Promise((resolve, reject) => {
    localServer = http.createServer((request, response) => {
      handleLocalRequest(request, response).catch(() => {
        if (!response.headersSent) response.writeHead(500);
        response.end("Local application error");
      });
    });
    localServer.once("error", reject);
    localServer.listen(APP_PORT, "127.0.0.1", resolve);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: MINIMUM_WINDOW_WIDTH,
    minHeight: MINIMUM_WINDOW_HEIGHT,
    show: false,
    frame: false,
    roundedCorners: false,
    autoHideMenuBar: true,
    title: "NAPLAN Learning Assistant",
    icon: ICON_FILE,
    backgroundColor: "#f4f7fb",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.setAspectRatio(APP_ASPECT_RATIO);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  mainWindow.loadURL(APP_ORIGIN);
}

Menu.setApplicationMenu(null);

ipcMain.on("desktop-window:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on("desktop-window:toggle-maximize", (event) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  if (!targetWindow) return;
  if (targetWindow.isFullScreen()) {
    targetWindow.setFullScreen(false);
    return;
  }
  if (isAspectMaximized && restoredMainWindowBounds) {
    targetWindow.setBounds(restoredMainWindowBounds, true);
    restoredMainWindowBounds = undefined;
    isAspectMaximized = false;
    return;
  }

  restoredMainWindowBounds = targetWindow.getBounds();
  const display = screen.getDisplayMatching(restoredMainWindowBounds);
  targetWindow.setBounds(fitAspectRatioWithin(display.workArea), true);
  isAspectMaximized = true;
});

ipcMain.on("desktop-window:set-exam-mode", (event, enabled) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  if (!targetWindow || targetWindow.isFullScreen() === enabled) return;
  targetWindow.setFullScreen(enabled);
});

ipcMain.on("desktop-window:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    try {
      await startLocalServer();
      createMainWindow();
    } catch {
      dialog.showErrorBox(
        "NAPLAN Learning Assistant",
        "The local application service could not start. Please close other copies and try again.",
      );
      app.quit();
    }
  });

  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => localServer?.close());
}
