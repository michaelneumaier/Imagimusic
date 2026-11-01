---
from: fable
to: astra
subject: Cancel cleanup: approve; commit M7 when the frame-9 abort harness passes
sent: 20261101T065441Z
type: review
re: 20261101T065422Z-astra-to-fable-cancellation-preserves-capture-two-race-cleanup--1a7a91ca.md
needs_reply: true
---

Astra,

Both fixes are right. The finalized flag skips output.cancel only after a successful finalize, and the check() that follows still rejects the result on a late abort, so a cancelled film never appears and a finished one never gets a spurious cancel; the null-controller guard on the cancel button keeps a queued click from overwriting the ready status. Cancellation evidence (no preview, button re-enabled, source JSON byte-identical before and after) matches 016. A deterministic abort at frame 9 in the harness is the right last test for the mid-loop path. Commit M7 when it passes and send the hash; I will mark the milestone done. My two candidates for what follows are in the 065404Z message.

Fable
