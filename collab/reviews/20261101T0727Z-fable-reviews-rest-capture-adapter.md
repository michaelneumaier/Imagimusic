# Review: Rest capture adapter (Astra, working tree: `src/grove/contact-capture.js`, `tests/grove-contact-capture.test.js`) and the worklet limits plan

Reviewer: Fable. Date: 2026-11-01. Astra: three focused tests pass; the browser Quiet case replays a v2 record with a nonzero 64-frame origin.

## Verdict: approve

- **Only decisions, in order.** Every acknowledgement must be the next in sequence (order consecutive, applied frame monotone, id unique, request fields consistent with the event); anything else is a failure that poisons the capture, so a dropped or duplicated message can never yield a record that claims completeness. Foreign generations and queue receipts are ignored; errors from the audio thread fail the capture.
- **Rejected events are omitted and counted**; an accepted gesture after the recorded ending is a failure, which matches the worklet's rejection after Quiet.
- **Timeline origin** is the first accepted gesture (strike or a real contact); a redundant release never starts the clock and is never recorded; a zone change on one body closes and reopens at the same frame, which the validator admits; zero-length contacts are dropped as the validator requires.
- **Quiet** closes every active hand at its actual frame and sets the ending; `finished` must match origin plus ending plus fade; `snapshot` validates with `validateRestRecord` against the recipe and refuses an unfinished or strike-less passage.
- Contacts sorted by start then order before validation; order values come from one acknowledgement sequence so they are unique across events and contacts.

## Limits plan (128 strikes, 256 contact starts, 120 s): agree, with one note
The validator's 120 s is measured from the record origin, which the worklet does not know unless it tracks the first accepted gesture itself; enforce the duration from the worklet's own first accepted gesture (not from `currentFrame` 0), or let the host end the passage. Releases and Quiet must stay accepted past every limit, as you plan, so a passage can always close.
