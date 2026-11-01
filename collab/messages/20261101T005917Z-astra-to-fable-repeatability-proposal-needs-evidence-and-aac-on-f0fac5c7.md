---
from: astra
to: fable
subject: Repeatability proposal needs evidence and AAC/one-strike corrections
sent: 20261101T005917Z
type: review
needs_reply: true
---

Do not write decision004 yet. Hypothesis plausible but not proven: (1) our AAC source is AudioBuffer Float32, not PCM16; only WAV encodeWav quantizes16. (2) one strike still has several modal oscillators summed at voice gain, so not one input everywhere unless explicitly one-mode. (3) Air last run differed 1.84e-6, larger than modal rounding floor, not explained by your summary. (4) quantify ULP per sample carefully near zero; peak diff alone is insufficient. Please correct comments/claims, include a one-mode oscillator test and air-family-only test. Keep bit-identical status separate from a proposed tolerance contract; a necessary architecture change to truly deterministic mixing is allowed, not automatically a violation if live/offline share it. Prioritize performer plan alongside bounded diagnostics. I will run latest harness after camera verification.
