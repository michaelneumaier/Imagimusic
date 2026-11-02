# Proposal: "A memory, then an answer", an authored continuation listening pair (Fable, 2026-11-02; proposal only)

## Why
The home can now show the remembered opening, but only as a path to walk; the listening studies show every other idea as a pair one can hear in a minute. A pair for the continuation lets a visitor hear what "its gestures play first, then the voices are yours" means without a personal performance, and lets Astra's first-minute evaluation start from a fixed, reproducible example.

## The pair
1. **Authored passage · original**: the demonstration phrase (the same record the return study uses), rendered as today.
2. **The same passage, remembered, then answered**: the demonstration replayed as a remembered opening on a fresh mount of the same instruments, then an authored answer (a few strikes and one resting hand on the G Grove after the handoff), ended by Quiet; the kept seeded file's verified render.

## How it is made (reproducible from source, no human performance)
A tool `tools/render-ensemble-continuation-study.mjs` runs the production ensemble processor and host under the same mocked Web Audio plumbing the tests use, at 48 kHz: it keeps the demonstration as the source, builds the plan with `continuationPlan`, schedules it with `scheduleContinuation`, drives blocks until the barrier completes, sends the authored answer (fixed frames after the boundary), Quiets, keeps the capture, builds and verifies the seeded wrapper with the retained source (`seedEnsembleRecord`, `verifySeededEnsemble`, which must report verified with no mismatch), writes `original.json`, `continued.json` (the seeded wrapper, canonical), both WAVs from `renderEnsembleRecord`, a report with hashes, the ledger summary (accepted, refused, not reached, timing changed) and the boundary in seconds, and an `index.html` through the shared player at the ensemble listening level with the play link to Three Groves. Deterministic: the mocked clock makes every remembered edge apply at its requested frame, so the study's ledger shows no late edge; the report says so, and says that a live run can differ (Astra's native run had a 112-frame-late first strike), which is exactly what the kept file records.

## What the page says and does not say
"An authored passage returns as a remembered opening on the same instruments; after the handoff an authored answer joins what still rings." Questions: "Where does the opening end and the answer begin, to your ear?" and "Does the answer belong to the passage?" No claim that the answer is good, that continuity is felt, or that this is how a personal continuation would sound. Disclosure: authored demonstration and authored answer, rendered offline from kept files; not a device recording; the same model level and listening boost as the other studies.

## Fits
Fourth entry in the preparer and catalogue beside the return study; `prepare-project-home.mjs --check` lists it; about 2 MB of WAV like the others, untracked like the others (Michael's pending decision on committing generated studies covers it).

## Open for Astra
- Whether the answer should be on G only (the voice the demonstration ends on) or spread across voices; I would keep it to one voice so the handoff is audible as a change of agency, not of texture.
- Whether the study should also include the early-Quiet case (opening stopped before the handoff) as a third example; I would leave it out of the listening pair and keep it as reader evidence.
