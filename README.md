# Raegan Rowing

Independent rowing app copied from the adaptive workout tracker. The app uses ONLY chuckdotexe/raegan-rowing-tracker and separate browser storage/cache keys. The original lifting repository is unchanged.

## Current program

Twelve workouts, November 9–28, 2026, Monday/Wednesday/Friday/Saturday. No November lifting. Rest Tuesday/Thursday/Sunday and November 30; winter training starts December 1. Weekly scheduled totals are 123, 136 and 150 minutes, including warm-up, recovery and cooldown. The prescription is a starting plan, conditional on current exercise tolerance and recovery, not a guaranteed fitness outcome.

`data/rowing-plan.json` is the bundled offline starting plan. `next-week.json` is the live authoritative plan with revision, dated workout IDs, timed segments, reasons and processing receipts. `completed.json` is the separate rowing submission queue. No inherited lifting history or program is used.

## Use

Published app: https://chuckdotexe.github.io/raegan-rowing-tracker/

Open the app, choose a workout, and Start. Each segment has time, effort and stroke rate. The timer pauses between segments and survives refresh; use PM5 measurements for actual results. Optional per-work-segment distances are preserved in the submission. Record actual total minutes, meters, effort and completion; rate, notes and recovery ratings are optional. Next-day ratings should remain blank until known.

An unsubmitted draft can be discarded after confirmation; uncertain submissions stay locked for retry. Finish saves to this repository using a fine-grained GitHub token restricted to this repository with Contents read/write. The token is remembered only on the device. A failed save retains the same frozen session and ID for safe retry. Acknowledged sessions are excluded from upcoming workouts. Offline logging uses the saved plan and clearly labels it. Refresh loads the published plan, while an active workout retains its original prescription.

The Sheet is `1-pVOc2nrw72E9CFZ9Jh77GjhTmhLcOBu9--E07JbREk`, tabs November Plan and Workout Log. Ask ChatGPT to process Raegan's rowing workouts using PROCESS_WORKOUTS.md. Saving in the app queues to Git; it does NOT immediately write Sheets. No scheduled or API-billed processing is installed. The processing helper requires full 16-column readback proof before acknowledgment, retains newly arrived sessions and publishes plan/receipts/queue together. The processor must verify real Sheet reads; the helper cannot independently authenticate connector evidence.

All submitted workouts in this public repository, including notes and cleared Git history, are public. No Google credentials are stored in the app.

## Development

Node 22+: `npm ci`, `npm test`, `npm run build`, `npm run typecheck`. Browser tests: `npx playwright install chromium webkit`, then `npm run test:e2e`. The manual browser-check workflow builds the app before testing Chromium and mobile WebKit. Tests simulate network and processing proofs; they do not prove live Sheet writes or physical iPhone behavior.

GitHub Pages uses NEXT_PUBLIC_BASE_PATH=/raegan-rowing-tracker and publishes through GitHub Actions. Pages is configured to use GitHub Actions; no repository variable or Google secret is required. No deployment is implied by a successful build. The cache prefix and repair page affect only raegan-rowing caches, leaving the lifting app untouched.

Code changes must update README.md and CHANGELOG.md in the same commit. Workout data changes alone do not require documentation edits.
