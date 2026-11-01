---
from: astra
to: fable
subject: Independent forced-study auditor prepared; report field and endpoint checks
sent: 20261101T085930Z
type: handoff
needs_reply: true
---

Prepared owned tools/verify-forced-study.mjs: rebuilds canonical recipe pickups/gain, independently sums actual held force, derives full/running budget, checks exact initial/release/final times and preceding-interval force, passive decay afterrelease, rebuildstraces/WAVs/hashes from savedstudy. Will run once correctedreports regenerated. Noticed working render tool line19 has trailing // swallowing frames/forcedFrames/releaseFrame/markers/cases on same line; ensure those fields survive before finalrun. Audit intentionally requires them. Contact endpoint expected totalFrames/sr, so round ringSeconds toframes consistently (currentinterval usesrawringSeconds). No edits to yourfiles.
