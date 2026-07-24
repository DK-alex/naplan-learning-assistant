# Dashboard design QA

- source visual truth: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-16e7a4ea-3a9e-49f0-a152-8d577f1a9794.png`
- implementation screenshot: `C:\Users\alex3\AppData\Local\Temp\naplan-dashboard-desktop-implementation-1.0.8.png`
- full-view comparison: `C:\Users\alex3\AppData\Local\Temp\naplan-dashboard-full-comparison-1.0.8.png`
- focused comparison: `C:\Users\alex3\AppData\Local\Temp\naplan-dashboard-focus-comparison-1.0.8.png`
- viewport: frameless Windows desktop app at 1440 × 811 logical pixels, fixed 1600 × 900 app canvas scaled to fit
- density normalization: source 2880 × 1642 pixels was downsampled to 1440 × 814; implementation was captured at 1440 × 811 pixels
- state: warm dashboard, Chinese interface, existing local learner profile; the source contains annotated demo percentages while the implementation contains persisted practice results

## Full-view comparison evidence

- The overall fixed-ratio composition, navigation rail, card grid, illustrations, typography hierarchy, palette, borders, and spacing remain aligned with the reference.
- The implementation reserves a clear top-right strip for the frameless window controls. The greeting illustration now begins below the control row and no longer covers the minimise, maximise, or close buttons.
- The learning-target card preserves the reference layout while replacing hard-coded demo percentages with the latest persisted results. In the captured profile, Reading is 3%, Numeracy is 8%, and areas without trustworthy results display an em dash.
- No browser scrollbar or outer web-page frame appears in the desktop implementation.

## Focused region comparison evidence

- The focused top-right comparison confirms separate hit areas and visible spacing between the three window controls and the boy illustration.
- The five progress rows retain their labels, colors, alignment, and track lengths. Empty states use a neutral track and an em dash rather than a fabricated score.
- A focused comparison was necessary because the requested changes concern small window-control and progress-card details that are difficult to judge in the full view.

## Required fidelity surfaces

- Fonts and typography: family, weights, sizes, line heights, bilingual labels, wrapping, and hierarchy remain consistent with the existing dashboard.
- Spacing and layout rhythm: the 16:9 canvas and card geometry are unchanged; only the greeting illustration's top safe area and compact progress-card spacing changed.
- Colors and visual tokens: existing orange, green, purple, coral, and teal subject tokens are preserved; missing-data tracks use the existing neutral gray family.
- Image quality and asset fidelity: all original illustration assets remain sharp, correctly cropped, and undistorted.
- Copy and content: the dashboard now states that values are the latest real results and uses an em dash when a reliable score does not exist.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- P3: The source and implementation show different learner activity counts and timestamps because the implementation intentionally uses the existing local profile.

## Comparison history

- Pass 1: the combined full-view and focused comparisons found no actionable P0/P1/P2 issue. No visual correction iteration was required after the implementation capture.

## Interaction and runtime checks

- Confirmed the live desktop window is frameless and fixed to the app canvas.
- Confirmed the window controls remain visually separate from the greeting illustration.
- Confirmed persisted Reading and Numeracy values render as real percentages and unavailable areas render as missing data.
- Confirmed the local browser build exposes accessible progressbar values and produces no test or build failure.

final result: passed

---

# Design QA — AI 作文批改摘要卡片

## Source and implementation

- Source screenshot: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-04e074dd-af97-46b5-8bed-6ef71eda7496.png`
- Implementation URL: `http://127.0.0.1:5173/`
- Full implementation evidence: `artifacts/design-qa/ai-writing-summary-full.png`
- Focused implementation evidence: `artifacts/design-qa/ai-writing-summary-card.png`
- Combined before/after evidence: `artifacts/design-qa/ai-writing-summary-comparison.png`

## Viewport and state

- Source dimensions: 784 × 810 px, cropped from the populated warm-dashboard report card.
- Implementation viewport: 1600 × 900 CSS px at device-pixel ratio 2.
- Focused card dimensions: 401 × 486 CSS px.
- State: latest Year 3 OpenAI writing review, score 45/47, all six dashboard rubric rows visible.

## Findings

- The source had a P1 collision: the sixth “拼写 (Spelling)” row, the unofficial-score note, the action button, and the rabbit illustration occupied the same bottom area.
- The implementation now uses a dedicated 90 px report-card footer for the note and action.
- The populated-state rabbit is constrained to 100 × 100 px and placed inside the footer decoration area.
- Measured geometry:
  - final rubric row bottom: 854 px
  - footer top: 886.5 px
  - rabbit top: 884.5 px
  - rubric-to-footer clearance: 32.5 px
  - rubric-to-rabbit clearance: 30.5 px
- Automated intersection checks:
  - final rubric row vs footer: no overlap
  - final rubric row vs rabbit: no overlap
  - action vs rabbit: no overlap
  - note vs action: no overlap
- No new P0, P1, or P2 visual issues were found in the focused comparison.

## Iteration history

1. Baseline: footer controls and the 174 px rabbit were absolutely positioned over the rubric list.
2. Revision: grouped the note and action into a footer flow, made the populated card a vertical flex layout, and reduced only the populated-state rabbit to fit the reserved decoration area.
3. Verification: compared the supplied source and rendered implementation side by side, then confirmed the relevant DOM rectangles do not intersect.

Final result: passed

---

# Design QA — 作文摘要按钮裁切修复

## Source and implementation

- Source screenshot: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-d225fbf2-528a-4188-9e36-900b42c4c7e6.png`
- Implementation URL: `http://127.0.0.1:5173/`
- Focused implementation evidence: `artifacts/design-qa/ai-writing-summary-button-visible.png`
- Combined before/after evidence: `artifacts/design-qa/ai-writing-summary-button-comparison.png`

## Viewport and state

- Source dimensions: 1002 × 1034 px, cropped from the populated warm-dashboard report card.
- Implementation viewport: 1600 × 900 CSS px at device-pixel ratio 2.
- Rendered card dimensions: 401 × 485.5 CSS px.
- State: latest Year 3 OpenAI writing review, score 45/47, all six rubric rows and the report action present.

## Findings

- [P1] The source shows the “查看详细报告” button clipped by the card's lower boundary, leaving only the button's top edge visible.
- The populated rubric list now uses a 13 px row gap and 4 px block padding, recovering 24 px of vertical room without removing content.
- The report footer is fixed as a non-shrinking 90 px flex region.
- Post-fix measurements:
  - action bottom: 962.5 px
  - card bottom: 977.5 px
  - action-to-card bottom clearance: 15 px
  - action fully inside card: yes
  - final rubric row vs footer: no overlap
  - final rubric row vs rabbit: no overlap
  - note vs action: no overlap
  - action vs rabbit: no overlap
- Fonts, colors, border treatment, illustration asset, and app-specific copy remain unchanged.

## Comparison history

1. Pass 1 found the action clipped at the lower card boundary.
2. The rubric rhythm was tightened and the footer was made non-shrinking.
3. Pass 2 confirmed the complete action button is visible with 15 px bottom clearance and no P0/P1/P2 overlap regression.

Final result: passed
