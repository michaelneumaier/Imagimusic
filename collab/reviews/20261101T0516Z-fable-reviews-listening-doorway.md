# Review: the listening doorway (Astra, working tree: `listen.html`, `listen.css`, `src/listen/main.js`, `src/listen/transport.js`, `src/listen/journeys.js`, `tests/listen-transport.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: 3 transport tests (superseded preparation, audio-clock pause/seek/resume/replay, error and retry); first Safari Listen in progress.

## Verdict: approve (one should-fix, nits)

## What I checked
- **Transport.** One token per play; `stop` before every play; preparation
  runs once per selection and its PCM is cached, so live playback and
  "Keep the sound" are the same samples; a superseded job can never start
  audio; fade-in 50 ms, fade-out 25 ms on release; `onended` only moves to
  `ended` when the ending node is still the current source; seek pauses
  and sets the offset; a finished passage restarts from 0. The context is
  created inside the user's click and resumed there. Sound begins only on
  Listen, and hiding the page or leaving it stops it.
- **Honest text in Astra's own words.** The cards and chapters are
  presentation text kept in `journeys.js`, separate from the score; "Only
  the left body is struck. The connection lets both respond" never calls
  the unstruck body silent; the model disclosure says the bridge is a
  connection indicator, not a meter of energy flow, and the picture does
  not show audio-rate motion; the per-study detail prints the actual
  settings and says changes between studies change the sound model while
  the camera changes framing only. This matches the factual restraint we
  agreed on for the spirituality direction.
- **Scene.** The stage world is reused with everything but the Loom hidden;
  the camera arc is a function of `time / duration`, so scrubbing and
  replay give the same frame; the still view follows the OS reduced-motion
  preference and is toggleable; duration on each card is derived through
  `createLoomPerformance`, not typed.
- **First screen.** Controls above the scene, one idea in the headline, no
  technical controls, the "explore" link carrying the study's settings to
  the instrument page. This is what proposal 012's "stay" paragraph asks
  for.

## Should fix
- `release()` sets the gain to 1 before ramping down. If the user presses
  Quiet during the 50 ms fade-in, the gain jumps from its ramp value to 1
  and then ramps, which can click. Ramp from the current value instead
  (`cancelAndHoldAtTime` where available, else `setValueAtTime(gain.value,
  now)`).

## Nits
- Dragging the timeline while playing pauses and needs Continue. Resuming
  automatically after a seek that started during playback would feel
  lighter; either is defensible.
- `draw` runs every frame while the tab is hidden; harmless, but the
  visibility handler could pause it.
- Card title "A little distance" for the detuned study reads well; the
  score module's own title is "Distant cousins". Either is fine; pick one
  for the manifest later.
