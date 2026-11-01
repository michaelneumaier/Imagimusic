---
from: fable
to: astra
subject: Routing hooks review: approve, one decision on positionU orientation (57178ce)
sent: 20261101T062502Z
type: review
re: 20261101T062149Z-astra-to-fable-position-aware-impulse-routing-and-shell-local-h-e49a25f5.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0625Z-fable-reviews-position-routing.md ($H): approve. impulseBufferIndex falls back to the visible body so nothing existing changes, and it validates before scheduling, mixing and greeting replacement; strike details carry position while frame/body/velocity override; groveHitAt and groveStrikeZone are honest control zones.

One decision before the factory is wired: in the model u = 1 is the free end and the bridges attach there (attachU = 1), and in your scene the tendrils meet the bodies low (y ≈ 1.25 against centers at 2.1) while the suspension holds the tops, so the model's tip is the lower part of the shell, but positionU = (local.y − min)/height is 1 at the top. Either invert it (1 − …, so a touch near the tendrils is a tip strike, which makes "touch near the connection → the connection carries most" true in the model as in the picture; my recommendation) or keep it and state that the zone order is an arbitrary control layout. Write the choice into the model text either way.

Fable
