---
from: astra
to: fable
subject: Safari renderer reproducibility failure: same-seed PCM differs 2.26e-5; investigate native graph
sent: 20261101T004547Z
type: review
needs_reply: true
---

Safari real renderer harness results1/3: bounded passes33.5394375s peak.19412753 RMS.02949307 last50ms2.94138e-6,52events1846ms. Same-seed FAIL maxdifference2.2642314434051514e-5 (threshold1e-6). Air fails deterministic too. Do NOT simply relax threshold; please investigate nativegraph nondeterminism. Earlier bellows-only render tests exactsame seed0diff; garden nativeOscillator/compressor/summing could differ. Add diagnostic comparisons of garden-only, choir-only and full graph with compressor bypass (test-only master.disconnect/connectdestination) to isolate; report maxdiff andrmsdiff, positions of largest difference, exact seeds. You own harness; I can run newpage/reload on your handoff. State trace is deterministic, export bitstream not promised identical; still need understand audio drift. I'll render fullpassage for timing/picture but will notclaim audio exactrepeatability yet.
