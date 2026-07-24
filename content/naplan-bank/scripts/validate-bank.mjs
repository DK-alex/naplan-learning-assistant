import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS = path.join(ROOT, "questions");
const REPORTS = path.join(ROOT, "reports");
const YEARS = [3, 5, 7, 9];

const EXPECTED = {
  domain: { reading: 560, conventions_of_language: 600, numeracy: 800, writing: 40 },
  conventions: { spelling: 288, grammar: 218, punctuation: 94 },
  readingYoung: { imaginative: 224, informative: 196, persuasive: 140 },
  readingSenior: { imaginative: 182, informative: 189, persuasive: 189 },
  difficulty: {
    3: { easy: 772, medium: 870, hard: 318, not_applicable: 40 },
    5: { easy: 608, medium: 884, hard: 468, not_applicable: 40 },
    7: { easy: 458, medium: 884, hard: 618, not_applicable: 40 },
    9: { easy: 388, medium: 790, hard: 782, not_applicable: 40 },
  },
  absoluteComplexity: {
    3: { easy: 1, medium: 2, hard: 3 },
    5: { easy: 3, medium: 4, hard: 5 },
    7: { easy: 5, medium: 6, hard: 7 },
    9: { easy: 7, medium: 8, hard: 9 },
  },
  readingPassageWords: {
    3: [65, 90],
    5: [110, 150],
    7: [145, 190],
    9: [170, 220],
  },
};

const SINGLE_RESPONSE_TYPES = new Set(["multiple_choice", "hot_text", "inline_choice", "hotspot"]);
const REQUIRED_INTERACTIONS = {
  3: ["multiple_choice", "hot_text", "inline_choice", "multiple_select", "drag_and_drop", "matrix", "hotspot", "text_entry", "writing_prompt"],
  5: ["multiple_choice", "hot_text", "inline_choice", "multiple_select", "drag_and_drop", "matrix", "hotspot", "text_entry", "writing_prompt"],
  7: ["multiple_choice", "hot_text", "inline_choice", "multiple_select", "drag_and_drop", "matrix", "hotspot", "text_entry", "writing_prompt"],
  9: ["multiple_choice", "hot_text", "inline_choice", "multiple_select", "drag_and_drop", "matrix", "hotspot", "text_entry", "writing_prompt"],
};

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function sameCounts(actual, expected) {
  return Object.entries(expected).every(([key, value]) => actual[key] === value);
}

function fingerprint(item) {
  return JSON.stringify([
    item.domain,
    item.subdomain,
    item.prompt,
    item.stimulus,
    item.answer?.display ?? item.answer?.value ?? null,
  ]);
}

const report = {
  generated_at: new Date().toISOString(),
  result: "passed",
  years: {},
  errors: [],
  warnings: [],
};

const readingWordAverages = {};

