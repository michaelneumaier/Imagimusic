# Assessment: a small curated family of Groves for Three Groves (Fable, 2026-11-02; measurements and contract check only, no runtime change)

Astra's question: what changes across `composeGrove` seeds at the current three tunings (C3, E♭3, G3), whether the existing gestures and the keeping, continuation and return contracts need any change, and whether a small family chooser can be supported without new schema. Candidates: 3 (the page today), 7, 11, 19, 31. The curated `GROVE_SEEDS` from proposal 014 are already [3, 7, 11].

## Contracts: nothing needs new schema
- A kept Rest record carries its own `grove` and `voice`; the ensemble record carries one per part; the reader rebuilds recipes from the record, not from the page. Every candidate family composes the authored demonstration, admits it, builds a 5-edge continuation plan with the handoff at 320,000, and rotates into a derived return that verifies (checked for seeds 3, 7, 11, 19, 31).
- The gesture vocabulary is identical across all five families at all three tunings: three bodies, positions [0.3, 0.6, 1], zones [0.3, 0.6, 1], strengths light 12 and firm 60, output gain 0.45. The page's strike (position 1, velocity 0.5) and firm hand apply unchanged, and the page strike is admitted on every body of every family at every tuning.
- Continuation: `seedEnsembleRecord` and `verifySeededEnsemble` require the kept passage's instruments to equal the source's verbatim, so a remembered opening must mount the source passage's family, not the family currently chosen; the host's `enable(groves)` already takes the groves as an argument, so this is a lifecycle rule for the page: "Play this passage, then continue" mounts the retained source's groves. Returns move histories within one record and are unaffected. The listening studies stay seed 3 and say so.
- Scenes: `createGroveScene(grove)` is built per family; a family change rebuilds the three scenes (and the close-view targets and labels) on the successful fresh mount, never under a kept passage.

## What changes, measured (page strike on each body, 3 s free ring; envelope share = the picture's low-band envelope per body sampled every 10 ms over 3 s, normalised across bodies; peaks dBFS; no claim about hearing)
| seed | bare tuning offsets within the Grove (bodies 0/1/2) | bridges (coupling) | loss | strike 0 share | strike 1 share | strike 2 share | peaks 0/1/2 |
|---|---|---|---|---|---|---|---|
| 3 | 0 / −2.5 / −0.1 Hz (C) | 0-1 .004, 1-2 .005, 0-2 .009 | 0.42 | .47/.09/.44 | .13/.73/.14 | .44/.10/.45 | −37.0 / −36.9 / −34.6 |
| 7 | 0 / +1.2 / −0.6 | 0-1 .005, 1-2 .009 (no 0-2) | 0.61 | .60/.15/.24 | .11/.66/.23 | .16/.21/.63 | −40.2 / −39.5 / −35.9 |
| 11 | 0 / +0.6 / +0.2 | 0-1 .008, 1-2 .009, 0-2 .007 | 0.52 | .39/.31/.30 | .34/.30/.36 | .17/.19/.64 | −43.0 / −44.4 / −35.4 |
| 19 | 0 / +1.6 / −1.1 | 0-1 .008, 1-2 .008 (no 0-2) | 0.64 | .76/.13/.11 | .19/.61/.21 | .13/.17/.70 | −36.7 / −44.2 / −38.6 |
| 31 | 0 / −2.7 / −0.9 | 0-1 .013, 1-2 .012, 0-2 .010 | 0.46 | .29/.28/.43 | .24/.47/.29 | .26/.20/.54 | −40.4 / −38.8 / −33.8 |
The pattern holds at E♭ and G within 0.02 of share and 0.4 dB (the retuning scales the cluster; the offsets scale with it: seed 3's −2.5 Hz at C is −3.8 Hz at G).

In words, as anatomy rather than sound:
- **3, the page today**: bodies 0 and 2 tuned within 0.1 Hz and linked directly; a strike on either sets both ringing nearly equally; body 1 keeps three quarters of its own ring.
- **7, a chain**: no direct 0-2 bridge; each struck body keeps most of its envelope and passes a little to its neighbour; body 2 is the loudest by 4 dB.
- **11, an even triad**: tunings within 0.8 Hz, all three bridges, the highest free-ring share; a strike on 0 or 1 spreads almost evenly over all three bodies within 3 s; body 2 (the lightest mass) keeps most of its own and is 8 dB louder than the others.
- **19, the most separate**: a chain with the highest loss; each body keeps 60 to 76 % of its own ring; body 1 is 7.5 dB quieter than body 0.
- **31, the most coupled**: the strongest bridges and the widest tuning spread; body 2 dominates every strike's picture and the output (−33.8 dBFS, the loudest of all).

## What this supports
A family chooser without new schema: a short curated list, each with a name that describes anatomy (for example "a locked pair", "a chain", "an even triad", "three apart", "tightly bound"), shown only before a fresh Begin, remembered nowhere, with the current family and any kept passage preserved until a new Begin succeeds; the kept files already say which family they are. Which families to curate is a listening question and Astra's encounter design; the five above are each distinct in anatomy by these measurements, and [3, 7, 11] already carry the earlier curation. Loudness differs by up to 10 dB between bodies across families (seed 11's body 2 versus its body 1), which is the model's own level and is reported, not corrected.

## Not claimed
That any family sounds more appealing or is audibly distinct from another; that the envelope share is energy; that the picture shows these shares in real time.
