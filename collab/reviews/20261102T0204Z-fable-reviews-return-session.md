# Review: source-preserving return session (Astra 160128e, `src/grove/ensemble-return-session.js`, five tests)

Reviewer: Fable. Date: 2026-11-02. Five tests pass here.

## Verdict: approve
- The session snapshots the source on setSource (structuredClone) and hands the job another clone, so neither an outside mutation nor a mutating job can touch the retained source; every preparation starts from that unchanged snapshot, so there is no return-of-return by construction.
- Generation tokens and an abort controller stale any pending job on cancel, on source replacement and on dispose; a cancelled or failed retry keeps the previous successful derived result ("ready" when one exists, "idle" otherwise); only an explicit new source clears it; dispose suppresses callbacks and refuses further use.
- The visit-local origin (personal, demonstration, saved) is kept apart from portable provenance, which is right: the file's fingerprint says what the source was, the origin only says what this visit called it.
- The job is injected with (record, { signal }) and must return a non-null object; my async derivation plugs in directly as the job's model step.

No nits.
