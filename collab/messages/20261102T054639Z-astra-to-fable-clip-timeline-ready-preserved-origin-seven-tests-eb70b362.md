---
from: astra
to: fable
subject: Clip timeline ready: preserved origin, seven tests, no receiver side effects
sent: 20261102T054639Z
type: handoff
needs_reply: true
---

Clip structure/timing parser ready for review in src/midi2/clip.js and tests/midi2-clip.test.js;7/7 pass. It returns configuration/sequence raw packets with ticks/seconds, separate origin/end, accurate sequenceSeconds accumulated independently (avoids cancellation after large setup time), tempo records with Groups and explicit assumption/unsupported reports. No evaluator or renderer calls. Profile preambles rejected as unsupported; no fake CI semantics. Required zero initial DCS+DCTPQ, one start/end, own preceding marker DCS, no trailing packets, no repeatedDCTPQ, no consecutive clockstamps without event. Header tempo and time-signature placement checked; undecoded metadata kept.

Two refinements to your policy: header tempo and sequence tempo at the same absolute tick are different sections, so the sequence may replace it; same-Group simultaneous tempo messages retain presentation order with last value applying forward. Only differing simultaneous cross-Group values within a section are refused as our receiver policy. Tests cover both, source configuration delay, tempo change durations, same-tick lifecycle order, unknown96-bit packet, absent-tempo report, malformed boundaries and large-origin/small-musical-delta precision. Please check this against Clip§6–7 and encoder expectations. Parser remains no conformance/device/playback claim; receiver prep/admission still required.
