# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

The dashboard's “模拟练习” and “1:1 模拟做题” entry points must open `/exam`. That route uses the faithful NAPLAN-style test UI from `../naplan-ui-clone` and must load questions from `content/naplan-bank/questions/`, not hard-coded demo questions.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

Keep every sidebar and dashboard shortcut functional. Practice submissions from `/exam` must sync into the assistant's learning records, mistake book, and AI report views through the shared local practice history.

The learning-assistant UI must support Simplified Chinese, English, Traditional Chinese, and Korean. Keep `/exam` and all practice-test content in English. Store the writing-review output language separately from the interface language, with the same four options.

Official-update content must come from NAP or ACARA URLs, be stored with fetch metadata and CC BY attribution, and provide summaries in all four UI languages. Full HTML page text may be mirrored for licensed general information pages; keep PDFs and ACARA-excluded materials such as demonstration tests, example questions, prompts, marking guides, SSSR guides, and example ISRs as official links only.

The latest-updates reader must keep the English official-page snapshot separate from convenience translations. Store Simplified Chinese, Traditional Chinese, and Korean machine-assisted full-page translations in `src/data/official-page-translations.json`, bind them to the source snapshot hash, follow the selected interface language by default, and always offer an explicit four-language reader switch plus an official-English-source warning.

Use `/assets/naplan-app-icon.png` as the learning assistant's favicon, touch icon, and sidebar app mark. It comes from the user-provided `E:/2323.png`. Keep the NAPLAN-style exam player's own in-product logo treatment separate from this software branding.

Desktop packaging uses two distinct icon families under `packaging/icons/`: `app-icon.*` is the installed application/shortcut icon, while `installer-icon.*` is the installer and uninstaller artwork supplied by the user as `E:/ouyhkjhw.png`. Do not show the installer artwork inside the running application UI.

The Windows desktop shell must stay frameless and edge-to-edge: do not show the native title bar, application menu, or an outer padded card/frame. Keep the custom minimise, maximise/restore, and close controls functional through the Electron preload/IPC bridge on both the learning dashboard and `/exam`, and preserve a draggable region that does not cover primary controls.

The Windows learning-assistant shell must render inside a fixed 1600 x 900 (16:9) application canvas that scales uniformly and stays centred in the available window. Do not let desktop breakpoints reflow dashboard cards into a webpage-like vertical document, and do not show browser-style scrollbars. Feature workspaces may still scroll with the mouse or keyboard inside the fixed canvas, but their scrollbars must remain hidden.

Use `William` as the default student name for a fresh profile. Preserve a student name that the user has explicitly saved in settings.

Entering `/exam` in the Windows desktop app must automatically enable true full-screen mode, and returning to `/` must exit it. The fixed-ratio exam stage must remain centred on both axes; wide-screen practice controls may sit at the right edge but must not shift the answer stage away from screen centre.

Treat multilingual reflow as a release requirement: Simplified Chinese, English, Traditional Chinese, and Korean must have no uncontrolled page/card overflow at 1440 px, the medium desktop breakpoint, 390 px, or the 320 px minimum. Keep `/exam` English-only. Preserve safe wrapping for brand copy and quick actions, and keep mobile navigation scrolling inside its own strip rather than widening the page.

Dashboard cards with translated summaries, especially the warm-home latest-news card, must grow with their content; never use a fixed grid row that lets the final item or action arrow cross the card boundary.

Treat the “考试指南” / NAPLAN guide as the canonical parent-facing introduction and official-resource hub. Keep its test dates, official durations, tailored-test explanation, proficiency descriptions, and outbound links aligned with current NAP or ACARA sources in all four interface languages. Never present practice scores as official NAPLAN scaled scores.

Dashboard and full-page schedules must show only official NAPLAN test windows that have not ended as of the viewer's current date. Derive the countdown from the next future window, never retain an already completed test year as a static dashboard milestone, and link future dates to the NAP key-dates page.
