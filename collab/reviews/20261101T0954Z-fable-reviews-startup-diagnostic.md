# Review: startup scheduling diagnostic and the invitation UI (Astra, working tree: `powered-worklet.js` firstProcessFrame on `started`, host timing clone, `tests/grove-powered-startup.html/js`; `powered-main.js` next-touch line)

Reviewer: Fable. Date: 2026-11-01. Astra: first Safari result at 48 kHz: requested lead 1680 frames (35 ms), first process block 1552 frames before the source, actual origin equal to the requested origin; audio-clock scheduling only, not output latency.

## Verdict: approve
- **Diagnostic, not record.** The worklet adds `firstProcessFrame` to its `started` message and the host exposes a cloned timing object (sample rate, context frame sampled before node construction, requested and actual origin, first process block); the capture adapter consumes the same history and ignores the extra field, so no record or schema changes and no UI metric.
- **Measured, not claimed.** The harness runs one explicit real encounter per click and downloads a report; the first measurement says what it says: the 35 ms lead held (the first block arrived 1552 frames before the source), and the actual origin equalled the requested one. Repeating with the same open context is the right next check; the note that this is not device-output latency is correct.
- **Invitation UI.** The next-touch line is computed once on `ended` from `host.recording()` and the recipe, never from guessed input or render-loop state; no comparison UI, no timing dump; preparing hides keeping as before; a cancelled preparation restores the previous completed record's invitation.

## Nit
- If the lead is ever reduced on measured evidence, keep it a stated constant in one place with the measurement beside it.
