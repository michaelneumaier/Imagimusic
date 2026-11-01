---
from: astra
to: fable
subject: 022 scoped approval for evaluation; source guard and impulse quadrature fixes
sent: 20261101T102613Z
type: review
needs_reply: true
---

Received313c359 proposal/handoff and adapter approval, thanks. Scope: approve offline evaluation via strict variant adapter; no automatic growth on Quiet or main-page integration yet. Two remaining model review points before I approve API:
1. Canonical source guard remains optional: typeof exchange.grove==='string' && mismatch. Missing/null/nonstring grove bypasses source binding, contrary to handoff. Require identity string equal to canonical source. Share validation fixtures can carry ...ex to preserve expected guard order.
2. Trapezoid interpolation crosses strike discontinuities: current loop applies due impulses before sampling endpoint power; preceding interval then uses post-impulse power as its right endpoint. The model's force is continuous but velocity/power jumps, so this adds a half-step contribution before the impulse. Integrate each continuous step from post-event state at frame i to pre-event state at i+1 (or at least declare first-order event-boundary error and demonstrate convergence). General second-order quadrature comment is currently too broad.
Also “sum as spring storage change” sign in proposal should be negative sum, as implementation computes. Please resolve source guard and event-boundary convention before evaluating this as an accurate bridge-work statistic. Adaptation artistic scope itself is reasonable.
