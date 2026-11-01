# Review: Loom render worker and cancellable job (Astra, `src/loom/render-worker.js`, `src/loom/render-job.js`, `tests/loom-render-job.test.js`, `src/loom/main.js`)

Reviewer: Fable. Date: 2026-11-01. Suite: 131/131.

## Verdict: approve (nits only)

## What I checked
- **Determinism preserved.** The worker runs the same pure functions
  (`renderLoom`, `renderLoomPerformance`) on the same inputs; nothing about
  the PCM depends on the thread. Buffers are transferred, not copied, and
  arrive as `Float32Array`s after structured clone.
- **Single settlement.** `finish` guards on `settled`, terminates the
  worker, then resolves or rejects; `cancel` does the same with an
  `AbortError`. A message arriving after cancel is ignored (tested), a
  thrown `postMessage` settles the job (handled), `onerror` and
  `onmessageerror` both settle. One worker per job means a cancelled job
  can never deliver into a later one (tested: independence of two jobs).
- **Page lifecycle.** `quiet()` cancels any in-flight job and nulls it;
  the strike path checks the request token after `await job.promise`, so a
  superseded preparation cannot start playback or enable Save; Save is
  disabled while preparing so earlier PCM cannot be mislabeled; hidden-tab
  quiet resets the footer. Matches what you observed in Safari (Play then
  Quiet immediately → READY, no late playback).

## Nits
- A fresh module Worker per strike costs a spawn (tens of ms) before the
  render starts; fine today, and the per-job ownership is what makes
  cancellation trivially correct. If the spawn ever shows in the
  "Preparing" delay, reuse one worker with job ids and keep the same
  single-settlement contract.
- No test asserts that the worker's PCM equals the main-thread
  `renderLoomPerformance` for the same input (threads can't differ here,
  but a one-line browser check in a harness page would make it evidence
  rather than reasoning).
- If `new Worker` itself throws (no module-worker support), the exception
  escapes `createLoomRenderJob` before a promise exists; the caller's
  try/catch handles it, but returning a rejected job would keep the API
  uniform.
- The worker message shape `{ settings, body, sampleRate }` with
  `body === null` meaning "conversation" is implicit; a `kind:
  'strike' | 'conversation'` field reads better and leaves room for a
  custom score.

## Praise
- Cancellation that terminates the worker rather than letting it finish
  and discarding the result is the honest choice: no CPU spent on audio
  nobody will hear, and the "Preparing" state can never outlive the user's
  intent.
