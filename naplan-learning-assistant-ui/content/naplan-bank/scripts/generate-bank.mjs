import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "questions");
const REPORTS = path.join(ROOT, "reports");
const YEARS = [3, 5, 7, 9];
const VERSION = "2026.2";

const OFFICIAL_ALIGNMENT = {
  framework: "https://nap.edu.au/docs/default-source/naplan/naplan-assessment-framework.pdf",
  tests: "https://www.nap.edu.au/naplan/whats-in-the-tests",
  demo: "https://www.nap.edu.au/naplan/public-demonstration-site",
  proficiency: "https://nap.edu.au/naplan/results-and-reports/proficiency-level-descriptions",
};

const YEAR_PROFILES = {
  3: {
    age_band: "8–9",
    curriculum_band: "Foundation–Year 3 consolidation",
    reading_passage_word_target: [65, 90],
    sentence_word_target: [6, 14],
    absolute_complexity: { easy: 1, medium: 2, hard: 3 },
    difficulty_mix: { easy: 0.38, medium: 0.45, hard: 0.17 },
    design_focus: {
      easy: "one explicit step with familiar language and representations",
      medium: "one or two connected steps with a clearly signposted inference",
      hard: "two connected steps or one less-explicit inference using Year 3 content",
    },
  },
  5: {
    age_band: "10–11",
    curriculum_band: "Years 3–5 consolidation",
    reading_passage_word_target: [110, 150],
    sentence_word_target: [8, 18],
    absolute_complexity: { easy: 3, medium: 4, hard: 5 },
    difficulty_mix: { easy: 0.32, medium: 0.46, hard: 0.22 },
    design_focus: {
      easy: "one step with familiar content and an explicit representation",
      medium: "two connected steps or a comparison across nearby information",
      hard: "multi-step reasoning, representation change or an implicit relationship",
    },
  },
  7: {
    age_band: "12–13",
    curriculum_band: "Years 5–7 consolidation",
    reading_passage_word_target: [145, 190],
    sentence_word_target: [11, 22],
    absolute_complexity: { easy: 5, medium: 6, hard: 7 },
    difficulty_mix: { easy: 0.27, medium: 0.46, hard: 0.27 },
    design_focus: {
      easy: "direct application of Year 7 content with limited competing information",
      medium: "two or three steps, proportional reasoning or evidence integration",
      hard: "multi-step modelling, qualification of evidence or a non-routine representation",
    },
  },
  9: {
    age_band: "14–15",
    curriculum_band: "Years 7–9 consolidation",
    reading_passage_word_target: [170, 220],
    sentence_word_target: [14, 26],
    absolute_complexity: { easy: 7, medium: 8, hard: 9 },
    difficulty_mix: { easy: 0.22, medium: 0.45, hard: 0.33 },
    design_focus: {
      easy: "direct use of Year 9 content with an explicit model or data source",
      medium: "multi-step reasoning across representations, evidence or constraints",
      hard: "non-routine modelling, competing interpretations or evaluation of limitations",
    },
  },
};

const TESTLET_ELIGIBILITY = {
  lower: ["B", "C"],
  average: ["A", "B", "E"],
  higher: ["A", "D", "F"],
};

const SPELLING_TESTLET_ELIGIBILITY = {
  lower: ["SA", "SB", "PB"],
  average: ["SA", "SB", "SD", "PB", "PD"],
  higher: ["SA", "SD", "PD"],
};

class Rng {
  constructor(seed) {
    this.state = seed >>> 0;
  }
  next() {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick(values) {
    return values[this.int(0, values.length - 1)];
  }
  shuffle(values) {
    const output = [...values];
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }
}

function difficultySequence(count, rng, year) {
  const mix = YEAR_PROFILES[year].difficulty_mix;
  const easy = Math.round(count * mix.easy);
  const medium = Math.round(count * mix.medium);
  const hard = count - easy - medium;
  return rng.shuffle([
    ...Array(easy).fill("easy"),
    ...Array(medium).fill("medium"),
    ...Array(hard).fill("hard"),
  ]);
}

function makeId(year, prefix, index) {
  return `Y${year}-${prefix}-${String(index + 1).padStart(4, "0")}`;
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value)))];
}

function difficultyModel(year, difficulty, domain) {
  if (difficulty === "not_applicable") {
    return {
      relative_band: "not_applicable",
      absolute_complexity: null,
      status: "not_applicable",
      rationale: "Writing prompts are common tasks and are not labelled easy, medium or hard.",
    };
  }
  const profile = YEAR_PROFILES[year];
  const cognitiveSteps = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  return {
    relative_band: difficulty,
    absolute_complexity: profile.absolute_complexity[difficulty],
    cognitive_steps: cognitiveSteps,
    curriculum_band: profile.curriculum_band,
    design_estimate: profile.design_focus[difficulty],
    status: "design_estimate_uncalibrated",
    calibration_version: null,
    domain,
  };
}

function pathwayBand(difficulty) {
  if (difficulty === "easy") return "lower";
  if (difficulty === "hard") return "higher";
  if (difficulty === "medium") return "average";
  return "not_applicable";
}

function interactionDefinition(itemType, answer, choices) {
  const base = {
    renderer: itemType,
    keyboard_complete: true,
    response_required: true,
  };
  if (answer?.type === "multiple_select") {
    return { ...base, min_selections: answer.values.length, max_selections: answer.values.length };
  }
  if (answer?.type === "drag_drop") {
    return {
      ...base,
      draggable_option_ids: (choices ?? []).map((choice) => choice.id),
      targets: answer.targets,
    };
  }
  if (answer?.type === "matrix") {
    return {
      ...base,
      rows: answer.rows,
      columns: answer.columns,
      one_response_per_row: true,
    };
  }
  return { ...base, min_selections: 1, max_selections: 1 };
}

function inferMedia(stimulus, toolPolicy) {
  const media = [];
  if (stimulus?.visual) {
    media.push({
      asset_id: stimulus.visual.asset_id,
      kind: stimulus.visual.kind,
      render_mode: stimulus.visual.render_mode ?? "svg",
      answer_critical: Boolean(stimulus.visual.answer_critical),
      original: true,
      alt_text: stimulus.visual.alt_text,
    });
  }
  if (stimulus?.type === "table") {
    media.push({
      asset_id: stimulus.asset_id ?? `${stimulus.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-table`,
      kind: "data_table",
      render_mode: "html",
      answer_critical: true,
      original: true,
      alt_text: stimulus.alt_text ?? stimulus.title,
    });
  }
  if (stimulus?.type === "audio_dictation_script") {
    media.push({
      asset_id: stimulus.asset_id ?? "generated-dictation-audio",
      kind: "audio",
      render_mode: "tts",
      answer_critical: true,
      original: true,
      alt_text: "Audio dictation with a text alternative item available.",
    });
  }
  if (toolPolicy?.ruler || toolPolicy?.protractor || toolPolicy?.calculator) {
    media.push({
      asset_id: "naplan-player-tools",
      kind: "interactive_tool",
      render_mode: "html",
      answer_critical: Boolean(toolPolicy.ruler || toolPolicy.protractor),
      original: true,
      alt_text: "Interactive mathematical tool enabled for this item.",
    });
  }
  return media;
}

function makeChoices(correct, distractors, rng) {
  let pool = uniqueStrings([correct, ...distractors]).filter((value) => value !== "");
  let n = 1;
  while (pool.length < 4) {
    const numeric = Number(correct);
    pool.push(Number.isFinite(numeric) ? String(numeric + n * 3) : `Not enough information ${n}`);
    pool = uniqueStrings(pool);
    n += 1;
  }
  const selected = rng.shuffle([String(correct), ...pool.filter((v) => v !== String(correct)).slice(0, 3)]);
  const options = selected.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  const answer = options.find((option) => option.text === String(correct)).id;
  return { options, answer };
}

function baseItem({
  id,
  year,
  domain,
  subdomain,
  skill,
  difficulty,
  itemType,
  prompt,
  stimulus = null,
  choices = null,
  answer,
  explanation,
  calculator = "not_applicable",
  tags = [],
  curriculumCode = null,
  toolPolicy = null,
}) {
  const pathway = pathwayBand(difficulty);
  const resolvedToolPolicy = toolPolicy ?? {
    calculator: calculator === "allowed",
    ruler: false,
    protractor: false,
  };
  const testletNodes = domain === "writing"
    ? []
    : subdomain === "spelling"
      ? SPELLING_TESTLET_ELIGIBILITY[pathway]
      : TESTLET_ELIGIBILITY[pathway];
  return {
    id,
    bank_version: VERSION,
    year_level: year,
    year_profile: {
      age_band: YEAR_PROFILES[year].age_band,
      curriculum_band: YEAR_PROFILES[year].curriculum_band,
    },
    domain,
    subdomain,
    skill,
    difficulty,
    difficulty_model: difficultyModel(year, difficulty, domain),
    pathway_band: pathway,
    curriculum: {
      framework: "Australian Curriculum v9 aligned practice scope",
      code: curriculumCode,
      descriptor: skill,
      year_band: YEAR_PROFILES[year].curriculum_band,
    },
    testlet: {
      adaptive_design: domain === "writing" ? "none" : "multistage_testlet",
      eligible_nodes: testletNodes,
      parameters_status: "provisional_uncalibrated",
    },
    item_type: itemType,
    calculator,
    tool_policy: resolvedToolPolicy,
    prompt,
    stimulus,
    options: choices,
    answer,
    scoring: {
      method: answer?.type ?? "manual",
      max_score: answer?.type === "extended_response" ? answer.maximum_score : 1,
      partial_credit: Boolean(answer?.partial_credit),
      status: answer?.type === "extended_response" ? "practice_rubric" : "machine_scorable",
    },
    interaction: interactionDefinition(itemType, answer, choices),
    media: inferMedia(stimulus, resolvedToolPolicy),
    accessibility: {
      keyboard_complete: true,
      zoom_200_percent: true,
      visual_alternative_required: Boolean(stimulus?.visual?.answer_critical),
      audio_alternative_required: stimulus?.type === "audio_dictation_script",
    },
    explanation,
    tags,
    provenance: {
      original_item: true,
      official_item: false,
      source_mode: "public_spec_reference",
      alignment_basis: ["NAPLAN Assessment Framework updated December 2025", "Australian Curriculum-aligned NAPLAN domain descriptions"],
    },
    review: {
      curriculum: "generated_pending_expert_review",
      editorial: "generated_pending_expert_review",
      accessibility: "generated_pending_expert_review",
      copyright: "originality_checks_required",
      psychometric: "uncalibrated",
    },
  };
}

function contentFingerprint(item) {
  return JSON.stringify([
    item.domain,
    item.subdomain,
    item.prompt,
    item.stimulus,
    item.answer?.display ?? item.answer?.value ?? null,
  ]);
}

function makeUniqueItem({ factory, seen, baseIndex, step = 1, label = "item" }) {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const item = factory(baseIndex + attempt * step);
    const fingerprint = contentFingerprint(item);
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      return item;
    }
  }
  throw new Error(`Could not create unique content variant for ${label} at item index ${baseIndex}.`);
}

function mcqItem(args, correct, distractors, rng) {
  const { options, answer } = makeChoices(correct, distractors, rng);
  return baseItem({
    ...args,
    itemType: args.itemType ?? "multiple_choice",
    choices: options,
    answer: { type: "single_choice", value: answer, display: String(correct) },
  });
}

function multiSelectItem(args, correctAnswers, distractors, rng) {
  const texts = rng.shuffle(uniqueStrings([...correctAnswers, ...distractors]).slice(0, 4));
  const options = texts.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  const values = options.filter((option) => correctAnswers.includes(option.text)).map((option) => option.id).sort();
  return baseItem({
    ...args,
    itemType: "multiple_select",
    choices: options,
    answer: {
      type: "multiple_select",
      values,
      display: correctAnswers.join("; "),
    },
  });
}

