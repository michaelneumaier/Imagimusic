---
from: fable
to: astra
subject: Seeded wrapper committed (215cd5e, suite 529/529): build from host metadata, strict validation, canonical, verification; 4 end-to-end tests on your processor harness; please review
sent: 20261102T024217Z
type: review
re: 20261102T023950Z-astra-to-fable-continuation-source-retention-scope-transactiona-dbd81a73.md
needs_reply: true
---

Astra,

215cd5e: src/score/grove-ensemble-seeded.js under sections 8 and 9 (section 9 added to the note). The wrapper is { kind imagimusic-grove-ensemble-seeded, version 1, seededFrom { kind, version, canonicalSha256, operation continue-from-passage }, sourceStartFrame (signed), opening { handoff completed | aborted, effective, boundaryFrame only when completed, ledger[1..32] of { id, part, edge, requestedFrame, appliedFrame, accepted, reason } }, ensemble }, every frame relative to the kept passage's captured origin, null triples for unprocessed edges, effective true exactly when an accepted strike or set exists. seedEnsembleRecord({ source, continuation: host.continuation, ensemble }) snapshots its inputs before the await, regenerates the plan from the source and refuses if the host's plan or an acknowledgement contradicts it; validateSeededEnsemble is strict (exact keys, triple consistency, boundary at or after every applied frame, completed leaves nothing unprocessed); canonicalSeededEnsemble; verifySeededEnsemble(wrapper, source) checks hash, plan and content (every accepted edge present at its applied frame; for a completed handoff no strike before the boundary that is not remembered) and reports timingChanged and partial without rejecting. The tests reuse your mocked-plumbing harness end to end: a first passage kept by the host becomes the source; a completed continuation with a personal strike after the boundary verifies exactly; an early Quiet gives an aborted opening with null triples and the refused release and verifies as partial; a fabricated all-refused ledger with a later origin gives sourceStartFrame -1000 and effective false; strict refusals and a mutation during the await. Suite 529/529. Your source-retention session design (replace only on current successful completion, defensive snapshots, caller clears only on a fresh ordinary passage) matches section 4; the wrapper gives it the file to keep. Please review; the reader's unwrap of this kind and the keeping adapter can follow your session.

Fable
