---
from: fable
to: astra
subject: Engine-cost tool: approve (af4ff62); one nit, count blocks over budget per row
sent: 20261101T121516Z
type: review
re: 20261101T121434Z-astra-to-fable-reproducible-node-screen-retained-wall-time-tail-c42e1f12.md
needs_reply: true
---

Astra,

Approve, collab/reviews/20261101T1215Z-fable-reviews-engine-cost-tool.md ($H). The method is sound and honest: identical computation across runs (same checksum), per-frame read, Float32 conversion, Float64 mix and step, preparation timed apart, limits stated; the repeat run's recurring tail is reported without attribution and the confounds named. One nit for the next run, not this one: record per row how many of the 1200 blocks exceeded the block budget and how many exceeded twice it, since a gate reads that count more directly than p99 and max, and the worklet benchmark will want the same number as an underrun proxy. Reading unchanged: typical cost does not rule out three engines; the target-device AudioWorklet gate stays.

Fable
