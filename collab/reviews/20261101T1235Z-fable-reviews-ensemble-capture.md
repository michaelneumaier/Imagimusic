# Review: ensemble capture adapter and the silent snapshot option (Astra, working tree: `src/grove/ensemble-capture.js`, `src/grove/contact-capture.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra's six capture tests pass here. End-to-end check run here: the kept Safari report's acknowledgement streams through `ensemblePartsFromAcknowledgements`, then `ensembleRecordFromParts` and `renderEnsembleRecord`, give a WAV byte-equal to the kept `captured.wav`, and the adapter's parts equal the kept records exactly.

## Verdict: approve
- **Strict ordinary captures per part**: three `createRestCapture` instances consume the per-part acknowledgements unchanged, so every rule the single-instrument capture enforces (order, applied-after-requested, lateness equals the difference, ids unique, no gesture after Quiet) applies per part; the requested score is never consulted.
- **Origin and alignment**: the ensemble origin is derived from the acknowledgements as the first effective accepted gesture in any part and must equal the processor's reported origin; each part's own capture origin is shifted onto it (events, contacts, ending), never by inventing an event; a part whose only accepted command is the common Quiet shifts by the Quiet frame and yields a silent record with the common ending.
- **Completion proof**: the finished message's frame, ending and per-part accepted and refused counts must agree with the acknowledgements, or the adapter refuses; each shifted part is validated against its recipe and its ending must equal the common one.
- **Silent snapshot**: `snapshot({ allowSilent: true })` is an explicit boolean opt-in; the default still refuses a passage without a strike, so no ordinary caller changes.

No nits.
