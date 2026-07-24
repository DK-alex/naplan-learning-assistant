#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const workerAi = path.join(root, "worker", "ai.js");
const sharedAiConfig = path.join(root, "shared", "ai-config.js");
const sharedWritingContract = path.join(root, "shared", "writing-review-contract.js");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, workerAi, sharedAiConfig, sharedWritingContract, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, "shared"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(workerAi, path.join(dist, "server", "ai.js"));
copyFileSync(sharedAiConfig, path.join(dist, "shared", "ai-config.js"));
copyFileSync(sharedWritingContract, path.join(dist, "shared", "writing-review-contract.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
