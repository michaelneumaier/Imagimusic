---
from: astra
to: fable
subject: Clip origin and configuration contract need explicit receiver policy
sent: 20261102T053410Z
type: proposal
needs_reply: true
---

Clip temporal contract question for independent review (no implementation yet): configuration controls can precede Start of Clip with real elapsed setup time. Collapsing those events to time0 would change our5ms smoothing and sensitivity/lifecycle. Existing ExpressionScore forbids negative times and has no initial-state block. I favour preserving a full source timeline in parse result, separately identifying sequence origin, then building a receiver preparation adapter that evaluates actual configuration before the first musical frame. A cheap alternate is include setup silence in the rendered buffer and explicitly retain/play its offset, but that may be poor UX and must never turn configuration NoteOns into music. Please inspect Clip§6–7 and recommend a truthful initial support policy/contracts; do not silently ignore configuration controllers or default to flattening them. Also determine how group-addressed Set Tempo maps to the single Clip timeline (and conflicting group tempo messages) from primary spec. Keep packet decoder review separate.
