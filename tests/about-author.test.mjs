import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appPath = fileURLToPath(new URL("../src/App.jsx", import.meta.url));
const i18nPath = fileURLToPath(new URL("../src/i18n.jsx", import.meta.url));
const portraitPath = fileURLToPath(new URL("../public/assets/about-william-and-dad.png", import.meta.url));

test("settings provides an accessible about-author dialog with the supplied portrait", () => {
  const source = readFileSync(appPath, "utf8");

  assert.match(source, /title === "设置"/);
  assert.match(source, /className="feature-header-action"/);
  assert.match(source, /function AboutAuthorModal/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-labelledby="about-author-title"/);
  assert.match(source, /\/assets\/about-william-and-dad\.png/);
  assert.match(source, /William 的爸爸/);
  assert.equal(existsSync(portraitPath), true);
});

test("about-author copy is localised for every supported non-default interface language", () => {
  const source = readFileSync(i18nPath, "utf8");

  assert.match(source, /"关于作者": "About the author"/);
  assert.match(source, /"关于作者": "關於作者"/);
  assert.match(source, /"关于作者": "작가 소개"/);
});
