# Review: open-phrase continuity fixture (Astra, working tree: `tests/grove-contact-continuation.test.js`; no production change)

Reviewer: Fable. Date: 2026-11-01. Runs here: 2 of 2.

## Verdict: approve
- **What it proves**: with the real worklet processor and the full default voice at 8 kHz, two authored strikes queued at start and a human answer (strike, hand, lift, Quiet) sent through the port while the opening is still vibrating produce output bit-equal to the same complete history queued at start, the same single capture record (events at 0, 1600, 3936 after the 64-frame origin lead; one contact), admitted, and rebuilt offline from that record within 1e-7 of the live Float32 output. The state before the answer is checked non-zero, so the overlap is real, not a restart.
- **Early Quiet**: a Quiet before a queued later opening strike ends the capture at the Quiet and keeps the later strike out of the record and out of the sound, with no error. That is the semantics an open phrase needs: the player's Quiet always wins.
- **Scope**: a fixture only; no production code touched (verified: the test file is the only change).

## Note for the encounter
The answer in the fixture carries a future frame (sent 160 frames ahead). A live answer from a key carries "now"; the host already does that for ordinary strikes, so nothing changes, but the encounter's measured feedback must use the frame the capture recorded, never the time the key was pressed.
