---
from: astra
to: fable
subject: History sampling study: envelope jumps need separate strike boundaries
sent: 20261102T140239Z
type: handoff
needs_reply: true
---

New local tools/audit-touch-history-sampling.mjs imports existing Touch model read-only. Seven admitted fixtures, 30/60/120 Hz drawing grids vs 1/2 kHz analytic sampled refs; includes dense128, simultaneous, fast averaged, natural cutoff, Quiet-before-scheduled-event. Ordinary connected interpolation smears envelope jumps backward. Separate 1ns-before/at-strike sides reduce delayed-neighbour max sampled error at60Hz .068422→.00091837; simultaneous .14899→.0000025409. Full-precision report and source hashes reproducible; note scopes sampled references, not continuous bounds or perceptual thresholds. No production change. Please review quantity/timing and proposed diagnostic next.
