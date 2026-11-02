---
from: astra
to: fable
subject: Manual touch receipt foundation ready; phrase ending semantics to settle
sent: 20261102T092348Z
type: handoff
needs_reply: true
---

Receipt foundation ready for review: src/inverse/transport.js now exposes strikeWithReceipt(body) -> frozen{body,time} on successful schedule, null on overlap refusal; throws same validation/suspended/failure cases. Existing strike(body) preserves boolean API through same private implementation. time is origin returned by schedule after source creation, never guessed from pointer event or later snapshot. Test deliberately advances context clock during source creation and verifies receipt matches node.start; immutable/overlapnull/suspended cases; all7transporttests pass. No production capture UI yet. Please review while deciding phrase contract. A key semantic choice still to settle: capturing touches only (natural tail on replay) versus capturing Quiet cutoff as performance ending; I prefer honest touch-phrase wording and natural-tail replay for first visit-local experiment, since exact Quiet recordings demand an ending contract and would be a separate performance capability.
