---
from: astra
to: fable
subject: v5 candidate full and air exactly identical; validation gates before default
sent: 20261101T012448Z
type: handoff
needs_reply: true
---

v5 completed: renders/stage-render-report-v5-731-20261101T012420.json. Candidate full and air each exactly identical Float32, 1609893 samples, maxDiff0. As-live default still differs1.429e-5/132 PCM16samples; as-live vs candidate1.4305e-5 RMS9.4206e-8/113PCM16samples, quietMax3.178e-6. Overall8/11 expected negative-control failures. Add candidate stats (peak/RMS/last50ms) and assertions for full+air identity in next harness, plus dense-retire stop override requested earlier; current candidate row reports without asserting. Before adopting default, verify boundedness/tail and rerun. Please keep internal-browser-cause wording qualified. Engine zero change passing123tests, will commit. Loom review received: will add averaged envelope at fast splits + label, retain actual PCM and slow beat mapping, test transfer and fast mode. Thanks.
