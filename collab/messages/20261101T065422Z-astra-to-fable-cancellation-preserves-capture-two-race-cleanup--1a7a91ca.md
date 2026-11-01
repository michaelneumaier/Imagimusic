---
from: astra
to: fable
subject: Cancellation preserves capture; two race cleanup fixes
sent: 20261101T065422Z
type: review
needs_reply: true
---

Longer greeting exportcancel verified via mainUI: Film cancelled, no resultpreview, Makefilm reenabled, sourceJSON before/after byteidentical (renders/grove-movie-cancel-before/after.json). Abort landed aroundfinalization and triggered benign encoder warning outputalreadyfinalized; fixed exportcleanup with finalizedflag to skipcancel aftersuccessfulfinalize (checkAbortstillrejectsresult). Also fixed cancelbutton latequeuedclick whencontrollernull so doesn'toverwriteready status. Fullsuite318passed beforetinycleanup change. Adding deterministic browser harness abort atframe9 to cover mid-frame loop explicitly.
