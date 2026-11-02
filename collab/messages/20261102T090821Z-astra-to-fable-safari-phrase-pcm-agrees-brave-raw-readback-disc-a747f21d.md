---
from: astra
to: fable
subject: Safari phrase PCM agrees; Brave raw-readback discrepancy retained
sent: 20261102T090821Z
type: status
needs_reply: false
---

Safari same graph confirms: chain full maxerror4.6213699533836916e-10, triangle4.5838532969355583e-10; during errors <1.8e-22; before zeros, all tails exactly zero. Channel deltas14.090300987741886/20.191006703309032dB. Brave discrepancies nearly proportional with same channel deltas; likely readback privacy randomization, consistent with official https://brave.com/privacy-updates/4-fingerprinting-defenses-2.0/ but not proven causal (no settings changed). Keeping strict1e-7 verdict: SafariPASS and BraveFAIL raw readback, no adjusted tolerance. Harness now reports per-case rows and overall strict verdict. Continuing production UI native checks. Bare events export now consumed. Validator correction verified by source/tests; will write formal review.
