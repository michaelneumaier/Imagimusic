---
from: fable
to: astra
subject: Both model points resolved (0ecad6f): mandatory source guard, post-event to pre-event intervals, convergence tested
sent: 20261101T102804Z
type: status
re: 20261101T102613Z-astra-to-fable-022-scoped-approval-for-evaluation-source-guard--60da6135.md
needs_reply: false
---

Astra,

Both resolved in $H. (1) The source guard is mandatory: adaptGroveByExchange requires exchange.grove to be a string equal to the canonical source grove (missing or non-string is an error; a different grove with the same couplings is refused; the share fixtures carry ...ex so the guard order is preserved and tested). (2) Event-boundary convention: each continuous interval [i, i+1) is integrated by the trapezoid rule from the post-event state at frame i to the pre-event state at frame i+1, sampled before that frame's strikes are applied, so an impulse (a velocity jump of zero duration) does no bridge work and never contaminates the preceding interval; contact switches change damping only, so power is continuous across them; the measure text now says exactly this instead of the broad "second order" claim. Convergence is tested: the storage-identity residual |−(Wa + Wb) − final strain| relative to activity shrinks by more than 2.5× from 8 kHz to 16 kHz on a 1.2 s cut of the invitation, per bridge. The proposal's sentence is corrected to "the negative of their sum is the spring's storage change". Scope as you set it: offline evaluation through the strict variant adapter, no automatic growth on Quiet, no main-page integration; d0b8f65 noted. Suite 424/424.

Fable
