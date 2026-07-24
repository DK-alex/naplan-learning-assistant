import assert from "node:assert/strict";
import test from "node:test";

import { calculateDomainProgress } from "../src/data/domain-progress.js";

test("domain progress uses the latest real result for each reporting area", () => {
  const history = [
    {
      completed_at: "2026-07-24T10:00:00Z",
      domain: "Conventions of language",
      score_breakdown: {
        Spelling: { percentage: 64 },
        "Grammar & Punctuation": { percentage: 71 },
      },
    },
    {
      completed_at: "2026-07-24T10:30:00Z",
      domain: "Conventions of language",
      score_breakdown: {
        Spelling: { percentage: 80 },
        "Grammar & Punctuation": { percentage: null },
      },
    },
    {
      completed_at: "2026-07-24T09:00:00Z",
      domain: "Reading",
      percentage: 78,
    },
    {
      completed_at: "2026-07-24T08:00:00Z",
      domain: "Numeracy",
      percentage: 83,
    },
    {
      completed_at: "2026-07-20T08:00:00Z",
      domain: "Reading",
      percentage: 42,
    },
  ];
  const writingReports = [
    {
      generated_at: "2026-07-24T11:00:00Z",
      report: { total_score: 35, maximum_score: 47 },
    },
    {
      generated_at: "2026-07-19T11:00:00Z",
      report: { total_score: 20, maximum_score: 47 },
    },
  ];

  assert.deepEqual(calculateDomainProgress(history, writingReports), {
    Writing: 74,
    Reading: 78,
    Spelling: 80,
    "Grammar & Punctuation": 71,
    Numeracy: 83,
  });
});

test("domain progress returns no value when trustworthy data is unavailable", () => {
  assert.deepEqual(calculateDomainProgress([], []), {
    Writing: null,
    Reading: null,
    Spelling: null,
    "Grammar & Punctuation": null,
    Numeracy: null,
  });

  const legacyConventions = [{
    completed_at: "2026-07-24T10:00:00Z",
    domain: "Conventions of language",
    percentage: 75,
  }];
  assert.equal(calculateDomainProgress(legacyConventions, []).Spelling, null);
  assert.equal(calculateDomainProgress(legacyConventions, [])["Grammar & Punctuation"], null);

  const unscoredWriting = [{
    generated_at: "2026-07-24T11:00:00Z",
    report: { total_score: null, maximum_score: 47 },
  }];
  assert.equal(calculateDomainProgress([], unscoredWriting).Writing, null);
});