for (const year of YEARS) {
  const file = path.join(QUESTIONS, `year-${year}.jsonl`);
  const lines = (await readFile(file, "utf8")).trim().split(/\r?\n/);
  const items = [];
  lines.forEach((line, index) => {
    try {
      items.push(JSON.parse(line));
    } catch (error) {
      report.errors.push(`Year ${year}, line ${index + 1}: invalid JSON (${error.message})`);
    }
  });

  const ids = new Set();
  const content = new Set();
  let duplicateContent = 0;
  for (const item of items) {
    if (ids.has(item.id)) report.errors.push(`Duplicate id: ${item.id}`);
    ids.add(item.id);

    const fp = fingerprint(item);
    if (content.has(fp)) duplicateContent += 1;
    content.add(fp);

    if (item.year_level !== year) report.errors.push(`${item.id}: year_level mismatch`);
    if (!item.prompt || !item.domain || !item.subdomain || !item.difficulty) report.errors.push(`${item.id}: missing required field`);
    if (!["easy", "medium", "hard", "not_applicable"].includes(item.difficulty)) report.errors.push(`${item.id}: invalid difficulty`);
    if (!item.provenance?.original_item || item.provenance?.official_item || item.provenance?.source_mode !== "public_spec_reference") {
      report.errors.push(`${item.id}: provenance must mark the item as original, unofficial and public-spec-derived`);
    }

    if (!item.year_profile?.age_band || !item.year_profile?.curriculum_band) report.errors.push(`${item.id}: missing year profile`);
    if (item.difficulty_model?.relative_band !== item.difficulty) report.errors.push(`${item.id}: difficulty model does not match difficulty label`);
    if (item.difficulty === "not_applicable") {
      if (item.domain !== "writing") report.errors.push(`${item.id}: only writing may use not_applicable difficulty`);
      if (item.difficulty_model?.absolute_complexity !== null) report.errors.push(`${item.id}: writing must not have an absolute difficulty index`);
      if (item.pathway_band !== "not_applicable") report.errors.push(`${item.id}: writing must not enter a pathway band`);
    } else {
      const expectedAbsolute = EXPECTED.absoluteComplexity[year][item.difficulty];
      if (item.difficulty_model?.absolute_complexity !== expectedAbsolute) {
        report.errors.push(`${item.id}: expected absolute complexity ${expectedAbsolute}`);
      }
      const expectedPathway = item.difficulty === "easy" ? "lower" : item.difficulty === "hard" ? "higher" : "average";
      if (item.pathway_band !== expectedPathway) report.errors.push(`${item.id}: pathway band does not match difficulty`);
    }

    if (!item.curriculum?.descriptor || item.curriculum?.descriptor !== item.skill) report.errors.push(`${item.id}: curriculum descriptor must match the skill`);
    if (!item.testlet || !Array.isArray(item.testlet.eligible_nodes)) report.errors.push(`${item.id}: missing testlet metadata`);
    if (item.domain === "writing" && item.testlet?.adaptive_design !== "none") report.errors.push(`${item.id}: writing must not be adaptive`);
    if (item.domain !== "writing" && item.testlet?.adaptive_design !== "multistage_testlet") report.errors.push(`${item.id}: objective item must be testlet eligible`);

    if (item.interaction?.renderer !== item.item_type || item.interaction?.keyboard_complete !== true) {
      report.errors.push(`${item.id}: invalid interaction definition`);
    }
    if (!item.scoring || item.scoring.max_score < 1) report.errors.push(`${item.id}: missing scoring metadata`);
    if (!item.tool_policy || typeof item.tool_policy.calculator !== "boolean") report.errors.push(`${item.id}: missing tool policy`);
    if (!Array.isArray(item.media)) report.errors.push(`${item.id}: media must be an array`);
    for (const asset of item.media ?? []) {
      if (!asset.asset_id || !asset.alt_text || asset.original !== true) report.errors.push(`${item.id}: invalid media provenance or alternative text`);
    }
    if (item.accessibility?.keyboard_complete !== true || item.accessibility?.zoom_200_percent !== true) {
      report.errors.push(`${item.id}: accessibility metadata is incomplete`);
    }
    if (item.review?.psychometric !== "uncalibrated") report.errors.push(`${item.id}: generated items must remain explicitly uncalibrated`);

    if (SINGLE_RESPONSE_TYPES.has(item.item_type)) {
      if (!Array.isArray(item.options) || item.options.length !== 4) report.errors.push(`${item.id}: choice item must have 4 options`);
      const optionIds = new Set((item.options ?? []).map((option) => option.id));
      const optionTexts = new Set((item.options ?? []).map((option) => option.text));
      if (item.answer?.type !== "single_choice") report.errors.push(`${item.id}: single-response item has the wrong answer type`);
      if (!optionIds.has(item.answer?.value)) report.errors.push(`${item.id}: answer does not match an option`);
      if (optionIds.size !== (item.options ?? []).length) report.errors.push(`${item.id}: duplicate option ids`);
      if (optionTexts.size !== (item.options ?? []).length) report.errors.push(`${item.id}: duplicate option text`);
      const selected = (item.options ?? []).find((option) => option.id === item.answer?.value);
      if (selected && String(selected.text) !== String(item.answer?.display)) report.errors.push(`${item.id}: answer display does not match selected option`);
    }

    if (item.item_type === "multiple_select") {
      const optionIds = new Set((item.options ?? []).map((option) => option.id));
      if (!Array.isArray(item.options) || item.options.length !== 4) report.errors.push(`${item.id}: multiple select must have 4 options`);
      if (item.answer?.type !== "multiple_select" || !Array.isArray(item.answer?.values) || item.answer.values.length !== 2) {
        report.errors.push(`${item.id}: multiple select must have exactly two correct values`);
      }
      if (!(item.answer?.values ?? []).every((value) => optionIds.has(value))) report.errors.push(`${item.id}: multiple-select answer does not match options`);
    }

    if (item.item_type === "drag_and_drop") {
      const optionIds = new Set((item.options ?? []).map((option) => option.id));
      const placements = item.answer?.placements ?? {};
      const targets = item.answer?.targets ?? [];
      const targetIds = new Set(targets.map((target) => target.id));
      if (!Array.isArray(item.options) || item.options.length < 2) report.errors.push(`${item.id}: drag item must have at least 2 draggable options`);
      if (
        item.answer?.type !== "drag_drop"
        || targets.length < 2
        || Object.keys(placements).length !== targets.length
        || !Object.keys(placements).every((targetId) => targetIds.has(targetId))
      ) report.errors.push(`${item.id}: invalid drag-drop response map`);
      if (!Object.values(placements).every((value) => optionIds.has(value))) report.errors.push(`${item.id}: drag-drop answer does not match options`);
      if (new Set(Object.values(placements)).size !== Object.values(placements).length) report.errors.push(`${item.id}: drag-drop sorting answer reuses an option`);
    }

    if (item.item_type === "matrix") {
      const rows = item.answer?.rows ?? [];
      const columns = item.answer?.columns ?? [];
      const values = item.answer?.values ?? {};
      if (item.answer?.type !== "matrix" || rows.length < 2 || columns.length < 2) report.errors.push(`${item.id}: invalid matrix definition`);
      if (!rows.every((row) => values[row.id] && columns.some((column) => column.id === values[row.id]))) {
        report.errors.push(`${item.id}: incomplete matrix answer map`);
      }
    }

    if (item.item_type === "text_entry") {
      if (!item.answer?.value || !item.answer?.accepted?.length) report.errors.push(`${item.id}: text item missing accepted answer`);
      if (!(item.answer?.accepted ?? []).includes(String(item.answer?.value ?? "").toLowerCase())) report.errors.push(`${item.id}: accepted answers do not include the canonical value`);
    }

    if (item.item_type === "writing_prompt") {
      const expectedMax = item.subdomain === "narrative" ? 47 : 48;
      if (item.answer?.maximum_score !== expectedMax) report.errors.push(`${item.id}: writing maximum score must be ${expectedMax}`);
      if (item.answer?.rubric_ref !== "../writing-rubric-ai.md") report.errors.push(`${item.id}: writing rubric reference is missing or incorrect`);
      if (item.difficulty !== "not_applicable") report.errors.push(`${item.id}: writing prompts must not use easy/medium/hard`);
    }

    if (year <= 5 && item.domain === "numeracy" && item.calculator === "allowed") {
      report.errors.push(`${item.id}: Year ${year} numeracy cannot be calculator allowed`);
    }
    if (year === 3 && (item.tool_policy?.ruler || item.tool_policy?.protractor || item.tool_policy?.calculator)) {
      report.errors.push(`${item.id}: Year 3 numeracy must not enable mathematical tools`);
    }
    if ((item.tool_policy?.ruler || item.tool_policy?.protractor) && !item.stimulus?.visual?.answer_critical) {
      report.errors.push(`${item.id}: measurement tool item needs an answer-critical visual specification`);
    }
  }

  const byDomain = countBy(items, "domain");
  const conventions = countBy(items.filter((item) => item.domain === "conventions_of_language"), "subdomain");
  const reading = countBy(items.filter((item) => item.domain === "reading"), "subdomain");
  const difficulty = countBy(items, "difficulty");
  const expectedReading = year <= 5 ? EXPECTED.readingYoung : EXPECTED.readingSenior;

  if (items.length !== 2000) report.errors.push(`Year ${year}: expected 2000 items, found ${items.length}`);
  if (!sameCounts(byDomain, EXPECTED.domain)) report.errors.push(`Year ${year}: domain allocation mismatch`);
  if (!sameCounts(conventions, EXPECTED.conventions)) report.errors.push(`Year ${year}: conventions allocation mismatch`);
  if (!sameCounts(reading, expectedReading)) report.errors.push(`Year ${year}: reading text-type allocation mismatch`);
  if (!sameCounts(difficulty, EXPECTED.difficulty[year])) report.errors.push(`Year ${year}: year-specific difficulty allocation mismatch`);
  if (duplicateContent > 0) report.errors.push(`Year ${year}: ${duplicateContent} exact duplicate item fingerprints`);

  const itemTypes = countBy(items, "item_type");
  for (const requiredType of REQUIRED_INTERACTIONS[year]) {
    if (!itemTypes[requiredType]) report.errors.push(`Year ${year}: missing required interaction ${requiredType}`);
  }

  const spelling = items.filter((item) => item.subdomain === "spelling");
  const spellingTypes = countBy(spelling, "skill");
  if (!sameCounts(spellingTypes, { audio_dictation: 173, mistake_identified: 58, mistake_not_identified: 57 })) {
    report.errors.push(`Year ${year}: spelling item-type allocation mismatch`);
  }

  const readingItems = items.filter((item) => item.domain === "reading");
  const passageMap = new Map(readingItems.map((item) => [item.stimulus?.id, item.stimulus?.text ?? ""]));
  const passageIds = new Set(passageMap.keys());
  if (passageIds.size !== 80) report.errors.push(`Year ${year}: expected 80 reading passages, found ${passageIds.size}`);
  readingWordAverages[year] = [...passageMap.values()]
    .reduce((sum, text) => sum + text.split(/\s+/).filter(Boolean).length, 0) / Math.max(1, passageMap.size);
  const [minimumAverageWords, maximumAverageWords] = EXPECTED.readingPassageWords[year];
  if (readingWordAverages[year] < minimumAverageWords || readingWordAverages[year] > maximumAverageWords) {
    report.errors.push(`Year ${year}: average reading passage length must be ${minimumAverageWords}–${maximumAverageWords} words`);
  }

  report.years[year] = {
    total_items: items.length,
    unique_ids: ids.size,
    unique_item_fingerprints: content.size,
    reading_passages: passageIds.size,
    average_reading_words: Number(readingWordAverages[year].toFixed(1)),
    by_domain: byDomain,
    by_difficulty: difficulty,
    by_item_type: itemTypes,
    conventions_by_subdomain: conventions,
    reading_by_text_type: reading,
    spelling_by_item_type: spellingTypes,
  };
}

