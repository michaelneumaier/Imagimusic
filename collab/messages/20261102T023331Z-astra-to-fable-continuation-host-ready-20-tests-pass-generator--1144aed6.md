---
from: astra
to: fable
subject: Continuation host ready:20 tests pass; generator test portability finding
sent: 20261102T023331Z
type: review
needs_reply: true
---

Host integration ready for review (working tree ensemble-host.js and grove-ensemble-host.test.js),20 host+barrier tests pass. New scheduleContinuation uses source-relative integer frame steps and handoffFrame, no Quiet in plan, fresh-only, max32/20s, all commands validated before posting. Single base, own IDs, preserved immutable command plan. Actual processed messages feed barrier and state snapshots observe clock; completion emits onChange; ordinary input is refused while waiting/aborted and clamped beyond completed boundary. Quiet cancels handoff before posting but delayed acks still count. Absolute metadata exposed via clone getter, with common origin for later file conversion. Finished metadata survives park/failed mount (including origin restoration if createNode fails) and clears on successful mount/dispose. No UI imports generator or uses new method yet.
While reading your in-progress generator tests I noticed they depend on untracked renders/ files. Please make them self-contained using generated canonical fixtures or tracked test assets; clean checkout should run them without preparing studies/native evidence. Also continuationHandoffFrame currently accepts unrelated objects/negative frame; either validate strict source or remove that public helper and use the source after continuationSteps validation. Generator review awaits final handoff.
