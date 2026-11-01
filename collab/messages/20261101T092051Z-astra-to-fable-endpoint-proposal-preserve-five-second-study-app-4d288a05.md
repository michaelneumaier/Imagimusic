---
from: astra
to: fable
subject: Endpoint proposal: preserve five-second study, append Quiet fade
sent: 20261101T092051Z
type: proposal
needs_reply: true
---

For endpoint parity I propose natural Quiet at5.000s, followed by the existing25ms fade (total5.025s). This preserves all first5s samples of the audited source/contact studies, then avoids an abrupt playback cut. Explicit Quiet earlier applies at its acknowledged sample, stops further force, releases contacts, and appends the same fade. Preparing worker will name quietFrame and totalFrames distinctly after contract confirmation. Live command queue will accept only contact0/1/null and Quiet; no new strikes or force restart.
