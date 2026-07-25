# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

Keep the copied NAPLAN-style interaction and layout, but source live practice tests from `../naplan-learning-assistant-ui/content/naplan-bank/questions/`. Preserve official-style year/domain flows, question counts, language-conventions sections, and Year 7/9 numeracy calculator transitions.

Year 3 writing is a paper test. Keep a Year 3 Writing entry in the practice flow, explain that the child completes the task on paper, and use a separate parent-transcription step for AI review. The product does not use handwriting OCR; parent entry must preserve the child's original spelling, punctuation, paragraphing and wording. Store Year 3 responses with `entry_method: "parent_transcription"` and do not present the transcription screen as an official online Year 3 test.

On the Year 3 writing prompt screen, keep the paper-task notice in normal document flow below the optional audio bar. It must retain visible breathing room and never use a negative top margin that lets the audio controls cover the notice.

Keep a persistent, unfinished practice-session bookmark. Leaving for the main app must save the current question, mode, answers, flags, section state, writing response and elapsed time, and the next visit to the mock-test route must resume that session. During an active test, objective responses are saved without revealing correctness, correct answers, scores or explanations. Grade only after the test is submitted; the submitted review shows results and explanations, and attempted incorrect answers are then archived to the mistake book. Keep the app-level Home, Restart and End controls outside the scaled official-style exam canvas. Ending early requires confirmation and the result screen reviews completed answers only.

In the Windows desktop build, `/exam` runs in true full-screen mode. Keep the scaled fixed-ratio exam stage centred horizontally and vertically; on wide screens reserve equal space on both sides before scaling so the separate right-side practice controls never push the answer stage off centre.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
