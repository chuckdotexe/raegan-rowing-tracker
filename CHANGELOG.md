# Changelog

## 2026-11-09 — Remove recovery questions

Removed next-day fatigue and soreness questions from workout submission. Existing saved drafts and retry submissions retain their data. Current pain or symptoms can still be recorded. Test fixtures use the starting plan so processed workout receipts do not affect their setup. Validation: all 9 unit tests and the production build passed.

## 2026-11-08 — Clear effort scale

Numeric effort targets now show “out of 10” on the workout list, active timer and upcoming workouts. Descriptive warm-up and recovery effort remains readable. Existing numeric results and JSON targets keep their values. Validation: production build and existing unit checks run before publication.

## 2026-11-08 — Independent rowing app

Replaced the inherited strength UI and program with twelve dated November rowing workouts. Added discard for unsubmitted drafts and validation of cached preview data. Added segment timing, PM5 actuals, optional interval distances, effort and recovery feedback, pinned session prescriptions, upcoming workouts and a separate Git submission queue. Removed inherited lifting data, modules, tests and API-billed processing workflow. Browser storage, cache, manifest, repository defaults and deployment base path are specific to Raegan.

Configured her separate Sheet and documented the ChatGPT processing workflow. Added validation and processing helpers for stable IDs/hashes, duplicate prevention, concurrent submissions, full A:P Sheet readback, new-arrival preservation and completed-prescription preservation.

Validation: 9 unit tests passed; production build and TypeScript check passed. The browser CI workflow builds before serving. Browser tests were authored but could not run locally because required Playwright browser downloads returned invalid ZIP files. CI initially found an ambiguous test selector matching Next.js route announcements; the selector was narrowed to the app error message. The corrected end-to-end test passed in both Chromium and mobile WebKit on GitHub Actions. The independent app was deployed successfully and its published plan and workout controls were inspected. No live workout or Sheet submission was made. Pages is configured for GitHub Actions and the independent deployment workflow no longer depends on copied repository variables. Publication status must be confirmed independently after push.

