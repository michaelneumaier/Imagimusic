# Proposal 013: Call and answer, one playable gesture (next creative slice after 011c)

*Fable, 2026-11-01, at Astra's request for one narrow, directly playable,
emotionally inviting interaction that carries the spirituality/psychedelia
direction through attention, relationship and continuity rather than a
diagnostic panel. Model/presentation distinction stated throughout.*

## The interaction, in one sentence

You touch one body of the Loom; the other answers through the bridge; the
page tells you, before it happens, when the answer will arrive, and then
waits with you until the ring has finished before inviting the next touch.

## Why this one

- **Attention.** The page does one thing per touch and then listens. The
  waiting is the design: a countdown to the answer, then a decay that the
  page lets finish. Nothing autoplays, nothing fills the silence.
- **Relationship.** The answer is a real modeled consequence (the coupled
  pair), not an effect. The listener's first discovery is that the body
  they did not touch sings.
- **Continuity.** Every touch adds to the same ringing system; nothing is
  reset. Touch the already-ringing body and the sound changes by
  superposition (reinforce or soften), which the model computes and the
  page can honestly name ("your touch met the ring and softened it").
- **Playable now.** The Loom already renders live impulses
  (`src/loom/main.js` strikes bodies from the page) and the coupling model
  is fixed and analytic, so prediction and picture can share one function.

## What the player does

- Two targets: the left body and the right body (keys F and J, or tap).
  One gesture: a tap; holding before release sets the strike velocity
  (0.25–1.0 over 0–600 ms), shown as the target filling.
- After a touch, the page shows a single line: "The answer arrives in
  0.32 s" (predicted from the model, below), and the camera leans toward
  the answering body as that moment approaches, then settles. No other
  controls on the first screen; "Try the other bridge" switches between
  the three journey settings of proposal 012, each with its own measured
  answer time.
- When the ring falls below a stated threshold the page says "Still" and
  the targets brighten slightly: the invitation to touch again. The player
  is never blocked from touching early; early touches simply meet the
  ring, and the page says so.

## The model side (Fable)

`src/score/call-answer.js`, pure:

```js
answerTime(settings, body) -> { seconds, peakRatio }   // first local maximum of the UNSTRUCK body's analytic envelope after a
                                                         // unit strike on `body`, from makeLoom's pickup modes (the same envelope the stage draws);
                                                         // peakRatio = that maximum over the struck body's own first maximum
stillness(settings, strikes, t) -> { level, stillAt }   // level = max body envelope from superposed strikes at t; stillAt = first t ≥ now at which
                                                         // level < threshold (default −40 dB re the strike's own first maximum), or null
meeting(settings, strikes, newStrike) -> { body, relation: 'reinforces' | 'softens' | 'first', ratio }
                                                         // what a new strike does to the energy already in its body: ratio of the body's envelope just
                                                         // after vs just before (superposeStrikes from src/coupling.js), named for the caption
```

All three read the existing coupled-pair solution; none introduces a new
parameter. Tests: answer times ordered as the measured settings predict
(close kin slowest, tight weave fastest; distant cousins' answer is small,
and `peakRatio` says so, which the page must show rather than hide);
stillness monotone after the last strike; meeting classification against
direct superposition at a known phase.

## The presentation side (Astra)

- Page `touch.html` (or a mode of `listen.html`): the Loom scene, two
  targets, the one-line prediction, the Still state, the bridge switch.
- The prediction and the camera lean read `answerTime`; the Still state
  reads `stillness`; the caption after an early touch reads `meeting`.
  Visuals: the answering body's glow follows its modeled envelope (as
  today); a presentation-only "lean" of the camera toward the answering
  body; nothing drawn that the model does not report.
- Captions in plain words: "The second body is never touched; the bridge
  moves it." "Your touch met the ring and reinforced it." "Still."
- Export: a touch session is a list of (time, body, velocity) strikes,
  which is already a Loom score; "Keep what you played" renders it through
  `createLoomPerformance` and the verifier, so a session is reproducible.

## Model / presentation distinction

| Layer | Contents |
| --- | --- |
| Simulated state | the coupled pair, superposed impulses at the player's times and velocities |
| Honest interpretation | envelopes drawn per body; answer time, stillness and meeting computed from the same solution and stated as numbers in the caption |
| Presentation | the camera lean, the target fill, the brightening at Still; all reversible, none affecting timing or sound |

No claim that the answer "means" anything; the page names what the model
does and leaves the rest to the player.

## Scope and order

1. 013a model functions + tests (Fable, ~1 slice).
2. 013b page with the single gesture, prediction, Still, bridge switch
   (Astra), reusing listen/transport patterns and the live Loom audio.
3. 013c "Keep what you played" through the existing Loom performance and
   verifier; a harness row for a recorded session (Astra, Fable fixture).
4. Audition with the question list: did the answer feel anticipated? did
   waiting feel like part of it? did you want to touch again?

## Not in scope

No time-varying coupling, no MIDI, no perceptual distortion layer, no
multi-player, no claims about inner states.
