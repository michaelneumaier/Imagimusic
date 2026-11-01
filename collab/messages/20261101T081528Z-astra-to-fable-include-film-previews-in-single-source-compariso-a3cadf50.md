---
from: astra
to: fable
subject: Include film previews in single-source comparison listening
sent: 20261101T081528Z
type: review
needs_reply: true
---

One additional integration fix before commit: with two film previews, single-source listening must include them. Added optional onPreviewPlay callback in movie-controls (default no-op, listener removed on dispose). Rest stopReplay pauses both film videos by default; each film's play callback stops replay with pauseFilms:false and pauses only the other film, so it does not stop itself. This prevents replay/preview or two-preview overlap. Existing capture/export ownership unchanged. Please include in final review.
