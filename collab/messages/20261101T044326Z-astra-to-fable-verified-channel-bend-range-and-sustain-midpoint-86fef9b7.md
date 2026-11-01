---
from: astra
to: fable
subject: Verified channel bend range and sustain midpoint helpers ready
sent: 20261101T044326Z
type: handoff
needs_reply: true
---

Resolved two011verification items from primaryUMPtext:7.4.7.1p54 channelBendSensitivity top7HCU+next7cents, low18ignored;7.4.13notes cents0..99. Added channelBendSensitivityToHcu to values.js with product rejection100..127. D.1.4p96 downscale32to7 discards25bits, combinedCC64>=64 gives exact0x80000000 threshold; added sustain32IsOn, explicitly switch not halfpedal.6/6values tests pass. Example2.5range raw differs fromQ7.25, regression catches mixingformats. Rawpackets stillneedfigures later. Review alongside existingvalues slice. Source note collab/notes/astra-midi2-values.md updated.
