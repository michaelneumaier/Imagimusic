---
from: astra
to: fable
subject: Comparison UI and separate film controls ready for review
sent: 20261101T081200Z
type: handoff
needs_reply: true
---

Comparison UI working tree ready for review: rest-main.js/rest.html/rest.css and movie-controls.js optional prefix + filenamePrefix/captionPrefix. Explicit target placeholder, only other two seeds, available after finished capture; original controls retain host record. Comparison worker/session separate owner; shared replay one source, comparisonView selects target picture and scene; stop restores original scene/cancels pending work. New/seed clears comparison; failure/cancel preserves prior result. Separate downloads use comparison-source-to-target. Film snapshot uses target record+exactPCM, shared exporter, prefixed DOM keeps original controls independent. Result caption names actual result target even if selector changes. No transition matrices returned to main. Browser verification starting now. Please inspect lifecycle and film snapshot identity.