function orderingItem(args, orderedSteps, rng) {
  const labels = ["First", "Next", "Last"];
  const shuffled = rng.shuffle(uniqueStrings(orderedSteps));
  const options = shuffled.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  const optionIdByText = new Map(options.map((option) => [option.text, option.id]));
  const targets = orderedSteps.map((_, index) => ({
    id: `position_${index + 1}`,
    label: labels[index] ?? `Position ${index + 1}`,
    capacity: 1,
  }));
  const placements = Object.fromEntries(targets.map((target, index) => [
    target.id,
    optionIdByText.get(orderedSteps[index]),
  ]));
  return baseItem({
    ...args,
    itemType: "drag_and_drop",
    choices: options,
    answer: {
      type: "drag_drop",
      placements,
      targets,
      display: orderedSteps.join(" → "),
    },
  });
}

function matrixItem(args, rows, columns, correctByRow) {
  return baseItem({
    ...args,
    itemType: "matrix",
    choices: null,
    answer: {
      type: "matrix",
      rows,
      columns,
      values: correctByRow,
      display: rows.map((row) => `${row.label}: ${columns.find((column) => column.id === correctByRow[row.id])?.label}`).join("; "),
    },
  });
}

function textItem(args, correct, accepted = [String(correct)]) {
  return baseItem({
    ...args,
    itemType: "text_entry",
    choices: null,
    answer: { type: "text", value: String(correct), accepted: uniqueStrings(accepted).map((value) => value.toLowerCase()) },
  });
}

const NUMERACY_ALLOCATIONS = {
  3: { number: 320, algebra: 80, measurement: 184, space: 112, statistics: 64, probability: 40 },
  5: { number: 320, algebra: 80, measurement: 160, space: 112, statistics: 88, probability: 40 },
  7: { number: 320, algebra: 80, measurement: 160, space: 112, statistics: 88, probability: 40 },
  9: { number: 280, algebra: 120, measurement: 160, space: 112, statistics: 88, probability: 40 },
};

function buildNumeracyStrands(year, rng) {
  const values = [];
  for (const [strand, count] of Object.entries(NUMERACY_ALLOCATIONS[year])) {
    values.push(...Array(count).fill(strand));
  }
  return rng.shuffle(values);
}

function numeracyNumber({ year, id, difficulty, index, rng }) {
  const d = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const variant = index % 6;
  const common = { id, year, domain: "numeracy", subdomain: "number", difficulty, calculator: year >= 7 && index % 4 !== 0 ? "allowed" : "not_allowed" };

  if (year === 3) {
    if (variant === 0) {
      const unit = Math.floor(index / 6);
      const hundreds = 2 + (unit % 7);
      const tens = 1 + (Math.floor(unit / 7) % 8);
      const ones = Math.floor(unit / 56) % 10;
      const number = hundreds * 100 + tens * 10 + ones;
      return mcqItem({ ...common, skill: "place value", prompt: `What is the value of the digit ${tens} in ${number}?`, explanation: `The digit ${tens} is in the tens place, so its value is ${tens * 10}.` }, tens * 10, [tens, tens * 100, ones * 10], rng);
    }
    if (variant === 1) {
      const a = 120 + ((index * 17) % (220 * d));
      const b = 24 + ((index * 11) % (60 * d));
      return mcqItem({ ...common, skill: "addition and subtraction", prompt: `A class collected ${a} cans on Monday and ${b} cans on Tuesday. How many cans did they collect altogether?`, explanation: `${a} + ${b} = ${a + b}.` }, a + b, [a + b - 10, a + b + 10, Math.abs(a - b)], rng);
    }
    if (variant === 2) {
      const unit = Math.floor(index / 6);
      const groups = 3 + (unit % (8 + d * 3));
      const each = 2 + (Math.floor(unit / (8 + d * 3)) % 11);
      return mcqItem({ ...common, skill: "multiplication", prompt: `There are ${groups} trays with ${each} muffins on each tray. How many muffins are there?`, explanation: `${groups} groups of ${each} is ${groups} × ${each} = ${groups * each}.` }, groups * each, [groups + each, groups * each + each, groups * (each - 1)], rng);
    }
    if (variant === 3) {
      const unit = Math.floor(index / 6);
      const denominator = 2 + (unit % 8);
      const total = denominator * (2 + (Math.floor(unit / 8) % 15));
      return mcqItem({ ...common, skill: "unit fractions", prompt: `A ribbon is divided into ${denominator} equal parts. How many centimetres is one part if the ribbon is ${total} cm long?`, explanation: `One of ${denominator} equal parts is ${total} ÷ ${denominator} = ${total / denominator} cm.` }, `${total / denominator} cm`, [`${denominator} cm`, `${total - denominator} cm`, `${total / denominator + 1} cm`], rng);
    }
    if (variant === 4) {
      const unit = Math.floor(index / 6);
      const dollars = 4 + (unit % 35);
      const cents = [10, 20, 30, 40, 50, 60, 70, 80, 90][Math.floor(unit / 35) % 9];
      const totalCents = dollars * 100 + cents;
      const paid = (dollars + 2 + d) * 100;
      const change = paid - totalCents;
      return mcqItem({ ...common, skill: "money", prompt: `A book costs $${(totalCents / 100).toFixed(2)}. Mia pays $${(paid / 100).toFixed(2)}. How much change should she receive?`, explanation: `$${(paid / 100).toFixed(2)} − $${(totalCents / 100).toFixed(2)} = $${(change / 100).toFixed(2)}.` }, `$${(change / 100).toFixed(2)}`, [`$${((change + 20) / 100).toFixed(2)}`, `$${((change - 20) / 100).toFixed(2)}`, `$${(totalCents / 100).toFixed(2)}`], rng);
    }
    const start = 40 + ((index * 7) % 120);
    const step = [2, 5, 10][index % 3];
    return mcqItem({ ...common, skill: "number sequences", prompt: `What number comes next? ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ___`, explanation: `The pattern increases by ${step}, so the next number is ${start + step * 4}.` }, start + step * 4, [start + step * 3 + 1, start + step * 5, start + step * 4 - step], rng);
  }

  if (year === 5) {
    if (variant === 0) {
      const a = 1200 + ((index * 73) % (4000 * d));
      const b = 140 + ((index * 31) % (700 * d));
      return mcqItem({ ...common, skill: "whole-number operations", prompt: `A warehouse packed ${a} boxes and sent ${b} away. How many boxes remained?`, explanation: `${a} − ${b} = ${a - b}.` }, a - b, [a - b + 100, a - b - 100, a + b], rng);
    }
    if (variant === 1) {
      const denominator = [4, 5, 8, 10][(index + d) % 4];
      const numerator = 1 + (index % (denominator - 1));
      const multiplier = 2 + (index % 4);
      return mcqItem({ ...common, skill: "equivalent fractions", prompt: `Which fraction is equivalent to ${numerator}/${denominator}?`, explanation: `Multiplying the numerator and denominator by ${multiplier} gives ${numerator * multiplier}/${denominator * multiplier}.` }, `${numerator * multiplier}/${denominator * multiplier}`, [`${numerator + multiplier}/${denominator + multiplier}`, `${numerator * multiplier}/${denominator}`, `${numerator}/${denominator * multiplier}`], rng);
    }
    if (variant === 2) {
      const a = (100 + ((index * 17) % 850)) / 100;
      const b = (20 + ((index * 13) % 300)) / 100;
      const result = (a + b).toFixed(2);
      return mcqItem({ ...common, skill: "decimal addition", prompt: `What is ${a.toFixed(2)} + ${b.toFixed(2)}?`, explanation: `Align the decimal points and add to get ${result}.` }, result, [(a + b + 0.1).toFixed(2), (a + b - 0.1).toFixed(2), (a + b + 1).toFixed(2)], rng);
    }
    if (variant === 3) {
      const n = 24 + ((index * 6) % 72);
      const factors = Array.from({ length: n }, (_, k) => k + 1).filter((value) => n % value === 0);
      const correct = factors[Math.min(factors.length - 1, 1 + (index % Math.max(1, factors.length - 1)))];
      return mcqItem({ ...common, skill: "factors and multiples", prompt: `Which number is a factor of ${n}?`, explanation: `${n} ÷ ${correct} is a whole number, so ${correct} is a factor.` }, correct, [correct + 1, correct + 2, Math.max(2, correct - 1)], rng);
    }
    if (variant === 4) {
      const percent = [10, 20, 25, 50][index % 4];
      const total = [40, 60, 80, 100, 120][(index + d) % 5];
      const result = (total * percent) / 100;
      return mcqItem({ ...common, skill: "simple percentages", prompt: `What is ${percent}% of ${total}?`, explanation: `${percent}% of ${total} is ${result}.` }, result, [result + 5, total - result, percent], rng);
    }
    const divisor = 3 + (index % 7);
    const quotient = 12 + ((index * 5) % 50);
    const dividend = divisor * quotient;
    return mcqItem({ ...common, skill: "division", prompt: `${dividend} seedlings are shared equally among ${divisor} gardens. How many seedlings does each garden receive?`, explanation: `${dividend} ÷ ${divisor} = ${quotient}.` }, quotient, [quotient + divisor, quotient - 1, divisor], rng);
  }

  if (year === 7) {
    if (variant === 0) {
      const a = -20 + ((index * 7) % 41);
      const b = -15 + ((index * 11) % 31);
      return mcqItem({ ...common, skill: "integers", prompt: `What is ${a} + (${b})?`, explanation: `Combining the signed numbers gives ${a + b}.` }, a + b, [a - b, b - a, Math.abs(a + b)], rng);
    }
    if (variant === 1) {
      const original = 40 + ((index * 10) % 161);
      const percent = [10, 15, 20, 25][index % 4];
      const result = (original * (100 - percent)) / 100;
      return mcqItem({ ...common, skill: "percentages", prompt: `A $${original} jacket is reduced by ${percent}%. What is the sale price?`, explanation: `The discount is $${(original * percent) / 100}, so the sale price is $${result}.` }, `$${result.toFixed(2)}`, [`$${(original - percent).toFixed(2)}`, `$${(result + percent / 10).toFixed(2)}`, `$${((original * percent) / 100).toFixed(2)}`], rng);
    }
    if (variant === 2) {
      const scale = 2 + (index % 5);
      const a = 3 + ((index * 3) % 8);
      const b = 4 + ((index * 5) % 9);
      return mcqItem({ ...common, skill: "ratio", prompt: `Paint is mixed in the ratio ${a}:${b}. If ${a * scale} cups of the first colour are used, how many cups of the second colour are needed?`, explanation: `The scale factor is ${scale}, so ${b} × ${scale} = ${b * scale}.` }, `${b * scale} cups`, [`${a * scale + b} cups`, `${b + scale} cups`, `${a * b} cups`], rng);
    }
    if (variant === 3) {
      const unit = Math.floor(index / 6);
      const base = 2 + (unit % 50);
      const exponent = 2 + (Math.floor(unit / 50) % 6);
      return mcqItem({ ...common, skill: "index notation", prompt: `What is ${base}^${exponent}?`, explanation: `${base} is multiplied by itself ${exponent} times, giving ${base ** exponent}.` }, base ** exponent, [base * exponent, base ** exponent + base, base ** (exponent - 1)], rng);
    }
    if (variant === 4) {
      const unit = Math.floor(index / 6);
      const denominator = 3 + (unit % 30);
      const n1 = 1 + (Math.floor(unit / 30) % (denominator - 1));
      const n2 = 1 + (Math.floor(unit / 90) % (denominator - 1));
      const sum = n1 + n2;
      return mcqItem({ ...common, skill: "fraction operations", prompt: `What is ${n1}/${denominator} + ${n2}/${denominator}?`, explanation: `The denominators are the same, so add the numerators: ${sum}/${denominator}.` }, `${sum}/${denominator}`, [`${sum}/${denominator * 2}`, `${n1 * n2}/${denominator}`, `${sum + 1}/${denominator}`], rng);
    }
    const root = 4 + (Math.floor(index / 6) % 100);
    return mcqItem({ ...common, skill: "square roots", prompt: `What is √${root * root}?`, explanation: `${root} × ${root} = ${root * root}, so √${root * root} = ${root}.` }, root, [root * 2, root - 1, root + 1], rng);
  }

  if (variant === 0) {
    const coefficient = 1 + (index % 8);
    const exponent = 4 + (index % 5);
    const display = `${coefficient}.${String((index * 7) % 90 + 10).padStart(2, "0")} × 10^${exponent}`;
    const decimal = Number(display.split(" ×")[0]) * 10 ** exponent;
    return mcqItem({ ...common, skill: "scientific notation", prompt: `Which ordinary number is represented by ${display}?`, explanation: `Move the decimal point ${exponent} places to the right: ${decimal}.` }, decimal, [decimal / 10, decimal * 10, decimal + 10 ** exponent], rng);
  }
  if (variant === 1) {
    const original = 80 + ((index * 13) % 320);
    const change = [5, 10, 12.5, 20][index % 4];
    const result = original * (1 + change / 100);
    return mcqItem({ ...common, skill: "percentage increase", prompt: `A value of ${original} increases by ${change}%. What is the new value?`, explanation: `${original} × ${1 + change / 100} = ${result}.` }, Number(result.toFixed(2)), [original + change, Number((result - change / 10).toFixed(2)), Number((original * change / 100).toFixed(2))], rng);
  }
  if (variant === 2) {
    const speed = 45 + ((index * 5) % 56);
    const hours = 2 + (index % 5);
    return mcqItem({ ...common, skill: "rates", prompt: `A cyclist travels at an average speed of ${speed} km/h for ${hours} hours. How far does the cyclist travel?`, explanation: `Distance = speed × time = ${speed} × ${hours} = ${speed * hours} km.` }, `${speed * hours} km`, [`${speed + hours} km`, `${speed * (hours - 1)} km`, `${speed / hours} km`], rng);
  }
  if (variant === 3) {
    const base = 2 + (index % 6);
    const a = 2 + (index % 4);
    const b = 1 + ((index * 3) % 4);
    return mcqItem({ ...common, skill: "index laws", prompt: `Simplify ${base}^${a} × ${base}^${b}.`, explanation: `When multiplying powers with the same base, add the exponents: ${base}^${a + b}.` }, `${base}^${a + b}`, [`${base}^${a * b}`, `${base * 2}^${a + b}`, `${base}^${Math.abs(a - b)}`], rng);
  }
  if (variant === 4) {
    const ratioA = 2 + (index % 5);
    const ratioB = 3 + ((index * 2) % 7);
    const scale = 4 + (index % 6);
    return mcqItem({ ...common, skill: "direct proportion", prompt: `${ratioA} metres of fabric cost $${ratioB * ratioA}. At the same rate, what is the cost of ${ratioA * scale} metres?`, explanation: `The cost per metre is $${ratioB}; ${ratioA * scale} × ${ratioB} = $${ratioA * scale * ratioB}.` }, `$${ratioA * scale * ratioB}`, [`$${ratioB * scale}`, `$${ratioA * ratioB + scale}`, `$${ratioA * scale}`], rng);
  }
  const numerator = 10 + ((index * 7) % 50);
  const denominator = 3 + (index % 8);
  const value = numerator / denominator;
  return mcqItem({ ...common, skill: "rational numbers", prompt: `Which is the best estimate of ${numerator} ÷ ${denominator}?`, explanation: `${numerator} ÷ ${denominator} ≈ ${value.toFixed(1)}.` }, value.toFixed(1), [(value + 1).toFixed(1), (value - 1).toFixed(1), (numerator / (denominator + 1)).toFixed(1)], rng);
}

