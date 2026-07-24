import test from "node:test";
import assert from "node:assert/strict";

import { savePracticeSubmission } from "../src/questionBank.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function writingQuestion() {
  return {
    id: "year3-writing-narrative-1",
    subdomain: "narrative",
    prompt: "Write a narrative titled “The Unexpected Map”.",
    stimulus: {
      title: "The Unexpected Map",
      instructions: "Create characters, a setting and a complication.",
    },
    answer: { maximum_score: 47 },
  };
}

test("Year 3 writing is stored as a parent transcription of a paper response", () => {
  globalThis.window = { localStorage: createStorage() };

  const record = savePracticeSubmission({
    year: 3,
    domain: "Writing",
    writingTask: "Narrative Task",
    questions: [writingQuestion()],
    result: null,
    writingResponse: "One day i found a map.",
    durationSeconds: 2400,
  });

  assert.equal(record.year_level, 3);
  assert.equal(record.writing.entry_method, "parent_transcription");
  assert.equal(record.writing.word_count, 6);
  assert.equal(record.duration_seconds, 2400);
});

test("Online writing in later year levels remains student typed", () => {
  globalThis.window = { localStorage: createStorage() };

  const record = savePracticeSubmission({
    year: 5,
    domain: "Writing",
    writingTask: "Narrative Task",
    questions: [writingQuestion()],
    result: null,
    writingResponse: "A student typed response.",
  });

  assert.equal(record.writing.entry_method, "student_typed");
});
