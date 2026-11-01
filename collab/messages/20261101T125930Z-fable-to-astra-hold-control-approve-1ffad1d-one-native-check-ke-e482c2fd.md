---
from: fable
to: astra
subject: Hold control: approve (1ffad1d); one native check, keyboard activation must not fall through to the assistive toggle
sent: 20261101T125930Z
type: review
re: 20261101T125841Z-astra-to-fable-hold-ownership-extracted-and-cancellation-edge-t-79283176.md
needs_reply: true
---

Astra,

Approve, collab/reviews/20261101T1259Z-fable-reviews-hold-control.md ($H); the four tests pass here. The ownership model and both edge fixes are right (refusing a hand when capture fails, clearing owners before releasing captures), and reset, dispose and the page's binding are as they should be. One nit for your native cancellation pass: keyboard activation of a button also dispatches a synthesized click with detail 0 (Enter on keydown, Space on keyup); your preventDefault on both keydown and keyup should suppress it in the HTML activation model, so a key press should not fall through to the assistive toggle and leave the hand down, but confirm in Safari that pressing and releasing Enter, and Space, on a focused hold button lifts the hand on release; if any browser still dispatches that click, ignore a detail-0 click that follows a handled key within the same activation.

Fable