function numeracyAlgebra({ year, id, difficulty, index, rng }) {
  const common = { id, year, domain: "numeracy", subdomain: "algebra", difficulty, calculator: year >= 7 && index % 3 !== 0 ? "allowed" : "not_allowed" };
  if (year === 3) {
    const answer = 8 + (index % 80);
    const add = 3 + (Math.floor(index / 80) % 30);
    return mcqItem({ ...common, skill: "unknown values", prompt: `What number makes this sentence true? □ + ${add} = ${answer + add}`, explanation: `${answer + add} − ${add} = ${answer}.` }, answer, [answer + add, answer - 1, answer + 1], rng);
  }
  if (year === 5) {
    const start = 3 + (index % 60);
    const step = 2 + (Math.floor(index / 60) % 20);
    return mcqItem({ ...common, skill: "number patterns", prompt: `The rule is “multiply by ${step}, then add 1”. What is the output when the input is ${start}?`, explanation: `${start} × ${step} + 1 = ${start * step + 1}.` }, start * step + 1, [start + step + 1, start * (step + 1), start * step - 1], rng);
  }
  if (year === 7) {
    const x = 2 + (index % 40);
    const a = 2 + (Math.floor(index / 40) % 15);
    const b = 1 + (Math.floor(index / 600) % 30);
    const total = a * x + b;
    return mcqItem({ ...common, skill: "linear equations", prompt: `Solve ${a}x + ${b} = ${total}.`, explanation: `Subtract ${b}, then divide by ${a}: x = ${x}.` }, x, [x + 1, x - 1, total - b], rng);
  }
  const unit = Math.floor(index / 3);
  const x = 2 + (unit % 40);
  const a = 2 + (Math.floor(unit / 40) % 15);
  const b = 1 + (Math.floor(unit / 600) % 30);
  const c = a * x + b;
  const variant = index % 3;
  if (variant === 0) {
    return mcqItem({ ...common, skill: "linear equations", prompt: `Solve ${a}x + ${b} = ${c}.`, explanation: `Subtract ${b} and divide by ${a}: x = ${x}.` }, x, [x + 2, x - 1, c - b], rng);
  }
  if (variant === 1) {
    const value = a * x - b;
    return mcqItem({ ...common, skill: "substitution", prompt: `Find the value of ${a}x − ${b} when x = ${x}.`, explanation: `${a} × ${x} − ${b} = ${value}.` }, value, [a * (x - b), value + a, value - b], rng);
  }
  return mcqItem({ ...common, skill: "linear rules", prompt: `A line follows y = ${a}x + ${b}. What is y when x = ${x}?`, explanation: `Substitute x = ${x}: y = ${a} × ${x} + ${b} = ${c}.` }, c, [a + x + b, c - b, c + a], rng);
}

function numeracyMeasurement({ year, id, difficulty, index, rng }) {
  const common = { id, year, domain: "numeracy", subdomain: "measurement", difficulty, calculator: year >= 7 && index % 3 !== 0 ? "allowed" : "not_allowed" };
  const variant = index % 5;
  const unit = Math.floor(index / 5);
  if (year === 3) {
    if (variant === 0) {
      const hour = 7 + (unit % 6);
      const minutes = [10, 15, 20, 25, 30, 35, 40, 45, 50][Math.floor(unit / 6) % 9];
      const stimulus = {
        type: "diagram",
        visual: {
          asset_id: `${id}-start-clock`,
          kind: "analog_clock",
          render_mode: "svg",
          answer_critical: true,
          alt_text: `An analogue clock showing ${hour} o'clock.`,
          parameters: { hour, minute: 0 },
        },
      };
      return mcqItem({ ...common, skill: "time", stimulus, prompt: `The clock shows when a lesson starts. The lesson lasts ${minutes} minutes. When does it finish?`, explanation: `The clock shows ${hour}:00. Adding ${minutes} minutes gives ${hour}:${String(minutes).padStart(2, "0")}.` }, `${hour}:${String(minutes).padStart(2, "0")}`, [`${hour + 1}:00`, `${hour}:${String(60 - minutes).padStart(2, "0")}`, `${hour - 1}:${String(minutes).padStart(2, "0")}`], rng);
    }
    const length = 12 + (unit % 60);
    const width = 4 + (Math.floor(unit / 60) % 30);
    if (variant <= 2) {
      return mcqItem({ ...common, skill: "perimeter", prompt: `A rectangular garden is ${length} m long and ${width} m wide. What is its perimeter?`, explanation: `Perimeter = 2 × (${length} + ${width}) = ${2 * (length + width)} m.` }, `${2 * (length + width)} m`, [`${length + width} m`, `${length * width} m`, `${2 * length + width} m`], rng);
    }
    const cm = 100 + 25 * (unit % 400);
    return mcqItem({ ...common, skill: "metric length", prompt: `How many metres are equal to ${cm} centimetres?`, explanation: `100 centimetres equals 1 metre, so ${cm} cm = ${(cm / 100).toFixed(2)} m.` }, `${(cm / 100).toFixed(2)} m`, [`${cm / 10} m`, `${cm} m`, `${(cm / 100 + 1).toFixed(2)} m`], rng);
  }
  if (year === 5) {
    const length = 6 + (unit % 45);
    const width = 4 + (Math.floor(unit / 45) % 30);
    if (variant <= 1) {
      return mcqItem({ ...common, skill: "area", prompt: `What is the area of a rectangle ${length} cm by ${width} cm?`, explanation: `Area = ${length} × ${width} = ${length * width} cm².` }, `${length * width} cm²`, [`${2 * (length + width)} cm²`, `${length + width} cm²`, `${length * width + width} cm²`], rng);
    }
    if (variant === 2) {
      const litres = 2 + (unit % 90);
      return mcqItem({ ...common, skill: "unit conversion", prompt: `How many millilitres are in ${litres} litres?`, explanation: `1 litre = 1000 millilitres, so ${litres} litres = ${litres * 1000} mL.` }, `${litres * 1000} mL`, [`${litres * 100} mL`, `${litres + 1000} mL`, `${litres * 10} mL`], rng);
    }
    if (variant === 4) {
      const measuredLength = 4 + (unit % 15);
      const stimulus = {
        type: "diagram",
        visual: {
          asset_id: `${id}-line-measure`,
          kind: "ruler_measurement",
          render_mode: "svg",
          answer_critical: true,
          alt_text: `A horizontal object with endpoints marked for measurement using the online ruler.`,
          parameters: { length_cm: measuredLength, start_offset_cm: 1 + (unit % 3) },
        },
      };
      return mcqItem({
        ...common,
        skill: "measuring length with a ruler",
        stimulus,
        prompt: "Use the online ruler to measure the marked length.",
        explanation: `Align zero on the ruler with the first endpoint. The second endpoint is at ${measuredLength} cm.`,
        toolPolicy: { calculator: false, ruler: true, protractor: false },
      }, `${measuredLength} cm`, [`${measuredLength - 1} cm`, `${measuredLength + 0.5} cm`, `${measuredLength + 1} cm`], rng);
    }
    const hours = 1 + (unit % 10);
    const minutes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(unit / 10) % 11];
    return mcqItem({ ...common, skill: "duration", prompt: `A trip lasts ${hours} hours and ${minutes} minutes. How many minutes is this altogether?`, explanation: `${hours} × 60 + ${minutes} = ${hours * 60 + minutes} minutes.` }, `${hours * 60 + minutes} minutes`, [`${hours * 100 + minutes} minutes`, `${hours * 60} minutes`, `${hours + minutes} minutes`], rng);
  }
  if (year === 7) {
    const length = 5 + (unit % 30);
    const width = 4 + (Math.floor(unit / 30) % 25);
    const height = 3 + (Math.floor(unit / 750) % 20);
    if (variant <= 1) {
      return mcqItem({ ...common, skill: "volume", prompt: `A rectangular prism measures ${length} cm by ${width} cm by ${height} cm. What is its volume?`, explanation: `Volume = ${length} × ${width} × ${height} = ${length * width * height} cm³.` }, `${length * width * height} cm³`, [`${2 * (length * width + length * height + width * height)} cm³`, `${length + width + height} cm³`, `${length * width} cm³`], rng);
    }
    if (variant === 4) {
      const measuredAngle = [35, 50, 65, 110, 125, 145][unit % 6];
      const stimulus = {
        type: "diagram",
        visual: {
          asset_id: `${id}-angle-measure`,
          kind: "protractor_measurement",
          render_mode: "svg",
          answer_critical: true,
          alt_text: `Two rays form an angle that can be measured with the online protractor.`,
          parameters: { angle_degrees: measuredAngle, orientation_degrees: (unit * 17) % 80 },
        },
      };
      return textItem({
        ...common,
        skill: "measuring angles with a protractor",
        stimulus,
        prompt: "Use the online protractor. Type the angle size in degrees.",
        explanation: `The second ray crosses the ${measuredAngle}° mark.`,
        toolPolicy: { calculator: true, ruler: false, protractor: true },
      }, measuredAngle, [String(measuredAngle), `${measuredAngle}°`]);
    }
    const rate = 40 + (unit % 121);
    const mins = [15, 20, 30, 40, 45, 60, 75, 90, 105, 120][Math.floor(unit / 121) % 10];
    const result = rate * (mins / 60);
    return mcqItem({ ...common, skill: "rate and time", prompt: `A train travels at ${rate} km/h for ${mins} minutes. How far does it travel?`, explanation: `${mins} minutes is ${mins / 60} hours, so distance = ${rate} × ${mins / 60} = ${result} km.` }, `${result} km`, [`${rate * mins} km`, `${rate + mins} km`, `${result + rate / 2} km`], rng);
  }
  if (variant === 4) {
    const measuredAngle = [28, 42, 73, 118, 137, 156][unit % 6];
    const nearestTen = Math.round(measuredAngle / 10) * 10;
    const stimulus = {
      type: "diagram",
      visual: {
        asset_id: `${id}-angle-estimate`,
        kind: "protractor_measurement",
        render_mode: "svg",
        answer_critical: true,
        alt_text: "Two rays form an angle to be measured and rounded to the nearest ten degrees.",
        parameters: { angle_degrees: measuredAngle, orientation_degrees: (unit * 23) % 90 },
      },
    };
    return textItem({
      ...common,
      skill: "measuring and rounding angles",
      stimulus,
      prompt: "Use the online protractor. Give the angle size to the nearest 10°.",
      explanation: `The angle is about ${measuredAngle}°, which rounds to ${nearestTen}°.`,
      toolPolicy: { calculator: true, ruler: false, protractor: true },
    }, nearestTen, [String(nearestTen), `${nearestTen}°`]);
  }
  const a = 3 + (unit % 40);
  const b = 4 + (Math.floor(unit / 40) % 40);
  const c = Math.sqrt(a * a + b * b);
  if (Number.isInteger(c) && variant <= 2) {
    return mcqItem({ ...common, skill: "Pythagoras", prompt: `A right triangle has shorter sides of ${a} cm and ${b} cm. What is the hypotenuse?`, explanation: `c² = ${a}² + ${b}² = ${c * c}, so c = ${c} cm.` }, `${c} cm`, [`${a + b} cm`, `${Math.abs(a - b)} cm`, `${a * b} cm`], rng);
  }
  const radius = 2 + (unit % 30);
  const height = 4 + (Math.floor(unit / 30) % 40);
  const volume = Math.PI * radius * radius * height;
  return mcqItem({ ...common, skill: "cylinder volume", prompt: `Using π ≈ 3.14, find the volume of a cylinder with radius ${radius} cm and height ${height} cm.`, explanation: `V = πr²h = 3.14 × ${radius}² × ${height} ≈ ${volume.toFixed(1)} cm³.` }, `${volume.toFixed(1)} cm³`, [`${(Math.PI * radius * 2 * height).toFixed(1)} cm³`, `${(Math.PI * radius * radius).toFixed(1)} cm³`, `${(volume + radius * height).toFixed(1)} cm³`], rng);
}

