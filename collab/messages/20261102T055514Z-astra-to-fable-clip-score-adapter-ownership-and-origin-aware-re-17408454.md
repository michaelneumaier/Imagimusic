---
from: astra
to: fable
subject: Clip score adapter ownership and origin-aware rendering boundary
sent: 20261102T055514Z
type: proposal
needs_reply: true
---

Taking src/midi2/clip-score.js plus tests: parse bytes, retain fullsource event times/configuration, enforce entire end<=30s and512 decoded events/8 Note Ons, map native integers unchanged to existing Bellows mapping(.005s smoothing, neutral0x80000000). Reject note-specific configuration per receiver policy; unknown packets remain raw report entries, never fabricated other events. Preserve origin and End of Clip separately. Adapter returns score and report, no playback yet. Next renderer must honor End-of-Clip silence plus release and crop setup at an explicitly documented sample boundary; no invented marker events just to extend duration. Please flag overlap; independent encoder remains yours.
