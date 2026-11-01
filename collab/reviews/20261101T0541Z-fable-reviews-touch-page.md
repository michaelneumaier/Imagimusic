# Review: "Touch. Listen. Answer." (Astra, working tree: `touch.html`, `touch.css`, `src/touch/main.js`, `src/touch/transport.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: unit/transport tests 5/5; Safari keyboard F/J and held pointer pads recorded gestures; Quiet froze capture and faded; an independent Node re-render from the saved JSON was byte-identical to the saved WAV.

## Verdict: approve (one wording nit)

## Cleanup, cancel, gestures
- **Scheduling is exact and recorded.** A strike is scheduled 25 ms ahead,
  rounded up to a sample; the first strike fixes the origin; the session
  records the integer frame and the buffer source starts at exactly
  `origin + frame / sampleRate`. The saved sum uses the same frames, which
  is why the Node re-render matches byte for byte.
- **Buses and lifetimes.** One master gain per passage; Quiet records the
  end frame, ramps the bus to zero over 25 ms and stops every source
  30 ms later; `fresh()` makes a new bus and the old one is disconnected
  once its last source ends, so a new passage cannot cut a fading one.
  `cancel()` bumps the token so a superseded bank can never replace the
  newer instrument (tested).
- **Holds.** Pointer capture with cancel and lost-capture releasing the
  hold without playing; keyboard F/J with repeat and modifier guards;
  Escape, window blur and page hide clear holds (blur without playing,
  hide with Quiet); a keyboard-activated pad (`click` with `detail === 0`)
  plays at 0.5. Nothing plays while the context is suspended or the
  instrument is not open.
- **Refusals** are explained in the listener's terms: headroom → "Let this
  ring settle a little"; capacity → keep it, then begin a new one.

## Captions and cues
- The model text says both bodies respond immediately and the other's
  first swell comes a little later; no answering notes are added; width
  and glow are envelopes, not audio-rate motion or energy flow; the
  camera stays still; the Still cue is a conservative decay bound, not an
  estimate of experience; fixed output gain so a later touch cannot
  change what came before; density may need space. All true to the code.
- The swell time and ratio appear only in the model disclosure (2 ms grid
  named); the main cue stays unnumbered. The phase line reads LISTEN
  ACROSS THE CONNECTION until `stillnessBound`'s `stillAt`, then STILL.

## Nit
- After an early touch the hint says "The left body's next swell is
  softer / grows." `meeting` measures the struck body's envelope just
  before the touch against its maximum within 50 ms after, so the
  truthful phrasing is about this touch, not the next swell: "The left
  body softens with this touch." / "…grows with this touch."

## Noted for docs (done)
Proposal 013 rev. 2 now states that "Keep the sound" is the unit-bank sum
of the touch record at fixed gain, deliberately not the whole-score
normalized performance path, and that the movie exporter and verifier are
not wired for touch sessions.
