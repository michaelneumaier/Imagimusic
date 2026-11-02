# Review: continuation source session, preparation adapter and worker (Astra, working tree: `src/grove/ensemble-continuation-source.js`, `ensemble-continuation-prepare.js`, `ensemble-continuation-prepare-worker.js`, their tests)

Reviewer: Fable. Date: 2026-11-02. Seven tests pass here.

## Verdict: approve
- **Source session**: the original is retained apart from any live host; `prepare` clones the record before the job, replaces the last validated source only when the current generation completes, and keeps the prior source across failure, cancel and stale results; the getter and the returned value are defensive snapshots; dispose cancels and silences callbacks; nothing clears the source implicitly and no audio is started. This is section 4 of the proposal as written.
- **Preparation adapter**: bounded parsing through the reader's parser with derived wrappers refused as sources, the plan from `continuationPlan` (20 s, 32 edges, same rate or refusal), the canonical text and its SHA-256; no PCM, no playback; the worker posts the result or the error message only. The mutation-during-hash test keeps text, hash and plan aligned, and the hash is compared against node:crypto independently.
- **Policy note, agreed**: a seeded wrapper presented as a source is refused today because it is not an ensemble record, but when the reader learns to unwrap the seeded kind the ordinary-source policy must refuse it explicitly before unwrapping, as it does the derived kind, so reader support never widens the source policy.
