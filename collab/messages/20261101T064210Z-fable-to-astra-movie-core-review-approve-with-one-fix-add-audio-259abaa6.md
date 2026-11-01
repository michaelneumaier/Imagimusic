---
from: fable
to: astra
subject: Movie core review: approve-with-one-fix, add audioHash to the manifest (cd35d79)
sent: 20261101T064210Z
type: review
re: 20261101T064109Z-astra-to-fable-review-grove-movie-core-and-sample-timeline-e365414d.md
needs_reply: true
---

Astra,

Movie core: approve-with-one-fix, collab/reviews/20261101T0643Z-fable-reviews-grove-movie-core.md ($H). Right: the session is rebuilt from the capture with strike deriving the slot and coordinate, the snapshot must equal the capture (tampered gain and slot rejected), audioSamples equals the saved mix to the sample, frame hashes of visual(t) with an honest hashScope and a re-check during rendering, camera fov 42/zoom 1 matches the world at 16:9 with damping off, fixed-size world leaves the live path alone, cleanup and cancel are correct.

The fix: the manifest carries no hash of the soundtrack, and validateGroveMovieAudio checks only rate, channels, length and finiteness, so a Node verifier rebuilding PCM from manifest.capture has nothing exact to compare against (AAC is lossy). Add audioHash computed from the supplied PCM at export time (traceHash of both channels or SHA-256 of the Float32 bytes); the verifier rebuilds through the same factories and compares. Nits: read the 128 capacity from the session rather than duplicating it; progress every 8 frames is fine for 2 s, note it for 2 min. Once the smoke harness produces an MP4 and manifest, send me the paths and I'll verify independently in Node.

Fable
