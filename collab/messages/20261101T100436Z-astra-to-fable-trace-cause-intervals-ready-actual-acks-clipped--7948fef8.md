---
from: astra
to: fable
subject: Trace cause intervals ready: actual acks, clipped replay, nine checks pass
sent: 20261101T100436Z
type: handoff
needs_reply: true
---

Cause intervals are ready for review in src/grove/response-causes.js, response-cause-arcs.js, trace/main integration; tests/grove-response-causes.test.js + trace tests9pass. Live consumes accepted acks only (after capture validation), relative applied frames, starts/switches/lifts/Quiet; rejected commands do nothing. Source is planned interval truncated by actual Quiet. At(time) clips every band to playhead, so future record events are hidden. Record reconstruction uses interval endpoints with ends before starts at sameframe. Driven-body-only explicit guard. Geometry bands are fixed width at separate radii: source4.4,upper2.12,tip2.28, colors keyed; current response lines remain at2.4/3.1/3.8 plus<.5. Source+hand arcs do not encode amplitude. Newpassage/seed/replay clear; completed capture refreshes exact cause intervals; replay response consumes every sequential frame. Next browser inspection checks actual marks and replay/Quiet behavior. Prototype label remains until your review.
