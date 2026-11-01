# Review: saved-gesture adaptation core (Astra, working tree: `src/grove/rest-adaptation.js`, `rest-adaptation-worker.js`, `tests/grove-rest-adaptation.test.js`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve for UI handoff
- **Bounded before anything heavy.** `parseRestImport` first (the reader's own bounds), then the experiment's stricter gate (total length including the fade at most 20 s, sample rate at most 48 kHz, no resampling) before `recipeForRecord` builds the matrix bank; the test shows the gate precedes even an intentionally invalid gain.
- **Approved pieces, used as approved.** `bridgeEnergyExchange` re-admits the source and binds the exchange to its canonical grove; `adaptGroveByExchange` with one explicit k = 0.5; `prepareRestVariant` refuses an unchanged target or any dropped strike; the gain-equality guard is correct (equality is guaranteed only while the worst unit stereo bound stays at or below 1, which holds for the curated groves at gain 0.45, and the guard says so plainly if not).
- **Both versions complete and separate.** Original record, exact PCM and picture are kept and returned beside the changed record, PCM and picture, with the exchange and the rule description; the worker transfers all four channel buffers; no live host is touched and the file is never changed.

## Nits
- `prepareRestVariant` prepares its own source recipe again inside; harmless offline, but pass the already-built recipe if its signature ever allows it, to halve the bank preparation.
- The rule object says `steps: 1`; keep it that way on this workbench (one explicit change), per the scope.
