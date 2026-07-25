const loaders = {
  3: () => import("../../content/naplan-bank/questions/year-3.jsonl?raw"),
  5: () => import("../../content/naplan-bank/questions/year-5.jsonl?raw"),
  7: () => import("../../content/naplan-bank/questions/year-7.jsonl?raw"),
  9: () => import("../../content/naplan-bank/questions/year-9.jsonl?raw"),
};

const domainKeys = {
  Reading: "reading",
  Writing: "writing",
  "Conventions of language": "conventions_of_language",
  Numeracy: "numeracy",
};

const testLengths = {
  Reading: { 3: 39, 5: 39, 7: 48, 9: 48 },
  Writing: { 3: 1, 5: 1, 7: 1, 9: 1 },
  "Conventions of language": { 3: 52, 5: 52, 7: 52, 9: 52 },
  Numeracy: { 3: 36, 5: 42, 7: 48, 9: 48 },
};

const yearDifficultyMix = {
  3: { easy: 0.38, medium: 0.45, hard: 0.17 },
  5: { easy: 0.32, medium: 0.46, hard: 0.22 },
  7: { easy: 0.27, medium: 0.46, hard: 0.27 },
  9: { easy: 0.22, medium: 0.45, hard: 0.33 },
};

const numeracyStrandTargets = {
  3: { number: 26, measurement: 7, space: 3 },
  5: { number: 26, measurement: 10, space: 3, probability: 3 },
  7: { number: 20, measurement: 10, space: 7, probability: 7, algebra: 4 },
  9: { number: 20, measurement: 14, space: 10, statistics: 4 },
};

const cache = new Map();

function seededShuffle(values, seed) {
  const output = [...values];
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  for (let index = output.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [output[index], output[next]] = [output[next], output[index]];
  }
  return output;
}

function demoTypeOf(item) {
  return item.tags?.find((tag) => /^Y[3579]-\d{2}-/.test(tag)) ?? item.skill ?? item.id;
}

