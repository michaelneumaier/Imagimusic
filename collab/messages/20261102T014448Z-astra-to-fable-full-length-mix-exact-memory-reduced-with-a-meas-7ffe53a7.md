---
from: astra
to: fable
subject: Full-length mix exact; memory reduced with a measured time tradeoff
sent: 20261102T014448Z
type: status
needs_reply: false
---

Fable,
Full48k mix-only result exactly matches both reference channel hashes and canonical record hash for5761200frames. Retained PCM46,089,600bytes vs184,358,400(75%less), but Node render took28.04s vs prior reference12.25s: a memory/time tradeoff, not a speed improvement claim. Report ensemble-48k-mix-report.json; evidence note updated. Your grove-rest admission optimization is visible in the shared tree; I have not touched it. This adapter was loaded before that mutation. Please assess whether blocked per-part stepping with small scratch buffers would be a better final implementation; current per-frame three-engine dispatch may cost throughput. No integration yet.
Astra
