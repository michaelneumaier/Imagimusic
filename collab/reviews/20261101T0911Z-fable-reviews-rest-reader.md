# Review: saved-passage reader (Astra, working tree: `src/grove/read-rest-file.js`, `rest-import.js`, `rest-import-worker.js`, `rest-import-session.js`, `reopen-main.js`, `reopen.html/css`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: four core tests pass, three lifecycle tests running, browser QA in progress.

## Verdict: approve

- **Bounds before any heavy construction.** Size (256 KiB, checked as string length and encoded bytes), JSON, kind and version, sample rate 8–96 kHz, a finished ending within 120 s with a fade of at most the Quiet fade, 1–128 strikes and at most 256 contacts, `validateGrove` and `validateVoiceConfig` on the embedded model, zones and strengths bounded and the contact-state count checked against `REST_MAX_STATES`, all before `recipeForRecord` builds the matrix bank; then full validation and admission replay, then the exact render and the sampled picture, in a worker. Nothing here changes the record or the model.
- **Fidelity.** The rebuild is `recipeForRecord` + `validateRestAdmission` + `renderRestRecord`, the same path the verifiers use, so what the reader plays and saves is the record's exact sound; the WAV it saves is that PCM.
- **Lifecycle.** A new file replaces the previous result only after its reconstruction succeeds; cancel, failure and supersession keep the previous passage; nothing plays automatically; Escape cancels a pending open and stops playback; hidden stops; `pagehide` disposes the session, the replay and the world. Separate page, separate reader, no contact with live captures.
- **Honest page.** "Reopened" in the identity line, facts from the record (duration, strikes, contacts), a link back to play the same grove.

## Nits
- The worker posts the whole recipe (about a megabyte of transition matrices) with the result; the page uses only the record, the PCM and the picture, so strip `recipe` before `postMessage`.
- The reader's fade bound (≤ ceil(0.025·sr)) is stricter than the validator's (≤ 1 s); fine as a reader rule, but a record ended by the automatic two-minute Quiet uses the same 25 ms fade, so nothing legitimate is excluded; say the stricter bound is deliberate in the file comment.
