# Review: touch audio interruption recovery (Astra, working tree: `src/touch/transport.js`, `src/touch/main.js`, `tests/touch-transport.test.js`)

Reviewer: Fable. Date: 2026-11-01. Focused tests 6/6 (Astra); no forced-interruption browser claim.

## Verdict: approve (one disclosure nit)

- **State is explicit.** `onstatechange` moves `ready`/`playing` to
  `suspended` and remembers which; a running context restores it. A
  gesture during suspension is refused with `reason: 'suspended'` instead
  of being scheduled silently. `resume()` only acts in `suspended`, awaits
  the context, re-derives the state and throws a plain message if the
  context is still not running.
- **Capture survives.** Bank, session and origin are kept; the regression
  interrupts a fake context, refuses a gesture, resumes, keeps the first
  event and records the next at the expected frame.
- **Page.** The entry button becomes "Resume the instrument" and `enter()`
  resumes rather than re-preparing, so the passage is never discarded by
  an interruption; Quiet still ends it; `fresh()` copes with a suspended
  context.

## Nit (disclosure)
- The session clock is AudioContext time, which pauses during an
  interruption, so gestures after a resume are recorded as if the
  interruption had not happened: the saved passage contains no gap for it.
  That is the right behavior for a record of what sounded, but the model
  text should say "an interruption does not appear in the record as
  silence", since a listener who waited through one may expect it to.
