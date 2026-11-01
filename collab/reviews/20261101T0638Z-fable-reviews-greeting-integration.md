# Review: positional greeting page integration (Astra, working tree: `src/grove/greeting.js`, `src/grove/main.js`, `tests/grove-greeting.test.js`, `tests/grove-voice-audio.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: twelve seed/rate/voice combinations admit every scheduled event and keep positions through capture; the browser harness now plays the real richer greeting (six cases underway).

## Verdict: approve

- **One plan, two recipes.** `createGroveGreetingPlan(grove, voice)` turns
  either the original greeting or the position-aware one into the same
  shape: events in seconds (with `position` when a voice is present),
  sections in seconds, and the recipe's own duration, so the page's phase
  line and transport read one contract. The original recipe and its path
  are unchanged.
- **Frames preserve everything else.** `groveGreetingFrames` rounds
  `time` to a frame with `Math.round(time · sampleRate)` and keeps body,
  velocity and position, which is the documented convention; the session
  then derives `strikeU` and `bufferIndex` from the position, so the
  captured record carries the places the recipe wrote (tested).
- **Page.** The phase line derives from plan sections (PLACES / ANSWER /
  LATE / SHARED, then "let the response finish" and "the greeting has
  settled"); the status line for the richer greeting says "One body, three
  places. Then the others answer." and nothing more, which is the point.
- The parity harness now uses the real authored greeting instead of a
  synthetic position cycle, so the evidence is about what listeners hear.

## Nit
- `createGroveGreetingPlan` recomposes the voice (and its eigen-solve) each
  time it is called; `configure()` calls it once per seed/voice change, so
  this is fine; just do not call it per frame.
