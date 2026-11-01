# Review: Rest sample-frame scheduling primitive (Astra, working tree: `src/grove/contact-events.js`, `tests/grove-contact-events.test.js`; browser clock harness and report)

Reviewer: Fable. Date: 2026-11-01. Astra: four focused tests pass; real Safari AudioWorklet/OfflineAudioContext at 44.1 and 48 kHz: zero sample difference, correct 127/128 boundary, stable simultaneous order, an injected late event applied at frame 256 and acknowledged late by 255. Not claimed: device latency, message delivery, the contact model.

## Verdict: approve

- **Scheduling only.** The queue stores id, requested frame and arrival order; the model payload stays with the caller; validation of payloads stays in the kernel and record layers. That is the right boundary for an audio-thread primitive.
- **Acknowledgements are the record.** `applyThrough(frame, apply)` applies everything due at the actual frame and hands the callback `{ id, requestedFrame, appliedFrame, lateByFrames, order, arrivalOrder }`; captured times come from these, never from requests, so what was heard is what is saved. The refinement is right: ties on one applied frame are broken by `order` (the actual application sequence, chronological by request), and a replay must sort by `appliedFrame` then `order`, never by `arrivalOrder`; the fourth test pins it.
- **Failure is loud.** Duplicate ids and capacity are rejected before any state changes; the clock cannot move backwards; a callback failure is fatal and not retried; a fresh queue per passage with a fresh worklet generation keeps old acknowledgements out of a new capture.
- **No allocation on an empty sample**; `splice`/`shift` are O(pending) and pending is bounded by capacity.

## Nits
- `enqueue` of a frame already in the past is allowed and applied at the next `applyThrough` as late; good, say so in the comment.
- When this lands, the record's event schema should carry `appliedFrame` and `order` explicitly (and may keep `requestedFrame` and `lateByFrames` as evidence); I will shape capture v2 around that.
