# Proposal 019: Do the three groves sound like three instruments? A measured listening comparison, and one weakness to test

*Fable, 2026-11-01, answering Astra's request to step back from controls and evaluate musical appeal. Measurements from the model; "may be heard" is derived from them and never promised. Listening is for Michael or a capable reviewer; neither of us can hear the output.*

## What measurably differs (same voice, same gesture: one strike on body 0 at the middle)

| seed | fundamentals (Hz) | low modes (Hz) | beat rates (Hz) | low-mode decay τ | neighbours' share at 1–2 s | layout x | ring above −40 dB |
|---|---|---|---|---|---|---|---|
| 3 | 130.8 / 128.3 / 130.7 | 128.7 / 131.2 / 132.2 | 1.0–3.5 | 2.4 s | 0.20 and 0.96 (triangle, strong 0–2 bridge) | 0, −0.65, 0.65 | 11.1 s |
| 7 | 130.8 / 132.0 / 130.2 | 130.7 / 131.1 / 133.3 | 0.4–2.6 | 1.65 s | 0.26 and 0.66 (chain, strong 1–2 bridge) | −0.8, 0, 0.8 | 7.6 s |
| 11 | 196.0 / 196.8 / 196.3 | 196.4 / 198.6 / 201.4 | 2.2–5.0 | 1.9 s | 0.91 and 0.85 (triangle, three similar bridges) | 0, −0.65, 0.65 | 8.6 s |

Two facts stand out. Every grove tunes its three bodies within about 3 Hz of one another, so each grove is **one pitch with beating**, and seeds 3 and 7 share that pitch (near C3) while seed 11 sits a fifth above (near G3). What distinguishes the groves is therefore not melody but **decay** (2.4 vs 1.65 vs 1.9 s), **what the bridges carry** (seed 3 sends a strike on body 0 almost entirely to body 2 and hardly to body 1; seed 11 sends it to both), the **beating rate**, and the **stereo layout** (seed 7 puts the struck body hard left; the triangles put it in the centre).

## The phrase (landed: `composeIndividualityPhrase(recipe)`, about 11 s at 60 BPM)

1. **Ring** (0–3 s): one strike on body 0 at the middle, alone. What may be heard: the beat rate and how long it lasts.
2. **Hand** (3–7 s): the same strike, then a firm hand on body 0 at the bridge tip from 3.5 s to 6 s. What may be heard: which shells keep ringing while the struck one is damped, and how much.
3. **Turn** (7–11 s): body 0, body 1, body 2 struck in turn, 0.4 s apart. What may be heard: where each shell sits in the stereo field, and whether the three are one pitch.
4. **Quiet** at 11 s.

The same record transposed to the other two groves (`transposeRestRecord`) is the comparison; the vocabulary rule guarantees identical gestures, and the phrase carries over whole on all three (tested). `describeIndividuality(recipe)` returns the facts above for any grove and four "may be heard" lines derived from them, for a caption that promises nothing.

## The weakness to test

**Pitch monotony.** Within a grove nothing changes pitch, and two of the three groves share one pitch. A newcomer may hear three groves as one instrument in three rooms: the same note, differently damped and differently spread. The listening question for Michael: after the phrase on 3, 7 and 11, do they sound like three instruments or one? If one, the honest remedies are not more controls but a different **choice of curated seeds** (the generator can produce groves whose bodies differ by a third or a fifth; the curation chose near-unison for beating) or a **fourth curated grove** tuned apart within itself, which would also give Rest a pitch to reveal when a hand silences one shell. Either is a curation decision, evidence-first: render the phrase on candidate seeds, measure the table, then listen.

## Not proposed

No new control, no automatic selection, no claim that beating or a long ring is beautiful.

## Addendum: monitoring level (Astra's measurement, 2026-11-01)

Astra's listening study of the 20 s invitation at natural model level measured peaks of −28.9 / −31.0 / −32.1 dBFS and whole-passage RMS of −46.4 / −50.5 / −51.8 dBFS on seeds 3 / 7 / 11, a 5.35 dB spread. Two honest statements follow. First, the Rest route plays about 30 dB below full scale: the output gain is fixed so that the rigorous energy bound of dense playing stays under the 0.9 ceiling, and ordinary playing sits far below that bound. Second, the groves differ in natural level, and a grove may feel weaker or stronger for that reason alone; the RMS-matched copies (attenuation only, to the quietest) exist to separate that from timbre, and are expressly not perceptual loudness matching. Neither of us can hear the files; both sets go to Michael.

If level turns out to matter, the remedy must not be a silent gain change (it would alter admission and every saved capture's meaning). The honest form is an **explicit, recorded listening level**: one scalar applied identically to the live output and to Keep the sound, written into the record and the film manifest as a presentation field, so that heard, saved and verified stay one thing and the model's gain stays what it is. That is a decision for after listening, not before.
