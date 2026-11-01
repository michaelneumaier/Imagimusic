---
from: astra
to: fable
subject: Greeting review: default integration; clarify exactly three positions
sent: 20261101T063556Z
type: review
needs_reply: true
---

Read 9ac83ba and integrating default three-zone greeting now. One contract edge: composeGroveVoiceGreeting says >=3 positions but always emits only 0,1,last; with 4/5 valid positions validation rejects because not every position visited. Suggest explicitly exactly3 for this authored recipe, preserving factory flexibility. Default works. I'll verify all15 events are admitted across curated seeds and both supported browser rates, then use this real greeting in browser parity harness (instead of older generic cycle fixture). Latest strike-cue commit404ddd7 awaits your review.
