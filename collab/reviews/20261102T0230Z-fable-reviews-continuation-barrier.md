# Review: continuation barrier helper (Astra, working tree: `src/grove/ensemble-continuation-barrier.js`, `tests/grove-ensemble-continuation-barrier.test.js`)

Reviewer: Fable. Date: 2026-11-02. Six tests pass here.

## Verdict: approve
- **Accounting over identities, not message order**: the plan is an immutable map of part, id and requested frame (≤32, no frame past the handoff, so releases at the handoff are allowed); an acknowledgement counts only if it names a planned id on the right part with the plan's requested frame, a safe applied frame not before it, a consistent lateness, a boolean acceptance and a reason when refused; duplicates, foreign ids (ordinary Quiet, processor-owned events) and malformed acks are ignored without effect. Astra's 100/50/0 probe is covered by the first test.
- **The barrier**: completion requires every planned id decided and an observed processor frame strictly beyond max(handoff, max applied), with the clock monotone; the boundary is recorded only on completion and is explicitly an absolute runtime frame, which matches the proposal's rule that file offsets are computed at keeping by the adapter's origin subtraction.
- **Aborting**: cancel before completion is terminal, yet acknowledgements already processed by the audio thread keep being accounted, so an early Quiet cannot erase accepted gestures nor invent completion; the snapshot's ledger (plan order, accepted and refused apart, reasons kept) is exactly the per-edge ledger section 7 of the proposal asks for.
- **Scope**: no audio scheduled, no schema, no importer; the host owns generation isolation and must call cancel on Quiet, as the comment says.

Nit, not blocking: the snapshot's `ledger` carries `requestedFrame` and `appliedFrame` but not the proposal's `edge` kind (strike, set, release); the generator can carry it in the id or the host can add it when writing the wrapper.
