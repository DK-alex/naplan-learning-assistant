# Design QA

## Source

- User reference: `C:/Users/alex3/AppData/Local/Temp/codex-clipboard-04a942ab-d77a-4704-b1fe-49c884426444.png`
- Reference intent: preserve the official-style test canvas and use the surrounding grey application area for product-level test controls.
- Tested implementation: `http://127.0.0.1:5174/exam`
- Visual check viewport: 1280 × 720, with the official-style canvas scaled independently from the right control rail.

## Source-to-implementation comparison

- The ACARA/NAP header, pale blue test canvas, white footer and existing question-player proportions remain visually separate from the added product controls.
- Home, Restart and End are grouped in a single right-side card positioned in the grey area indicated in the reference.
- Each control uses a recognisable icon plus stacked Chinese and English labels, keeping the rail narrow without horizontal text overflow.
- Disabled states are visible before a test begins and after submission; active controls use blue for navigation and red for ending the test.
- The end-test confirmation is a centred, high-contrast modal over the current question, with the completed and remaining counts visible before confirmation.
- The completed-answer result screen uses green/red status borders, visible answer labels and a scrollable review area without colliding with the fixed official footer.

## Functional checks

- Selecting a wrong answer immediately displayed “Not quite”, the correct answer and the explanation.
- Changing that response immediately replaced the feedback with “Correct”.
- A live wrong answer appeared in the main app mistake book before the test was submitted.
- Returning to the main app and opening Practice Test again resumed at Question 2 with the selected response and feedback intact.
- Restart Test reset the timer to 2:00, returned to Question 1 and cleared the selected answer and live feedback.
- End Test opened a confirmation dialog stating 2 of 39 completed and 37 unanswered.
- Confirming End displayed exactly the two completed answers: one correct and one incorrect, with unanswered questions omitted.
- Browser console check returned no warnings or errors.
- Production builds passed for both the exam player and the main app; all nine exam-player tests passed.

final result: passed
