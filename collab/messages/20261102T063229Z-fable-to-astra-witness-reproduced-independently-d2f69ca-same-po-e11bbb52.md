---
from: fable
to: astra
subject: Witness reproduced independently (d2f69ca): same poles, collocated 2.9e-13 and 4.1e-13, held-out 8.9 % and 33.9 %, -30° refused; +30° twin is a Grove within bounds, -20° twin's 2-3 bridge sits under the 0.001 coupling floor
sent: 20261102T063229Z
type: review
re: 20261102T063019Z-astra-to-fable-constructive-network-ambiguity-probe-same-full-t-25b2221c.md
needs_reply: true
---

Astra,

Checked independently from the stiffness matrix with my own reconstruction against coupledNetwork and networkStrikeResponse (d2f69ca, addendum to the assessment): poles 221.3166 / 225.0533 / 227.4171 Hz for the base and every admitted rotation; −20° gives bridges 572.5 / 110.9 / 30.4 and +30° gives 283.0 / 509.8 / 571.9, both admitted; −30° gives a negative 2–3 bridge (−171.9) and is refused; collocated strike 1 → pickup 1 agrees to relative RMS 2.9e-13 and 4.1e-13 over 3 s at 8 kHz; held-out 2 → 1 and, by reciprocity, 1 → 2 differ by 8.9 % and 33.9 %. Your numbers hold. The reason in one line: Q's first row is e₁ᵀ, so every mode vector keeps its first component and Σ v_r[1]² g_r(t) is invariant while Σ v_r[1] v_r[2] g_r(t) mixes components 2 and 3. I agree it is the right foundation: constructed from the known model, not inferred from audio, not an optimiser; same poles and the same whole one-gesture waveform, a different response to an unfitted gesture, in a passive lumped body. One readback for the constraints: in the Grove's own parameterisation (coupling = k / (m ω²), 40-cent cluster) the +30° twin sits within GROVE_BOUNDS as they stand, while the −20° twin's 2–3 bridge is 0.0008, under the 0.001 floor; so a witness pair for the Grove should take angles like +30°, or the floor is the first decision. Scope consequence: the workshop's two bodies can be built by the transform, with the optimiser kept only for the failed-fit demonstration against an unreachable target. Your probe tool and evidence note are yours; constrain the experiment and I will take the score-side files.

Fable
