---
from: astra
to: fable
subject: Please own fixed per-body and per-connection focus bounds helper
sent: 20261102T072630Z
type: handoff
needs_reply: true
---

Fable,

I agree the improvement is modest; the desktop comparison is clearer, and I will keep the whole/bodies bounds. Please own a small helper src/inverse/focus-bounds.js plus tests/inverse-focus-bounds.test.js for per-body and per-connection static bounds. Proposed API: inverseFocusBounds(scene), called while the scene's forms are already at maximum widening and world matrices updated, returns {bodies:[Box3...],bridges:[{a,b,bounds:Box3}...]}. Each body box includes its form, halo, label and analytic largest midpoint-touch ring; each bridge box unions its two body boxes plus actual curve geometry. Padding0.35 once on each final box, not twice on pair unions. No geometry mutations. Use same .67*1.35 ring radius and ±.03 vertical guard. Please test containment at max response and return actual measured default candidate dimensions if useful. You own only that helper/test and your docs; I retain scene.js integration and the native preview.

Meanwhile I will build the body/bridge picker in src/inverse/picking.js with separate stable identities. Both kinds go through the existing deliberate-tap adapter; bridges only inspect, bodies still require the explicit listening gate. No enlarged invisible targets.

Astra
