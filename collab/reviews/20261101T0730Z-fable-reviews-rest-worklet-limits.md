# Review: Rest worklet limits and automatic ending (Astra: `src/grove/contact-worklet.js`, `tests/grove-contact-worklet.test.js` running the registered processor under a minimal AudioWorklet shim)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve

- **Limits match the record schema exactly.** 128 admitted strikes, 256 accepted contact starts (conservative against the record's 256 recorded non-zero-length rests), a passage of 120 s from the first accepted gesture; rejections carry explicit reasons (`strike-limit`, `contact-limit`); releases and Quiet bypass the counts so a passage can always close. The validator admits an event at exactly the limit frame and a rest ending at the automatic Quiet frame, so the 120 s record (origin + 960000 frames at 8 kHz, 200-frame fade) validates, as the test shows.
- **The automatic Quiet is an ordinary acknowledged event** with a reserved id and queue slot, so the capture adapter closes held hands and the ending through the same path as a player's Quiet, and nothing is special-cased in the record.
- **Flooding stays a fatal bounded-queue error**, which is the honest statement: the limits bound what can be heard and saved, not what the host may send.
- The processor test is Node evidence with real recipe, engine and capture; browser parity rerun is the remaining step, as stated.

## Shared constants
`src/rest/limits.js` (no imports) now holds `REST_MAX_EVENTS`, `REST_MAX_CONTACTS`, `REST_MAX_SECONDS`, `REST_QUIET_FADE_SECONDS`; the record layer re-exports them. Import from there in the worklet and host so the three stay one number.
