# Latest-updates structured reader: design QA

## Evidence

- Source visual truth: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-c89e5a7c-d4dd-4850-92c6-c67d7085df74.png`
- Source pixels: 2202 × 1518
- Browser-rendered implementation: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\design-qa-reader-top.png`
- Implementation pixels / CSS viewport: 1265 × 712 at device scale factor 1
- Focused video state: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\design-qa-reader-video.png`
- Focused table state: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\design-qa-reader-table.png`
- Normalized comparison board: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\design-qa-comparison.png`
- State: 最新动向 → “2026 全国结果预计 8 月上旬发布” → 简体中文

The source is a problem-state screenshot rather than a pixel-perfect target: it documents a flattened plain-text reader at a larger viewport. The comparison board fits both captures into equal-width panels and the focused checks compare the reader content rather than browser/app chrome. No pixel-level claim is made across the unmatched viewport sizes.

## Full-view comparison

The implementation preserves the existing warm desktop design system and replaces the source screenshot’s monospaced text wall with an article hierarchy: a true page heading, paragraphs, nested lists, linked labels, tables, dividers and media regions. The title, source metadata, language switch and translation warning remain in the same reading order. The reader opens at the top, the official-source button stays on one line, and the article is contained within the fixed application canvas.

## Focused comparison

- Video: the former text-only location is now a labelled remote-media region with an explicit “在软件中播放” action and an external-source fallback. The iframe is not created until the user requests playback, so the page does not jump to the video on open. After activation, the official YouTube embed loads inside the app.
- Table: official rows, columns, headers and numeric score cut points render as a bordered table. Pure numeric values remain unchanged in every translation; long tables scroll horizontally within their own region instead of breaking the app layout.
- Links: visible labels are translated while the original resolved `http(s)` targets remain attached. The checked results page renders 76 external links.

## Required fidelity surfaces

- Fonts and typography: Segoe UI hierarchy is consistent with the application; article headings, body copy, links, metadata and media labels have distinct readable weights and line heights. No broken wrapping was found.
- Spacing and layout rhythm: reader padding, heading gaps, list indentation, table cells and media spacing remain consistent at the tested viewport. The official-source button no longer wraps.
- Colors and tokens: existing warm orange controls, green translation notice, blue links and neutral article surfaces are retained with adequate contrast.
- Image quality and asset fidelity: no source imagery was recreated or approximated. The official video stays remote; the app uses the real provider embed after user activation. Official image references are not downloaded.
- Copy and content: structured English source content and convenience translations are separate. NAPLAN terminology corrections are applied, and numeric data is never machine-translated.
- Icons: Phosphor icons are used consistently for links, media, audio and image references.
- Accessibility and behavior: semantic headings, lists, tables, links, buttons, figure captions and media titles are present. Keyboard-reachable buttons and visible focus behavior are retained.

## Comparison history

1. **P1 — Flattened page structure**
   - Earlier evidence: the source screenshot rendered headings and lists as literal `#` and `-` characters in one `<pre>`.
   - Fix: introduced structured document blocks and a semantic React renderer.
   - Post-fix evidence: `design-qa-reader-top.png`.

2. **P2 — Numeric data corrupted by machine translation**
   - Earlier evidence: table values such as `378` appeared as `第378章`.
   - Fix: non-language values now bypass translation; an exact NAPLAN glossary corrects terms such as Scales, Domain and transcript.
   - Post-fix evidence: `design-qa-reader-table.png`; automated preservation checks pass in all three translated languages.

3. **P1 — Results page extraction ended before the final sections**
   - Earlier evidence: the first structured snapshot stopped after proficiency standards.
   - Fix: extraction now selects the full `.main-content-text` region. The reader includes “NAPLAN 2026 results”, “NAPLAN technical reports” and “Past NAPLAN national reports”.
   - Post-fix evidence: 11,292 English snapshot characters, 78 top-level blocks and 75 stored links.

4. **P2 — Embedded video caused the reader to jump on load**
   - Earlier evidence: loading the YouTube iframe moved both the window and article scroll positions to the media region.
   - Fix: remote embeds are created only after the explicit in-app play action.
   - Post-fix evidence: fresh-open scroll positions are both zero; `design-qa-reader-video.png` shows the activation state.

## Interaction and runtime checks

- Four-language reader switch: passed.
- English source and Simplified Chinese structure: passed.
- Original link target retention: passed.
- Table rendering and numeric preservation: passed.
- Remote video activation and in-app iframe playback: passed.
- Fresh-tab console errors before and after video activation: none.
- Automated suite: 46 tests passed before final packaging.

## Findings

No actionable P0, P1 or P2 visual or interaction findings remain at the tested desktop viewport.

## Follow-up polish

- P3: a future editorial pass could expand the exact NAPLAN glossary for less common phrases while continuing to show the official English snapshot as authoritative.

## Final result

final result: passed
