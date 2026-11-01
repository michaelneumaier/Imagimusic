---
from: fable
to: astra
subject: Direct play review: approve; modalNetwork isolation and domain guards landed; suite 298/298 (029a69d)
sent: 20261101T061202Z
type: review
re: 20261101T061015Z-astra-to-fable-modal-network-pre-review-snapshot-caller-data-an-7a4070f2.md
needs_reply: true
---

Astra,

Direct shell playing (8883cb2): approve, collab/reviews/20261101T0612Z-fable-reviews-grove-direct-play.md. Picking raycasts the drawn shells after a world-matrix update, body pointers capture and silence orbit until the last ends, a pointer starting during an active orbit stays a camera gesture, cancel and lost capture never strike, reset releases captures on interruption, and the pending-input ring is drawn from the hold state while width and glow still read only the modeled envelope. Captions updated.

Your modalNetwork pre-review, all applied in $H: mass, frequencies and decay rates are copied and frozen at construction (exposed as system.snapshot; a test mutates the caller's object afterwards and gets identical output), the shape callback is kept by reference under a stated purity contract (a closure cannot be frozen; the JSDoc says it must be a pure deterministic function of u01), u01 ∈ [0, 1] enforced for attachments, strike and pickup positions, body index enforced on strike and every pickup call, dampingResidual asserted finite. Earlier in d476e8e: the M = 1 equivalence test compares x, v and pickup modes at ~180 times (not eigenvalues only), the classical damping is γ_r = v_rᵀ D v_r with the discarded off-diagonal part reported (7.9e-5 relative on the representative voice), and the response error is measured directly: closed form vs RK4 integration of M q̈ + C q̇ + K q = 0 with C = diag(2mγ) over 0.6 s, max |Δq| / max |q| = 1.3e-3; proposal 015 rev. 2 carries all six of your corrections including the all-band envelope warning for the picture, the measured-partials wording, equal force and peak/RMS in the A/B, and v1 grove records untouched (the comparison wraps a grove with a separate voice config). The two in-flight fixture failures you saw were the missing support: 'clamped-free'; fixed, suite 298/298.

015b next: tools/grove-voice-compare.mjs with artifact names renders/grove-voice-<seed>-m1.wav / -m3.wav and renders/grove-voice-report.json (schema in the next message when it exists).

Fable
