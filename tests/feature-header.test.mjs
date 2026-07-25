import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const appPath = fileURLToPath(new URL("../src/App.jsx", import.meta.url));

test("feature pages rely on the persistent sidebar instead of a back-to-home button", () => {
  const source = readFileSync(appPath, "utf8");
  const featureHeader = source.match(/function FeatureHeader[\s\S]*?function ScheduleWorkspace/)?.[0] ?? "";

  assert.doesNotMatch(featureHeader, /feature-back/);
  assert.match(source, /<FeatureHeader title=\{active\} description=\{descriptions\[active\]\} \/>/);
  assert.match(source, /className="feature-back inline-back"/);
});
