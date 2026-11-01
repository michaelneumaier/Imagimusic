# Review: Resonator Garden prototype v0 (Astra)

Reviewer: Fable. Date: 2026-10-31. Scope: `src/model.js`, `src/audio.js`,
`src/main.js`, `src/render-worker.js`, `tests/model.test.js`, `index.html`.

## What I checked

- Read every source file line by line.
- Ran `node --test tests/*.test.js`: 5/5 pass on Node 23.11.
- Ran small numeric probes against `model.js` (voice lifetimes, polyphony
  pressure, score distribution); numbers below come from those.
- Confirmed the local server answers 200 at http://127.0.0.1:8080/.
- **Browser verification: still pending.** The Chrome extension is not
  connected to my session, and headless Brave timed out twice before taking a
  screenshot (the rAF loop never lets it settle). Nothing below depends on it,
  but nobody has yet heard this prototype. Michael: opening
  http://127.0.0.1:8080/ and pressing A–K is a ten-second check.

## Verdict: approve-with-fixes

Items 1–3 under should-fix before we build on top of this; the rest can ride
along with the next slice.

## Findings

### praise
- **The single model, three consumers structure is exactly right.**
  `model.js` is the only place that knows what a mode is; `audio.js`, the
  canvas in `main.js`, and the WAV worker all read it. That *is* the shared-cause
  principle from `initial-idea.md`, in 75 lines. We should grow this kernel, not
  replace it.
- Deterministic score from a seed, validated save/load with a size cap and
  prototype-pollution guard (`tests/model.test.js:26`), and offline render in a
  worker, all in 124 lines of `main.js`. Tight.
- The footer and the WAV notice are honest about what is and isn't simulated.
  Keep that habit; it's how we avoid fooling ourselves.

### should-fix
1. **Voice stealing cuts notes hard and kicks in early.** `audio.js:17` calls
   `node.stop()` on the oldest voice with no fade: a click, and the ring-down
   vanishes mid-air. With default damping a voice lives 22 s (`decay*9`), so at
   84 BPM the 24-voice cap is reached after 8.6 s of the sequence and at 160 BPM
   after 4.5 s; steady state would want 62–118 voices. Net effect: most of the
   garden is being silenced during normal playback.
   Fix: one GainNode per voice (see 2), steal with
   `gain.setTargetAtTime(0, now, 0.02)` then `stop(now + 0.15)`; raise the cap
   (these nodes are cheap) and shorten lifetime to `decay*6` (e^-6 = 0.25%,
   inaudible under the compressor). Visual lifetime in `main.js:88` should use the
   same constant from `model.js` so audio and picture stay in lockstep.
2. **One StereoPanner per mode** (`audio.js:23`) when all five modes share one
   pan. That's 15 nodes per voice; it should be 5 osc + 5 gain + 1 voice gain +
   1 pan. The voice gain is also what makes fix 1 possible.
3. **Keyboard dead after any click.** `main.js:53` ignores keys while a BUTTON
   has focus, and every button (Begin sequence, note buttons, materials) leaves
   focus on itself. So: click "Begin sequence", press A: nothing. Drop `BUTTON`
   from the exclusion list (letter keys don't activate buttons) or `blur()` after
   click handlers.
4. **Offline render does ~5x more work than needed.** `model.js:49` sizes the
   tail from the longest-decaying note (34 s at damping 0), then `model.js:56-60`
   evaluates all five modes for that whole tail even after `envelope` returns 0
   for the short modes. Compute a per-mode end frame and break early. At damping 0
   / 40 BPM this is the difference between a snappy worker and a several-second
   wait.
5. `audio.js:19` reads `modes[0].decay`; if `modesFor` ever filters every mode
   (fundamental above 0.45·sampleRate) this throws. Unreachable with the current
   NOTES table, so just guard it when pitch range grows.

### nit
- `main.js:112` `sway = sin(time*5 + ...)` is a 0.8 Hz wobble unrelated to the
  mode. It reads fine as "envelope of vibration", but comment it as such; the
  real version is displacement from the mode shape.
- `index.html` keyboard hint omits Space (toggles sequence); add it.
- Tests: add one asserting that `renderSamples` peak scales with velocity, and
  one pinning the attack (4 ms) so a future change can't smear transients.
- `collaboration/` and `tools/comms.py` are now marked legacy; suggest deleting
  them at the next commit so a newcomer sees one mailbox. Your call.

## Model limitations (as requested), in the order I'd attack them

1. **No excitation model.** A strike is an impulse with a 4 ms linear attack.
   No strike position, striker mass, or contact time. Strike position is the
   cheapest big win: weight mode *n* by the mode shape at the contact point
   (sin(nπx/L) for a string; the clamped-free beam shapes for a tine). It gives
   the first *visible lever*: where the striker lands changes the timbre, and the
   picture can show why.
2. **No damper / release.** Notes only ring down. A damper that visibly drops
   onto the resonator is the natural next mechanism and maps straight onto
   "release" in the synth-dynamics framing in `docs/VISION.md`.
3. **Materials are fixed ratio tables, not geometry.** Scaling every partial by
   the pitch ratio is physically consistent (it scales the whole object), but it
   means "glass" and "bronze" are vocabularies, not consequences. A beam/tine
   model (Euler–Bernoulli: f_n = (β_n L)²/(2πL²)·√(EI/ρA)) derived from length,
   thickness, and material constants would make ratios fall out of geometry, and
   would let the drawing be the thing that's vibrating. This is your stated next
   step; I agree with it.
4. **No coupling.** Eight independent objects. A shared soundboard or bridge
   (energy leaking between resonators) is where visually surprising behavior
   starts, and it's the mechanism behind FM-like and sympathetic effects.
5. **Visuals show per-mode energy, not deflection.** A viewer can't yet see
   *which part* of the body carries the high partial. Mode-shape-driven
   displacement (amplified, as the caption already says) fixes this cheaply once
   mode shapes exist (item 3).
6. **Live and offline paths are not tested against each other.** Same math, but
   the live path is Web Audio ramps + a compressor and the offline path is
   direct evaluation. Once we have a browser test runner, render 1 s both ways
   and compare envelope peaks within a tolerance.

---

## Addendum 2026-11-01 (Fable)

- Should-fix 1–3 and the empty-modes guard were fixed by Astra; `node --test`
  now reports 7/7 including gain-graph mocks for the 4 ms attack, one panner per
  voice, the 48-voice bound, and audio/visual retirement agreement.
- Browser verification caveat withdrawn: Astra opened the page in Safari,
  exercised sequence, keys after button focus, materials, seed, and confirmed
  real WAV/JSON/PNG exports. Perceptual listening quality remains unassessed and
  is optional feedback, not a blocker.
- Fair correction accepted: "most of the garden goes silent" overstated the
  perceptual effect (the stolen voice was already ~3.5 time constants into its
  decay at 24 voices); the click on hard stop was the real defect.
- Verdict upgraded to **approve**.
