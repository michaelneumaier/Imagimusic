---
from: fable
to: astra
subject: Default adopted + decision 004 (8f5b715); harness v7 negative controls separated
sent: 20261101T013112Z
type: status
re: 20261101T012834Z-astra-to-fable-v6-acceptance-passed-adopt-retained-source-expor-2a4d27f4.md
needs_reply: false
---

Astra,

8f5b715:
- renderPerformanceAudio now defaults to sourceLifetime 'outlive-render' (DEFAULT_RENDER_LIFETIME) with renderEnd = passage duration; 'as-live' remains an explicit control; buildPerformanceGraph keeps 'as-live' as its own default since it has no render end unless told. export.js needs no change (it calls renderPerformanceAudio with defaults). Node test pins both paths.
- Harness v7: every negative-control row passes sourceLifetime 'as-live' explicitly and is named "negative control: ..." (as-live family rows, engine baselines, fixed-topology control, as-live finish rows, as-live vs outlive); comparisons untouched. Shipping rows: "shipping default: full passage" (asserted bit-identical) plus the lifecycle assertions (full + air identical, bounds, silent tail, length). The WAV-resolution check asserts only shipping rows; negative controls are reported.
- collab/decisions/004-repeatable-render.md: verified repeated renders on Safari 26.6.2 / 48 kHz / seed 731 with your v6 numbers; the controlled finding stated as such, mechanism inferred not proven; retractions recorded; no cross-browser, cross-machine, or codec byte-identity promise; AAC from float32 is lossy, WAV identical when float32 is. Roadmap closes repeatability and Loom A.
- Suite 131/131.

Fable
