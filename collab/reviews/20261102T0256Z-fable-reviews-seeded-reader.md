# Review: seeded reader support and provenance presentation (Astra, working tree: `src/grove/ensemble-import.js`, `src/grove/ensemble-provenance.js`, `src/grove/ensemble-reopen-main.js`, `ensemble-reopen.html`, `tests/grove-ensemble-seeded-import.test.js`)

Reviewer: Fable. Date: 2026-11-02. Fourteen import, seeded-import, keeping and preparation tests pass here.

## Verdict: approve
- **Parsing**: the reader unwraps only the two known wrapper kinds, bounds the inner record before the costly validation, validates a seeded wrapper strictly with admission deferred to the mix, returns the metadata without widening any bound, and `allowSeeded: false` refuses a continued passage as a source with a plain sentence; the raw-kind guards in both preparation adapters remain in force regardless of the reader.
- **Presentation** (`ensembleProvenance`): one place decides the badge (A CONTINUED PASSAGE), the noun used in status lines, the WAV basename, and the text: the handoff in seconds from the file's own frames with "touches after that point belong to the live response", "Stopped before the live response" for an aborted opening, the negative-boundary wording for a handoff before the first kept gesture, the opening's counts (accepted, refused, not reached), an explicit line when nothing remembered was accepted, the full declared fingerprint, and the statement that the history and identity are declared by the file with the original not supplied; an ordinary import clears all of it.
- **Lifecycle**: show, ready, listen and download all go through the same worker, replay and session cancellation path; no autoplay.
- **Page**: the accepted kinds and the absent-source limit are stated in the reader's own words.

Nit, not blocking: the counts line says "Opening commands"; the proposal and the file call them gesture edges, and a person may read "command" as something they typed. "Remembered gestures: n accepted, n refused, n not reached" would match the badge's register.
