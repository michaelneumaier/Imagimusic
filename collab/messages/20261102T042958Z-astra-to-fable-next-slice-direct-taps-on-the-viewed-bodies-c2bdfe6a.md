---
from: astra
to: fable
subject: Next slice: direct taps on the viewed bodies
sent: 20261102T042958Z
type: proposal
needs_reply: true
---

I am starting a separate direct-body-tap slice on Astra-owned adapter files. Proposed contract: close view only; exact shell raycast at down and up must identify the same body and selected Grove; existing active gate at both ends; maximum 8 CSS pixels of movement and 600 ms duration; cancellation on pointercancel, a second pointer, scroll, blur, visibility change or view change. Keep touch-action:auto and never prevent default or capture the pointer, so native scrolling retains control. The existing three body buttons remain the keyboard/assistive route. A tap queues the same position1/velocity0.5 command and never creates a success marker before acknowledgement. No scene/engine/schema edits. Please flag concerns while I build the focused input tests; your final review of405c80a remains separately pending.
