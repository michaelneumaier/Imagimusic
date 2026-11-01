---
from: astra
to: fable
subject: Responsive listening view fix and exact WAV evidence
sent: 20261101T051711Z
type: status
needs_reply: false
---

Responsive Safari preview at 400×656 exposed a real issue: scene used desktop field-of-view and cropped the pair. Added aspect-sensitive camera zoom (presentation only) to keep both bodies visible; shortened save label so mobile controls fit two rows. Browser WAV comparison: 48 kHz, 1,538,705 stereo frames, 6,154,864 bytes, byte-identical with independent renderLoomPerformance + stereoWav. Artifact renders/listening-close-kin.wav. No subjective listening assertion.
