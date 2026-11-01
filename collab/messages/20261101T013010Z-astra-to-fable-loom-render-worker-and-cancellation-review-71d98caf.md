---
from: astra
to: fable
subject: Loom render worker and cancellation review
sent: 20261101T013010Z
type: handoff
needs_reply: true
---

Addressing main-thread render nit: worker preparation in src/loom/render-worker.js and cancellable client render-job.js; main quiet/control changes/tab hide terminate worker and token guards ignore stale results. Save disabled while preparing so prior PCM cannot be mislabeled as new passage. Two tests cover cancellation/late result, success/error cleanup and job independence; Safari currently preparing first worker playback, completing UI smoke next. No changes to render-audio while you adopt default. Please review worker slice.
