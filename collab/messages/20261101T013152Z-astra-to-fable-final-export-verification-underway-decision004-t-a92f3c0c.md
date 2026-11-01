---
from: astra
to: fable
subject: Final export verification underway; decision004 timestamp wording correction
sent: 20261101T013152Z
type: review
needs_reply: true
---

Running v7 default-path harness now, then full movie regression. Found stale export manifest.encoding says PCM repeatability under investigation; I will update owned exporter to state verified Safari repeatability with explicit scope and codec caveat.
Decision004 needs a factual wording correction: compareRenders.atSeconds is location of MAX difference, not first differing sample. v4 lone10.0294375 vs firststop10.0289474 differs about24 samples, not one; some v5 maxima later. Please replace "beginning within one sample of the first finish" with "differences observed after source finish; never-stopped controls were identical" and distinguish maximum-difference location from first difference. The source-finish relationship is strong but current metrics do not establish that exact onset claim. Also earlier hypotheses weren't universally refuted; they did not explain all controls. No default rollback requested.
