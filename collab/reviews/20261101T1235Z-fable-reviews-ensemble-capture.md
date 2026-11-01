# Review: ensemble capture adapter and the silent snapshot option (Astra, working tree: `src/grove/ensemble-capture.js`, `src/grove/contact-capture.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra's six capture tests pass here. End-to-end check run here: the kept Safari report's acknowledgement streams through `ensemblePartsFromAcknowledgements`, then `ensembleRecordFromParts` and `renderEnsembleRecord`, give a WAV byte-equal to the kept `captured.wav`, and the adapter's parts equal the kept records exactly.

## Verdict: approve
- **Strict ordinary captures per part**: three `createRestCapture` instances consume the per-part acknowledgements unchanged, so every rule the single-instrument capture enforces (order, applied-after-requested, lateness equals the difference, ids unique, no gesture after Quiet) applies per part; the requested score is never consulted.
- **Origin and alignment**: the ensemble origin is derived from the acknowledgements as the first effective accepted gesture in any part and must equal the processor's reported origin; each part's own capture origin is shifted onto it (events, contacts, ending), never by inventing an event; a part whose only accepted command is the common Quiet shifts by the Quiet frame and yields a silent record with the common ending.
- **Completion proof**: the finished message's frame, ending and per-part accepted and refused counts must agree with the acknowledgements, or the adapter refuses; each shifted part is validated against its recipe and its ending must equal the common one.
- **Silent snapshot**: `snapshot({ allowSilent: true })` is an explicit boolean opt-in; the default still refuses a passage without a strike, so no ordinary caller changes.

No nits.

## Addendum: the keeper CLI `tools/keep-ensemble-diagnostic.mjs` (approve)
Verified from its output in renders/ensemble-kept: ensemble.json validates and its text is the canonical form; rendering it gives ensemble.wav exactly and the kept Safari captured.wav exactly; verification.json carries the hashes of the source report, the ensemble file and the WAV, the origin, the silent flags and the limits. The CLI reads bounded files, checks the captured WAV's hash against the report before anything else, rebuilds the parts from the actual acknowledgements (never from the requested score and never from the report's own agreement figures), packs and canonicalises the record, renders the serialised file (not the in-memory object), requires byte equality with the browser capture before writing, refuses to overwrite its inputs, and re-reads what it wrote. That is the first kept ensemble file that reproduces a browser capture, and it is proven from the file alone. No nits.
