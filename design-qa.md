# Design QA — Year 3 writing prompt header

## Source and implementation

- Source visual truth: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-7acd4a62-ffb2-45d0-9dec-1b2a743265eb.png`
- Browser-rendered implementation: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\artifacts\design-qa\year3-writing-layout-fixed-1920x1080.png`
- Focused combined comparison: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\artifacts\design-qa\year3-writing-layout-comparison.png`
- Secondary 1600 × 900 evidence: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\artifacts\design-qa\year3-writing-layout-fixed-full.png`

## Viewport, density and state

- Source image: 1618 × 328 physical pixels, a focused crop of the prompt header.
- Implementation: 1920 × 1080 CSS viewport, device-pixel ratio 1.
- Fixed exam player: 1280 × 768 CSS pixels, centred at x 320 and y 156.
- Secondary implementation: 1600 × 900 CSS viewport, device-pixel ratio 1.
- State: Year 3 Writing → Narrative Task → paper-writing prompt, with the audio bar visible.

## Full-view comparison evidence

- The fixed exam player remains centred and keeps the established NAPLAN-style toolbar, audio bar, writing stimulus grid, footer and separate practice controls.
- The paper-task notice now appears completely below the audio bar instead of being pulled upward and clipped at the bar boundary.
- Prompt title, instructions, guidance panels and relevant illustration retain their existing proportions and hierarchy.

## Focused comparison evidence

- The combined comparison shows the source notice touching the audio-bar boundary and the fixed implementation preserving a visible separation.
- Post-fix browser geometry at 1920 × 1080:
  - audio bar bottom: 270 px
  - paper-task notice top: 284 px
  - clear gap: 14 px
  - intersection: 0 px
- A focused comparison was required because the defect concerns a small vertical boundary that is less obvious in the full-player screenshot.

## Required fidelity surfaces

- Fonts and typography: existing families, weights, sizes, underlined prompt heading, line heights and English-only exam copy are unchanged.
- Spacing and layout rhythm: only the negative top margin on the paper notice was removed; all surrounding grid, padding and footer geometry is preserved.
- Colors and visual tokens: the blue audio bar, pale-blue paper notice, red narrative accents and neutral exam canvas are unchanged.
- Image quality and asset fidelity: the original generated writing illustration remains sharp, correctly cropped and undistorted.
- Copy and content: no task wording, guidance, timing, labels or image captions changed.

## Findings and comparison history

1. Baseline finding [P1]: `.paper-mode-inline` used a `-26px` top margin, which moved the notice above the writing-body content box and let the audio layer clip its top region.
2. Fix: changed the notice to normal document flow with `margin: 0 0 17px`.
3. Post-fix evidence: the live player reports a 14 px visual gap and zero intersection at both 1600 × 900 and 1920 × 1080.
4. No actionable P0, P1 or P2 visual differences remain. No P3 follow-up is required for this scoped change.

## Interaction and runtime checks

- Entered the complete Year 3 narrative paper-writing flow.
- Hid and restored the audio bar; the notice remained readable and stable in both states.
- Confirmed the restored audio bar still has a 14 px gap from the notice.
- Checked browser console warnings and errors: none.
- Ran the exam-player automated tests and production build successfully.

final result: passed
