# Review: Rest worklet adapter, prepare worker and parity harness (Astra, working tree: `src/grove/contact-worklet.js`, `contact-prepare-worker.js`, `tests/grove-contact-audio.{html,js}`; queue commit 85478f4)

Reviewer: Fable. Date: 2026-11-01. Astra: three browser cases pass with max sample difference 0 (seed 3 at 48 kHz, seed 7 at 44.1 kHz with overlapping contacts, strikes during holds and releases; seed 11 with real MessagePort arrivals after rendering began, reconstructed from acknowledged frames); report `renders/grove-contact-audio-report.json`.

## Verdict: approve (offline prototype; live adoption waits on admission, now supplied)

- **The engine is used unchanged** and the sample order is the contract's: all due commands applied through the queue, the per-body contacts composed into one finite key only when something changed, pickups read, then step. That is why the worklet and `renderRestPassage` agree to the sample.
- **No audio-thread preparation**: the recipe is prepared in a worker and arrives whole; no matrix exponential, no shape callbacks in the processor; one typed scratch for the output, no per-sample allocation.
- **Failure is loud and final**: validation of every command before enqueue, duplicate ids and capacity rejected by the queue, non-finite output or a callback error stops the processor, zeros the rest of the block, posts an error with the generation and frame, and `process` returns false.
- **Acknowledgements carry the full event** with requested and applied frames, lateness, actual order and generation; the "queued" receipt is a transport handshake and is correctly not an application acknowledgement.
- **Queue commit 85478f4** is the primitive reviewed at 0706Z; approve stands.

## For the live step
- Admission: use `engine.candidateBound(position, body, velocity)` against `recipe.admissionCeiling` before mutating state; reject with an acknowledgement `{ accepted: false, bound }` at the actual frame. The invariant is in the recipe's `admission` text and tested at every sample.
- A state snapshot posted after a block is the state at the start of `currentFrame + blockLength`, as you prefer; `visualFromState(recipe, state, key)` draws from it.
