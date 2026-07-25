const RAW_TYPES = [
  [3, 1, "picture-subtraction", "number", "subtract from a pictured collection", "collection_subtraction", "single_choice", "pictured collection", [], "standard"],
  [3, 2, "recognise-halves", "number", "recognise two equal halves in partitioned shapes", "equal_halves", "multiple_select_exact_2", "partitioned circles", [], "standard"],
  [3, 3, "missing-addend-story", "number", "find an unknown addend from an initial and final total", "missing_addend", "numeric_text_entry", "part-whole scene", [], "standard"],
  [3, 4, "order-lengths-visual", "measurement", "compare and order four visible lengths", "order_lengths", "drag_drop_order_4", "four illustrated objects", [], "standard"],
  [3, 5, "threshold-classification-matrix", "number", "classify numbers on either side of a benchmark", "threshold_matrix", "matrix_single_choice_per_column", "number-card table", [], "standard"],
  [3, 6, "match-collections-to-numbers", "number", "match pictured collection counts to number labels", "match_collections", "drag_drop_matching_4", "four object collections", [], "standard"],
  [3, 7, "addition-equation-drag", "number", "complete an equation for a two-part addition situation", "addition_equation", "drag_one_token_to_equation_blank", "equation and number tiles", [], "standard"],
  [3, 8, "compare-lengths-uniform-units", "measurement", "compare lengths measured with equal informal units", "informal_length_compare", "dropdown_sentence_completion", "objects aligned with equal units", [], "standard"],
  [3, 9, "select-collection-by-cardinality", "number", "select a pictured collection matching a two-digit number", "select_collection", "single_hotspot_region", "three pictured collections", [], "standard"],
  [3, 10, "identify-shapes-in-composite", "space", "identify all triangles in a partitioned composite shape", "composite_triangles", "multiple_hotspot_regions", "partitioned composite polygon", [], "standard"],
  [3, 11, "pair-complements-to-target", "number", "pair six values into three pairs with a shared target total", "pair_complements", "drag_drop_pairing_3", "six value cards and pair slots", [], "standard"],

  [5, 1, "half-of-visual-collection", "number", "find half of an even pictured collection", "half_collection", "single_choice", "open container and item collection", [], "standard"],
  [5, 2, "possible-die-outcomes", "probability", "identify every possible outcome of a standard die", "die_outcomes", "multiple_select_all_valid", "die and outcome cards", [], "standard"],
  [5, 3, "sum-category-counts", "number", "add three quantities from a labelled visual table", "sum_categories", "numeric_text_entry", "illustrated category table", [], "standard"],
  [5, 4, "repeated-spending-budget", "number", "multiply a repeated cost and subtract it from a budget", "repeated_budget", "currency_numeric_text_entry", "budget ledger", [], "standard"],
  [5, 5, "order-lengths-visual", "measurement", "compare and order four visible lengths", "order_lengths", "drag_drop_order_4", "four illustrated objects", [], "standard"],
  [5, 6, "compare-measures-to-benchmark", "measurement", "classify metric lengths relative to a benchmark", "measure_benchmark_matrix", "matrix_single_choice_per_row", "measurement comparison table", [], "standard"],
  [5, 7, "match-polygons-to-vertex-count", "space", "match convex and concave polygons to vertex counts", "polygon_vertices", "drag_drop_matching_3", "three irregular logo polygons", [], "standard"],
  [5, 8, "addition-equation-drag", "number", "complete an equation representing the total of two quantities", "addition_equation", "drag_one_token_to_equation_blank", "equation and number tiles", [], "standard"],
  [5, 9, "measure-image-with-online-ruler", "measurement", "measure an illustrated object in centimetres with an on-screen ruler", "ruler_whole", "tool_assisted_single_choice", "measurable object", ["ruler"], "standard"],
  [5, 10, "complete-subtraction-equation", "number", "complete both missing values in a subtraction equation", "subtraction_equation", "two_dropdown_equation_completion", "equation with two blanks", [], "standard"],
  [5, 11, "greatest-value-mixed-representations-table", "number", "compare digits and number words and select the greatest", "mixed_representation_greatest", "single_table_cell_hotspot", "mixed-representation table", [], "standard"],
  [5, 12, "select-two-banknotes-for-total", "number", "select two banknote denominations that make a target amount", "banknote_total", "multiple_hotspot_exact_2", "four original practice banknotes", [], "standard"],
  [5, 13, "pair-complements-to-target", "number", "pair six represented values into target-sum pairs", "pair_complements", "drag_drop_pairing_3", "six represented values and pair slots", [], "standard"],

  [7, 1, "equal-groups-plus-remainder", "number", "combine several equal groups and a leftover quantity", "groups_plus_remainder", "single_choice", "capacity containers", [], "non_calculator"],
  [7, 2, "redistribute-equal-groups", "number", "find a total and redistribute it into equal groups", "redistribute_groups", "numeric_text_entry", "shelves with repeated items", [], "non_calculator"],
  [7, 3, "fraction-to-decimal-power-of-ten", "number", "convert a power-of-ten fraction to decimal notation", "fraction_decimal", "decimal_text_entry", "proportion grid", [], "non_calculator"],
  [7, 4, "fundamental-counting-principle", "probability", "represent independent choices with multiplication", "counting_principle", "multiple_select_exact_2", "choice-category board", [], "non_calculator"],
  [7, 5, "classify-event-probability", "probability", "classify events as impossible, possible or certain", "probability_matrix", "matrix_single_choice_per_row", "probability table", [], "calculator"],
  [7, 6, "order-reflex-and-nonreflex-angles", "space", "compare and order angle sizes from diagrams", "order_angles", "drag_drop_order_4", "four angle fans", [], "calculator"],
  [7, 7, "match-measurement-attribute-to-unit", "measurement", "match attributes to plausible values and metric units", "measurement_units", "drag_drop_matching_3", "attribute and measurement cards", [], "calculator"],
  [7, 8, "compare-areas-on-grid-floorplan", "measurement", "identify a region whose area is a multiple of another", "floorplan_area", "single_hotspot_region", "unit-grid floor plan", [], "calculator"],
  [7, 9, "select-two-banknotes-for-total", "number", "select two banknote denominations that make a target amount", "banknote_total", "multiple_hotspot_exact_2", "four original practice banknotes", [], "calculator"],
  [7, 10, "multi-rate-profit-or-loss", "number", "calculate mixed-price revenue and determine profit or loss", "profit_loss", "two_dropdown_sentence_completion", "market ledger", ["calculator"], "calculator"],
  [7, 11, "measure-image-to-half-centimetre", "measurement", "measure an object to the nearest half-centimetre", "ruler_half", "tool_assisted_single_choice", "measurable object", ["ruler"], "calculator"],
  [7, 12, "measure-angle-with-protractor", "space", "measure an angle and round to the requested precision", "protractor_angle", "tool_assisted_numeric_entry", "shaded angle", ["protractor"], "calculator"],
  [7, 13, "complete-visual-growing-pattern", "algebra", "infer a visual growth rule and fill two missing terms", "growing_pattern", "drag_drop_fill_two_sequence_gaps", "dot-array sequence", [], "calculator"],
  [7, 14, "pair-equivalent-fraction-decimal-percent", "number", "pair equivalent fractions, decimals and percentages", "equivalent_rational_pairs", "drag_drop_pairing_3", "six rational-number cards", [], "calculator"],

  [9, 1, "subtract-unlike-fractions", "number", "subtract fractions with related unlike denominators", "subtract_fractions", "single_choice", "fraction strip", [], "non_calculator"],
  [9, 2, "subtract-currency-decimals", "number", "find the difference between two money amounts", "currency_difference", "currency_numeric_text_entry", "comparison ledger", [], "non_calculator"],
  [9, 3, "whole-groups-from-division", "number", "interpret a division result as complete groups", "whole_groups", "numeric_text_entry", "one complete repeated motif", [], "non_calculator"],
  [9, 4, "place-value-digit-constraints", "number", "identify numbers satisfying simultaneous place-value constraints", "digit_constraints", "multiple_select_exact_2", "six number cards", [], "non_calculator"],
  [9, 5, "equal-area-grid-shapes", "measurement", "compare areas by decomposing grid-based shapes", "equal_area_grid", "multiple_hotspot_exact_2", "five grid polygons", [], "calculator"],
  [9, 6, "calendar-weekday-date", "measurement", "locate a date satisfying an ordinal weekday condition", "calendar_date", "single_table_cell_hotspot", "monthly calendar", [], "calculator"],
  [9, 7, "read-analogue-scales-and-order", "measurement", "read analogue scales and order measured masses", "scale_order", "drag_drop_order_4", "four dial scales", [], "calculator"],
  [9, 8, "match-nets-to-solids", "space", "match two-dimensional nets to three-dimensional solids", "nets_to_solids", "matrix_single_choice_per_row", "three nets and three solids", [], "calculator"],
  [9, 9, "match-polygons-to-vertex-count", "space", "match convex and concave polygons to vertex counts", "polygon_vertices", "drag_drop_matching_3", "three irregular logo polygons", [], "calculator"],
  [9, 10, "measure-image-to-half-centimetre", "measurement", "measure an object to the nearest half-centimetre", "ruler_half", "tool_assisted_single_choice", "measurable object", ["ruler"], "calculator"],
  [9, 11, "measure-angle-with-protractor", "space", "measure an angle and round to the requested precision", "protractor_angle", "tool_assisted_numeric_entry", "shaded angle", ["protractor"], "calculator"],
  [9, 12, "multi-rate-profit-or-loss", "number", "calculate mixed-price revenue and determine profit or loss", "profit_loss", "two_dropdown_sentence_completion", "market ledger", ["calculator"], "calculator"],
  [9, 13, "complete-two-set-venn-diagram", "statistics", "use inclusion-exclusion to complete a two-set Venn diagram", "venn_two_sets", "drag_drop_fill_four_regions", "two-set Venn diagram", ["calculator"], "calculator"],
  [9, 14, "pair-equivalent-fraction-decimal-percent", "number", "pair equivalent fractions, decimals and percentages", "equivalent_rational_pairs", "drag_drop_pairing_3", "six rational-number cards", [], "calculator"],
];

