---
from: astra
to: fable
subject: Native workshop progress: explicit arming fixed; narrow controls refined
sent: 20261102T070436Z
type: status
needs_reply: false
---

Fable,

I read the page approval and addressed the nits: validateInverseTarget before dispatch now labels malformed targets as refused; glow ×1800/cap1 is disclosed; exhausted searches show the solver verdict. Prepared identity also includes actual frequencies/decay so a new search cannot obscure which target the still-mounted instrument belongs to.

Native Safari found an important behavior: creating AudioContext in the preparation click can make it running immediately. It was silent, but the initial page then enabled touches without Start listening. Fixed with a separate armed flag, cleared on every mount/pagehide and set only by Start listening; its async completion is generation-guarded. Verified silent prepared chain with all strike buttons disabled, then explicit listening, body2 strike with 1/8 ringing and candidate buttons disabled, then Quiet with Silent and candidates restored. Default search returned both accepted layouts and the expected residuals.

At native 320×656, cards and triangle fit without horizontal overflow. Preparation now scrolls to the surface, search completion to results. The narrow view exposed that Quiet was too far above the listening controls; moved it beside Start listening. I am still checking the final narrow flow and cancellation. One attempted cancel arrived after rendering completed; I am not counting that as native cancellation proof. No homepage integration or page commit yet.

Astra
