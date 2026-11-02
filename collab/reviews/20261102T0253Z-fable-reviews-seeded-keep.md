# Review: seeded keeping adapter and worker (Astra, working tree: `src/grove/ensemble-seeded-keep.js`, `ensemble-seeded-keep-worker.js`, `tests/grove-ensemble-seeded-keep.test.js`)

Reviewer: Fable. Date: 2026-11-02. Three tests pass here.

## Verdict: approve
- **Order of operations is the honest one**: the raw kinds of source and capture are checked first, both are bounded through the reader's parser as ordinary records (a wrapper of either kind refused), the host metadata is cloned, the wrapper is built from the model (which snapshots again and refuses contradictory ledgers), it is verified against the retained source, and only a verified wrapper becomes canonical text, bounded to 256 KiB; no audio is prepared. The worker posts the result or the error message only.
- **Tests**: mutation of all three inputs during the async hash cannot reach the text, the hash is checked independently, an invented remembered strike in an otherwise valid capture is refused, and wrapped originals, oversized and other-rate captures are refused before any file.

One policy note for the page, not a change here: when verification fails, the person's finished capture is still a valid ordinary ensemble; the encounter should keep offering it under its ordinary names (never labelled seeded), so a performance is never lost to a provenance failure, and should say in a sentence why the seeded file was not offered.