export const NUMERACY_DEMO_TYPE_CATALOG = RAW_TYPES.map(([
  year,
  demoItem,
  slug,
  strand,
  skill,
  family,
  interaction,
  visualPattern,
  tools,
  section,
]) => ({
  year,
  demo_item: demoItem,
  type_id: `Y${year}-${String(demoItem).padStart(2, "0")}-${slug}`,
  strand,
  skill,
  family,
  interaction,
  visual_pattern: visualPattern,
  tools,
  section,
  variants_required: 40,
  source: "https://nap.edu.au/naplan/public-demonstration-site",
  copyright_note: "Structural analysis only. No official wording or artwork is stored.",
}));

const CONTEXTS = [
  "community garden", "wildlife rescue", "school fair", "sports club", "library display",
  "coastal walk", "music workshop", "science expo", "market stall", "art studio",
];
const OBJECTS = ["shells", "buttons", "seed packets", "badges", "tiles", "stickers", "beads", "cards"];
const NAMES = ["Ari", "Maya", "Noah", "Zoe", "Kai", "Ruby", "Luca", "Amira"];

function rotate(values, offset) {
  const index = ((offset % values.length) + values.length) % values.length;
  return [...values.slice(index), ...values.slice(0, index)];
}

function optionsFrom(texts, correctTexts, variant) {
  const ordered = rotate([...new Set(texts.map(String))], variant);
  const options = ordered.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  const correctSet = new Set(correctTexts.map(String));
  const values = options.filter((option) => correctSet.has(option.text)).map((option) => option.id);
  return { options, values };
}

function single(texts, correct, variant) {
  const { options, values } = optionsFrom(texts, [correct], variant);
  return {
    itemType: "multiple_choice",
    choices: options,
    answer: { type: "single_choice", value: values[0], display: String(correct) },
  };
}

function multi(correct, distractors, variant) {
  const { options, values } = optionsFrom([...correct, ...distractors], correct, variant);
  return {
    itemType: "multiple_select",
    choices: options,
    answer: { type: "multiple_select", values: values.sort(), display: correct.join("; ") },
  };
}

function textAnswer(value, accepted = [String(value)]) {
  return {
    itemType: "text_entry",
    choices: null,
    answer: {
      type: "text",
      value: String(value),
      accepted: [...new Set(accepted.map((entry) => String(entry).trim().toLowerCase()))],
      display: String(value),
    },
  };
}

