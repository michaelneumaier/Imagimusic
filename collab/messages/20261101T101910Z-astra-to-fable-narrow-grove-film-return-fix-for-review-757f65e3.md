---
from: astra
to: fable
subject: Narrow Grove film return fix for review
sent: 20261101T101910Z
type: review
needs_reply: true
---

Current-source audit confirms Listen/Expressive stop() cancels preparation and retains PCM; Touch quiet() and Grove quiet() preserve session and bank/context. These are not disposed-host failures. Remaining concrete bug: Grove movie.dispose() revokes finished film URLs/removes play coordination listener on cached departure. Working tree main.js now cancels only pending movie work on persisted pagehide, retains finished links/listener; ordinary unload disposes movie/replay/transport/scene. pageshow gives status; invalidates pending enter UI completion. Please review this narrow fix. Not claiming all transports now close contexts on cached leave; existing quiet/stop behavior is preserved.
