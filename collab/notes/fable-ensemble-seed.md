# A saved passage as a seed for a new live response (Fable, 2026-11-02; proposal only, no model change)

Astra's direction: let a finished or reopened passage seed a new live passage, with an explicit boundary between remembered gestures and new personal touches. The contract has to keep authorship honest in the kept file and make the experience clear in the first minute.

## The experience
After Quiet, or after reopening a saved ensemble, one collapsed invitation: "Play with what remains." Prepare seed builds nothing new; it schedules the remembered passage as an authored opening on a fresh live passage, through the host's existing `scheduleOpening` (fresh-only, bounded, prevalidated, one shared clock, Quiet always allowed). While the remembered opening is still being applied the ordinary controls are refused, as for the demonstration; at the acknowledgement of its last command the bodies become the person's, and they play into whatever still rings, as in the open phrase. Quiet ends everything together; keeping names say "seeded passage". Nothing plays automatically; the seed is never a second live performance of the person's past, only its gestures re-applied through the same admission.

## The boundary, in the file
A wrapper kind, like the derived return, around an unchanged strict v1 ensemble record of the whole seeded passage:
```
{ "kind": "imagimusic-grove-ensemble-seeded", "version": 1,
  "seededFrom": { "kind": "imagimusic-grove-ensemble", "version": 1, "canonicalSha256": "<source fingerprint>", "operation": "replay-as-opening" },
  "boundaryFrame": <the frame at which the remembered opening's last command was acknowledged>,
  "ensemble": { ...strict v1 record... } }
```
- Every gesture at or before `boundaryFrame` is remembered (re-applied from the seed through admission); every gesture after it is new. Because ordinary commands are refused until the opening's last acknowledgement, the boundary is a single frame per passage and needs no per-event marking, which keeps the v1 schema untouched.
- The remembered gestures are the seed's gestures only if admission accepted them again; the live state is the same as the original's only if nothing was refused, and the wrapper records refusals (`remembered: { planned: n, accepted: m }`) so a seeded passage never claims to contain its source exactly when it does not.
- The source fingerprint is a declared identity, as for the return; the reader labels the file "seeded from a remembered passage; new touches after <time>", and verification needs the source in hand.

## Why this and not a mixed record
Marking remembered and new gestures event by event inside a v1 record would change the strict schema for a convenience; a frame boundary enforced by the host's refusal rule is both simpler and more honest, and it matches how the open phrase already behaves.

## Open questions before any code
1. Should the remembered opening be the whole source passage or its first N seconds, bounded by `scheduleOpening`'s 32 commands and 20 s? A passage longer than that cannot be a seed as-is; the honest options are to refuse, or to seed with the opening's first 20 s and say so.
2. Should a derived return be allowed as a seed (playing with the return of one's own passage)? The reader's `allowDerived: false` rule for returns suggests not in the first version.
3. The first-minute wording: "what remains" is literally true only while the remembered passage still rings; the invitation should say the remembered passage plays first.
Astra owns the experience and provenance decisions; nothing here extends the model until agreed.
