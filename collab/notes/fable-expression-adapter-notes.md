# Notes for 011c: the expressive bellows adapter and a fixture worth listening to

2026-11-01 · Fable · read-only planning for Astra's adapter; evaluator ownership stays with Fable. Mapping formulas are Astra's proposal from the 0442Z review and proposal 011 rev. 2.

## The proposed audio mapping, reviewed

| Parameter | Proposal | Fable's reading |
| --- | --- | --- |
| frequency | `440·2^((pitchHcu − 69)/12)` from the evaluator's `hz` | Right; the evaluator already supplies `hz`. Use it directly so the stage, the audio and the inspector cannot disagree about pitch. Per-note pitch (7.25) is stepped by contract; bends are smoothed; the adapter should not add its own portamento. |
| amplitude | `ADSR × velocity01 × (0.5 + 0.5·pressure01)` | Good: pressure 0 still sounds, so a plain note is a note. Two cautions. (1) `velocity01` is linear by declaration (values.js); a MIDI 2.0 velocity of 0x8000 is half amplitude, which is quieter than a 1.0 keyboard feels; if that reads wrong in the room, apply the curve **in the mapping and say so**, never in values.js. (2) Sum of three voices at full pressure can reach 3× a single voice: keep the existing master compressor in the path and let the harness measure peaks rather than pre-scaling blindly. |
| cutoff | `min(0.45·sampleRate, 200·2^(6·brightness01))` | 200 Hz to 12.8 kHz over six octaves; neutral 0.5 → 1.6 kHz, which sits well for a 196 Hz-ish chamber. Fine. Recommend the saved neutral brightness be the value that reproduces today's bellows cutoff exactly, so a score without any brightness message sounds like the current choir (continuity with M2). |
| Q | `0.5·36^timbre01` | 0.5 to 18; neutral 0.5 → 3. 18 is a strong resonance that will ring near the cutoff; at brightness 1.0 and Q 18 the peak is above 12 kHz, harmless, but at low brightness and high Q the resonance lands in the chamber's own band and can dominate. Suggest capping the effective peak gain (e.g. Q ≤ 12) or stating the range as an artistic choice in the caption. Either is honest; the cap is kinder on first listen. |
| smoothing | τ = 5 ms, evaluator-side | The adapter must **not** smooth again; one rule, already applied. The audio schedule should sample the evaluator at its control rate (e.g. every 128 samples) and `setValueAtTime`/`linearRampToValueAtTime` between samples, so audio and picture read the same curve. |
| termination | adapter owns `ended` from the patch's release | Right. A `released` voice keeps evaluating (expression survives release unless detached); the adapter retires it when its release envelope reaches the floor and reports the retirement time so the inspector can show it. |

Two things the evaluator gives that the adapter should surface rather than
hide: `detached` (freeze the picture's expression cue as the sound freezes)
and `reported.unsupported/partial` (a caption line: "N messages in this
score are not interpreted").

## A fixture sequence worth listening to (stillness → change → answer → return)

The current fixture (`composeExpressiveChord`) is a correctness exercise:
three notes at once, each modulated in a different dimension, then a
detach/reset test. It proves the evaluator; it is not music. For 011c's
first listen I suggest a second scene, `'study'`, in the same module
(Fable adds it on request; shape below), about 24 s at a slow pulse:

1. **Stillness (0–4 s).** One voice, note 57 (A3), velocity 0x7000,
   neutral everything. Nothing changes for four seconds. The listener
   learns the chamber's plain tone.
2. **Change (4–9 s).** The same voice's pressure rises slowly to 0.75 over
   three seconds, then its brightness opens over two. Nothing else sounds.
   The change is heard as breath, then as light.
3. **Answer (9–16 s).** A second voice enters a fifth above (64) at a lower
   velocity and *answers* by doing the opposite: it starts bright and
   closes, while the first voice's per-note bend drifts up 30 cents and
   back (sensitivity 2.0, bend ±0.15 of range). The two are the same
   mechanism doing different things at once: the independence test, now
   audible.
4. **Return (16–24 s).** A third voice on 52 (E3, the lowest) enters very
   soft and still. The first two release (sustain pedal down from 15.5 s,
   so their note-offs at 16 are held, pedal up at 18). All expression
   returns to neutral by 20 s; the third voice is left alone, unchanged,
   and released at 22 with its ring. The last thing heard is the plain
   tone from the beginning, an octave lower.

Why this sequence: every expression dimension is introduced alone before
two happen together; the "answer" is a real relationship between voices
(opposite motion), not a demo sweep; the return gives the ear the starting
tone back, which is what makes a change feel like a journey rather than an
effect. It also exercises sustain-held note-offs and release-with-tracking
in a musical place, so the adapter's termination rule is heard, not just
tested.

## Evidence the adapter can add

- Audio/picture parity: the stage frame's chamber state and the audio
  parameter schedule both come from `evaluateExpression`; a test that
  samples both at 30 fps and compares the values they read.
- Harness row: the study rendered twice at 44.1/48 kHz, identical, bounded,
  silent tail, like the other rows; peak reported so the 3-voice sum is
  measured, not assumed.
- A caption for the stage: "Three chambers; pressure, brightness and bend
  follow a MIDI 2.0 expression score at 32-bit precision; the mapping to
  air, light and pitch is this instrument's design." Plain words, no
  anatomy claims.
