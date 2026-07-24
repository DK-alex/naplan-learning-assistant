import test from "node:test";
import assert from "node:assert/strict";

import { scorePracticeTest } from "../src/questionBank.js";
import {
  clearActivePracticeSession,
  practiceProgressKey,
  practiceSessionId,
  readActivePracticeSession,
  readLivePracticeMistakes,
  replaceLivePracticeMistakes,
  saveActivePracticeSession,
} from "../src/practiceSession.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test("unfinished practice sessions can be bookmarked and cleared", () => {
  const storage = memoryStorage();
  saveActivePracticeSession({
    year: 5,
    domain: "Reading",
    writingTask: "Narrative Task",
    formSeed: 271828,
  }, storage);

  assert.deepEqual(
    {
      year: readActivePracticeSession(storage).year,
      domain: readActivePracticeSession(storage).domain,
      formSeed: readActivePracticeSession(storage).formSeed,
    },
    { year: 5, domain: "Reading", formSeed: 271828 },
  );
  assert.equal(practiceProgressKey(5, "Reading"), "naplan-practice:5:Reading:");

  clearActivePracticeSession(storage);
  assert.equal(readActivePracticeSession(storage), null);
});

test("live mistake replacement removes a question after it is corrected", () => {
  const storage = memoryStorage();
  const sessionId = practiceSessionId(3, "Numeracy");
  replaceLivePracticeMistakes(sessionId, [{ id: "n-1", response: "B", correct: false }], storage);
  assert.equal(readLivePracticeMistakes(storage).length, 1);

  replaceLivePracticeMistakes(sessionId, [], storage);
  assert.deepEqual(readLivePracticeMistakes(storage), []);
});

test("scoring immediately reflects answer changes", () => {
  const questions = [{
    id: "read-1",
    prompt: "Choose the answer.",
    subdomain: "reading",
    item_type: "multiple_choice",
    options: [{ id: "A", text: "First" }, { id: "B", text: "Second" }],
    answer: { type: "single_choice", value: "B", display: "Second" },
    explanation: "B is supported by the text.",
    difficulty: "easy",
    skill: "literal comprehension",
  }];

  assert.equal(scorePracticeTest(questions, { 1: "A" }).correct, 0);
  assert.equal(scorePracticeTest(questions, { 1: "B" }).correct, 1);
});

test("scoring supports the rebuilt interactive response types", () => {
  const questions = [
    {
      id: "read-multi",
      prompt: "Choose two details.",
      subdomain: "reading",
      item_type: "multiple_select",
      options: [
        { id: "A", text: "First detail" },
        { id: "B", text: "Second detail" },
        { id: "C", text: "Third detail" },
      ],
      answer: { type: "multiple_select", values: ["A", "C"], display: "First detail; Third detail" },
      explanation: "Both details are supported.",
      difficulty: "medium",
      skill: "evidence",
    },
    {
      id: "read-drag",
      prompt: "Order the events.",
      subdomain: "reading",
      item_type: "drag_and_drop",
      options: [{ id: "A", text: "Last" }, { id: "B", text: "First" }, { id: "C", text: "Next" }],
      answer: {
        type: "drag_drop",
        targets: [
          { id: "position_1", label: "First" },
          { id: "position_2", label: "Next" },
          { id: "position_3", label: "Last" },
        ],
        placements: { position_1: "B", position_2: "C", position_3: "A" },
        display: "First; Next; Last",
      },
      explanation: "The cards follow the passage sequence.",
      difficulty: "medium",
      skill: "summarising",
    },
    {
      id: "num-matrix",
      prompt: "Classify each event.",
      subdomain: "chance",
      item_type: "matrix",
      options: [],
      answer: {
        type: "matrix",
        rows: [{ id: "r1", label: "Event 1" }, { id: "r2", label: "Event 2" }],
        columns: [{ id: "likely", label: "Likely" }, { id: "unlikely", label: "Unlikely" }],
        values: { r1: "likely", r2: "unlikely" },
        display: "Event 1: Likely; Event 2: Unlikely",
      },
      explanation: "The events have different likelihoods.",
      difficulty: "hard",
      skill: "probability",
    },
    {
      id: "num-text",
      prompt: "Enter the angle.",
      subdomain: "measurement",
      item_type: "text_entry",
      options: [],
      answer: { type: "text", accepted: ["50", "50°"], display: "50°" },
      explanation: "The angle is 50 degrees.",
      difficulty: "hard",
      skill: "angle measurement",
    },
  ];

  const correct = scorePracticeTest(questions, {
    1: ["C", "A"],
    2: { position_1: "B", position_2: "C", position_3: "A" },
    3: { r1: "likely", r2: "unlikely" },
    4: "50°",
  });
  assert.equal(correct.correct, 4);
  assert.equal(correct.rawPoints, 4);
  assert.equal(correct.unanswered, 0);

  const partial = scorePracticeTest(questions, {
    1: ["A"],
    2: { position_1: "B", position_2: "A" },
    3: { r1: "likely" },
    4: "",
  });
  assert.equal(partial.correct, 0);
  assert.equal(partial.unanswered, 4);
  assert.ok(partial.rows.every((row) => row.complete === false));
});
