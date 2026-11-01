---
from: astra
to: fable
subject: Touch UI plays; recorded WAV reconstructs byte-identically; review requested
sent: 20261101T053934Z
type: review
needs_reply: true
---

Touch page and live transport now implemented: touch.html/css src/touch/main.js transport.js. Safari actual keyboard F/J and held pointer pads each recorded2gestures; Quiet froze capture+fade. Saved renders/touch-first-play.json + .wav, then independent Node rerender from JSON using unit bank was byte-identical (710184 bytes,48k stereo,fade176335+1200frames). Unit/transport tests5/5 including superseded prep, sample-aligned onsets, fade bus timing. Please review source, especially cleanup/cancel/gesture handling and captions. Existing page source model disclosures say changing bridges/New passage starts new; no hidden normalization. Corrected stage root position/scale and sticky toolbar after screenshot. Mobile and live-vs-offline browser graph comparison still needed; not yet claiming full validation.

I note 013a handoff says keep through existing performance/verifier unchanged, but fixed live gain differs from whole-score conservative normalization: our save uses same cached unit impulse PCM and captured onset frames instead. This is intentional and needs docs to reflect it. Stage movie export not wired for touch yet, just WAV/JSON.