function drag(labels, targetLabels, placementByTarget, variant) {
  const orderedLabels = rotate([...labels], variant);
  const choices = orderedLabels.map((text, index) => ({ id: String.fromCharCode(65 + index), text: String(text) }));
  const idByText = new Map(choices.map((choice) => [choice.text, choice.id]));
  const targets = targetLabels.map((label, index) => ({ id: `target_${index + 1}`, label, capacity: 1 }));
  const placements = Object.fromEntries(targets.map((target, index) => [
    target.id,
    idByText.get(String(placementByTarget[index])),
  ]));
  return {
    itemType: "drag_and_drop",
    choices,
    answer: { type: "drag_drop", placements, targets, display: placementByTarget.join(" | ") },
  };
}

function matrix(rows, columns, values) {
  return {
    itemType: "matrix",
    choices: null,
    answer: {
      type: "matrix",
      rows,
      columns,
      values,
      display: rows.map((row) => `${row.label}: ${columns.find((column) => column.id === values[row.id])?.label}`).join("; "),
    },
  };
}

function inlineTwo(options, leftCorrect, rightCorrect, leftLabel, rightLabel, variant) {
  const ordered = rotate([...new Set(options.map(String))], variant);
  const choices = ordered.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  const idByText = new Map(choices.map((choice) => [choice.text, choice.id]));
  const targets = [
    { id: "target_1", label: leftLabel, capacity: 1 },
    { id: "target_2", label: rightLabel, capacity: 1 },
  ];
  return {
    itemType: "inline_choice",
    choices,
    answer: {
      type: "drag_drop",
      targets,
      placements: { target_1: idByText.get(String(leftCorrect)), target_2: idByText.get(String(rightCorrect)) },
      display: `${leftCorrect}; ${rightCorrect}`,
    },
  };
}

function scene(type, variant, parameters, altText, answerCritical = true) {
  return {
    type: "diagram",
    visual: {
      asset_id: `generated-${type}-${variant}`,
      kind: "generated_numeracy_scene",
      render_mode: "svg",
      answer_critical: answerCritical,
      original: true,
      alt_text: altText,
      parameters: { scene: type, variant, ...parameters },
    },
  };
}

function toolPolicy(tools = [], calculator = false) {
  return {
    calculator,
    ruler: tools.includes("ruler"),
    protractor: tools.includes("protractor"),
  };
}

