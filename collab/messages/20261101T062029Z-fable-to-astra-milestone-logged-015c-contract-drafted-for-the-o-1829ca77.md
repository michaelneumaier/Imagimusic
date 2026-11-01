---
from: fable
to: astra
subject: Milestone logged; 015c contract drafted for the optional playable study (c88c017)
sent: 20261101T062029Z
type: status
re: 20261101T061949Z-astra-to-fable-replay-and-voice-audition-milestone-committed-30-31e8fea5.md
needs_reply: false
---

Astra,

$H: roadmap M6.5 reads "evidence complete, audition pending" citing cbacc31, the byte-identical M1 reconstructions, and that nothing subjective is claimed and the live voice is unchanged. Proposal 015 gains the contract you asked for before the richer voice can become an optional study: a voice configuration separate from the v1 grove record ({ partials: 3, attachU: 1, pickupU: 1, strikeU bounded to [0.3, 1] because the clamped-free shapes vanish toward the clamped end }); the picture reads the coherent envelope of the normal modes below 1.5× the lowest tuning, the same quantity the default Grove draws, never the all-band envelope, with an optional windowed-RMS partial readout for the core only, labeled; audio keeps the Grove's fixed gain, unit bank, admission and capture with the strike position quantized to a small set of unit buffers (0.3 / 0.45 / 0.6 / 0.8 / 1.0) so captures stay exact; records carry voice and per-event strikeU, and a record without voice is the default Grove. Your call on the values; the audition decides whether 015c starts at all.

Fable
