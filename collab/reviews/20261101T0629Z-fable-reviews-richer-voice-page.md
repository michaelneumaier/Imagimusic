# Review: optional richer-voice page integration (Astra, working tree: `grove.html`, `grove.css`, `src/grove/main.js`, `scene.js`, `render-job.js`, `render-worker.js`, the voice adapters)

Reviewer: Fable. Date: 2026-11-01. Astra: fifteen focused factory/session/routing/interaction tests pass; Safari loads the optional page and prepares the bank; save parity and harness next.

## Verdict: approve-with-fixes (one: the strike-position orientation must be stated and consistent)

## What is right
- **Original stays the default.** The voice selector defaults to Original;
  `voice=partials` in the URL is the only way in; `createSession` picks
  the new record kind only when a voice is present; the old caption stays
  on the old voice; save names gain `-partials`; replay is unchanged.
- **One factory, one worker.** `createGroveStudyJob` sends the canonical
  settings and the worker branches on `voice`, rendering the nine
  position-major responses through `createVoiceInstrument` /
  `renderVoiceBank`, the same factory the comparison tool uses; the
  original path is untouched.
- **Positions are explicit everywhere.** Pad selector lower / middle / tip
  = 0.3 / 0.6 / 1; a direct shell hit quantizes to the same three at
  gesture start; the greeting uses the middle; the held ring moves to the
  selected height so the player sees which zone they chose.
- **Captions.** The optional model paragraph says three beam-family
  partials per body coupled through attachment-point springs, nine normal
  modes with assigned decay rates, no radiation or room, camera is view
  only; the per-grove detail names the low band that is displayed.

## Should fix: which end is the tip
`groveHitAt` still returns `positionU = 1` at the **top** of the shell and
the UI calls that "Tip · 1.0" ("touch a shell … high"). In the model the
tip is the bridge attachment (`attachU = 1`), and in the scene the tendrils
meet the bodies low while the suspension holds the tops; so the picture
says the connection is at the bottom and the control says the tip is at
the top. Pick one and write it into the model text:
(a) invert `positionU` (`1 − …`) so "tip" is the tendril end, low on the
shell, and the lower pad option becomes the top of the shell; or
(b) keep the current mapping and say the zones are a control layout whose
"tip" is the top by convention, unrelated to where the tendrils are drawn.
I recommend (a): touching near the connection then excites the attachment
point most, which is true in the model and visible in the picture.

## Nits
- `applyGroveScene` positions the gesture ring with `(u − 0.5) · 2.6 ·
  scale.y`, i.e. the same top-is-1 convention; it must follow the decision
  above.
- Memory: nine stereo responses at 48 kHz for a 20 s ring is ≈ 69 MB of
  Float32; fine on a desktop, worth one measurement line in the validation
  note before claiming mobile.

## Addendum: shared-basis bank renderer (voice-performance.js)

Approve. The renderer evaluates the nine normal modes' basis
`e^{−γ_r t} sin(2π f_r t)` once per sample and projects it with each
profile's signed amplitudes; since every strike position and pickup
shares the same normal frequencies and decays (one `modalNetwork`), this
is the same sum as before with the terms regrouped, so the bank is
mathematically identical and the independent analytic check at 1e-8 over
all 9 slots × 2 channels × 5 times is the right guard. `voice.gammas[r]`
equals `1 / decay` of the stereo modes, as used. Measured 12.1 s → 2.6 s
for the same 66 MB of samples; the remaining cost is the sample count,
not the math. Same tail nit as the previous renderer (no `t ≥ ring`
branch; harmless because `t < ring` for every sample).
