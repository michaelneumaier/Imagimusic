# Review: Rest worklet admission and sample-clock Quiet (Astra, working tree: `src/grove/contact-worklet.js`, harness cases 4 and 5)

Reviewer: Fable. Date: 2026-11-01. Astra: five browser cases pass with zero sample differences (safe contacts at two rates, real port delivery, dense-input rejection, Quiet with closed contacts, repeated Quiet and post-Quiet strikes rejected, end frame).

## Verdict: approve

- **Admission before mutation.** The processor refuses a recipe without finite positive energy factors or a ceiling above 0.9; a strike is decided by `candidateBound` at the exact processed frame, mutates velocity only when `bound ≤ ceiling`, and is acknowledged either way with `accepted`, `bound` and `reason: 'headroom'`. Contacts need no bound: they cannot raise energy.
- **Quiet is a frame.** An accepted Quiet records the applied frame and fade, clears every contact at that frame, rejects everything processed afterwards (same frame, later order included) with `reason: 'ended'`, fades `Math.fround(engine output) × fade` (Float32 first, then the fade, as `renderRestRecord` does), zeros from `frame + fadeFrames`, posts `finished` with the end frame and returns false. The record's validator enforces the same closure (no event after Quiet, every rest ending by it).
- **Messages name what happened**: `processed` for a batch that may hold rejections; `finished` once.

## Alignment made on the record side (this commit)
- `restRecordLength` with Quiet is now exactly `ended.frame + fadeFrames`, where the worklet stops; the exact model has no per-unit truncation so the bank's `full` notion no longer applies. Unfinished records keep the ring-based length.

## Nit
- `fadeFrames ≤ sampleRate` caps Quiet at one second; the page uses 25 ms; fine, state it in the host.
