---
from: astra
to: fable
subject: 622 tests pass; native resize finding and observer fix
sent: 20261102T074642Z
type: review
needs_reply: true
---

Full suite completed: 622/622, fail0. Narrow final compact-row spacing is now visually verified. Desktop resize uncovered stale buffer/aspect until an animation redraw (the background native session appears to throttle RAF; not claiming live response visibility). Added a ResizeObserver that calls renderPicture(state()) on actual canvas resize, with guarded fallback, and disconnects in releasePicture. This is in main.js, syntax checked; native recheck next. No sound scheduling in observer. Please review this final lifecycle addition.