function diversePick(items, count, seed) {
  const groups = new Map();
  for (const item of seededShuffle(items, seed)) {
    const key = demoTypeOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const queues = seededShuffle([...groups.values()], seed + 19);
  const selected = [];
  let cursor = 0;
  while (selected.length < count && queues.some((queue) => queue.length > 0)) {
    const queue = queues[cursor % queues.length];
    if (queue.length > 0) selected.push(queue.shift());
    cursor += 1;
  }
  return selected;
}

export function spreadNumeracyDemoTypes(items, seed) {
  const groups = new Map();
  for (const item of seededShuffle(items, seed)) {
    const key = demoTypeOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let activeGroups = seededShuffle(
    [...groups.entries()].map(([key, queue]) => ({ key, queue })),
    seed + 13,
  );
  const ordered = [];
  let previousType = null;
  let round = 0;

  while (activeGroups.length > 0) {
    let roundGroups = seededShuffle(activeGroups, seed + 101 + round * 37);
    if (roundGroups.length > 1 && roundGroups[0].key === previousType) {
      roundGroups = [...roundGroups.slice(1), roundGroups[0]];
    }

    for (const group of roundGroups) {
      const next = group.queue.shift();
      if (!next) continue;
      ordered.push(next);
      previousType = group.key;
    }

    activeGroups = activeGroups.filter((group) => group.queue.length > 0);
    round += 1;
  }

  return ordered;
}

function balancedPick(items, count, seed, year) {
  const mix = yearDifficultyMix[year] ?? yearDifficultyMix[5];
  const targets = {
    easy: Math.round(count * mix.easy),
    medium: Math.round(count * mix.medium),
  };
  targets.hard = count - targets.easy - targets.medium;

  const selected = [];
  for (const [difficulty, target] of Object.entries(targets)) {
    selected.push(...diversePick(items.filter((item) => item.difficulty === difficulty), target, seed + target));
  }

  if (selected.length < count) {
    const selectedIds = new Set(selected.map((item) => item.id));
    selected.push(...diversePick(items.filter((item) => !selectedIds.has(item.id)), count - selected.length, seed + 97));
  }

  return spreadNumeracyDemoTypes(selected, seed + 211);
}

function pickReading(items, count, seed) {
  const passageGroups = new Map();
  for (const item of items) {
    const passageId = item.stimulus?.id;
    if (!passageGroups.has(passageId)) passageGroups.set(passageId, []);
    passageGroups.get(passageId).push(item);
  }

  const selected = [];
  for (const passage of seededShuffle([...passageGroups.values()], seed)) {
    const ordered = [...passage].sort((left, right) => left.id.localeCompare(right.id));
    selected.push(...ordered);
    if (selected.length >= count) break;
  }
  return selected.slice(0, count);
}

function pickConventions(items, seed, year) {
  const spelling = balancedPick(items.filter((item) => item.subdomain === "spelling"), 25, seed + 1, year);
  const grammar = balancedPick(items.filter((item) => item.subdomain === "grammar"), 18, seed + 2, year);
  const punctuation = balancedPick(items.filter((item) => item.subdomain === "punctuation"), 9, seed + 3, year);
  return {
    questions: [...spelling, ...seededShuffle([...grammar, ...punctuation], seed + 4)],
    sectionBreakAfter: 25,
  };
}

function pickNumeracy(items, year, count, seed) {
  const targets = numeracyStrandTargets[year];
  const stratifiedPick = (pool, strandTargets, strandSeed) => {
    const selected = [];
    for (const [strand, target] of Object.entries(strandTargets)) {
      if (target <= 0) continue;
      selected.push(...balancedPick(
        pool.filter((item) => item.subdomain === strand),
        target,
        strandSeed + strand.length * 31,
        year,
      ));
    }
    if (selected.length < Object.values(strandTargets).reduce((sum, value) => sum + value, 0)) {
      const selectedIds = new Set(selected.map((item) => item.id));
      const missing = Object.values(strandTargets).reduce((sum, value) => sum + value, 0) - selected.length;
      selected.push(...balancedPick(pool.filter((item) => !selectedIds.has(item.id)), missing, strandSeed + 701, year));
    }
    return spreadNumeracyDemoTypes(selected, strandSeed + 809);
  };

  if (year < 7) {
    return {
      questions: stratifiedPick(items.filter((item) => item.calculator !== "allowed"), targets, seed),
      sectionBreakAfter: null,
    };
  }

  const nonCalculatorCount = 8;
  const nonCalculatorTargets = year === 7
    ? { number: 6, probability: 2 }
    : { number: 8 };
  const nonCalculator = stratifiedPick(
    items.filter((item) => item.calculator === "not_allowed"),
    nonCalculatorTargets,
    seed + 1,
  );
  const selectedIds = new Set(nonCalculator.map((item) => item.id));
  const calculatorPool = items.filter((item) => !selectedIds.has(item.id) && item.calculator !== "not_allowed");
  const calculatorTargets = Object.fromEntries(Object.entries(targets).map(([strand, target]) => [
    strand,
    target - (nonCalculatorTargets[strand] ?? 0),
  ]));
  const calculator = stratifiedPick(calculatorPool, calculatorTargets, seed + 2);
  return {
    questions: [...nonCalculator, ...calculator],
    sectionBreakAfter: nonCalculatorCount,
  };
}

export async function loadPracticeTest({ year, domain, writingTask, formSeed = 0 }) {
  if (!loaders[year]) throw new Error(`No question bank is available for Year ${year}.`);

  if (!cache.has(year)) {
    const module = await loaders[year]();
    const parsed = module.default
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    cache.set(year, parsed);
  }

  const allItems = cache.get(year);
  const domainKey = domainKeys[domain];
  const items = allItems.filter((item) => item.domain === domainKey);
  const total = testLengths[domain][year];
  const seed = year * 1009 + domain.length * 97 + (Number(formSeed) || 0);

  if (domain === "Reading") {
    return { questions: pickReading(items, total, seed), sectionBreakAfter: null };
  }

  if (domain === "Conventions of language") {
    return pickConventions(items, seed, year);
  }

  if (domain === "Numeracy") {
    return pickNumeracy(items, year, total, seed);
  }

  const genre = writingTask === "Persuasive Task" ? "persuasive" : "narrative";
  const prompt = seededShuffle(items.filter((item) => item.subdomain === genre), seed)[0];
  return { questions: [prompt], sectionBreakAfter: null };
}

function responseIsComplete(item, response) {
  if (response === null || response === undefined || response === "") return false;
  if (item.answer.type === "multiple_select") {
    return Array.isArray(response) && response.length === item.answer.values.length;
  }
  if (item.answer.type === "drag_drop") {
    if (typeof response === "string") return (item.answer.targets?.length ?? 1) === 1;
    return response && typeof response === "object"
      && Object.keys(response).length === Object.keys(item.answer.placements ?? {}).length;
  }
  if (item.answer.type === "matrix") {
    return response && typeof response === "object" && !Array.isArray(response)
      && Object.keys(response).length === Object.keys(item.answer.values ?? {}).length;
  }
  if (item.answer.type === "text") return String(response).trim().length > 0;
  return true;
}

export function scorePracticeTest(questions, answers) {
  const rows = questions.map((item, index) => {
    const response = answers[index + 1];
    const complete = responseIsComplete(item, response);
    let correct = false;

    if (complete && item.answer.type === "single_choice") {
      correct = response === item.answer.value;
    } else if (complete && item.answer.type === "multiple_select") {
      const actual = Array.isArray(response) ? [...response].sort() : [];
      const expected = [...item.answer.values].sort();
      correct = actual.length === expected.length && actual.every((value, responseIndex) => value === expected[responseIndex]);
    } else if (complete && item.answer.type === "drag_drop") {
      const actual = typeof response === "string" ? { target_1: response } : (response ?? {});
      const expected = item.answer.placements;
      correct = Object.keys(expected).length === Object.keys(actual).length
        && Object.entries(expected).every(([target, value]) => actual[target] === value);
    } else if (complete && item.answer.type === "matrix") {
      const actual = response && typeof response === "object" && !Array.isArray(response) ? response : {};
      const expected = item.answer.values;
      correct = Object.keys(expected).length === Object.keys(actual).length
        && Object.entries(expected).every(([row, value]) => actual[row] === value);
    } else if (complete && item.answer.type === "text") {
      const normalized = String(response ?? "").trim().toLowerCase();
      correct = item.answer.accepted.includes(normalized);
    }

    const responseDisplay = Array.isArray(response)
      ? response.map((value) => item.options?.find((option) => option.id === value)?.text ?? value).join("; ")
      : response && typeof response === "object"
        ? Object.entries(response).map(([key, value]) => {
            const row = item.answer.rows?.find((candidate) => candidate.id === key)?.label ?? key;
            const option = item.options?.find((candidate) => candidate.id === value)?.text
              ?? item.answer.columns?.find((candidate) => candidate.id === value)?.label
              ?? value;
            return `${row}: ${option}`;
          }).join("; ")
        : item.options?.find((option) => option.id === response)?.text ?? response ?? null;

    return {
      id: item.id,
      number: index + 1,
      prompt: item.prompt,
      subdomain: item.subdomain,
      correct,
      points: correct ? 1 : 0,
      maxPoints: item.scoring?.max_score ?? 1,
      response: response ?? null,
      responseDisplay,
      answer: item.answer.display ?? item.answer.value ?? null,
      explanation: item.explanation,
      difficulty: item.difficulty,
      absoluteComplexity: item.difficulty_model?.absolute_complexity ?? null,
      pathwayBand: item.pathway_band,
      skill: item.skill,
      complete,
    };
  });

  return {
    correct: rows.filter((row) => row.correct).length,
    total: rows.length,
    rawPoints: rows.reduce((sum, row) => sum + row.points, 0),
    maxRawPoints: rows.reduce((sum, row) => sum + row.maxPoints, 0),
    unanswered: rows.filter((row) => !row.complete).length,
    rows,
  };
}

function summariseRows(rows) {
  const total = rows.reduce((sum, row) => sum + (Number(row.maxPoints) || 0), 0);
  const correct = rows.reduce((sum, row) => sum + (Number(row.points) || 0), 0);
  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : null,
  };
}

function buildScoreBreakdown(domain, result) {
  if (!result?.rows?.length) return null;
  if (domain === "Reading" || domain === "Numeracy") {
    return { [domain]: summariseRows(result.rows) };
  }
  if (domain === "Conventions of language") {
    return {
      Spelling: summariseRows(result.rows.filter((row) => row.subdomain === "spelling")),
      "Grammar & Punctuation": summariseRows(
        result.rows.filter((row) => ["grammar", "punctuation"].includes(row.subdomain)),
      ),
    };
  }
  return null;
}

export function savePracticeSubmission({
  year,
  domain,
  writingTask,
  questions,
  result,
  writingResponse,
  durationSeconds = 0,
}) {
  const completedAt = new Date().toISOString();
  const writingItem = domain === "Writing" ? questions[0] : null;
  const safeDurationSeconds = Math.max(0, Math.round(Number(durationSeconds) || 0));
  const record = {
    id: `${completedAt}-${year}-${domain}`,
    completed_at: completedAt,
    duration_seconds: safeDurationSeconds,
    year_level: year,
    domain,
    writing_task: domain === "Writing" ? writingTask : null,
    question_count: questions.length,
    correct: result?.correct ?? null,
    percentage: result ? Math.round((result.correct / result.total) * 100) : null,
    unanswered: result?.unanswered ?? null,
    score_breakdown: buildScoreBreakdown(domain, result),
    writing: writingItem
      ? {
          prompt_id: writingItem.id,
          title: writingItem.stimulus?.title,
          genre: writingItem.subdomain,
          prompt: writingItem.prompt,
          prompt_context: writingItem.stimulus?.context,
          idea_starters: writingItem.stimulus?.idea_starters ?? [],
          prompt_instructions: [
            writingItem.prompt,
            writingItem.stimulus?.context,
            writingItem.stimulus?.instructions,
            writingItem.stimulus?.idea_starters?.length
              ? `Think about:\n${writingItem.stimulus.idea_starters.map((idea) => `- ${idea}`).join("\n")}`
              : null,
          ].filter(Boolean).join("\n\n"),
          prompt_image: writingItem.stimulus?.image?.src ?? null,
          response: writingResponse,
          word_count: writingResponse.trim().split(/\s+/).filter(Boolean).length,
          maximum_score: writingItem.answer.maximum_score,
          entry_method: Number(year) === 3 ? "parent_transcription" : "student_typed",
          status: "awaiting_ai_review",
        }
      : null,
    mistakes: result
      ? result.rows.filter((row) => (
          !row.correct
          && row.response !== null
          && row.response !== undefined
          && String(row.response).trim() !== ""
        )).map((row) => ({
          ...row,
          year_level: year,
          domain,
        }))
      : [],
  };

  let history = [];
  try {
    history = JSON.parse(window.localStorage.getItem("naplan-practice-history") || "[]");
  } catch {
    history = [];
  }
  window.localStorage.setItem("naplan-practice-history", JSON.stringify([record, ...history].slice(0, 50)));
  window.localStorage.setItem("naplan-practice-latest", JSON.stringify(record));
  return record;
}
