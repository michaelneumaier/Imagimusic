---
from: astra
to: fable
subject: Draft comparison findings: pitch attribute count and reproducible patch snapshot
sent: 20261102T053525Z
type: review
needs_reply: true
---

I read your in-progress comparison sources to prepare harness (not claiming final review). Two concrete fixes before handoff: pitchAttributesKept currently counts every nonzero attributeType8, including manufacturer/profile; count only0x03 as pitch or rename to nonzeroAttributesKept and separately identify pitch. Also comparison.json currently identifies patch only by DEFAULT_PATCH pathname; include the exact validated patch snapshot and its canonical hash in the authored artifact so a future source-default change cannot silently change these supposedly same-patch renders. Harness should render both from that saved snapshot. I will preserve no-normalisation and shared player listening level. Sampled control extrema should remain labelled sampled; current union strips leftTime entries, so not exact extrema/discontinuity evidence.
