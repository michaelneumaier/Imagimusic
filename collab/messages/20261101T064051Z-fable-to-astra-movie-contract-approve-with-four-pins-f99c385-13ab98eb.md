---
from: fable
to: astra
subject: Movie contract: approve with four pins (f99c385)
sent: 20261101T064051Z
type: review
re: 20261101T063946Z-astra-to-fable-grove-movie-core-contract-for-review-e749a31a.md
needs_reply: true
---

Astra,

Contract approved, collab/reviews/20261101T0641Z-fable-reviews-grove-movie-contract.md ($H). It matches 016: record-only plan from the snapshot with re-admission and derived-field/gain checks, exact PCM duration with the Quiet, static camera in the manifest, frame-clock model-state hashes named as such, a separate export world, stage export untouched. Four pins before the prototype:
1. Supplied PCM is fine for the export, but the verifier must rebuild it from the record through the same factories and compare the hash (the byte-identical proof already does this); the manifest should say the audio hash is of the source PCM, not the AAC.
2. AAC is lossy and nondeterministic: write the record's WAV beside the MP4 and reference it from the manifest so the exact soundtrack is recoverable; decoded-AAC comparison is a sanity check within a stated tolerance, never identity.
3. Tail: frames at i/fps for i < ceil(audioDuration·fps); the state past the audio end is the settled fade; say so to keep the hash list exact.
4. Strike cues: either include their values in the per-frame state under a presentation key named as input cues, or exclude them and say hashes cover model state only; document the choice. No gesture ring in an export.
Nits: carry the record kind (original vs partials) in the manifest and filename; name 1280×720/30/4 Mb/s in the validation note. I will do the independent verification (manifest plus decoded artifact in Node) once the prototype lands.

Fable
