# Review: Bellows Choir integration (Astra, uncommitted working tree)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/bellows-audio.js`,
`src/bellows-scene.js`, `src/bellows-ui.js`, `tests/bellows-audio.test.js`,
`src/model.js` v4 delegation, `src/main.js` mount. Suite: 51/51 on my run.

## Verdict: approve-with-fixes

One should-fix (rolling-window gap), the rest nits. Commit when fix 1 is in.

## Findings

### praise
- **One graph for live and offline** (`createBellowsGraph`, used by
  `BellowsAudio.noteOn` and `renderBellows`) with the same per-voice trim,
  master gain, and compressor. That is the strongest truthfulness guarantee
  we have: the WAV is the choir.
- **Steal freezes the current amplitude** from the model
  (`bellowsState` at the steal time) before ramping, and the picture reads the
  same frozen value (`bellows-audio.js:49-56`). Sound and image fade together.
- **Offline allocation mirrors live** (`planBellowsVoices` vs `noteOn`'s
  filter/shift/slot logic) and the test pins slot, end, and stolenAt for every
  event under 8 s releases. Pinned noise seeds per score event make the air
  source reproducible between live phrase and export.
- **`begin()`'s pending-token guard** (`bellows-ui.js:37-46`) correctly
  handles key-up arriving while `audio.enable()` is still awaiting; no stuck
  voices. The `blur` handler ends both held and pending tokens.
- Idle chambers still show their pendulum and base aperture, and the label
  says what it is (source / slot) rather than pretending a voice is sounding.

### should-fix
1. **Rolling windows can leave an automation hole.** `tick()` schedules from
   `from = Math.max(voice.scheduledUntil, this.time)` (`bellows-audio.js:102`).
   If a tick arrives late (`this.time > scheduledUntil`), the interval
   `[scheduledUntil, now]` has no events, so each param holds its last ramped
   value, and the new window opens with `setValueAtTime(modelValue, now)`: a
   jump, audible as a click during attack or release. `steal()` already
   handles this correctly by backfilling from `scheduledUntil`
   (`bellows-audio.js:88`). Do the same in `tick()`: always schedule from
   `voice.scheduledUntil`; Web Audio clamps past-time events to "now", and the
   ramp from the last known value to the next lattice point is continuous.
   Add a test: advance `currentTime` past `scheduledUntil + HORIZON`, call
   `tick()`, assert the gain events are contiguous (every event's time ≥ the
   previous and the first new event's time equals the old `scheduledUntil`).

### nit
- `air` source has no `frequency` param, so an LFO with target `pitch` does
  nothing audible while the picture shows `frequencyHz` wobbling. Either
  drive `playbackRate` (`source.playbackRate = frequencyHz / noteHz`) so the
  noise pitch-shifts too, or grey out the pitch target for air in the UI.
- Decay, sustain, and keyTrack have no controls (`bellows-ui.js:9-20`), so
  Michael can't hear the decay-to-sustain corner. Two more sliders.
- A 20 Hz pendulum at 60 fps draws 3 frames per swing and strobes. Below
  ~8 Hz it reads; above, draw the swing envelope (a faded arc) instead of the
  bob position. Same display-rate rule as the garden sway.
- `bellows-scene.js:16` idle state uses `noteOn: 0`, so idle pendulums are
  phase-locked to absolute time; harmless, but if you want idle chambers to
  look independent give each slot its own `phase0` via `lfoValue` (it accepts
  one).
- `applyBellowsSchedule` re-validates the patch and voice on every rolling
  window (`scheduleVoice` validates once per call); at 6 voices × 40 Hz that
  is negligible, noting it only so nobody "optimizes" it into a bug later.
- The score for the choir is derived from the garden's `makeScore` by taking
  even events (`bellowsScore`), so the two phrases share a seed but not a
  feel. Fine for now; a per-family phrase generator is a later nicety.

## Truthful rendering checklist
- Iris = log cutoff: yes, and said in a comment. Suggest the caption text
  carries it too ("iris opening = cutoff on a log scale").
- Horn = output level, "no claim of acoustic radiation": yes.
- Pendulum per voice, not a shared fictional iris: yes.
- Needs the family label in the caption: "Interpreted mechanism: the sound is
  a subtractive synth; the bellows, chamber, and pendulum are driven by its
  control state." (I can't see `index.html` text in the diff I read; please
  confirm it's there.)

## On what comes after M2
Agreed with your note: before more controls accumulate, the next strong
milestone should be either deterministic video or 3D. My recommendation is
**deterministic video first** (pull M5 forward): it is the "procedural,
rendered" output Michael asked for, it forces the FrameClock discipline that
3D will need anyway, and the offline audio path you just built is already the
hard half. Proposal in the handoff message.
