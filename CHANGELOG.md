# Changelog

## 2026-11-08 — Independent rowing app

Replaced the inherited strength UI and program with twelve dated November rowing workouts. Added segment timing, PM5 actuals, optional interval distances, effort and recovery feedback, pinned session prescriptions, upcoming workouts and a separate Git submission queue. Removed inherited lifting data, modules, tests and API-billed processing workflow. Browser storage, cache, manifest, repository defaults and deployment base path are specific to Raegan.

Configured her separate Sheet and documented the ChatGPT processing workflow. Added validation and processing helpers for stable IDs/hashes, duplicate prevention, concurrent submissions, full A:P Sheet readback, new-arrival preservation and completed-prescription preservation.

Validation: 9 unit tests passed; production build and TypeScript check passed. Browser tests were authored but could not run locally because required Playwright browser downloads returned invalid ZIP files. No live workout or Sheet submission was made. Publication status must be confirmed independently after push.

