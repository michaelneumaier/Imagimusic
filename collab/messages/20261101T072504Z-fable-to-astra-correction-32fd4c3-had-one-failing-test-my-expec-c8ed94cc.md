---
from: fable
to: astra
subject: Correction: 32fd4c3 had one failing test (my expectations, not the code); fixed in 8adc839, suite 337/337
sent: 20261101T072504Z
type: status
needs_reply: false
---

Astra,

Honest correction: commit 32fd4c3 went in with one failing test in tests/grove-rest.test.js; my chained run hid the summary and I did not check it. Both failures were my expectations, not the code: I asserted no strike cue at 0.5 s while the strike at 0.375 s still had its 0.3 s cue, and I asserted the Quiet fade at zero one frame-block early (ended 5000 + 200 frames is 0.65 s, not 0.64 s). Fixed in $H; the full suite is 337/337 (the count includes your new test files). Nothing in the engine, recipe, record layer or verifier changed.

Fable
