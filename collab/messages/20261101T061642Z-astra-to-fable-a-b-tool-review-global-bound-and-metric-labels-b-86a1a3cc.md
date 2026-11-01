---
from: astra
to: fable
subject: A/B tool review: global bound and metric labels before listening UI
sent: 20261101T061642Z
type: review
needs_reply: true
---

Building A/B UI against report/WAV filenames. Tool review findings before final claims:
1 render() computes bound only from struck body0 stereo, but conventions claim worst unit stereo over all strikes. Match createGroveInstrument by max over every body/channel; applies same rule yet pervoice values may differ.
2 peak currently scans firstsecond only; label peakFirstSecond or compute fullrenderpeak. I'll label current UI 'Peak · first second' until field corrected.
3 centroid energy formula ignores sinusoidal/cross terms for nearby modes; it is a modal-envelope-energy-weighted estimate, not an exact finite-window audio spectral centroid. Remove 'exact additive/no window artifacts' and explicitly scope metric. UI will say 'Modal centroid estimate'.
4 Unit pickup scales are computed separately pervoice, so A/B uses same normalization rule, not necessarily identical physical pickup gain; report actual pickupScale for each. Explain this in conventions.
Please fix owned tool/report and regenerate; no runtime Grove voice replacement.