function numeracySpace({ year, id, difficulty, index, rng }) {
  const common = { id, year, domain: "numeracy", subdomain: "space", difficulty, calculator: "neutral" };
  const angles = [30, 45, 60, 90, 120, 135, 180];
  if (year >= 5 && index % 9 === 0) {
    const angleSet = difficulty === "easy"
      ? [35, 90, 125, 180]
      : difficulty === "medium"
        ? [48, 87, 116, 142]
        : [62, 89, 91, 128];
    const targetIndex = difficulty === "hard"
      ? angleSet.findIndex((angle) => angle > 90)
      : angleSet.reduce((best, angle, offset) => (
          Math.abs(angle - 90) < Math.abs(angleSet[best] - 90) ? offset : best
        ), 0);
    const target = angleSet[targetIndex];
    const labels = ["A", "B", "C", "D"];
    const correct = `Angle ${labels[targetIndex]}`;
    const stimulus = {
      type: "diagram",
      visual: {
        asset_id: `${id}-angle-hotspot`,
        kind: "angle_hotspot_set",
        render_mode: "svg",
        answer_critical: true,
        alt_text: `Four labelled angles: ${angleSet.map((angle, offset) => `${labels[offset]} is ${angle} degrees`).join(", ")}.`,
        parameters: { angles: angleSet, labels },
      },
    };
    return mcqItem({
      ...common,
      skill: difficulty === "hard" ? "discriminating near-right angles" : "identifying a right angle",
      itemType: "hotspot",
      stimulus,
      prompt: difficulty === "hard"
        ? "Select the marked angle that is just greater than a right angle."
        : difficulty === "medium"
          ? "Select the marked angle that is closest to a right angle."
          : "Select the right angle.",
      explanation: `${correct} is ${target}°, so it satisfies the condition.`,
    }, correct, labels.filter((_, offset) => offset !== targetIndex).map((label) => `Angle ${label}`), rng);
  }
  if (year === 3) {
    const variant = index % 3;
    const name = NAMES[index % NAMES.length];
    const placeA = ["library","garden","hall","oval","office","canteen","playground","gate"][Math.floor(index / NAMES.length) % 8];
    const placeB = ["pond","classroom","stage","court","shed","crossing","fountain","tree"][Math.floor(index / (NAMES.length * 8)) % 8];
    if (variant <= 1) {
      const shapes = variant === 0
        ? ["square", "rectangle", "triangle", "pentagon"]
        : ["square", "scalene_triangle", "irregular_quadrilateral", "arrow"];
      const orderedShapes = rng.shuffle(shapes);
      const labels = ["A", "B", "C", "D"];
      const correct = `Shape ${labels[orderedShapes.indexOf("square")]}`;
      const stimulus = {
        type: "diagram",
        visual: {
          asset_id: `${id}-shape-set`,
          kind: "shape_hotspot_set",
          render_mode: "svg",
          answer_critical: true,
          alt_text: `Four labelled shapes. ${labels.map((label, offset) => `Shape ${label} is a ${orderedShapes[offset].replaceAll("_", " ")}`).join("; ")}.`,
          parameters: { shapes: orderedShapes, labels },
        },
      };
      return mcqItem({
        ...common,
        skill: variant === 0 ? "2D shape properties" : "symmetry",
        itemType: "hotspot",
        stimulus,
        prompt: variant === 0
          ? `${name} needs a shape with exactly 4 equal sides and 4 right angles. Select the correct shape.`
          : `${name} needs a tile that always has more than one line of symmetry. Select the correct shape.`,
        explanation: variant === 0 ? "A square has 4 equal sides and 4 right angles." : "A square has 4 lines of symmetry.",
      }, correct, labels.filter((label) => `Shape ${label}` !== correct).map((label) => `Shape ${label}`), rng);
    }
    const directions = [["north","south"],["east","west"],["south","north"],["west","east"]];
    const [from, answer] = directions[Math.floor(index / 3) % directions.length];
    const stimulus = {
      type: "diagram",
      visual: {
        asset_id: `${id}-direction-map`,
        kind: "direction_map",
        render_mode: "svg",
        answer_critical: true,
        alt_text: `A simple map showing the ${placeA} ${from} of the ${placeB}.`,
        parameters: { place_a: placeA, place_b: placeB, relation: from },
      },
    };
    return mcqItem({ ...common, skill: "position", stimulus, prompt: `Use the map. In which direction is the ${placeB} from the ${placeA}?`, explanation: `The ${placeA} is ${from} of the ${placeB}, so the ${placeB} is ${answer} of the ${placeA}.` }, answer, ["north", "south", "east", "west"].filter((value) => value !== answer), rng);
  }
  if (year === 5) {
    const angle = 5 + ((index * 17) % 176);
    const type = angle < 90 ? "acute" : angle === 90 ? "right" : angle < 180 ? "obtuse" : "straight";
    return mcqItem({ ...common, skill: "angles", prompt: `How should an angle of ${angle}° be classified?`, explanation: `${angle}° is a ${type} angle.` }, type, ["acute", "right", "obtuse", "straight"].filter((v) => v !== type), rng);
  }
  if (year === 7) {
    const x = -10 + (index % 21);
    const y = -10 + (Math.floor(index / 21) % 21);
    const nx = -x;
    return mcqItem({ ...common, skill: "coordinates and reflection", prompt: `Point P is at (${x}, ${y}). It is reflected in the y-axis. What are the new coordinates?`, explanation: `Reflection in the y-axis changes the sign of the x-coordinate: (${nx}, ${y}).` }, `(${nx}, ${y})`, [`(${x}, ${-y})`, `(${y}, ${x})`, `(${-x}, ${-y})`], rng);
  }
  const scale = 2 + (index % 8);
  const side = 3 + ((index * 17) % 97);
  return mcqItem({ ...common, skill: "similarity and scale", prompt: `Two triangles are similar. A side of ${side} cm on the smaller triangle corresponds to ${side * scale} cm on the larger triangle. What is the scale factor from smaller to larger?`, explanation: `${side * scale} ÷ ${side} = ${scale}.` }, scale, [scale + 1, side, side * scale], rng);
}

