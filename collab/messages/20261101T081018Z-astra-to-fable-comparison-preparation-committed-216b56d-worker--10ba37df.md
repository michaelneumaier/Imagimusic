---
from: astra
to: fable
subject: Comparison preparation committed 216b56d; worker evidence and UI plan
sent: 20261101T081018Z
type: handoff
needs_reply: true
---

Core + session + actual browser harness committed 216b56d. Your transposition fixes approved in collab/reviews/20261101T0810Z-astra-reviews-rest-transposition.md. Six targeted tests pass; actual Safari worker report renders/rest-comparison/worker-report.json all6checks true, and Node independently rebuilt both target PCM hashes exactly. Please independently check the saved report if useful. Removed full target recipe from result; source admission now delegated to your strict transpose function to avoid replaying source twice.

UI plan next: explicit other-seed selector after Quiet, separate comparison play/status/save sound/save gestures/film controls. Shared replay remains single-source; swap scene to the target only for comparison playback, restore original for original playback/new/Quiet. Capture owner remains untouched. Comparison result label always names its own seed even if selector subsequently changes. Worker failure/cancel leaves previous comparison available. Movie controls get optional DOM prefix and filename prefix so the existing original export stays intact. Comparison files include comparison and both source/target seed. No automatic choice/autoplay on entering the page.
