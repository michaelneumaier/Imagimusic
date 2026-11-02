# Proposal: "Which body?", playing the connected bodies of a Grove (Fable, 2026-11-02; proposal only, measurements first)

Astra's direction: Three Groves strikes only body 0 although the close view shows three internally connected bodies. Before any interface, what does the model already offer, and does anything need new schema?

## What is already supported without schema change
- Records: `events[].body` ranges over the recipe's bodies; a one-strike record on body 0, 1 or 2 of each Grove validates and is admitted (checked for C, E♭ and G at the page's gesture, position 1, velocity 0.5).
- Host: `validCommand` already accepts any body below the recipe's count; only the page's buttons fix body 0.
- Continuation and return: the generator, the barrier, the seeded wrapper's ledger and verification, and the rotation all carry the body field untouched, so remembered openings and returns of passages that strike other bodies need nothing new.

## What the model offers, measured (offline, 3 s after one strike, no claim about hearing)
Per Grove the three bodies are tuned close: C at 130.8 / 128.3 / 130.7 Hz, E♭ at 155.6 / 152.5 / 155.4, G at 196.0 / 192.2 / 195.8 (bodies 0, 1, 2). Bodies 0 and 2 sit within 0.1 Hz of each other; body 1 is about 2.5 Hz below (2 %, roughly a third of a semitone).
| strike | peak dBFS | low-band envelope share across bodies 0 / 1 / 2 |
|---|---|---|
| body 0 | −37.0 | 0.47 / 0.09 / 0.44 |
| body 1 | −36.9 | 0.13 / 0.73 / 0.14 |
| body 2 | −34.6 | 0.44 / 0.10 / 0.45 |
(C shown; E♭ and G are the same within 0.02.) Striking body 0 or body 2 sets the pair ringing almost equally: the near-identical tuning lets the bridges hand the energy back and forth, so the ring is shared and the picture shows two bodies breathing. Striking body 1 keeps three quarters of the energy in body 1: a voice of its own, slightly flat of the pair. Playing bodies 0 and 1 together would put the pair's pitch and the flat body's pitch in the same ring, about 2.5 Hz apart: the model's own slow beat. Nothing here is normalised; peaks differ by at most 2.4 dB.

## One coherent interaction (Astra owns the UI; this is the shape I would propose)
In the close view only, the viewed Grove's Play button becomes three labelled strike buttons, "Strike 01", "Strike 02", "Strike 03", at the page's unchanged position and velocity, and the hand control stays on body 0 as it is. The main Together view keeps its three Play and Soften buttons meaning body 0, unchanged, so nothing multiplies there. The caption under the close view says what the measurement says, in one line: "01 and 03 share their ring; 02 keeps its own, a little lower." Nothing plays automatically; a kept passage, its return and its remembered opening carry whichever bodies were struck.

## Artifacts before any UI
A listening pair "One Grove, three bodies" from the same renderer family: the C Grove struck on 01, then on 02, then 01 and 02 together, each rendered from a kept Rest record through the existing path, with the per-body envelope shares in the report and the two questions "Which strike sets more than one body ringing?" and "What do you hear when 01 and 02 ring together?", no preferred answer. The report states the frequencies and shares; the page says nothing about how it sounds.

## Not claimed
That the shared ring or the beat is audible on a phone, that three buttons are the right count forever (direct shell picking can come later), or that this changes the hand vocabulary.
