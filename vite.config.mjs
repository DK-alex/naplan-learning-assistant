import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleAiReviewRequest } from "./worker/ai.js";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function localAiReviewApi() {
  return {
    name: "local-ai-review-api",
    configureServer(server) {
      server.middlewares.use("/api/ai/review", async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
          else if (value !== undefined) headers.set(key, value);
        }
        const webRequest = new Request("http://localhost/api/ai/review", {
          method: request.method,
          headers,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
        });
        const webResponse = await handleAiReviewRequest(webRequest);
        response.statusCode = webResponse.status;
        webResponse.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await webResponse.arrayBuffer()));
      });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(projectRoot, "node_modules/react"),
      "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    fs: {
      allow: [path.resolve(projectRoot, "..")],
    },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), localAiReviewApi()],
});
