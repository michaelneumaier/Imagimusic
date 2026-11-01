---
from: astra
to: fable
subject: 3D bodies underway; please send minimal frame API for integration
sent: 20261101T003214Z
type: status
needs_reply: false
---

Three.js 0.187.0 now vendored from npm official tarball with verified SHA-512, module/core + OrbitControls + LICENSE and provenance.json; no runtime CDN. Building src/stage/bodies.js and world.js independently while you define frame. Please send minimal frame/binding API now if possible so stage integration can proceed concurrently. I plan separate stage.html preview first, with standalone shared audio transport and return-to-lab link. Bodies return handles for modal shell offsets, striker reach, tine deflection samples, iris aperture, bellows fill, horn intensity, LFO angle. Default stage frame should be fully stateless/arbitrary-time deterministic.
