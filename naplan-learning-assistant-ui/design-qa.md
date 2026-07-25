# Design QA — remove redundant “Back to home”

## Source and implementation

- Source visual truth: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-ca8edafb-bc25-4632-aa07-23830e252e78.png`
- Browser-rendered implementation: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\artifacts\design-qa\latest-updates-no-back-home.png`
- Normalized combined comparison: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\artifacts\design-qa\latest-updates-no-back-home-comparison.png`

## Viewport, density and state

- Source image: 2880 × 1620 physical pixels, representing the fixed 1600 × 900 desktop app canvas at higher display density.
- Implementation browser viewport: 1600 × 900 CSS pixels, captured as 1264 × 710 physical pixels by the in-app preview surface.
- Density normalization: the source was downsampled to the implementation capture dimensions before the combined comparison.
- State: Simplified Chinese warm theme, “最新动向” feature workspace selected in the persistent sidebar.

## Full-view comparison evidence

- The redundant orange “← 返回首页” action is absent from the feature header.
- “最新动向” now starts at the top of the content header, and its description follows with the existing spacing rhythm.
- Sidebar navigation, official information card, search, filters and update cards retain their original layout and styling.
- The persistent sidebar continues to provide a visible “首页” destination.

## Focused comparison evidence

- The combined before/after image clearly shows the removed action and the title moving into the freed header space.
- Browser DOM verification found zero `.feature-header .feature-back` elements and zero exact “← 返回首页” text matches.
- Header measurements after the change:
  - title top: 52 px
  - description top: 94.86 px
  - feature header height: 64.86 px
- A focused comparison was necessary because the requested change concerns one small header control and the resulting vertical rhythm.

## Required fidelity surfaces

- Fonts and typography: title, description and card typography remain unchanged; only the redundant action text was removed.
- Spacing and layout rhythm: the title naturally occupies the former first row without artificial blank space; card alignment and maximum content width remain unchanged.
- Colors and visual tokens: warm background, orange accents, selected sidebar state, borders and neutral text colors are unchanged.
- Image quality and asset fidelity: app logo and koala artwork remain unchanged, sharp and correctly placed.
- Copy and content: feature title, description, search/filter labels and official update content are unchanged.

## Findings and comparison history

1. Baseline finding [P2]: the feature header duplicated the always-visible sidebar’s home navigation and consumed unnecessary vertical space.
2. Fix: removed the shared feature-header home action and its callback while preserving contextual drill-down actions such as “返回资讯列表”.
3. Post-fix evidence: no back-home control is rendered, the title moves up cleanly, and no new P0/P1/P2 issue appears.

## Interaction and runtime checks

- Selected “最新动向” through the persistent sidebar.
- Returned to the dashboard through the sidebar “首页” button.
- Reopened “最新动向” and confirmed the feature header remained correct.
- Browser console warnings and errors: none.
- Automated tests: 44 passed.
- Production build: passed.

final result: passed
