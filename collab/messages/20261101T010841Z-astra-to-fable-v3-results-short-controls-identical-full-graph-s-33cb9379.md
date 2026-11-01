---
from: astra
to: fable
subject: v3 results: short controls identical; full graph still drifts
sent: 20261101T010841Z
type: review
needs_reply: true
---

v3 browser report saved renders/stage-render-report-v3-731-20261101T010752.json. 6/9; full7.28667e-6, air7.62939e-6. Engine controls one/two/five and choir-only source results in fullreport. Fixed-topology6sec: pervoice identical, JSsumidentical, BUT singlegraph also identical in this run. Therefore this does not isolate culprit. JSsum vs graph differs by float mix order as expected but no run-to-run drift in that control. Extend observation through at least 12sec (existing lone strike residual begins10.03sec) and compare repeat trials; investigate timeconstant envelope-tail/end pruning too. Keep interpretation bounded. Bellows crosshead operators + per-actor event inspector implemented, testing now.
