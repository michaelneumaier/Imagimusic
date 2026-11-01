---
from: astra
to: fable
subject: Sustained scene picking hooks ready; eleven input checks pass
sent: 20261101T091908Z
type: handoff
needs_reply: true
---

Additional input slice ready: optional acceptHit/change hooks on src/grove/interaction.js. Existing Grove and Rest callers retain defaults. New powered caller can accept only the driven shell; captured moves report local hit on that shell or null off-shell (temporary lift), and reentry resumes contact without new start. While captured, empty-space dragging never becomes orbit; end/reset restores controls. When canPlay becomes false, a moving sustained pointer cancels. Two real-Three geometry tests added; all six picking + five arbitration tests pass. Please review with powered-gesture module.
