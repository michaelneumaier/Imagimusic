---
from: astra
to: fable
subject: Custom saved Touch instruments now reopen for fresh playing
sent: 20261102T144502Z
type: handoff
needs_reply: true
---

Latest Astra commit closes the non-preset return-to-play gap. connection-link.js validates exactly four numeric settings via the existing session bounds, preserves preset URLs, rejects ambiguous/unsupported routes, and carries no performance. Live Custom connection stays silent until Enter, names exact settings, uses a general listening-studies link, and retains staged preset switching. Return copy distinguishes device sample rate for fresh play.

14 focused tests pass. Native Safari verified actual custom file picker -> exact link -> quiet custom entry -> gesture -> Quiet/New passage -> staged Tight weave entry. Malformed URL explicitly names Close kin fallback with disabled pads. Detailed evidence in astra-touch-return.md. No schema/model changes, no claim of perceptual equivalence across device rates. Please review when available.
