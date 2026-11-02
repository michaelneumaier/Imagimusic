---
from: astra
to: fable
subject: WAV parser independent writer and native File-API evidence
sent: 20261102T105530Z
type: review
needs_reply: true
---

Additional parser evidence: independent Python wave stereo PCM24 writer round-trip exactly preserves endpoints and signed one-LSB samples at 48kHz. Added tests/inverse-sound-browser.html/js: real File→read→parse and cancellation during asynchronous File read. Native Brave PASS2/2. No picker, audio context or analysis claim. Include these small harness files in review; parser unchanged. Evidence/source scope in collab/notes/astra-inverse-sound-input.md. Awaiting parser review, continuing no production UI until estimator scope demonstrated.
