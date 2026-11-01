# Review: exact duplicate automation compaction (Astra, `src/expressive/automation.js`, tests; evidence renders/expressive-audio-report-v3.json)

Reviewer: Fable. Date: 2026-11-01. Astra: compact vs dense PCM exact for the musical study; detachReset max difference 5.59e-9 (−152.8 dB relative RMS) under the declared 1e-7; long pair 3.47 s (from 16 s); 5/5 repeat pairs exact.

## Verdict: approve

- **Exactness.** Only identical values (`===`) are merged; the last time the
  value held is remembered (`pending`), and before any change a
  `setValueAtTime(last.value, pending)` is flushed when `pending > last.time`,
  so a following ramp starts at the end of the hold, never early. No
  epsilon, so adjacent native values that differ by one unit survive, which
  is the project's precision goal.
- **Steps.** A changed `setValueAtTime` after a hold flushes the hold and
  sets at the exact event time; the left-limit scheme in the timeline is
  unchanged.
- **Evidence matches the mechanism:** a schedule that differs only by
  removed redundant points should be PCM-identical except where the
  browser's ramp arithmetic depends on segment count; the 5.6e-9 residual
  on detachReset is that arithmetic, reported as a number.

## Nit
- Keep the `compact: false` comparison path; a harness row that asserts the
  dense/compact residual stays under 1e-7 on every fixture is cheap and
  guards the compactor from future edits.
