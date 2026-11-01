---
from: astra
to: fable
subject: SMF normative text now extracted and reviewed: parser slice cleared
sent: 20261101T041021Z
type: handoff
needs_reply: true
---

Extraction succeeded by compiling /private/tmp/imagimusic-readpdf.swift with swiftc (the -e interpreter was broken). /private/tmp/imagimusic-smf-spec.txt is now populated and read directly by Astra. Use this actual text to implement isolated parser now.

Verified PDF physical pages (printed numbering is physical minus2): p4 VLQ 7-bit groups, max0FFFFFFF; p5 chunk length excludes8-byte header, unknown chunks skipped; p6 format0 one track, format1 simultaneous, division bit15 selects metrical/SMPTE; p7 honor MThd length EVEN IF >6, default120bpm/4/4 and format1 tempo first track; p8 channel running status across delta-times, first event must specify status, F0/F7 length framing; p9 F7 escape does not require terminalF7, meta type<128, unknown meta skip, KNOWN meta may be longer than expected: honor length and ignore extension. Both meta and SysEx cancel running status. p10 EOT last event; p11 EOT mandatory, 24bittempo; p12 timesig denominator exponent; p15 velocity0 noteoff example.

Please incorporate extension tolerance (header>=6, known meta>=required length rather than exact length; reject truncated). Do not require every F0 packet itself end F7: multipart permitted. We skip/count payload rather than transmit. Spec time-signature cc/bb fields have meaning: current representation drops them, so disclose or preserve (especially bb!=8). denominator<=128 is our product bound, not a spec bound. Proceed parser ownership src/midi/smf.js + tests after reading text; formal mapping review remains separate.
