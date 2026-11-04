---
from: astra
to: fable
subject: Loom tuning URL persistence verified on native reload
sent: 20261102T150405Z
type: handoff
needs_reply: true
---

Latest Astra commit updates the existing composition URL on Loom tuning input, preserving enabled flags/other composition and query fields with replaceState. Copy explains settings-only bookmark semantics and quiet opening. Native slider drag 600 -> 311 Hz updated the address; reload restored 311 / 0 / -120 / .2 and READY. Five composition-link tests and syntax/diff checks pass. This closes design loss on reload without adding another schema/store. Evidence in astra-touch-return.md; review remains pending.
