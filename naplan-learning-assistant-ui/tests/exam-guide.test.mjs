import assert from "node:assert/strict";
import test from "node:test";
import { getExamGuide } from "../src/data/exam-guide.js";

const languages = ["zh-CN", "en", "zh-TW", "ko"];
const officialHosts = new Set(["www.nap.edu.au", "nap.edu.au"]);

test("official resource library has complete copy in all four languages", () => {
  const resourceIds = getExamGuide("en").resources.items.map((item) => item.id);
  assert.equal(resourceIds.length, 9);

  for (const language of languages) {
    const resources = getExamGuide(language).resources;
    assert.deepEqual(resources.items.map((item) => item.id), resourceIds);
    assert.ok(resources.languageTitle);
    assert.ok(resources.languageBody);
    assert.ok(resources.officialOriginal);

    for (const resource of resources.items) {
      assert.ok(resource.title);
      assert.ok(resource.description);
      assert.ok(resource.officialTitle);
      assert.ok(resource.publisher);
      assert.ok(["web", "pdf"].includes(resource.type));
      const url = new URL(resource.url);
      assert.equal(url.protocol, "https:");
      assert.ok(officialHosts.has(url.hostname), `${resource.id} must use an official NAP host`);
    }
  }
});

test("official resource cards preserve the English source title and direct source URL", () => {
  const resources = getExamGuide("zh-CN").resources.items;
  const framework = resources.find((item) => item.id === "framework");
  assert.equal(framework.officialTitle, "NAPLAN Assessment Framework");
  assert.equal(
    framework.url,
    "https://www.nap.edu.au/docs/default-source/naplan/naplan-assessment-framework.pdf",
  );
  assert.equal(framework.type, "pdf");
});

