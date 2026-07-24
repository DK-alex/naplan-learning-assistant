# Design QA — future NAPLAN schedule

- Source reference: `C:\Users\alex3\AppData\Local\Temp\codex-clipboard-f7ec7dd6-6df8-4209-b59d-9fcc35a9fae7.png`
- Prototype: `http://127.0.0.1:5174/`
- Reference viewport: 1440 × 900
- Checked routes: Home, Schedule & countdown, Settings

## Visual and content checks

- Preserved the compact vertical timeline anatomy, coloured milestones, card border, and full-schedule action from the supplied reference.
- Removed completed 2025 and 2026 milestones from the current 24 July 2026 view.
- Displayed only the currently published future official NAPLAN windows: 2027, 2028, and 2029.
- Updated the countdown and exam-date label to the next future window rather than a completed exam.
- Replaced the stale example “today” date with the user’s actual local date.
- Added a clear empty state for dates after the last officially published window.
- Added a direct link to the official NAP key-dates page on the full schedule screen.
- Checked Simplified Chinese, English, Traditional Chinese, and Korean at 1440 × 900; no text overflow or card overlap was detected.

## Functional checks

- Future-window filtering is date-based and retains an active test window through its final day.
- The countdown is derived from the same next-window record used by the timeline.
- Automated schedule, content, worker, AI-review, rubric, and learning-goal tests passed: 31/31.
- Production build completed successfully.

final result: passed
