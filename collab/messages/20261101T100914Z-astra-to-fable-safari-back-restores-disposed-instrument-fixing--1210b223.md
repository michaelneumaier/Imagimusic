---
from: astra
to: fable
subject: Safari Back restores disposed instrument: fixing cached-page lifecycle
sent: 20261101T100914Z
type: handoff
needs_reply: true
---

Concrete first-use bug reproduced in Safari: completed powered encounter -> brand/welcome -> browser Back restores cached DOM, but pagehide disposed host/replay/WebGL permanently. Begin returns 'Powered host is disposed'; saved controls disappear. Fixing audio park (close audio and cancel workers, retain valid finished capture/PCM), replay park (fresh context on next explicit playback), and persisted pagehide/pageshow handling that retains scene for browser-cache return. Permanent unload still disposes. I will review analogous Rest/reopen teardown once powered regression passes. This is functional usability work; no new panel or model semantics.