function numeracyStatistics({ year, id, difficulty, index, rng }) {
  const common = { id, year, domain: "numeracy", subdomain: "statistics", difficulty, calculator: year >= 7 ? "allowed" : "not_allowed" };
  const labels = ["Banksia", "Wattle", "Grevillea", "Bottlebrush"];
  const span = year * 3 + 10;
  const values = labels.map((_, i) => 4 + (Math.floor(index / (span ** i)) % span));
  const stimulus = { type: "table", title: "Books borrowed this week", columns: ["Class", "Books"], rows: labels.map((label, i) => [label, values[i]]) };
  if (year <= 5) {
    const max = Math.max(...values);
    const correct = labels[values.indexOf(max)];
    return mcqItem({ ...common, skill: "interpreting data displays", stimulus, prompt: `Which class borrowed the most books?`, explanation: `${correct} has the greatest value in the table: ${max}.` }, correct, labels.filter((label) => label !== correct), rng);
  }
  if (year === 7) {
    const sorted = [...values].sort((a, b) => a - b);
    const median = (sorted[1] + sorted[2]) / 2;
    return mcqItem({ ...common, skill: "median", stimulus, prompt: `What is the median number of books borrowed?`, explanation: `The middle two values are ${sorted[1]} and ${sorted[2]}, so the median is ${median}.` }, median, [sorted[1], sorted[2], Math.max(...values) - Math.min(...values)], rng);
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return mcqItem({ ...common, skill: "mean and interpretation", stimulus, prompt: `What is the mean number of books borrowed by the four classes?`, explanation: `Add the values and divide by 4: ${values.reduce((a, b) => a + b, 0)} ÷ 4 = ${mean}.` }, Number(mean.toFixed(2)), [Math.max(...values), Math.min(...values), Number((mean + 1).toFixed(2))], rng);
}

function numeracyProbability({ year, id, difficulty, index, rng }) {
  const common = { id, year, domain: "numeracy", subdomain: "probability", difficulty, calculator: "neutral" };
  if (difficulty === "easy" && index % 5 === 0) {
    const rows = [
      { id: "row_possible", label: year <= 5 ? "Choose a red counter from a bag containing red and blue counters." : "A fair die shows an even number." },
      { id: "row_certain", label: year <= 5 ? "Choose either a red or blue counter from that bag." : "A fair die shows a number from 1 to 6." },
      { id: "row_impossible", label: year <= 5 ? "Choose a green counter from that bag." : "A fair die shows the number 9." },
    ];
    const columns = [
      { id: "impossible", label: "Impossible" },
      { id: "possible", label: "Possible but not certain" },
      { id: "certain", label: "Certain" },
    ];
    return matrixItem({
      ...common,
      skill: "classifying likelihood",
      prompt: "Choose the probability description that matches each event.",
      explanation: "An event is impossible when it cannot occur, certain when it must occur, and otherwise possible but not certain.",
    }, rows, columns, {
      row_possible: "possible",
      row_certain: "certain",
      row_impossible: "impossible",
    });
  }
  if (year <= 5) {
    const red = 1 + (index % 20);
    const blue = 2 + (Math.floor(index / 20) % 20);
    const total = red + blue;
    return mcqItem({ ...common, skill: "chance", prompt: `A bag contains ${red} red counters and ${blue} blue counters. What is the probability of choosing a red counter?`, explanation: `There are ${red} favourable outcomes out of ${total} counters.` }, `${red}/${total}`, [`${blue}/${total}`, `${red}/${blue}`, `1/${total}`], rng);
  }
  if (year === 7) {
    const sides = 4 + (index % 97);
    const favourable = Math.floor(sides / 2);
    return mcqItem({ ...common, skill: "sample spaces", prompt: `A fair ${sides}-sided spinner is numbered 1 to ${sides}. What is the probability of landing on an even number?`, explanation: `${favourable} of the ${sides} outcomes are even, so the probability is ${favourable}/${sides}.` }, `${favourable}/${sides}`, [`1/${sides}`, `${sides - favourable}/${sides}`, `${favourable - 1}/${sides}`], rng);
  }
  const red = 2 + (index % 20);
  const blue = 3 + (Math.floor(index / 20) % 20);
  const total = red + blue;
  const probability = (red / total) * ((red - 1) / (total - 1));
  return mcqItem({ ...common, skill: "two-step probability", prompt: `A bag has ${red} red and ${blue} blue counters. Two counters are drawn without replacement. What is the probability that both are red?`, explanation: `P(red then red) = ${red}/${total} × ${red - 1}/${total - 1} = ${red * (red - 1)}/${total * (total - 1)}.` }, `${red * (red - 1)}/${total * (total - 1)}`, [`${red * red}/${total * total}`, `${red}/${total}`, `${blue * (blue - 1)}/${total * (total - 1)}`], rng);
}

function generateNumeracy(year, rng) {
  const strands = buildNumeracyStrands(year, rng);
  const difficulties = difficultySequence(800, rng, year);
  const seen = new Set();
  return strands.map((strand, index) => {
    const factory = (variantIndex) => {
      const args = { year, id: makeId(year, "NUM", index), difficulty: difficulties[index], index: variantIndex, rng };
      if (strand === "number") return numeracyNumber(args);
      if (strand === "algebra") return numeracyAlgebra(args);
      if (strand === "measurement") return numeracyMeasurement(args);
      if (strand === "space") return numeracySpace(args);
      if (strand === "statistics") return numeracyStatistics(args);
      return numeracyProbability(args);
    };
    return makeUniqueItem({ factory, seen, baseIndex: index, label: `Year ${year} numeracy/${strand}` });
  });
}

const SPELLING_WORDS = {
  3: ["because","friend","school","people","water","little","after","again","around","every","could","would","should","their","there","where","were","happy","garden","animal","family","morning","really","different","important","together","favourite","colour","centre","travelled","beautiful","quiet","quickly","enough","thought","through","answer","caught","children","country","early","earth","heard","island","laugh","minute","often","once","picture","please","right","something","special","straight","surprise","teacher","usually","weather","whole","woman","young","breakfast","calendar","careful","complete","decide","excited","finished","holiday","interesting","library","remember"],
  5: ["necessary","separate","environment","community","exercise","probably","library","surprise","calendar","business","believe","receive","journey","decision","equipment","familiar","February","forward","grammar","imagine","knowledge","language","material","natural","occasion","opposite","particular","popular","position","possible","practice","promise","question","recent","regular","sentence","several","strength","therefore","thoughtful","throughout","variety","vegetable","volunteer","whether","written","achieve","address","ancient","apparent","attention","average","breathe","certain","circle","continue","describe","develop","dictionary","disappear","education","electric","experience","favourite","government","immediately","individual","information","interest","neighbour","organise"],
  7: ["accommodation","achievement","argument","category","committee","conscience","curiosity","definite","discipline","embarrass","government","guarantee","independent","knowledge","maintenance","opportunity","privilege","recommendation","rhythm","separate","accessible","accurate","advertisement","analysis","apologise","appearance","appropriate","beginning","beneficial","campaign","cemetery","challenge","circumstance","communication","competition","conclusion","convenient","correspondence","criticise","description","desperate","development","difference","disastrous","efficient","environment","equipment","especially","exaggerate","existence","explanation","fascinating","foreign","frequently","generally","immediately","influence","intelligence","interesting","interrupt","leisure","lightning","noticeable","occasionally","occurred","parallel","persuade","physical","possession","preferred","prejudice"],
  9: ["accessible","analytical","bureaucracy","camouflage","conscientious","controversial","correspondence","deterioration","entrepreneur","exaggeration","fluorescent","hierarchy","indispensable","liaison","manoeuvre","millennium","miscellaneous","perseverance","phenomenon","questionnaire","acknowledgement","acquaintance","adolescent","amateur","apparently","argumentative","assassination","belligerent","caribbean","cemetery","coincidence","colloquial","commission","conscience","consensus","contemporary","curriculum","deceive","definitely","discipline","ecstasy","embarrassment","environmental","existence","fascinating","feasible","foreign","gauge","government","harassment","hypocrisy","immediately","independent","intelligence","irrelevant","maintenance","medieval","miniature","necessary","occasionally","parallel","parliament","possession","privilege","pronunciation","recommendation","restaurant","rhythm","separate","supersede","threshold","tomorrow","twelfth"],
};

function misspell(word, index) {
  const replacements = [["ie", "ei"], ["ei", "ie"], ["ou", "o"], ["ll", "l"], ["ss", "s"], ["mm", "m"], ["rr", "r"], ["tion", "shun"], ["able", "ible"], ["ence", "ance"]];
  for (let offset = 0; offset < replacements.length; offset += 1) {
    const [from, to] = replacements[(index + offset) % replacements.length];
    if (word.includes(from)) {
      const result = word.replace(from, to);
      if (result !== word) return result;
    }
  }
  const middle = Math.max(1, Math.min(word.length - 2, 1 + (index % Math.max(1, word.length - 2))));
  return `${word.slice(0, middle)}${word[middle + 1] ?? ""}${word[middle]}${word.slice(middle + 2)}`;
}

const CONTEXTS = [
  (w, name) => `${name} used the word “${w}” in a class presentation.`,
  (w, name) => `${name} wrote ${w} clearly on the label.`,
  (w, name) => `${name}'s teacher explained why ${w} was important in the sentence.`,
  (w, name) => `${name} checked the spelling of ${w} before printing the article.`,
  (w, name) => `During the lesson, ${name} practised writing ${w}.`,
  (w, name) => `The word ${w} appeared in the final paragraph of ${name}'s story.`,
  (w, name) => `${name} noticed the word ${w} in the instructions.`,
  (w, name) => `${name} added ${w} to the shared vocabulary list.`,
];

function generateSpellingItem({ year, id, difficulty, index, type, rng }) {
  const bank = SPELLING_WORDS[year];
  const third = Math.ceil(bank.length / 3);
  const tier = difficulty === "easy"
    ? bank.slice(0, third)
    : difficulty === "hard"
      ? bank.slice(third * 2)
      : bank.slice(third, third * 2);
  const word = tier[index % tier.length];
  const context = CONTEXTS[Math.floor(index / Math.max(1, tier.length)) % CONTEXTS.length](word, NAMES[index % NAMES.length]);
  const wrong = misspell(word, index);
  const common = { id, year, domain: "conventions_of_language", subdomain: "spelling", skill: type, difficulty, calculator: "not_applicable", tags: ["Standard Australian English"] };
  if (type === "audio_dictation") {
    return textItem({
      ...common,
      prompt: "Type the missing word.",
      stimulus: { type: "audio_dictation_script", display_text: context.replace(word, "_____"), audio_script: `${word}. ${context}` },
      explanation: `The correct spelling is “${word}”.`,
    }, word);
  }
  if (type === "mistake_identified") {
    return textItem({
      ...common,
      prompt: "The highlighted word is misspelled. Type the correct spelling.",
      stimulus: { type: "proofreading", text: context.replace(word, `<mark>${wrong}</mark>`) },
      explanation: `“${wrong}” should be spelled “${word}”.`,
    }, word);
  }
  const fillers = rng.shuffle(SPELLING_WORDS[year].filter((value) => value !== word)).slice(0, 4);
  const sentence = `The proofreader checked these words: ${fillers[0]}, ${wrong}, ${fillers[1]}, ${fillers[2]} and ${fillers[3]}.`;
  return textItem({
    ...common,
    prompt: "Find the misspelled word and type its correct spelling.",
    stimulus: { type: "proofreading", text: sentence },
    explanation: `“${wrong}” is the only misspelled word; it should be “${word}”.`,
  }, word);
}

const NAMES = ["Ari","Mia","Noah","Zara","Luca","Amira","Sam","Evie","Kai","Priya","Leo","Sofia"];
const OBJECTS = ["basket","collection","team","group","pair","box","display","plan","report","garden","committee","series"];
const VERBS = ["arrive","finish","explore","organise","practise","observe","compare","explain","prepare","travel","perform","respond"];

function grammarItem({ year, id, difficulty, index, rng, punctuation }) {
  const name = NAMES[index % NAMES.length];
  const object = OBJECTS[Math.floor(index / NAMES.length) % OBJECTS.length];
  const verb = VERBS[Math.floor(index / (NAMES.length * OBJECTS.length)) % VERBS.length];
  const common = { id, year, domain: "conventions_of_language", subdomain: punctuation ? "punctuation" : "grammar", difficulty, calculator: "not_applicable" };

  if (punctuation) {
    const all = [...Array(year <= 3 ? 4 : year === 5 ? 6 : 8).keys()];
    const pool = difficulty === "easy"
      ? all.slice(0, Math.min(3, all.length))
      : difficulty === "hard"
        ? all.slice(Math.max(0, all.length - 4))
        : all.slice(0, Math.min(6, all.length));
    const variant = pool[index % pool.length];
    if (variant === 0) return mcqItem({ ...common, skill: "sentence punctuation", prompt: `Which sentence is punctuated correctly?`, explanation: `A complete statement begins with a capital letter and ends with a full stop.` }, `${name} packed the ${object}.`, [`${name} packed the ${object}`, `${name.toLowerCase()} packed the ${object}.`, `${name} packed, the ${object}.`], rng);
    if (variant === 1) return mcqItem({ ...common, skill: "question marks", prompt: `Which punctuation mark completes ${name}'s question? “When will the ${object} arrive___”`, explanation: `The sentence asks a direct question, so it needs a question mark.` }, "?", [".", "!", ","], rng);
    if (variant === 2) return mcqItem({ ...common, skill: "commas in lists", prompt: `Which sentence uses commas correctly in ${name}'s packing note for the ${object}?`, explanation: `Commas separate the items in a list.` }, `${name} packed pencils, paper, rulers and glue.`, [`${name}, packed pencils paper rulers and glue.`, `${name} packed, pencils paper rulers, and glue.`, `${name} packed pencils paper rulers and, glue.`], rng);
    if (variant === 3) return mcqItem({ ...common, skill: "apostrophes", prompt: `${name} is editing a label. Which phrase shows that one student owns the ${object}?`, explanation: `An apostrophe before s shows singular possession.` }, `the student's ${object}`, [`the students ${object}`, `the students' ${object}`, `the student ${object}'s`], rng);
    if (variant === 4) return mcqItem({ ...common, skill: "direct speech", prompt: `Which sentence punctuates direct speech correctly?`, explanation: `The spoken words are enclosed in quotation marks and end with punctuation.` }, `“We are ready to ${verb},” said ${name}.`, [`“We are ready to ${verb}”, said ${name}.`, `We are ready to ${verb},” said ${name}.`, `“We are ready to ${verb} said ${name}.”`], rng);
    if (variant === 5) return mcqItem({ ...common, skill: "commas after clauses", prompt: `Which sentence is punctuated correctly?`, explanation: `A comma separates the opening dependent clause from the main clause.` }, `Although it was late, ${name} completed the ${object}.`, [`Although, it was late ${name} completed the ${object}.`, `Although it was late ${name}, completed the ${object}.`, `Although it was late ${name} completed, the ${object}.`], rng);
    if (variant === 6) return mcqItem({ ...common, skill: "colon", prompt: `Which sentence uses a colon correctly?`, explanation: `A colon can introduce a list after a complete clause.` }, `${name} needed three items: a map, a torch and water.`, [`${name}: needed three items a map, a torch and water.`, `${name} needed: three items a map, a torch and water.`, `${name} needed three: items, a map, a torch and water.`], rng);
    return mcqItem({ ...common, skill: "semicolon", prompt: `Which sentence uses a semicolon correctly?`, explanation: `A semicolon can link two closely related independent clauses.` }, `${name} expected rain; the ${object} remained indoors.`, [`${name}; expected rain, the ${object} remained indoors.`, `${name} expected; rain the ${object} remained indoors.`, `${name} expected rain,; the ${object} remained indoors.`], rng);
  }

  const all = [...Array(year <= 3 ? 5 : year === 5 ? 7 : 10).keys()];
  const pool = difficulty === "easy"
    ? all.slice(0, Math.min(4, all.length))
    : difficulty === "hard"
      ? all.slice(Math.max(0, all.length - 5))
      : all.slice(0, Math.min(7, all.length));
  const variant = pool[index % pool.length];
  if (variant === 0) return mcqItem({ ...common, skill: "subject–verb agreement", prompt: `Choose the correct word in ${name}'s sentence: “The ${object} of samples ___ on the table.”`, explanation: `The head noun “${object}” is singular, so “is” agrees with it.` }, "is", ["are", "were", "be"], rng);
  if (variant === 1) return mcqItem({ ...common, skill: "verb tense", prompt: `Choose the correct word: “Yesterday, ${name} ___ the ${object}.”`, explanation: `“Yesterday” signals past tense, so “finished” is correct.` }, "finished", ["finishes", "finishing", "will finish"], rng);
  if (variant === 2) return mcqItem({ ...common, skill: "pronouns", prompt: `Choose the correct word: “${name} and ___ prepared the ${object}.”`, explanation: `The subject pronoun “I” is required.` }, "I", ["me", "my", "mine"], rng);
  if (variant === 3) return mcqItem({ ...common, skill: "conjunctions", prompt: `Which word best completes the sentence? “${name} protected the ${object} ___ rain was forecast.”`, explanation: `“Because” introduces the reason.` }, "because", ["unless", "although", "or"], rng);
  if (variant === 4) return mcqItem({ ...common, skill: "adverbs", prompt: `Which word tells how ${name} completed the ${object}? “${name} carefully completed the ${object}.”`, explanation: `“Carefully” describes how the action was completed.` }, "carefully", [name, "completed", object], rng);
  if (variant === 5) return mcqItem({ ...common, skill: "relative clauses", prompt: `Which sentence contains a relative clause?`, explanation: `“Who won the award” adds information about ${name}.` }, `${name}, who won the award, thanked the ${object}.`, [`${name} thanked the ${object}.`, `Winning the award, ${name} smiled.`, `${name} won and thanked the ${object}.`], rng);
  if (variant === 6) return mcqItem({ ...common, skill: "active and passive voice", prompt: `Which sentence is written in the passive voice?`, explanation: `The receiver of the action appears first in the passive sentence.` }, `The ${object} was completed by ${name}.`, [`${name} completed the ${object}.`, `${name} is completing the ${object}.`, `${name} will complete the ${object}.`], rng);
  if (variant === 7) return mcqItem({ ...common, skill: "sentence fragments", prompt: `Which option is a complete sentence?`, explanation: `It contains a subject and a complete verb and expresses a full idea.` }, `${name} will ${verb} before lunch.`, [`Before lunch.`, `While ${name} will ${verb}.`, `The ${object} near the window.`], rng);
  if (variant === 8) return mcqItem({ ...common, skill: "parallel structure", prompt: `Which sentence uses parallel structure?`, explanation: `Each action uses the same -ing form.` }, `${name} enjoys reading, drawing and hiking.`, [`${name} enjoys reading, to draw and hikes.`, `${name} enjoys to read, drawing and to hike.`, `${name} enjoys read, drew and hiking.`], rng);
  return mcqItem({ ...common, skill: "modifier placement", prompt: `Which sentence makes it clear that ${name} used binoculars?`, explanation: `The phrase “using binoculars” is placed next to ${name}, the person who used them.` }, `Using binoculars, ${name} watched the birds cross the lake.`, [`${name} watched the birds using binoculars cross the lake.`, `The birds crossed the lake, watching ${name} with binoculars.`, `Crossing the lake, binoculars helped ${name} watch the birds.`], rng);
}

function generateConventions(year, rng) {
  const difficulties = difficultySequence(600, rng, year);
  const seen = new Set();
  const spellingTypes = rng.shuffle([
    ...Array(173).fill("audio_dictation"),
    ...Array(58).fill("mistake_identified"),
    ...Array(57).fill("mistake_not_identified"),
  ]);
  const items = spellingTypes.map((type, index) => makeUniqueItem({
    seen,
    baseIndex: index,
    label: `Year ${year} spelling/${type}`,
    factory: (variantIndex) => generateSpellingItem({
      year,
      id: makeId(year, "COL", index),
      difficulty: difficulties[index],
      index: variantIndex,
      type,
      rng,
    }),
  }));
  const sectionTypes = rng.shuffle([...Array(218).fill(false), ...Array(94).fill(true)]);
  sectionTypes.forEach((punctuation, localIndex) => {
    const index = 288 + localIndex;
    items.push(makeUniqueItem({
      seen,
      baseIndex: localIndex,
      label: `Year ${year} ${punctuation ? "punctuation" : "grammar"}`,
      factory: (variantIndex) => grammarItem({
        year,
        id: makeId(year, "COL", index),
        difficulty: difficulties[index],
        index: variantIndex,
        punctuation,
        rng,
      }),
    }));
  });
  return items;
}

const STORY_PARTS = {
  characters: ["Ari","Mia","Noah","Zara","Luca","Amira","Sam","Evie","Kai","Priya","Leo","Sofia"],
  settings: ["a windswept coastal track","the old community library","a quiet platform at dawn","a bushland camp beside a creek","the school garden after rain","a small ferry crossing","a museum storeroom","a crowded weekend market","a hilltop observatory","a neighbourhood repair workshop"],
  goals: ["return a lost field notebook","prepare a surprise for the community","find the source of a faint tapping sound","deliver an important message before sunset","repair a model before the exhibition","understand why the birds had suddenly disappeared","guide a younger student back to the group","protect a fragile seedling during a storm"],
  obstacles: ["a sudden power failure","a washed-out path","a missing key","an unexpected change in the weather","a misleading set of directions","a disagreement within the team","a damaged wheel","a rising tide"],
  solutions: ["combined two overlooked clues and chose a safer route","asked for help, tested a careful plan and solved the problem","used the map's scale to identify a shortcut","listened closely and discovered a simple mechanical fault","shared tasks so the group could work before the deadline","noticed a repeated pattern that revealed what to do next"],
  themes: ["cooperation can turn a setback into progress","careful observation is often more useful than rushing","asking for help can be a sign of good judgement","small decisions can protect something valuable","courage can mean acting thoughtfully despite uncertainty","different viewpoints can strengthen a solution"],
};

const INFO_TOPICS = [
  ["a school shade survey","students measured playground temperatures","dark surfaces stayed warmer for longer","planting shade trees near seating areas","the survey covered only two clear days"],
  ["a creek water-quality project","a class compared water clarity at three locations","clarity fell after heavy rain near bare soil","protecting creek-bank plants","the readings did not identify every possible pollutant"],
  ["a library use study","volunteers counted how different spaces were used","quiet booths filled earlier than group tables","creating bookable small study areas","the study took place during one school term"],
  ["a community food-waste audit","families weighed discarded food for a week","avoidable waste was highest after large weekend meals","planning portions and freezing leftovers","participants recorded their own results"],
  ["a night-light observation","students recorded visible stars from several streets","fewer stars were visible near bright unshielded lights","directing outdoor lights downward","cloud cover varied between observations"],
  ["a wetland bird count","teams recorded birds at morning and midday","more species were observed near dense reeds in the morning","retaining mixed wetland habitats","sound and movement may have affected counts"],
  ["a bicycle-route review","students timed several routes to school","the shortest route was not always the quickest or safest","comparing crossings, traffic and travel time","weather conditions were similar on all trial days"],
  ["a classroom acoustics trial","groups measured how clearly speech could be heard","soft wall materials reduced echoes","adding removable acoustic panels","results may differ in larger rooms"],
];

const PERSUASIVE_TOPICS = [
  ["the school should create a weekly outdoor learning session","outdoor lessons can connect ideas to real observations","a planned rotation would keep activities focused","weather interruptions could disrupt lessons","trial the program for one term and review the evidence"],
  ["the council should add more drinking-water refill stations","refill stations make water easier to access","reusable bottles can reduce single-use plastic","installation has an upfront cost","begin at busy parks and measure usage"],
  ["students should help design the library's new spaces","students understand how the spaces are actually used","participation can reveal needs adults may overlook","too many opinions could slow decisions","use a short survey and a representative student panel"],
  ["community events should include quiet areas","quiet zones make events more accessible","a small signed space needs little equipment","organisers may think space is too limited","include one trial zone and collect feedback"],
  ["schools should teach basic repair skills","repair skills can reduce waste","practical tasks build patience and problem-solving","specialist tools require supervision","start with safe repairs such as sewing buttons and fixing bicycle lights"],
  ["local parks should protect more habitat corridors","connected habitat helps animals move safely","native plantings can also cool walking paths","some open areas are needed for recreation","use park edges and unused strips for connected planting"],
  ["public transport information should be easier for young people to understand","clear maps support independent travel","real-time updates reduce uncertainty","simplified information may omit detail","offer a simple view with an optional detailed view"],
  ["schools should schedule regular device-free discussion time","face-to-face discussion develops listening skills","a predictable routine can improve participation","digital tools are useful for many tasks","use device-free time for selected collaborative activities"],
];

function passageComplexity(year) {
  if (year === 3) return { vocab: "hesitant", meaning: "unsure about acting", extra: "" };
  if (year === 5) return { vocab: "reluctant", meaning: "unwilling at first", extra: "The decision was not obvious, because each option protected something different." };
  if (year === 7) return { vocab: "tentative", meaning: "careful and not yet certain", extra: "What first appeared to be a simple obstacle revealed competing priorities, so the group compared the likely consequences of each response." };
  return { vocab: "ambivalent", meaning: "having mixed feelings", extra: "The apparent solution also carried a cost, forcing the group to distinguish immediate convenience from the longer-term effects of its choice." };
}

function buildImaginativePassage(year, index) {
  const character = STORY_PARTS.characters[(index * 3 + year) % STORY_PARTS.characters.length];
  const setting = STORY_PARTS.settings[(index * 5 + year) % STORY_PARTS.settings.length];
  const goal = STORY_PARTS.goals[(index * 7 + year) % STORY_PARTS.goals.length];
  const obstacle = STORY_PARTS.obstacles[(index * 2 + year) % STORY_PARTS.obstacles.length];
  const solution = STORY_PARTS.solutions[(index * 11 + year) % STORY_PARTS.solutions.length];
  const theme = STORY_PARTS.themes[(index * 13 + year) % STORY_PARTS.themes.length];
  const { vocab, meaning, extra } = passageComplexity(year);
  const title = `${["The Last Clue","A Change of Route","Before the Bell","The Quiet Signal","One Careful Step","Beyond the Gate"][index % 6]} ${index + 1}`;
  const text = year === 3
    ? `${character} was at ${setting}. The plan was to ${goal}. At first, the job seemed easy. Then ${obstacle} stopped the plan.\n\n${character} felt ${vocab}, but did not rush. A small detail gave ${character} a new idea. ${character} ${solution}. The plan worked, and the group could continue safely.\n\nOn the way home, ${character} understood that ${theme}.`
    : year === 5
      ? `${character} arrived at ${setting} with one clear goal: to ${goal}. The group had prepared carefully, so the task looked straightforward. Without warning, ${obstacle} changed the plan. Several people suggested quick solutions, but ${character} was ${vocab}. ${extra}\n\nInstead of choosing the first idea, ${character} checked the available clues and asked the group to explain what each option might change. After this short discussion, ${character} ${solution}. The solution required extra effort, but it allowed the group to continue without risking a worse problem.\n\nLater, ${character} reflected that ${theme}. The delay had been frustrating, yet it revealed why a thoughtful decision can be more useful than a fast one.`
      : year === 7
        ? `${character} reached ${setting} with a precise purpose: to ${goal}. Early progress made the task seem manageable, but ${obstacle} altered both the route and the time available. Some members of the group argued that any action was better than waiting. ${character}, however, remained ${vocab}. ${extra}\n\nThe obvious solution would have solved the immediate difficulty while creating another one for the people following behind. ${character} compared the available evidence, identified an assumption the group had made, and invited a quieter member to explain a different observation. Together they tested the safest part of the idea before committing to it. ${character} then ${solution}.\n\nThe response did not remove every inconvenience, but it protected what mattered most and allowed the group to continue. Looking back, ${character} recognised that ${theme}; judgement was not the absence of uncertainty, but the willingness to examine it before acting.`
        : `${character} arrived at ${setting} intending to ${goal}. The plan had appeared efficient on paper, yet ${obstacle} exposed a conflict between speed, safety and responsibility. Several members of the group treated the setback as a technical problem with a single answer. ${character} was more ${vocab}: ${extra}\n\nA rapid solution would have restored progress, but only by transferring the risk to someone else. ${character} separated verified observations from assumptions, compared the short-term and longer-term consequences, and asked whose interests were missing from the discussion. This changed the group’s understanding of the problem. After testing the most reversible option, ${character} ${solution}.\n\nThe outcome was imperfect. Time had been lost and one part of the original plan had to be abandoned. Even so, the group avoided a more serious cost and documented why the decision had been made. Later, ${character} concluded that ${theme}. What looked like hesitation had actually been a disciplined response to uncertainty.`;
  return { id: `Y${year}-PASS-I-${String(index + 1).padStart(3, "0")}`, title, type: "imaginative", text, facts: { character, setting, goal, obstacle, solution, theme, vocab, meaning } };
}

function buildInformativePassage(year, index) {
  const [topic, method, finding, recommendation, limitation] = INFO_TOPICS[index % INFO_TOPICS.length];
  const title = `${topic.replace(/^a /, "").replace(/\b\w/g, (c) => c.toUpperCase())}: Report ${index + 1}`;
  const detail = 18 + ((index * 7 + year) % 31);
  const comparison = detail + 9 + (index % 12);
  const text = year === 3
    ? `A local class completed ${topic}. First, ${method}. One group recorded ${detail} observations. Another group recorded ${comparison}.\n\nThe class found that ${finding}. They suggested ${recommendation}. The students knew their result was useful, but ${limitation}. They decided that another class could repeat the study.`
    : year === 5
      ? `A student team conducted ${topic} to answer a question about their community. Over several sessions, ${method}. One condition produced ${detail} observations, compared with ${comparison} in another condition. The students used the same recording sheet each time so that the results could be compared fairly.\n\nThe clearest pattern was that ${finding}. On the basis of this result, the team recommended ${recommendation}. The report also noted a limitation: ${limitation}. The students concluded that their evidence supported a small trial, but that more observations would be needed before the same claim could be made about every location.`
      : year === 7
        ? `A student research team conducted ${topic} in response to a practical community question. Before collecting data, the team identified the variable it wanted to compare and agreed on a consistent method. Across several sessions, ${method}. One condition produced ${detail} recorded observations, whereas the comparison condition produced ${comparison}.\n\nThe most consistent pattern was that ${finding}. The difference was large enough to justify further investigation, although the team avoided claiming that one factor alone had caused it. The researchers recommended ${recommendation} as a limited, measurable response.\n\nThe report identified an important limitation: ${limitation}. It also noted that the sample represented only a narrow period and that an unmeasured factor may have influenced the observations. The evidence therefore supports a trial and continued monitoring, rather than a permanent decision without further data.`
        : `A student research team designed ${topic} to inform a contested community decision. The team first defined the outcome it would measure, documented possible confounding factors and selected a repeatable sampling method. Across several sessions, ${method}. The primary comparison produced ${detail} observations in one condition and ${comparison} in another.\n\nThe data were consistent with the claim that ${finding}, but the size of the difference did not by itself establish causation. The team checked whether the pattern remained after excluding one unusual observation and found that the general direction was unchanged. It therefore recommended ${recommendation}, framed as a reversible trial with published monitoring criteria.\n\nTwo qualifications matter. First, ${limitation}. Second, the sampling period may not represent other seasons or patterns of use. These constraints do not make the investigation worthless; they limit the strength and reach of its conclusion. The report argues that the evidence is sufficient for a carefully evaluated next step, but not for a universal claim.`;
  return { id: `Y${year}-PASS-N-${String(index + 1).padStart(3, "0")}`, title, type: "informative", text, facts: { topic, method, finding, recommendation, limitation, detail, comparison } };
}

function buildPersuasivePassage(year, index) {
  const [position, reason1, reason2, counterargument, call] = PERSUASIVE_TOPICS[index % PERSUASIVE_TOPICS.length];
  const title = `A Case for Change ${index + 1}`;
  const text = year === 3
    ? `I believe ${position}. First, ${reason1}. Also, ${reason2}.\n\nSome people say that ${counterargument}. This concern matters, but we can start with a small trial. We should ${call}. A careful change could help the community learn what works.`
    : year === 5
      ? `Our community should consider a practical change: ${position}. One strong reason is that ${reason1}. Another is that ${reason2}. Together, these benefits could improve how people use and share local spaces.\n\nSome people may argue that ${counterargument}. This concern should not be ignored, but it can be tested rather than treated as a reason to do nothing. A short trial would allow organisers to collect feedback and correct problems.\n\nThe sensible next step is to ${call}. If the results are recorded and discussed, the community can decide whether the proposal should continue.`
      : year === 7
        ? `The community should act on a practical proposal: ${position}. The strongest reason is that ${reason1}. In addition, ${reason2}. These benefits are not merely convenient; they can support fairer and more thoughtful participation.\n\nCritics may argue that ${counterargument}. That concern deserves attention, particularly if the proposal creates costs for people who receive fewer benefits. However, uncertainty is not a reason to avoid all action. A limited, measurable trial can protect against unintended effects while producing evidence for the next decision.\n\nThe sensible next step is to ${call}. The trial should publish its goals, collect feedback from different users and identify a clear point for review. This approach is more responsible than either adopting the proposal permanently without evidence or rejecting it on assumptions alone.`
        : `The proposal that ${position} should be judged by its likely effects rather than by whether it preserves familiar routines. The immediate case is persuasive: ${reason1}. More broadly, ${reason2}. These outcomes matter because access, cost and participation are not distributed evenly across a community.\n\nOpponents may respond that ${counterargument}. This objection identifies a genuine implementation risk, but it does not establish that the underlying proposal is unsound. The relevant question is whether the risk can be reduced, measured and compared with the cost of maintaining the current arrangement. A reversible trial with transparent criteria would provide better evidence than competing predictions.\n\nAccordingly, decision-makers should ${call}. They should also publish baseline information, invite responses from groups likely to be affected differently and set a review date before the trial begins. A proposal earns support not because it is described as progress, but because its benefits, burdens and alternatives can withstand scrutiny.`;
  return { id: `Y${year}-PASS-P-${String(index + 1).padStart(3, "0")}`, title, type: "persuasive", text, facts: { position, reason1, reason2, counterargument, call } };
}

function readingQuestionsForPassage(year, passage, startIndex, rng) {
  const f = passage.facts;
  const cognitiveDifficulty = {
    3: ["easy", "easy", "easy", "medium", "medium", "medium", "hard"],
    5: ["easy", "easy", "medium", "medium", "medium", "hard", "hard"],
    7: ["easy", "medium", "medium", "medium", "hard", "hard", "hard"],
    9: ["easy", "medium", "medium", "hard", "hard", "hard", "hard"],
  }[year];
  const common = (local, skill, prompt, explanation, itemType = "multiple_choice") => ({
    id: makeId(year, "REA", startIndex + local),
    year,
    domain: "reading",
    subdomain: passage.type,
    skill,
    difficulty: cognitiveDifficulty[local],
    prompt,
    explanation,
    stimulus: { id: passage.id, title: passage.title, text_type: passage.type, text: passage.text },
    itemType,
    calculator: "not_applicable",
  });

  if (passage.type === "imaginative") {
    return [
      mcqItem(common(0, "locating explicit information", `Where does the story begin?`, `The opening sentence places the action at ${f.setting}.`), f.setting, STORY_PARTS.settings.filter((v) => v !== f.setting).slice(0, 3), rng),
      mcqItem(common(1, "interpreting motivation", `What was ${f.character} trying to achieve?`, `The passage states that the purpose was to ${f.goal}.`, "hot_text"), f.goal, STORY_PARTS.goals.filter((v) => v !== f.goal).slice(0, 3), rng),
      mcqItem(common(2, "sequencing and cause", `Which event created the main complication?`, `${f.obstacle} interrupts the original plan.`), f.obstacle, STORY_PARTS.obstacles.filter((v) => v !== f.obstacle).slice(0, 3), rng),
      mcqItem(common(3, "vocabulary in context", `In this passage, “${f.vocab}” most nearly means`, `The surrounding actions show that ${f.character} was ${f.meaning}.`, "inline_choice"), f.meaning, ["angry without a reason", "moving very quickly", "certain that nothing could go wrong"], rng),
      mcqItem(common(4, "main idea and theme", `Which statement best expresses a theme of the story?`, `The final reflection states that ${f.theme}.`), f.theme, STORY_PARTS.themes.filter((v) => v !== f.theme).slice(0, 3), rng),
      multiSelectItem(common(5, "analysing character", `Choose two details that best show ${f.character} acts thoughtfully.`, `The character pauses to inspect the situation and uses evidence before acting.`), ["The character checks the situation before deciding.", "The character uses an observed clue to guide the response."], ["The character ignores the group and acts without evidence.", "The character assumes the first plan cannot fail."], rng),
      orderingItem(
        common(6, "analysing narrative sequence", "Drag the cards into first, next and last order to show how the resolution develops.", "The sequence moves from disruption, through evidence-based decision-making, to a resolution and reflection."),
        [
          "The original plan is interrupted by a complication.",
          "The character examines a clue before deciding what to do.",
          "The solution addresses the problem and leads to a reflection.",
        ],
        rng,
      ),
    ];
  }

  if (passage.type === "informative") {
    return [
      mcqItem(common(0, "locating explicit information", `What did the student team investigate?`, `The first sentence identifies ${f.topic}.`), f.topic, INFO_TOPICS.filter((row) => row[0] !== f.topic).slice(0, 3).map((row) => row[0]), rng),
      mcqItem(common(1, "interpreting data", `What comparison was reported?`, `The passage compares ${f.detail} observations with ${f.comparison}.`), `${f.detail} observations and ${f.comparison} observations`, [`${f.detail + f.comparison} observations in both groups`, `${f.detail} minutes and ${f.comparison} kilometres`, `two groups with exactly the same result`], rng),
      mcqItem(common(2, "cause and effect", `Which finding was clearest in the study?`, `The report explicitly states that ${f.finding}.`), f.finding, INFO_TOPICS.filter((row) => row[2] !== f.finding).slice(0, 3).map((row) => row[2]), rng),
      mcqItem(common(3, "purpose of recommendation", `Why did the team recommend ${f.recommendation}?`, `It responds to the pattern described in the findings.`, "inline_choice"), "It is a practical response to the observed pattern.", ["It guarantees the same result everywhere.", "It removes the need to collect any more evidence.", "It was unrelated to the investigation."], rng),
      mcqItem(common(4, "interpreting limitations", `What does the limitation suggest?`, `The limitation narrows how confidently the result can be generalised.`), "The result is useful but should not be assumed to apply in every situation.", ["The investigation has no value at all.", "The recommendation has already been proven everywhere.", "The data must have been invented."], rng),
      multiSelectItem(common(5, "analysing evidence", `Choose two features that make the report appropriately cautious.`, `The report identifies a limitation and avoids claiming that the observed relationship proves a cause.`), ["It identifies a limitation in the investigation.", "It avoids treating the observed pattern as universal proof."], ["It guarantees that the result applies everywhere.", "It removes all uncertainty from the conclusion."], rng),
      orderingItem(
        common(6, "analysing investigation sequence", "Drag the cards into first, next and last order to show how the report builds its conclusion.", "A sound investigation applies a consistent method, compares observations, then qualifies and acts on the finding."),
        [
          "The team applies a consistent method to collect observations.",
          "The team compares the recorded results and identifies a pattern.",
          "The team qualifies the finding and recommends a measured next step.",
        ],
        rng,
      ),
    ];
  }

  return [
    mcqItem(common(0, "identifying position", `What position does the writer support?`, `The opening sentence states that ${f.position}.`), f.position, PERSUASIVE_TOPICS.filter((row) => row[0] !== f.position).slice(0, 3).map((row) => row[0]), rng),
    mcqItem(common(1, "locating reasons", `Which reason does the writer give?`, `The passage argues that ${f.reason1}.`), f.reason1, PERSUASIVE_TOPICS.filter((row) => row[1] !== f.reason1).slice(0, 3).map((row) => row[1]), rng),
    mcqItem(common(2, "author purpose", `What is the main purpose of this text?`, `The writer presents reasons to persuade the reader to support a change.`), "to persuade readers to support a proposed change", ["to entertain with a fictional mystery", "to report neutral scientific results only", "to explain how to calculate a measurement"], rng),
    mcqItem(common(3, "counterargument", `Why does the writer mention that ${f.counterargument}?`, `The writer acknowledges an opposing concern before responding to it.`, "inline_choice"), "to acknowledge and answer an opposing view", ["to abandon the main position", "to introduce an unrelated topic", "to prove that no action is possible"], rng),
    mcqItem(common(4, "persuasive devices", `What effect does the phrase “The sensible next step” have?`, `It frames the proposed action as reasonable and practical.`), "It presents the recommendation as reasonable.", ["It makes the proposal sound impossible.", "It changes the passage into a narrative.", "It removes the writer's point of view."], rng),
    multiSelectItem(common(5, "evaluating argument", `Choose two features that strengthen the writer's argument.`, `The writer acknowledges a concern and proposes a measurable way to test the recommendation.`), ["The writer acknowledges a concern about the proposal.", "The writer proposes a measurable trial or review."], ["The writer treats an unsupported rumour as proof.", "The writer avoids explaining what should happen next."], rng),
    orderingItem(
      common(6, "analysing argument structure", "Drag the cards into first, next and last order to show how the writer develops the argument.", "The argument states a position, addresses an opposing concern, then proposes a practical action."),
      [
        "The writer states a position and supports it with reasons.",
        "The writer acknowledges and responds to an opposing concern.",
        `The writer proposes a practical next step: ${f.call}.`,
      ],
      rng,
    ),
  ];
}

function generateReading(year, rng) {
  const passageTypes = year <= 5
    ? rng.shuffle([...Array(32).fill("imaginative"), ...Array(28).fill("informative"), ...Array(20).fill("persuasive")])
    : rng.shuffle([...Array(26).fill("imaginative"), ...Array(27).fill("informative"), ...Array(27).fill("persuasive")]);
  const items = [];
  const counters = { imaginative: 0, informative: 0, persuasive: 0 };
  passageTypes.forEach((type, passageIndex) => {
    const typeIndex = counters[type]++;
    const passage = type === "imaginative"
      ? buildImaginativePassage(year, typeIndex + passageIndex)
      : type === "informative"
        ? buildInformativePassage(year, typeIndex + passageIndex)
        : buildPersuasivePassage(year, typeIndex + passageIndex);
    items.push(...readingQuestionsForPassage(year, passage, passageIndex * 7, rng));
  });
  return items;
}

const NARRATIVE_PROMPTS = [
  "The Unexpected Map","A Sound Below","The Second Door","The Day the Signs Changed","The Borrowed Bicycle","A Message in the Rain","The Empty Seat","Before the Lights Returned","The Smallest Rescue","The Last Bus Home",
  "A Package with No Name","The Hidden Garden","One Minute Too Late","The Photograph on the Floor","A Different Kind of Prize","When the River Rose","The Unfinished Model","The Visitor at Dawn","The Long Way Around","What the Telescope Found",
];
const PERSUASIVE_PROMPTS = [
  "Every school should have a vegetable garden","Homework should be redesigned","Public parks need more shade","Students should help plan school events","Repairing is better than replacing","Community libraries should stay open later","School uniforms should include more choice","Young people should learn first aid",
  "Local streets should have safer cycling routes","Every class should spend time outdoors","School canteens should reduce food waste","Students should have a voice in technology rules","Community events should include quiet spaces","Pets should be allowed in more public places","Museums should be free for students","Schools should teach practical money skills",
  "Public transport should be easier to understand","Team projects are better than individual projects","Every neighbourhood needs a shared tool library","Advertising aimed at children needs stronger rules",
];

function generateWriting(year, rng) {
  const items = [];
  NARRATIVE_PROMPTS.forEach((title, index) => {
    const younger = year <= 5;
    items.push(baseItem({
      id: makeId(year, "WRI", index),
      year,
      domain: "writing",
      subdomain: "narrative",
      skill: "independent construction of a narrative",
      difficulty: "not_applicable",
      itemType: "writing_prompt",
      calculator: "not_applicable",
      prompt: `Write a narrative titled “${title}”.`,
      stimulus: {
        type: "writing_prompt",
        title,
        instructions: younger
          ? "Create characters and a setting. Build a problem or complication, then show what happens."
          : "Craft an engaging narrative centred on the title. Develop tension or conflict and shape the resolution for effect.",
        suggested_time_minutes: year === 3 ? 40 : 42,
      },
      choices: null,
      answer: { type: "extended_response", rubric_ref: "../writing-rubric-ai.md", maximum_score: 47 },
      explanation: "Narrative responses are assessed independently across the 10 narrative criteria; there is no single model answer.",
      tags: ["orientation", "complication", "resolution"],
    }));
  });
  PERSUASIVE_PROMPTS.forEach((title, localIndex) => {
    const index = 20 + localIndex;
    const younger = year <= 5;
    items.push(baseItem({
      id: makeId(year, "WRI", index),
      year,
      domain: "writing",
      subdomain: "persuasive",
      skill: "independent construction of a persuasive text",
      difficulty: "not_applicable",
      itemType: "writing_prompt",
      calculator: "not_applicable",
      prompt: `Write a persuasive text about this statement: “${title}.”`,
      stimulus: {
        type: "writing_prompt",
        title,
        instructions: younger
          ? "State your opinion, give clear reasons and finish with a conclusion that supports your view."
          : "Develop a sustained position with relevant evidence, persuasive devices, a coherent structure and a purposeful conclusion.",
        suggested_time_minutes: year === 3 ? 40 : 42,
      },
      choices: null,
      answer: { type: "extended_response", rubric_ref: "../writing-rubric-ai.md", maximum_score: 48 },
      explanation: "Persuasive responses are assessed independently across the 10 persuasive criteria; there is no single model answer.",
      tags: ["introduction", "body", "conclusion", "position"],
    }));
  });
  return items;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(REPORTS, { recursive: true });
  const manifest = {
    bank_version: VERSION,
    schema_version: "2.0",
    generated_at: new Date().toISOString(),
    licence_note: "All questions are original practice materials. They are not official NAPLAN items and are not endorsed by ACARA.",
    difficulty_note: "Difficulty is a year-relative design estimate plus an uncalibrated cross-year absolute complexity index. It is not an official NAPLAN scale score or proficiency level.",
    official_alignment: OFFICIAL_ALIGNMENT,
    year_profiles: YEAR_PROFILES,
    year_levels: {},
  };

  for (const year of YEARS) {
    const rng = new Rng(202600 + year * 997);
    const numeracy = generateNumeracy(year, rng);
    const conventions = generateConventions(year, rng);
    const reading = generateReading(year, rng);
    const writing = generateWriting(year, rng);
    const items = [...reading, ...conventions, ...numeracy, ...writing];
    const file = `year-${year}.jsonl`;
    await writeFile(path.join(OUT, file), `${items.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");
    manifest.year_levels[year] = {
      file,
      total_items: items.length,
      by_domain: countBy(items, "domain"),
      by_difficulty: countBy(items, "difficulty"),
      by_absolute_complexity: countBy(items, (item) => item.difficulty_model.absolute_complexity ?? "not_applicable"),
      by_pathway_band: countBy(items, "pathway_band"),
      by_item_type: countBy(items, "item_type"),
      answer_critical_media_items: items.filter((item) => item.media.some((asset) => asset.answer_critical)).length,
      machine_scorable_items: items.filter((item) => item.scoring.status === "machine_scorable").length,
      psychometric_status: "uncalibrated",
      numeracy_by_strand: countBy(numeracy, "subdomain"),
      conventions_by_subdomain: countBy(conventions, "subdomain"),
      reading_by_text_type: countBy(reading, "subdomain"),
    };
  }

  await writeFile(path.join(ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(REPORTS, "generation.log"), `${JSON.stringify(manifest.year_levels, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(manifest.year_levels, null, 2)}\n`);
}

await main();
