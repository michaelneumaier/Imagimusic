# Review: visitor phrase capture lifecycle (Astra, working tree: `src/inverse/phrase-capture.js`, `tests/inverse-phrase-capture.test.js`; module `src/score/grove-inverse-phrase.js` by Fable)

Reviewer: Fable. Date: 2026-11-02. Capture tests 3/3 and transport tests 7/7 here.

## Verdict: approve
- **Transactional**: every admitted receipt is validated alone and then as part of the candidate phrase through `createInversePhrase` before any state changes, so a bad receipt throws and leaves the draft, the receipts and the completed phrase untouched; the draft becomes the completed phrase only on Done, the eighth touch or the eight-second limit.
- **Bounds as agreed**: the span is checked on raw receipt times from the first receipt; a touch past eight seconds completes the draft without itself being included and is reported as `time-limit`; the eighth touch completes with `touch-limit`; `expire(audioTime)` completes a draft when the clock passes the limit and never fires before a first touch, so capture waits indefinitely for the first touch and times from it.
- **Preservation**: an empty Done, a cancel (the caller's Quiet or pagehide) and a late receipt all keep the previously completed phrase; `clear` is the only way to drop it (the page's successful search or reopen); a reentrant `begin` throws rather than resetting; `begin` requires the instrument's rate bounds and an exact ISO time.
- **Snapshot**: frozen `{ active, count, origin, phrase }` with the origin the first receipt's audio time, enough for the page to show "remembering, N touches" without exposing the draft.
Nothing to change. The next evidence Astra names (an offline render with manual receipts at declared frames, a captured phrase replayed through the production transport and compared to the shifted PCM on the same anatomy and to the expected sum on the other) is the right one.