function buildDraft(type, variant, difficulty) {
  const context = CONTEXTS[(variant + type.year + type.demo_item) % CONTEXTS.length];
  const object = OBJECTS[(variant * 3 + type.demo_item) % OBJECTS.length];
  const name = NAMES[(variant + type.demo_item) % NAMES.length];
  const common = {
    subdomain: type.strand,
    skill: type.skill,
    difficulty,
    calculator: type.section === "calculator" ? "allowed" : "not_allowed",
    toolPolicy: toolPolicy(type.tools, type.section === "calculator"),
    tags: ["official-demo-structure", type.type_id, `interaction:${type.interaction}`, "original-vector-visual"],
  };

  if (type.family === "collection_subtraction") {
    const total = 12 + variant;
    const removed = 2 + (variant % 6);
    const correct = total - removed;
    return {
      ...common,
      ...single([correct, removed, total, correct + 2], correct, variant),
      stimulus: scene("collection", variant, { total, crossed_out: removed, object }, `${total} ${object}, with ${removed} crossed out.`),
      prompt: `${name} arranged ${total} ${object} for a ${context}. ${removed} were taken away. How many remain?`,
      explanation: `${total} - ${removed} = ${correct}.`,
    };
  }

  if (type.family === "equal_halves") {
    const correct = ["Shape B", "Shape E"];
    return {
      ...common,
      ...multi(correct, ["Shape A", "Shape C", "Shape D", "Shape F"], variant),
      stimulus: scene("partitioned_shapes", variant, {
        option_visuals: [
          { label: "Shape A", parts: [35, 65] }, { label: "Shape B", parts: [50, 50] },
          { label: "Shape C", parts: [40, 60] }, { label: "Shape D", parts: [30, 70] },
          { label: "Shape E", parts: [50, 50] }, { label: "Shape F", parts: [45, 55] },
        ],
      }, "Six circles divided into two parts; two are divided equally."),
      prompt: "Choose the two shapes that are divided into equal halves.",
      explanation: "A half is one of two equal parts.",
    };
  }

  if (type.family === "missing_addend") {
    const start = 18 + variant * 2;
    const added = 4 + (variant % 13);
    return {
      ...common,
      ...textAnswer(added),
      stimulus: scene("part_whole", variant, { start, added, total: start + added, object }, `A part-whole bar showing ${start}, an unknown part and total ${start + added}.`),
      prompt: `${name} had ${start} ${object}. After receiving some more, there were ${start + added}. How many were added?`,
      explanation: `${start + added} - ${start} = ${added}.`,
    };
  }

  if (type.family === "order_lengths") {
    const lengths = [42 + variant % 7, 70 + variant % 9, 54 + variant % 5, 88 + variant % 11];
    const cards = lengths.map((length, index) => ({ label: `Object ${"ABCD"[index]}`, length }));
    const ordered = [...cards].sort((a, b) => a.length - b.length).map((card) => card.label);
    return {
      ...common,
      ...drag(cards.map((card) => card.label), ["Shortest", "Next", "Next", "Longest"], ordered, variant),
      stimulus: scene("length_cards", variant, { cards }, "Four original illustrated objects with visibly different lengths."),
      prompt: "Place the four objects in order from shortest to longest.",
      explanation: `The visual lengths increase in this order: ${ordered.join(", ")}.`,
    };
  }

  if (type.family === "threshold_matrix" || type.family === "measure_benchmark_matrix") {
    const benchmark = type.family === "threshold_matrix" ? 50 + variant : 120 + variant * 2;
    const offsets = [-18, -5, 7, 21, 33];
    const rows = offsets.slice(0, type.family === "threshold_matrix" ? 5 : 3).map((offset, index) => ({
      id: `row_${index + 1}`,
      label: type.family === "threshold_matrix" ? String(benchmark + offset) : `${benchmark + offset} cm`,
    }));
    const columns = [
      { id: "below", label: type.family === "threshold_matrix" ? `Less than ${benchmark}` : `Shorter than ${benchmark} cm` },
      { id: "above", label: type.family === "threshold_matrix" ? `Greater than ${benchmark}` : `Longer than ${benchmark} cm` },
    ];
    const values = Object.fromEntries(rows.map((row, index) => [row.id, offsets[index] < 0 ? "below" : "above"]));
    return {
      ...common,
      ...matrix(rows, columns, values),
      stimulus: scene("benchmark_scale", variant, { benchmark, values: rows.map((row) => row.label) }, `A benchmark marker and ${rows.length} values to compare.`),
      prompt: type.family === "threshold_matrix"
        ? `Classify each number as less than or greater than ${benchmark}.`
        : `Classify each measurement relative to ${benchmark} cm.`,
      explanation: "Compare each value with the benchmark before choosing a column.",
    };
  }

  if (type.family === "match_collections") {
    const counts = rotate([2, 3, 4, 5, 6, 7, 8, 9], variant).slice(0, 4);
    const rowObjects = rotate(
      ["butterfly", "fish", "flower", "boat", "kite", "apple", "ladybird", "turtle"],
      variant * 3,
    ).slice(0, 4);
    const labels = counts.map((count, index) => (
      (variant + index) % 2 === 0 ? String(count) : numberWord(count)
    ));
    const rowSummary = counts
      .map((count, index) => `${count} ${rowObjects[index]}`)
      .join(", ");
    return {
      ...common,
      ...drag(labels, ["Collection A", "Collection B", "Collection C", "Collection D"], labels, variant),
      stimulus: scene(
        "collection_rows",
        variant,
        { counts, row_objects: rowObjects },
        `Four illustrated rows containing ${rowSummary}.`,
      ),
      prompt: `${name} made four picture groups. Match each picture group to the correct number.`,
      explanation: "Count the pictures in each row, then match each group to its numeral or number word.",
    };
  }

  if (type.family === "addition_equation") {
    const a = 7 + variant;
    const b = 3 + (variant % 11);
    const total = a + b;
    const labels = [total, a, b, total + 2].map(String);
    return {
      ...common,
      ...drag(labels, ["Equation result"], [String(total)], variant),
      stimulus: scene("equation_story", variant, { left: a, right: b, total, object }, `Two groups of ${a} and ${b} ${object}, with an equation blank.`),
      prompt: `${name} combines ${a} ${object} with ${b} more. Complete ${a} + ${b} = □.`,
      explanation: `${a} + ${b} = ${total}.`,
    };
  }

  if (type.family === "informal_length_compare") {
    const relationship = ["shorter than", "longer than", "the same length as"][variant % 3];
    const baseLength = 4 + (variant % 5);
    const difference = 1 + (variant % 3);
    const a = relationship === "shorter than"
      ? baseLength
      : relationship === "longer than"
        ? baseLength + difference
        : baseLength;
    const b = relationship === "shorter than"
      ? baseLength + difference
      : relationship === "longer than"
        ? baseLength
        : baseLength;
    const secondName = NAMES[(variant + 3) % NAMES.length];
    const objectKind = ["ribbon", "shoelace", "cord", "paper strip"][variant % 4];
    const unitKind = ["paperclips", "blocks", "buttons", "tiles"][Math.floor(variant / 4) % 4];
    const leftLabel = `${name}'s ${objectKind}`;
    const rightLabel = `${secondName}'s ${objectKind}`;
    return {
      ...common,
      ...single(["shorter than", "longer than", "the same length as"], relationship, variant),
      itemType: "inline_choice",
      stimulus: scene(
        "informal_units",
        variant,
        {
          a,
          b,
          unit: unitKind,
          object_kind: objectKind,
          left_label: leftLabel,
          right_label: rightLabel,
        },
        `${leftLabel} spans ${a} equal ${unitKind}; ${rightLabel} spans ${b} equal ${unitKind}.`,
      ),
      prompt: `${name} and ${secondName} measure a ${objectKind} using same-sized ${unitKind}. Complete the comparison sentence.`,
      explanation: `${a} equal units is ${relationship} ${b} equal units.`,
    };
  }

  if (type.family === "select_collection" || type.family === "half_collection") {
    const target = type.family === "half_collection" ? 8 + variant : 24 + variant;
    const correct = type.family === "half_collection" ? target / 2 : target;
    const options = [correct - 2, correct, correct + 3].map((count, index) => ({ label: `Collection ${"ABC"[index]}`, count }));
    const correctLabel = options.find((entry) => entry.count === correct).label;
    return {
      ...common,
      ...single(options.map((entry) => entry.label), correctLabel, variant),
      itemType: "hotspot",
      stimulus: scene("option_collections", variant, { option_visuals: options, object }, `Three selectable collections of ${object}; ${correctLabel} contains ${correct}.`),
      prompt: type.family === "half_collection"
        ? `A container holds ${target} ${object}. Which collection shows half this number?`
        : `Choose the collection that contains ${target} ${object}.`,
      explanation: type.family === "half_collection" ? `${target} ÷ 2 = ${correct}.` : `The matching collection contains ${target}.`,
    };
  }

  if (type.family === "composite_triangles") {
    const labels = ["Piece A", "Piece B", "Piece C", "Piece D", "Piece E", "Piece F", "Piece G"];
    const shapes = ["triangle", "triangle", "triangle", "triangle", "triangle", "square", "parallelogram"];
    const layout = ["rocket", "sailboat", "house", "bird"][variant % 4];
    return {
      ...common,
      ...multi(labels.slice(0, 5), labels.slice(5), variant),
      stimulus: scene(
        "tangram_puzzle",
        variant,
        {
          layout,
          pieces: labels.map((label, index) => ({ id: String.fromCharCode(65 + index), label, shape: shapes[index] })),
          palette_shift: variant,
        },
        `An original seven-piece ${layout} mosaic containing five triangles, one square and one parallelogram.`,
      ),
      prompt: `A seven-piece shape puzzle has been arranged as a ${layout}. Choose all five pieces that are triangles.`,
      explanation: "The five selected pieces each have exactly three straight sides and three vertices.",
    };
  }

  if (type.family === "pair_complements") {
    if (type.year === 3) {
      const faces = [1, 2, 3, 4, 5, 6];
      const placements = [1, 6, 2, 5, 3, 4].map(String);
      const secondName = NAMES[(variant + 5) % NAMES.length];
      const game = ["treasure trail", "space race", "jungle path", "ocean quest"][variant % 4];
      return {
        ...common,
        ...drag(
          faces.map(String),
          ["Pair 1 left", "Pair 1 right", "Pair 2 left", "Pair 2 right", "Pair 3 left", "Pair 3 right"],
          placements,
          variant,
        ),
        stimulus: scene(
          "dice_pairing",
          variant,
          { faces, target: 7, theme: game, palette_shift: variant },
          "Six original dice faces showing one to six, ready to be matched into three pairs totalling seven.",
        ),
        prompt: `${name} and ${secondName} are playing a ${game} game. Match the six dice so every pair totals 7. Make three pairs.`,
        explanation: "The three complementary pairs are 1 and 6, 2 and 5, and 3 and 4.",
      };
    }
    const target = 18 + (variant % 10);
    const low = 1 + (variant % 2);
    const pairs = [[low, target - low], [low + 2, target - low - 2], [low + 4, target - low - 4]];
    const labels = pairs.flat().map(String);
    const placements = pairs.flat().map(String);
    return {
      ...common,
      ...drag(labels, ["Pair 1 left", "Pair 1 right", "Pair 2 left", "Pair 2 right", "Pair 3 left", "Pair 3 right"], placements, variant),
      stimulus: scene("value_cards", variant, { values: labels, target, representations: type.year >= 5 ? "mixed" : "dots" }, `Six value cards to be paired so each pair totals ${target}.`),
      prompt: `Make three pairs. The two values in every pair must total ${target}.`,
      explanation: pairs.map((pair) => `${pair[0]} + ${pair[1]} = ${target}`).join("; "),
    };
  }

  if (type.family === "die_outcomes") {
    const correct = ["1", "2", "3", "4", "5", "6"];
    return {
      ...common,
      ...multi(correct, ["0", "7"], variant),
      stimulus: scene("die", variant, { faces: 6 }, "A fair six-sided die and eight outcome cards."),
      prompt: "Choose every number that could appear after one roll of this standard die.",
      explanation: "A standard die has faces numbered 1 to 6.",
    };
  }

  if (type.family === "sum_categories") {
    const values = [12 + variant, 8 + variant % 9, 15 + variant % 7];
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      ...common,
      ...textAnswer(total),
      stimulus: scene("category_table", variant, { labels: ["Gold", "Silver", "Blue"], values, object }, `A three-category table containing ${values.join(", ")} items.`),
      prompt: `A ${context} display contains the three groups shown. How many ${object} are there altogether?`,
      explanation: `${values.join(" + ")} = ${total}.`,
    };
  }

  if (type.family === "repeated_budget") {
    const days = 3 + (variant % 7);
    const cost = 4 + (variant % 9);
    const remaining = 8 + variant;
    const budget = days * cost + remaining;
    return {
      ...common,
      ...textAnswer(remaining, [remaining, `$${remaining}`, `${remaining}.00`]),
      stimulus: scene("budget_ledger", variant, { budget, days, cost }, `A simple budget ledger showing $${budget}, ${days} days and $${cost} per day.`),
      prompt: `${name} has $${budget} for a ${context}. They spend $${cost} each day for ${days} days. How many dollars remain?`,
      explanation: `${days} × ${cost} = ${days * cost}; ${budget} - ${days * cost} = ${remaining}.`,
    };
  }

  if (type.family === "polygon_vertices") {
    const labels = ["Triangle logo", "Concave logo", "Pentagon logo"];
    const counts = ["3 vertices", "4 vertices", "5 vertices"];
    return {
      ...common,
      ...drag(counts, labels, counts, variant),
      stimulus: scene("polygon_logos", variant, {
        polygons: [
          { label: labels[0], points: 3 },
          { label: labels[1], points: 4, concave: true },
          { label: labels[2], points: 5 },
        ],
      }, "Three original polygon logos with 3, 4 and 5 vertices."),
      prompt: "Match each logo to its number of vertices.",
      explanation: "Count each corner where two sides meet.",
    };
  }

  if (type.family === "ruler_whole" || type.family === "ruler_half") {
    const half = type.family === "ruler_half";
    const length = half ? 6 + (variant % 14) + (variant % 2) * 0.5 : 3 + (variant % 8);
    const labels = [length - 1, length - 0.5, length, length + 0.5, length + 1]
      .filter((value) => value > 0)
      .map((value) => `${value} cm`);
    return {
      ...common,
      ...single(labels, `${length} cm`, variant),
      stimulus: {
        type: "diagram",
        visual: {
          asset_id: `generated-ruler-${type.year}-${variant}`,
          kind: "ruler_measurement",
          render_mode: "svg",
          answer_critical: true,
          original: true,
          alt_text: `An original illustrated object measuring ${length} centimetres.`,
          parameters: { length_cm: length, object: OBJECTS[(variant + 2) % OBJECTS.length], variant },
        },
      },
      prompt: `Use the online ruler to measure the illustrated object${half ? " to the nearest half-centimetre" : ""}.`,
      explanation: `Align zero with the first endpoint. The other endpoint is at ${length} cm.`,
    };
  }

  if (type.family === "subtraction_equation") {
    const start = 24 + variant;
    const removed = 5 + (variant % 9);
    const result = start - removed;
    return {
      ...common,
      ...inlineTwo([start, removed, result, start + removed], start, result, "Starting amount", "Result", variant),
      stimulus: scene("equation_blanks", variant, { operator: "−", fixed: removed, start, result }, `A subtraction equation with missing start and result around minus ${removed}.`),
      prompt: `${name} begins with some ${object}, gives away ${removed}, and has ${result} left. Complete □ − ${removed} = □.`,
      explanation: `${start} - ${removed} = ${result}.`,
    };
  }

  if (type.family === "mixed_representation_greatest") {
    const values = [21 + variant, 34 + variant, 28 + variant, 31 + variant];
    const words = [String(values[0]), numberWord(values[1]), String(values[2]), numberWord(values[3])];
    const greatest = Math.max(...values);
    const correctIndex = values.indexOf(greatest);
    const labels = words.map((value, index) => `Row ${index + 1}: ${value}`);
    return {
      ...common,
      ...single(labels, labels[correctIndex], variant),
      itemType: "hotspot",
      stimulus: scene("mixed_number_table", variant, { rows: words.map((value, index) => ({ label: `Row ${index + 1}`, value })) }, "Four selectable table cells containing numbers as digits or words."),
      prompt: "Choose the table cell with the greatest number.",
      explanation: `${greatest} is greater than the other three values.`,
    };
  }

  if (type.family === "banknote_total") {
    const pairs = [[5, 10], [10, 20], [20, 50], [5, 20]];
    const [a, b] = pairs[variant % pairs.length];
    const correct = [`$${a}`, `$${b}`];
    const distractors = [5, 10, 20, 50].filter((value) => ![a, b].includes(value)).map((value) => `$${value}`);
    return {
      ...common,
      ...multi(correct, distractors, variant),
      stimulus: scene("practice_banknotes", variant, { denominations: [5, 10, 20, 50], palette: variant % 4 }, "Four clearly fictional practice banknotes labelled $5, $10, $20 and $50."),
      prompt: `Choose exactly two practice notes whose values total $${a + b}.`,
      explanation: `$${a} + $${b} = $${a + b}.`,
    };
  }

  if (type.family === "groups_plus_remainder") {
    const groups = 3 + (variant % 8);
    const capacity = 12 + (variant % 9);
    const leftover = 1 + (variant % 7);
    const total = groups * capacity + leftover;
    return {
      ...common,
      ...single([total, groups * capacity, total - capacity, groups + capacity + leftover], total, variant),
      stimulus: scene("full_containers", variant, { groups, capacity, leftover, object }, `${groups} full containers of ${capacity} ${object} and ${leftover} loose items.`),
      prompt: `${name} fills ${groups} containers with ${capacity} ${object} each and has ${leftover} left over. How many are there altogether?`,
      explanation: `${groups} × ${capacity} + ${leftover} = ${total}.`,
    };
  }

  if (type.family === "redistribute_groups") {
    const oldGroups = 4 + (variant % 4);
    const each = 9 + (variant % 7);
    const newGroups = 2 + (variant % 3);
    const total = oldGroups * each;
    const result = total / newGroups;
    if (!Number.isInteger(result)) return buildDraft(type, variant + 40, difficulty);
    return {
      ...common,
      ...textAnswer(result),
      stimulus: scene("shelves", variant, { shelves: oldGroups, each, object }, `${oldGroups} shelves each holding ${each} ${object}.`),
      prompt: `${oldGroups} shelves each hold ${each} ${object}. They are rearranged equally onto ${newGroups} shelves. How many go on each shelf?`,
      explanation: `${oldGroups} × ${each} = ${total}; ${total} ÷ ${newGroups} = ${result}.`,
    };
  }

  if (type.family === "fraction_decimal") {
    const denominator = variant % 2 ? 100 : 1000;
    const numerator = 7 + variant * 3;
    const value = numerator / denominator;
    return {
      ...common,
      ...textAnswer(value, [String(value), value.toFixed(denominator === 100 ? 2 : 3)]),
      stimulus: scene("proportion_grid", variant, { numerator, denominator }, `${numerator} shaded cells out of ${denominator}.`),
      prompt: `${numerator} out of ${denominator} survey responses chose one option. Write this proportion as a decimal.`,
      explanation: `${numerator}/${denominator} = ${value}.`,
    };
  }

  if (type.family === "counting_principle") {
    const a = 2 + (variant % 4);
    const b = 3 + (variant % 5);
    const c = 2 + (variant % 3);
    const correct = [`${a} × ${b} × ${c}`, `${a} × (${b} × ${c})`];
    return {
      ...common,
      ...multi(correct, [`${a} + ${b} + ${c}`, `${a} × (${b} + ${c})`], variant),
      stimulus: scene("choice_board", variant, { categories: [a, b, c], labels: ["Route", "Activity", "Snack"] }, `Three choice categories with ${a}, ${b} and ${c} options.`),
      prompt: "Choose the two expressions that correctly calculate the total number of possible one-from-each combinations.",
      explanation: "Independent choices are multiplied; factor order does not change the product.",
    };
  }

  if (type.family === "probability_matrix") {
    const rows = [
      { id: "possible", label: "A fair spinner lands on one of its labelled colours." },
      { id: "certain", label: "A standard die shows a number from 1 to 6." },
      { id: "impossible", label: "A standard die shows 9." },
    ];
    const columns = [
      { id: "zero", label: "0" },
      { id: "between", label: "Greater than 0 and less than 1" },
      { id: "one", label: "1" },
    ];
    return {
      ...common,
      ...matrix(rows, columns, { possible: "between", certain: "one", impossible: "zero" }),
      stimulus: scene("probability_scale", variant, { markers: [0, 0.5, 1] }, "A probability scale from 0 to 1."),
      prompt: "Match each event to the correct probability category.",
      explanation: "Impossible events have probability 0, certain events 1, and other possible events lie between.",
    };
  }

  if (type.family === "order_angles") {
    const angles = [35 + variant % 10, 80 + variant % 12, 125 + variant % 15, 220 + variant % 20];
    const cards = angles.map((angle, index) => ({ label: `Angle ${"ABCD"[index]}`, angle }));
    const ordered = [...cards].sort((a, b) => a.angle - b.angle).map((card) => card.label);
    return {
      ...common,
      ...drag(cards.map((card) => card.label), ["Smallest", "Next", "Next", "Largest"], ordered, variant),
      stimulus: scene("angle_fans", variant, { cards }, "Four original fan diagrams showing acute, obtuse and reflex angles."),
      prompt: "Order the four angle diagrams from smallest to largest.",
      explanation: `Their sizes increase as ${ordered.join(", ")}.`,
    };
  }

  if (type.family === "measurement_units") {
    const labels = ["mass", "area", "length"];
    const values = [`${40 + variant} kilograms`, `${1 + (variant % 6) / 4} square metres`, `${2 + (variant % 5) / 10} metres`];
    return {
      ...common,
      ...drag(values, labels, values, variant),
      stimulus: scene("measurement_cards", variant, { labels, values }, "Three attribute cards and three plausible metric measurements."),
      prompt: "Match each measurement attribute to the plausible value and unit.",
      explanation: "Kilograms measure mass, square metres measure area and metres measure length.",
    };
  }

  if (type.family === "floorplan_area") {
    const baseArea = 4 + (variant % 5);
    const areas = [baseArea, baseArea * 2, baseArea * 3, baseArea * 4];
    const labels = ["Room A", "Room B", "Room C", "Room D"];
    const correct = labels[2];
    return {
      ...common,
      ...single(labels, correct, variant),
      itemType: "hotspot",
      stimulus: scene("grid_floorplan", variant, { rooms: labels.map((label, index) => ({ label, area: areas[index] })), reference: labels[0] }, `A four-room unit-grid floor plan; ${correct} has three times the area of ${labels[0]}.`),
      prompt: `Choose the room with three times the area of ${labels[0]}.`,
      explanation: `${areas[2]} square units is three times ${baseArea} square units.`,
    };
  }

  if (type.family === "profit_loss") {
    const quantity = 100 + variant * 10;
    const costEach = 2 + (variant % 5);
    const fullPriceCount = Math.floor(quantity * 0.4);
    const fullPrice = costEach + 4;
    const salePrice = Math.max(1, costEach - 1);
    const cost = quantity * costEach;
    const revenue = fullPriceCount * fullPrice + (quantity - fullPriceCount) * salePrice;
    const resultType = revenue >= cost ? "profit" : "loss";
    const amount = Math.abs(revenue - cost);
    return {
      ...common,
      ...inlineTwo(["profit", "loss", `$${amount}`, `$${amount + 50}`, `$${Math.abs(revenue)}`], resultType, `$${amount}`, "Outcome", "Amount", variant),
      stimulus: scene("market_ledger", variant, { quantity, costEach, fullPriceCount, fullPrice, salePrice }, "A market ledger showing purchase cost and two selling prices."),
      prompt: `A stall buys ${quantity} items at $${costEach} each. It sells ${fullPriceCount} at $${fullPrice} and the rest at $${salePrice}. Complete the profit-or-loss statement.`,
      explanation: `Cost is $${cost}; revenue is $${revenue}; the ${resultType} is $${amount}.`,
    };
  }

  if (type.family === "protractor_angle") {
    const actual = 25 + ((variant * 13) % 140);
    const rounded = Math.round(actual / 10) * 10;
    return {
      ...common,
      ...textAnswer(rounded, [rounded, `${rounded}°`]),
      stimulus: {
        type: "diagram",
        visual: {
          asset_id: `generated-angle-${type.year}-${variant}`,
          kind: "protractor_measurement",
          render_mode: "svg",
          answer_critical: true,
          original: true,
          alt_text: "Two original rays form a shaded angle for protractor measurement.",
          parameters: { angle_degrees: actual, orientation_degrees: (variant * 17) % 70, variant },
        },
      },
      prompt: "Use the online protractor to measure the angle. Give the result to the nearest 10°.",
      explanation: `The angle is about ${actual}°, which rounds to ${rounded}°.`,
    };
  }

  if (type.family === "growing_pattern") {
    const step = 2 + (variant % 4);
    const start = 2 + (variant % 3);
    const sequence = [start, start + step, start + step * 2, start + step * 3, start + step * 4, start + step * 5];
    const labels = [sequence[2], sequence[4], sequence[2] + 1, sequence[4] - 1, sequence[5], sequence[1]].map(String);
    return {
      ...common,
      ...drag(labels, ["Missing term 3", "Missing term 5"], [String(sequence[2]), String(sequence[4])], variant),
      stimulus: scene("dot_pattern", variant, { sequence, missing: [2, 4], columns: 2 }, "A growing dot-array sequence with the third and fifth terms missing."),
      prompt: "Complete the two missing pictures in the growing dot pattern.",
      explanation: `The number of dots increases by ${step} each time.`,
    };
  }

  if (type.family === "equivalent_rational_pairs") {
    const entries = variant % 2 === 0
      ? ["1/2", "0.5", "1/4", "25%", "1/10", "10%"]
      : ["3/4", "0.75", "1/5", "20%", "2/5", "40%"];
    const placements = variant % 2 === 0
      ? ["1/2", "0.5", "1/4", "25%", "1/10", "10%"]
      : ["3/4", "0.75", "1/5", "20%", "2/5", "40%"];
    return {
      ...common,
      ...drag(entries, ["Pair 1 left", "Pair 1 right", "Pair 2 left", "Pair 2 right", "Pair 3 left", "Pair 3 right"], placements, variant),
      stimulus: scene("rational_cards", variant, { values: entries }, "Six fraction, decimal and percentage cards."),
      prompt: "Make three pairs of equivalent rational-number representations.",
      explanation: "Each pair names the same part of one whole.",
    };
  }

  if (type.family === "subtract_fractions") {
    const denominator = [8, 10, 12, 16][variant % 4];
    const largeNumerator = denominator - 2;
    const smallDenominator = denominator / 2;
    const smallNumerator = 1 + (variant % (smallDenominator - 1));
    const answerNumerator = largeNumerator - smallNumerator * 2;
    const correct = `${answerNumerator}/${denominator}`;
    return {
      ...common,
      ...single([correct, `${largeNumerator - smallNumerator}/${denominator}`, `${answerNumerator}/${smallDenominator}`, `${largeNumerator + smallNumerator}/${denominator}`], correct, variant),
      stimulus: scene("fraction_strips", variant, { denominator, largeNumerator, smallDenominator, smallNumerator }, "Two aligned fraction strips with related denominators."),
      prompt: `A container is ${largeNumerator}/${denominator} full. ${smallNumerator}/${smallDenominator} of its capacity is used. What fraction remains?`,
      explanation: `${smallNumerator}/${smallDenominator} = ${smallNumerator * 2}/${denominator}, so the difference is ${correct}.`,
    };
  }

  if (type.family === "currency_difference") {
    const larger = 1200 + variant * 37 + 0.75;
    const smaller = 700 + variant * 19 + 0.4;
    const difference = (larger - smaller).toFixed(2);
    return {
      ...common,
      ...textAnswer(difference, [difference, `$${difference}`]),
      stimulus: scene("comparison_ledger", variant, { larger: larger.toFixed(2), smaller: smaller.toFixed(2) }, "A two-row ledger with two dollar amounts."),
      prompt: `One project raised $${larger.toFixed(2)} and another raised $${smaller.toFixed(2)}. How much more did the first project raise?`,
      explanation: `$${larger.toFixed(2)} - $${smaller.toFixed(2)} = $${difference}.`,
    };
  }

  if (type.family === "whole_groups") {
    const groupSize = 5 + (variant % 8);
    const groups = 6 + (variant % 12);
    const leftover = 1 + (variant % (groupSize - 1));
    const total = groups * groupSize + leftover;
    return {
      ...common,
      ...textAnswer(groups),
      stimulus: scene("group_motif", variant, { groupSize, total, object }, `One complete motif made from ${groupSize} ${object}, beside a total of ${total}.`),
      prompt: `${total} ${object} are used in groups of ${groupSize}. How many complete groups can be made?`,
      explanation: `${total} ÷ ${groupSize} gives ${groups} complete groups with ${leftover} left over.`,
    };
  }

  if (type.family === "digit_constraints") {
    const thousands = 3 + (variant % 6);
    const tens = 1 + (variant % 8);
    const correct = [
      `${thousands}${(variant + 2) % 10}${tens}${(variant + 4) % 10}`,
      `${thousands}${(variant + 7) % 10}${tens}${(variant + 1) % 10}`,
    ];
    const distractors = [
      `${(thousands + 1) % 10}${variant % 10}${tens}${(variant + 3) % 10}`,
      `${thousands}${tens}${variant % 10}${(variant + 5) % 10}`,
      `${tens}${variant % 10}${thousands}${(variant + 6) % 10}`,
      `${(thousands + 2) % 10}${tens}${variant % 10}${(variant + 8) % 10}`,
    ];
    return {
      ...common,
      ...multi(correct, distractors, variant),
      stimulus: scene("number_cards", variant, { values: [...correct, ...distractors] }, "Six four-digit number cards."),
      prompt: `Choose the two numbers with ${thousands} in the thousands place and ${tens} in the tens place.`,
      explanation: "Check both specified place values in each option.",
    };
  }

  if (type.family === "equal_area_grid") {
    const area = 10 + (variant % 8);
    const labels = ["Shape A", "Shape B", "Shape C", "Shape D"];
    const shapeAreas = [area, area + 2, area, area - 2];
    return {
      ...common,
      ...multi(["Shape A", "Shape C"], ["Shape B", "Shape D"], variant),
      stimulus: scene("grid_shapes", variant, { reference_area: area, shapes: labels.map((label, index) => ({ label, area: shapeAreas[index], style: index })) }, `A reference grid shape of area ${area} and four selectable shapes, two with equal area.`),
      prompt: "Choose the two grid shapes with the same area as the reference shape.",
      explanation: "Combine full squares and pairs of half-squares to compare areas.",
    };
  }

  if (type.family === "calendar_date") {
    const firstWeekday = variant % 7;
    const targetWeekday = (variant * 3 + 1) % 7;
    const ordinal = 1 + (variant % 4);
    const firstTarget = 1 + ((targetWeekday - firstWeekday + 7) % 7);
    const date = firstTarget + (ordinal - 1) * 7;
    const ordinalWord = ["first", "second", "third", "fourth"][ordinal - 1];
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][targetWeekday];
    return {
      ...common,
      ...single([String(date), String(Math.max(1, date - 1)), String(date + 1), String(Math.max(1, date - 7))], String(date), variant),
      itemType: "hotspot",
      stimulus: scene("calendar", variant, { first_weekday: firstWeekday, days: 28 + (variant % 3), target: date }, `A monthly calendar with day 1 in weekday column ${firstWeekday + 1}.`),
      prompt: `Choose the date of the ${ordinalWord} ${weekday} in the displayed month.`,
      explanation: `Following the ${weekday} column gives date ${date}.`,
    };
  }

  if (type.family === "scale_order") {
    const values = [45 + variant, 80 + variant, 120 + variant, 165 + variant];
    const labels = ["Bowl A", "Bowl B", "Bowl C", "Bowl D"];
    return {
      ...common,
      ...drag(labels, ["Lightest", "Next", "Next", "Heaviest"], labels, variant),
      stimulus: scene("dial_scales", variant, { scales: labels.map((label, index) => ({ label, value: values[index], maximum: 200 })) }, "Four circular dial scales with different pointer positions."),
      prompt: "Read the four scales and order the bowls from lightest to heaviest.",
      explanation: `The readings are ${values.join(", ")} grams.`,
    };
  }

  if (type.family === "nets_to_solids") {
    const rows = [
      { id: "tri_prism", label: "Net A" },
      { id: "square_pyramid", label: "Net B" },
      { id: "tetrahedron", label: "Net C" },
    ];
    const columns = [
      { id: "prism", label: "Triangular prism" },
      { id: "pyramid", label: "Square pyramid" },
      { id: "tetra", label: "Tetrahedron" },
    ];
    return {
      ...common,
      ...matrix(rows, columns, { tri_prism: "prism", square_pyramid: "pyramid", tetrahedron: "tetra" }),
      stimulus: scene("nets_and_solids", variant, { nets: rows.map((row) => row.id), solids: columns.map((column) => column.id) }, "Three original polygonal nets and three wireframe solids."),
      prompt: "Match each net to the solid it forms.",
      explanation: "Match the face shapes and the way their edges meet after folding.",
    };
  }

  if (type.family === "venn_two_sets") {
    const onlyA = 20 + variant;
    const both = 10 + (variant % 12);
    const onlyB = 15 + variant;
    const neither = 8 + (variant % 9);
    const labels = [onlyA, both, onlyB, neither].map(String);
    return {
      ...common,
      ...drag(labels, ["Only set A", "Both sets", "Only set B", "Neither set"], labels, variant),
      stimulus: scene("venn", variant, { only_a: onlyA, both, only_b: onlyB, neither }, "Two overlapping circles and four empty placement regions."),
      prompt: `A survey has ${onlyA + both + onlyB + neither} people. ${onlyA + both} chose A, ${onlyB + both} chose B, and ${neither} chose neither. Complete the Venn diagram.`,
      explanation: `The intersection is ${both}; the exclusive regions are ${onlyA} and ${onlyB}; neither is ${neither}.`,
    };
  }

  throw new Error(`No numeracy draft builder for ${type.family}.`);
}

