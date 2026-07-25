# Design QA — Rounded desktop window

- Source visual truth: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-7c8690f1-cee1-4a0f-92b2-3031574f7e2c.png`
- Implementation screenshot: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\design-qa-implementation-rounded.png`
- Normalized comparison: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\design-qa-rounded-comparison.png`
- Viewport/state: restored Electron desktop window, 1440 × 811 logical pixels, Windows display density captured by Windows.Graphics.Capture.
- Source pixels: 3008 × 1800. The 2880 × 1620 application region was cropped and normalized to 1440 × 810.
- Implementation pixels: 1440 × 811. No density resampling was applied to the implementation capture.

## Full-view comparison evidence

The normalized side-by-side comparison shows the annotated square-corner source on the left and the revised running Electron window on the right. The revised window has four consistently rounded native outer corners with no inset frame, padding, or exposed square web-content background. The dashboard composition and fixed 16:9 proportions remain unchanged.

## Focused region comparison evidence

The four outer corners and the top-right window-control safe area were checked at full capture resolution. The top-right close control remains inside the rounded boundary, and the illustration remains clear of all three controls. Additional focused crops were unnecessary because the changed surface is visible at native resolution in the full-window capture.

## Findings

- No actionable P0, P1, or P2 mismatches remain.
- Fonts and typography: unchanged from the source implementation; headings, labels, wrapping, and weights remain stable.
- Spacing and layout rhythm: the 1600 × 900 canvas, dashboard grid, control positions, and edge-to-edge shell are unchanged; only the native outer silhouette changed.
- Colors and visual tokens: unchanged; no artificial corner fill or extra frame color was introduced.
- Image quality and asset fidelity: all existing illustrations and icons remain unchanged and correctly cropped.
- Copy and content: unchanged apart from the expected live countdown time advancing between captures.
- Interaction: maximise entered true 1920 × 1080 fullscreen with square edge-to-edge coverage; restoring returned to the rounded 1440 × 811 window.

## Comparison history

1. Earlier finding — P1: all four restored-window corners were square because `roundedCorners` was explicitly disabled.
2. Fix — enabled Electron native rounded corners and added a Windows 10 window-shape fallback that updates on resize, leaves fullscreen square, and reapplies after restore.
3. Post-fix evidence — `design-qa-implementation-rounded.png` and `design-qa-rounded-comparison.png` show the rounded restored window; the fullscreen interaction capture covered the full 1920 × 1080 display without borders.

## Implementation checklist

- [x] Enable native rounded corners for the frameless Electron window.
- [x] Add Windows 10 rounded-shape fallback.
- [x] Remove the fallback shape in fullscreen.
- [x] Restore the rounded shape after leaving fullscreen.
- [x] Verify minimise/maximise/close controls remain available.
- [x] Run the full automated test suite and production build.

## Follow-up polish

No P3 follow-up is required for the requested corner treatment.

final result: passed

---

# Design QA — Microsoft TTS player

- Source visual truth: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-c40c2d2b-931d-4207-bf31-ee54c7def74b.png`
- Final Electron capture: `C:\Users\alex3\AppData\Local\Temp\naplan-tts-final.png`
- Same-image comparison: `C:\Users\alex3\Documents\NAPLAN\naplan-learning-assistant-ui\artifacts\qa\tts-player-comparison.png`
- Viewport/state: fullscreen Electron numeracy practice, Question 1 of 36, Microsoft Zira Desktop playback restarted at the beginning.

## Findings

- The reference showed a hard-coded `0:04 / 0:42` timeline and a decorative fill beginning part-way across the track.
- The brief preparation state is `0:00 / --:--`; it does not invent a total before generated media metadata is available.
- Once the Microsoft WAV is ready, the player remains at `0:00 / 真实时长` and 0% until Play is selected, then advances from the track's left edge.
- Changing questions invalidates the previous question's time immediately, prepares the new WAV, and keeps the new question at `0:00` and 0%.
- The play control changes to Pause while audio is active and returns to Play at the real media end.
- Replaying completed audio explicitly resets both `currentTime` and the visual progress value to zero.
- The existing NAPLAN-style toolbar dimensions, colours, spacing, question layout and desktop control panel remain unchanged.
- No actionable P0, P1, P2 or P3 visual mismatch remains for the requested player correction.

## Verification

- [x] Generated a real WAV through the Windows Microsoft speech engine.
- [x] Confirmed the active voice is `Microsoft Zira Desktop`.
- [x] Confirmed real media duration and current-time updates in the running Electron app.
- [x] Confirmed first play and replay both begin at `0:00` and 0%.
- [x] Confirmed all 71 automated tests and the production build pass.

final result: passed