for (let index = 1; index < YEARS.length; index += 1) {
  const younger = YEARS[index - 1];
  const older = YEARS[index];
  if (!(readingWordAverages[older] > readingWordAverages[younger])) {
    report.errors.push(`Reading complexity: Year ${older} average passage length must exceed Year ${younger}`);
  }
}

report.warnings.push("All difficulty parameters are design estimates. Psychometric calibration and DIF review are still required before scaled reporting.");

if (report.errors.length > 0) report.result = "failed";

const md = [
  "# NAPLAN practice bank validation",
  "",
  `final result: ${report.result}`,
  "",
  `Generated: ${report.generated_at}`,
  "",
  "## Year-level results",
  "",
  "| Year | Items | Unique IDs | Unique fingerprints | Reading passages | Avg passage words | Easy | Medium | Hard | N/A |",
  "|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...YEARS.map((year) => {
    const row = report.years[year];
    return `| ${year} | ${row.total_items} | ${row.unique_ids} | ${row.unique_item_fingerprints} | ${row.reading_passages} | ${row.average_reading_words} | ${row.by_difficulty.easy} | ${row.by_difficulty.medium} | ${row.by_difficulty.hard} | ${row.by_difficulty.not_applicable} |`;
  }),
  "",
  "## Errors",
  "",
  ...(report.errors.length ? report.errors.map((error) => `- ${error}`) : ["- None"]),
  "",
  "## Warnings",
  "",
  ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ["- None"]),
  "",
].join("\n");

await writeFile(path.join(REPORTS, "validation.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(path.join(REPORTS, "validation.md"), md, "utf8");

process.stdout.write(`${JSON.stringify({ result: report.result, errors: report.errors.length, warnings: report.warnings.length, years: report.years }, null, 2)}\n`);
if (report.result !== "passed") process.exitCode = 1;
