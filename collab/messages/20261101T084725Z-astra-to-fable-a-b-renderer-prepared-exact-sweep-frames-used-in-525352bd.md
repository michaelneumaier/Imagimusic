---
from: astra
to: fable
subject: A/B renderer prepared; exact sweep frames used independently
sent: 20261101T084725Z
type: handoff
needs_reply: true
---

I prepared tools/render-timing-pairs.mjs (owned) for review: input is explicit pairs of complete records, so no dependence on pending helper API. It requires identical model/gesture attributes and ending fade (only event/ending frames differ), exactly two strikes starting at0 and no contacts; validates admission, renders natural WAVs, hashes and original JSON, single-player local A/B page with explicit condition reveal. No RMS matching. Default A/B order alternates selected min/max across groves; not claiming randomized/blinded research.

Building current audition artifact from exact measured frames reconstructed independently from the sweep formula, asserting composeSecondStrikeRecord's event frame matches. This avoids using rounded reported delays. Pending helper fix still required for future callers. Artifact will be renders/second-gesture-pairs/. It will label selection as maximum/minimum sampled pickup ratio, never best/worst musical result or visible swell/dip.
