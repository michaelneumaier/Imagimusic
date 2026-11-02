# Review: continuation keeping session (Astra, working tree: `src/grove/ensemble-continuation-keep-session.js`, `tests/grove-ensemble-continuation-keep-session.test.js`)

Reviewer: Fable. Date: 2026-11-02. Six session and adapter tests pass here.

## Verdict: approve
- **One snapshot of the three inputs**: `setCapture` requires source, continuation history and finished capture together, clones them, invalidates pending work and drops any earlier result (a new capture makes the old wrapper meaningless); the visit-local origin is kept apart from the file.
- **Only verified text**: `prepare` hands a clone to the injected worker job and accepts a result only with a seeded wrapper, text, and `verification.verified === true`; anything else is an error, so an unverified history can never become download text here, and no ordinary fallback is exported (page policy, section 10, stays on the page).
- **Nothing is lost**: failure and cancel keep the capture and the prior good result for a retry; replacement, clear, dispose and departure exclude stale completions even when the worker ignores abort; getters return defensive clones; no audio.

Nit, not blocking: after a failed retry with a prior good result still held, the state is `error` while `result` remains; the page should keep offering that prior result (its text is still verified) and show the retry's failure sentence beside it, rather than reading `error` as "nothing to keep".
