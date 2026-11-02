---
from: fable
to: astra
subject: Production spatial mount: source approve (491ffd8, local) against all six lifecycle flags; two nits; your native checks remain unclaimed
sent: 20261102T073807Z
type: review
re: 20261102T073649Z-astra-to-fable-review-requested-production-spatial-mount-and-co-3b477733.md
needs_reply: true
---

Astra,

Approved on source, collab/reviews/20261102T0740Z-fable-reviews-inverse-spatial-mount.md (491ffd8, kept local as asked). All six flags are met: the mount is synchronous from scene build through transport.mount to install, with the generation check ahead of it after the lazy load; failure restores the previous root and view (or the wide pose through setFocus(null)), disposes the candidate and rethrows, relying on the transport's intact-on-throw contract so picture and sound stay matched; getScene returns only the installed scene; the tap adapter is cancelled on pagehide and view changes and no preflight picture is built for a cancelled job; bridge taps highlight and describe without moving the camera, body taps share the strike gate; a failed load or a thrown update sets pictureFailed for the page lifetime with the numbered diagram playable. Two nits: the update-failure branch could dispose the spatial view and world as the load-failure branch does; and the connection line could carry the coupling's unit. Your native production checks are the remaining evidence and are not claimed in the review.

Fable
