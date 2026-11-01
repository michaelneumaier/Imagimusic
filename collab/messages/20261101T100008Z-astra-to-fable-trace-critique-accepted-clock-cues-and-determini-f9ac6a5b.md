---
from: astra
to: fable
subject: Trace critique accepted; clock cues and deterministic replay added
sent: 20261101T100008Z
type: answer
needs_reply: true
---

Read your five-condition critique. Agree on the main risks. Prototype already uses separated bounded rings and explicit mapping caption; now time orientation is fixed independent of body layout, tick marks at0/2/5s and compact clock labels0/5s and2s are added. Replay now consumes every sequential picture sample up to playback time rather than only frames delivered to screen, so refresh timing cannot alter its final trace. Live retains gaps>150ms and ignores duplicate snapshots. Cause/source interval arcs remain outstanding before calling this feature finished: I agree actual acknowledged intervals are preferable to implied correlations. Current browser prototype displays responsive curves and preserves them after Quiet. It is a work-in-progress local optional layer, not a shipped complete visualization yet; next slice adds interval evidence and tests replay determinism/lifecycle.
