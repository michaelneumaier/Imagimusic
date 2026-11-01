# imagimusic: vision

*v1, 2026-11-01. Drafted by Fable, amended and approved by Astra (lead).*

## The one-sentence version

**Give synthesizer sounds a body.** Take a familiar electronic sound, invent a
plausible physical mechanism that could be making it, and let every dynamic of
the sound (attack, decay, filter motion, modulation, pitch, loudness) visibly
drive that mechanism, so that watching explains hearing.

## What Michael asked for (paraphrased from his brief and `initial-idea.md`)

- A visual structure for synthesized sounds that is *somewhat realistic* and
  *malleable to creative direction* in both sound and visual.
- Runs with little intervention from him. Procedural first.
- Interactable (play it, tweak it, watch it respond) **and** renderable
  (produce a finished video of a performance, Animusic-style).
- The inspiring thing: the human perception of unknown potentials visually,
  attached to familiar electronic sounds; the way all the dynamics of the sound
  shape the visuals.
- Longer-term dream (initial-idea.md): the body is not just a visualization
  but a physical model that *is* the sound source, so sound and motion share
  one cause.

## Two realism modes, stated explicitly

We build and label two kinds of instrument. Both are first-class; the UI
always says which one is on screen.

| Mode | What it promises | Status |
| --- | --- | --- |
| **Geometry-derived resonator** | Shape and material determine the modes. Change the length, thickness, or material and the pitch and timbre change for physical reasons. Structural edits *must* alter the sound. | Target of M1/M1b. Not yet achieved: in the M0.5 garden, shape does not determine pitch. |
| **Interpreted synth mechanism** | A synth module (filter, LFO, FM, envelope) is given a mechanism that *could* plausibly do that job: a chamber with an iris, a pendulum, a tension bridge, a striker and damper. The mechanism's motion is driven by the module's real internal state, but the sound comes from the synth, not from simulated vibration. | M2 onward. |

"Everything visible has a mechanical reason" is the **acceptance target** for
both modes, not a description of what exists today. Where a visual is a
stylized reading of state (for example the garden's sinusoidal sway as an
envelope display), the caption says so.

## The core idea, as a contract

A synth **patch** is a description of *how a sound is made*. We treat it as a
design brief for an instrument. For every module we choose a **mechanism
metaphor**, assemble those mechanisms into a **body**, and animate the body from
the synth's **live internal state**.

| Synth module | Mechanism metaphor (first draft; see ARCHITECTURE) |
| --- | --- |
| Oscillator / voice | A resonator: tine, reed, string, blade, membrane. In geometry mode this *is* the sound source. |
| Filter | A chamber with an iris, shutters, or a sliding baffle. Cutoff = aperture; resonance = how taut the chamber's membrane is. |
| Envelope | The exciter and the dampers: a striker, bow, pump, or magnet. Attack = approach and contact; sustain = energy kept flowing; release = damper falls. |
| LFO | A pendulum, cam, or eccentric wheel visibly linked to whatever it modulates. |
| FM / phase mod | A coupled bridge or tensioner: one vibrating part physically pulls on another's tension or boundary. |
| Noise | Grit, steam, sand, shimmer: a chaotic exciter. |
| Delay / reverb | The space the body sits in: walls, reflectors, room size. |
| Amplitude / mix | How hard the output transducer (horn, soundboard, radiating plate) is driven. |

Two patches that sound different must look different, for reasons you can read
off the mechanism.

## An instrument as an ecosystem of energy routes (Astra's framing)

An instrument is a stable anatomy through which energy travels. Excitation
wakes a part; energy leaks along connections; dampers are resting creatures
that settle it again. Motifs recur through that one anatomy rather than the
body changing shape per note. Three planned families:

- **Glass Orchard**: modal resonators; the M0.5 garden grows into this.
- **Bellows Choir**: airflow and filter chambers; pumps, irises, baffles.
- **Tension Loom**: FM as a bridge that stretches strings while they ring.

A **"why did this move?"** inspection illuminates the signal path and the
shared parameter behind any motion, so the viewer can trace cause to effect.

## On the source of truth for motion

For instruments we build, the model's **internal state is authoritative**:
exciter position, damper state, per-mode energy, filter aperture. Analysis of
the audio (FFT, envelope followers) is legitimate for imported sounds and for
target-fitting later, and is always labeled as *interpretation*, never
presented as causal synthesis.

## Malleable to creative direction

Two dials:

1. **Mechanism / anatomy**: derived from the patch (interpreted mode) or from
   geometry and material (physical mode). Seeded; re-roll for a different
   plausible anatomy of the same sound.
2. **Visual skin**: palette, lighting, environment, surface finish. Swapping the
   skin never changes timing or what moves when.

In **physical mode, structural and material edits are not skin**: they change
the sound, by design. The UI makes that boundary visible.

## Display-rate honesty

Audible vibration (hundreds of Hz) is never animated as raw phase at display
rate. Motion shows energy envelopes, amplified mode-shape deflection, blur, or
an explicitly slowed inspection view. The sounding state stays authoritative;
the picture makes it legible.

## Two outputs from one system

- **Live mode:** browser, play with a keyboard, tweak, watch at 60 fps with real audio.
- **Render mode:** deterministic fixed-timestep playback of a score with
  Animusic-style anticipation (the striker starts before the note), captured to
  video. Same code path; the frame clock replaces the wall clock.

## Non-goals for now

- Photoreal rendering. Readable, physical, beautiful beats photoreal.
- Matching commercial synth plugins exactly. We define our own small patch
  format and grow it.
- General inverse fitting (find a body for an arbitrary recording) is later
  research, not a near-term milestone.
