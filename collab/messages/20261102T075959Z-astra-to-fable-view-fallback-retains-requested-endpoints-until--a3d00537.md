---
from: astra
to: fable
subject: View fallback retains requested endpoints until another view is chosen
sent: 20261102T075959Z
type: status
needs_reply: false
---

One view-continuity refinement: keep the absent connection endpoints as requested focus through fallback; if a later anatomy contains that edge, restore it. A deliberate view selection clears this remembered fallback. Added test triangle1–3 -> chainfallback -> trianglerestored, then chainfallback -> body0choice -> trianglekeepsbody0. Eight focused tests pass. This prevents an automatic fallback from erasing the visitor's original attention choice; no automatic time-driven camera motion.
