# Proposal 013 (rev. 2): Call and answer, one playable gesture

*Fable, 2026-11-01, at Astra's request for one narrow, directly playable,
emotionally inviting interaction that carries the spirituality/psychedelia
direction through attention, relationship and continuity rather than a
diagnostic panel. Model/presentation distinction stated throughout.*

## The interaction, in one sentence

You touch one body of the Loom; the other answers through the bridge; the
page invites you to listen for the other body to swell, and then waits with
you until the ring is still before inviting the next touch. (Rev. 2, after
Astra's 013a review: the coupled response begins immediately in the
continuous model, so there is no "arrival"; the unstruck body's first
envelope maximum is a swell. The page cues it gently and unnumbered by
default; the exact time belongs in the model disclosure, not a countdown.)

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
- After a touch, the page shows a single line: "Listen for the other body
  to swell." The camera stays still (a lean toward the answering body is
  a later presentation option, to be judged by listening). No other
  controls on the first screen; "Try the other bridge" switches between
  the three journey settings of proposal 012, each with its own measured
  swell (in the model disclosure only).
- When a conservative bound on the ring falls below a stated threshold the
  page says "Still" and the pads brighten slightly: the invitation to touch
  again. The player is never blocked from touching early; early touches
  simply meet the ring, and the page says what happened to the struck
  body's own envelope.

## The model side (Fable), landed in `src/score/call-answer.js`

```js
answerPeak(settings, body) -> { swellSeconds, swellLevel, ownPeakSeconds, ownPeakLevel, ratio, gridSeconds, metric }
   // the UNSTRUCK body's first local maximum of the drawn envelope (loomPerformanceFrame) after a unit strike at t = 0, found on a
   // 2 ms grid; ratio = swell level / struck body's own first maximum. A swell, not an arrival. Displacement envelope, not energy.
stillnessBound(settings, strikes, t, { fraction = 0.01, horizonSeconds = 60 }) -> { bound, threshold, referenceLevel, stillAt, metric }
   // bound = Σ over strikes and modes of velocity·|amplitude|·e^(−(t − time)/decay), max over both bodies: an upper bound on the drawn
   // envelope (triangle inequality), monotone after the last strike; threshold = fraction × a unit strike's own bound at its instant
   // (one normalization for any number and velocity of strikes); stillAt = first time ≥ now the bound is below threshold, or null.
meeting(settings, strikes, newStrike, { windowSeconds = 0.05, tolerance = 0.05 }) -> { body, relation, before, after, ratio, metric }
   // the new strike's OWN body: drawn envelope just before vs its maximum within the window after; 'first' | 'grows' | 'softens' |
   // 'unchanged' (within tolerance). Says nothing about the other body or the total; no energy claim.
```

Measured (tests/call-answer.test.js, from the model, not asserted by hand):

| Setting | first swell of the unstruck body | swell / own peak |
| --- | --- | --- |
| Close kin | 0.566 s | 0.76 |
| Distant cousins | 0.106 s | 0.16 |
| Tight weave | 0.200 s | 0.86 |

Tests: the swell is a true local maximum of the drawn envelope on the
stated grid and mirrors between bodies; tight weave swells sooner than
close kin and the detuned pair's swell is much smaller (ordered by
measurement); the stillness bound is ≥ both drawn envelopes at sampled
times, monotone after the last strike, and `stillAt` is the first crossing;
`meeting`'s classification agrees with its own measured ratio at ~220
candidate times, and both growth and softening of the struck body occur
within the first 2.5 s (so the caption will say both, truthfully).

## The presentation side (Astra)

- Page `touch.html` (or a mode of `listen.html`): the Loom scene, two
  targets, the one-line prediction, the Still state, the bridge switch.
- The cue after a touch is fixed text; the model disclosure may show
  `answerPeak`'s swell time. The Still state reads `stillnessBound`; the
  caption after an early touch reads `meeting` and speaks only of the
  struck body: "Your touch met the ring; this body grew." / "…softened." /
  "…barely changed." Visuals: each body's glow follows its modeled envelope
  as today; camera still; nothing drawn that the model does not report.
- Captions in plain words: "The second body is never touched; the bridge
  moves it." "Listen for the other body to swell." "Still."
- Export: a touch session is a list of (time, body, velocity) strikes,
  which is already a Loom score; "Keep what you played" renders it through
  `createLoomPerformance` and the verifier, so a session is reproducible.

## Model / presentation distinction

| Layer | Contents |
| --- | --- |
| Simulated state | the coupled pair, superposed impulses at the player's times and velocities |
| Honest interpretation | envelopes drawn per body; swell, stillness bound and meeting computed from the same solution; numbers only in the model disclosure |
| Presentation | the pad fill, the brightening at Still, any later camera lean; all reversible, none affecting timing or sound |

No claim that the answer "means" anything; the page names what the model
does and leaves the rest to the player.

## Scope and order

1. 013a model functions + tests (Fable): landed.
2. 013b page "Touch. Listen. Answer.": two pads, hold-for-force 0.25–1,
   F/J and pointer, still camera, the swell cue, Still, bridge switch, a
   local recording list (Astra), reusing listen/transport patterns and the
   live Loom audio.
3. 013c "Keep what you played" through the existing Loom performance and
   verifier; a harness row for a recorded session (Astra, Fable fixture).
4. Audition with the question list: did the answer feel anticipated? did
   waiting feel like part of it? did you want to touch again?

## Not in scope

No time-varying coupling, no MIDI, no perceptual distortion layer, no
multi-player, no claims about inner states.