function numberWord(value) {
  const small = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (value < 20) return small[value];
  return value % 10 === 0 ? tens[Math.floor(value / 10)] : `${tens[Math.floor(value / 10)]}-${small[value % 10]}`;
}

export function generateDemoAlignedNumeracy({
  year,
  rng,
  makeId,
  baseItem,
  difficultyFor,
}) {
  const types = NUMERACY_DEMO_TYPE_CATALOG.filter((type) => type.year === year);
  const items = [];
  let index = 0;
  for (const type of types) {
    for (let variant = 0; variant < type.variants_required; variant += 1) {
      const difficulty = difficultyFor(index, type, variant);
      const draft = buildDraft(type, variant, difficulty);
      items.push(baseItem({
        id: makeId(year, "NUM", index),
        year,
        domain: "numeracy",
        subdomain: draft.subdomain,
        skill: draft.skill,
        difficulty: draft.difficulty,
        itemType: draft.itemType,
        prompt: draft.prompt,
        stimulus: draft.stimulus,
        choices: draft.choices,
        answer: draft.answer,
        explanation: draft.explanation,
        calculator: draft.calculator,
        tags: draft.tags,
        toolPolicy: draft.toolPolicy,
      }));
      index += 1;
    }
  }
  return items;
}

export function summariseDemoAlignedNumeracy(items) {
  const summary = {};
  for (const item of items) {
    const typeId = item.tags.find((tag) => /^Y[3579]-\d{2}-/.test(tag));
    summary[typeId] = (summary[typeId] ?? 0) + 1;
  }
  return summary;
}
