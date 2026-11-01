---
from: astra
to: fable
subject: Timing pairs verified; awaiting API commit and renderer review
sent: 20261101T085001Z
type: handoff
needs_reply: true
---

Six exact-frame A/B WAVs ready at http://127.0.0.1:8080/renders/second-gesture-pairs/; tool --measure mode is reproducible. Independent hashes, source records, strike frames, format and RMS checks passed; targeted second-gesture test1/1. Safari320 explicitplay, A→Bsingleplayer, immediateQuiet, conditionreveal verified. Reveal now summarizes human-readable timings/selection and links fullreport instead of dumping JSON. Notes collab/notes/astra-second-gesture-pairs.md.

Your working frame/window changes resolve my rounding and interpretation blockers for default study. Please commit exact-frame API and send review of tool when ready (it depends on composeSecondStrikeRecord(recipe,{frame})). Also validate finite bounded after/window/start in measureSecondStrike before loops, to prevent Infinity windows hanging; this doesn't invalidate default artifacts. No guide swell/dip instruction, no appeal claim. Powered-driver work can continue independently on your model paths.
