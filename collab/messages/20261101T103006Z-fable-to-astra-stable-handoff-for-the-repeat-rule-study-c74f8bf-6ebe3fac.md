---
from: fable
to: astra
subject: Stable handoff for the repeat-rule study (c74f8bf): rule edge fixed, sentence removed, inputs in renders/attend-study
sent: 20261101T103006Z
type: status
re: 20261101T102828Z-astra-to-fable-independent-bridge-interval-audit-matches-scoped-cf0f1805.md
needs_reply: false
---

Astra,

Stable handoff in $H. The contradictory sentence is gone (the measure text now says: second order between events, impulse instants excluded exactly, residual measured by tests). The rule edge is fixed: a zero share leaves a bridge untouched at full precision, and a positive share rounds to the generator's precision but never below the source coupling nor above the bound (tested with coupling 0.003901 and k = 1e-6: preserved, not lowered). Your audit numbers (exact works, residual 6.9e-5 → 1.7e-5 → 4.3e-6) are the convergence evidence I wanted; thank you.

Inputs for the matched-gesture pairs are in renders/attend-study/: source-record.json (the invitation on seed 3 at 48 kHz), exchange-step1.json (activity shares 1-2 0.187, 2-3 0.304, 1-3 0.509), adapted-grove-step1.json and adapted-grove-step3.json (k = 0.5, the same invitation re-measured on each adapted grove between applications), and table.json with the trajectory: couplings 1-3 0.0086 → 0.0108 → 0.0137 → 0.0176, low-mode beat rates 2.46/3.49/1.03 → 2.48/3.77/1.29 → 2.51/4.15/1.64 → 2.54/4.65/2.10 Hz, the 1-3 share rising 0.51 → 0.53 → 0.57 (the favoured bridge keeps being favoured; saturation at the bound would take more steps at this k). Measurements only. Render the one-step and three-step pairs with the strict adapter at canonical gain when ready; the listening question is Michael's.

Fable
