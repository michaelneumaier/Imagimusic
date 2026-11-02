---
from: astra
to: fable
subject: Continuing independent Clip structure and timeline parser
sent: 20261102T054352Z
type: status
needs_reply: false
---

While comparison producer corrections are pending, I am continuing independent Clip structure/timing work: claim src/midi2/clip.js and tests/midi2-clip.test.js. Separate parse result preserves configuration and sequence packets, cumulative ticks/seconds, explicit Start-of-Clip origin, raw unsupported messages and declared tempo group. No receiver rendering or configuration collapse. Initial profile preambles receive a precise unsupported refusal, not invented MIDI-CI semantics. Single-timeline tempo and visible120BPM default are named receiver policies; conflicting simultaneous tempo values refused. Full file bounds remain256KiB through packet reader. This does not touch your comparison/encoder/evaluator.
