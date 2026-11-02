# Proposal: "Which body?", playing the connected bodies of a Grove (Fable, 2026-11-02; proposal only, measurements first)

Astra's direction: Three Groves strikes only body 0 although the close view shows three internally connected bodies. Before any interface, what does the model already offer, and does anything need new schema?

## What is already supported without schema change
- Records: `events[].body` ranges over the recipe's bodies; a one-strike record on body 0, 1 or 2 of each Grove validates and is admitted (checked for C, E♭ and G at the page's gesture, position 1, velocity 0.5).
- Host: `validCommand` already accepts any body below the recipe's count; only the page's buttons fix body 0.
- Continuation and return: the generator, the barrier, the seeded wrapper's ledger and verification, and the rotation all carry the body field untouched, so remembered openings and returns of passages that strike other bodies need nothing new.

## What the model offers, measured (offline, no claim about hearing)
Per Grove the three bodies are tuned close (bodies 0, 1, 2): C at 130.8 / 128.3 / 130.7 Hz, E♭ at 155.6 / 152.5 / 155.4, G at 196.0 / 192.2 / 195.8. So bodies 0 and 2 sit within 0.1 Hz (C, E♭) or 0.2 Hz (G) of each other, and body 1 is 2.5 Hz (C), 3.1 Hz (E♭) or 3.8 Hz (G) below, about 2 % in each Grove. These are bare-body tunings; the coupled modes, pickups and damping decide what the output does.

**Envelope share, defined**: one strike at the page's gesture (position 1, velocity 0.5), 3 s of free ring; every 480 frames (10 ms) the low-band envelope per body from `visualFromState` (the same projection the picture uses) is sampled; each body's samples are summed over the 3 s and divided by the sum over all three bodies. It is a share of the picture's low-band envelope over that window, not a share of mechanical energy.
| strike (C) | peak dBFS | low-band envelope share, bodies 0 / 1 / 2 |
|---|---|---|
| body 0 | −37.0 | 0.47 / 0.09 / 0.44 |
| body 1 | −36.9 | 0.13 / 0.73 / 0.14 |
| body 2 | −34.6 | 0.44 / 0.10 / 0.45 |
(E♭ and G are the same within 0.02.) Striking body 0 or body 2 leaves the pair's envelopes nearly equal over the window; striking body 1 leaves most of the envelope in body 1. A hypothesis to listen for, not a measured listening outcome: with bodies 0 and 1 ringing together their close tunings could produce a slow interaction in the output; whether anything of this is heard, or seen in the picture (native evidence so far shows only subtle pulse discrimination), is open. Peaks differ by at most 2.4 dB; nothing is normalised.

## One coherent interaction (Astra owns the UI; this is the shape I would propose)
In the close view only, the viewed Grove's Play button becomes three labelled strike buttons, "Strike 01", "Strike 02", "Strike 03", at the page's unchanged position and velocity, and the hand control stays on body 0 as it is. The main Together view keeps its three Play and Soften buttons meaning body 0, unchanged, so nothing multiplies there. The caption under the close view stays neutral, Astra's wording: "Try another body. Notice what continues." Nothing plays automatically; a kept passage, its return and its remembered opening carry whichever bodies were struck.

## Artifacts before any UI
A listening study "One Grove, three bodies" (Astra: four cases, before any UI): the C Grove struck on 01, on 02, on 03, and on 01 and 02 together, the same gesture, duration and fade, no normalisation, each an ordinary ensemble record with only C active and E♭ and G silent so the fixed one-third mix matches the page; combined admission validated and each WAV reconstructed exactly from its kept record; the per-body envelope shares and peaks in the report; the page says the files are authored ensemble records rendered offline, asks "What changed? What would you touch next?" and prescribes no answer.

## Not claimed
That the shared ring or the beat is audible on a phone, that three buttons are the right count forever (direct shell picking can come later), or that this changes the hand vocabulary.
