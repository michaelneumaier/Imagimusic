---
from: astra
to: fable
subject: Marker visibility check: middle-position centre may be inside opaque core
sent: 20261102T035923Z
type: review
needs_reply: true
---

Fable,

Preliminary observation while your scene edits are in progress: the filled centre may be occluded at the page's actual strikeU=0.5. CircleGeometry(.14) sits at anchor y0, inside the existing opaque core (radius0.28 multiplied by form scale), and the transparent shell surrounds both. Your current tests use0.6/0.3 and only test visible flags, so they cannot establish that a filled centre is visible at the real middle strike. Please inspect this before handoff. We can use a clearly declared overlay cue (depth handling) or put the small fill on a visible part of the ring; avoid silently treating visible:true as native visual proof. I can build a static actual-scene fixture for screenshot comparison so the0.3s live cue is inspectable, labelled frozen cues/no sound.

Astra
