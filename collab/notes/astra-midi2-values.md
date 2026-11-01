# MIDI 2.0 numeric boundary

Astra, 2026-11-01. Implemented in `src/midi2/values.js`; not wired into playback
yet. `node --test tests/midi2-values.test.js`: four tests passed.

Source: MIDI Association M2-104-UM v1.1.2, 2023-10-27, retrieved from the
[official specification page](https://midi.org/universal-midi-packet-ump-and-midi-2-0-protocol-specification).
Local PDF `/private/tmp/imagimusic-ump-spec.pdf`, PDFKit text extraction
`/private/tmp/imagimusic-ump-spec.txt`. Read sections 7.4.2–5, 7.4.11–15 and
Appendices A–C for this slice.

The helpers validate native unsigned integers, derive linear unit values, decode
Q7.25/Q7.9 pitch and convert absolute pitch to Hz. Raw integers must remain in
the future source event model. Doubles retain adjacent controller values that
a 7-bit conversion would collapse. Tests include values above the signed-int32
boundary, A440/octave anchors, fractional pitches and malformed input.

Per-note pitch bend uses a declared receiver mapping: each bipolar half scales
to the same positive/negative range, with an exact neutral point. Sensitivity
is the Q7.25 range from RPN 0/7; it must not be confused with the differently
encoded channel bend sensitivity. Linear velocity/controller normalization is
our instrument mapping, not a standardized loudness curve.

Rules handed to Fable for the event model:

- MIDI 2.0 zero-velocity Note On remains Note On (7.4.2).
- Same-note-number voices share per-note controllers unless detached (Appendix C).
- Detach holds existing notes at their current controller values; combined
  detach/reset detaches first (7.4.5).
- Attribute pitch overrides other base pitch for that note only (7.4.15.3).
- CC121 does not reset the newly defined per-note registered/assignable
  controllers or per-note pitch bend (Appendix B).

Integration finding: existing bellows synthesis exposes per-voice gain, cutoff
and pitch parameters, making it a useful first adapter. Its current scheduler
still consumes the existing dynamics model. The FM study's closed-form phase
assumes a fixed carrier and ratio, so continuous expression would require a
new phase solution or integration method. No dynamic FM support is implied.

Follow-up: read section7.4.7.1 (p54) and D.1.4 (p96) in the same primary document. Added `channelBendSensitivityToHcu`: RPN0/0 takes top7bits as HCUs and next7 as cents, ignoring the bottom18; our receiver rejects cents100–127 rather than inventing a meaning. Example raw `(2*2^25)+(50*2^18)` means2.50HCUs, not the Q7.25 value2.390625. Added `sustain32IsOn`: MIDI1 CC64 threshold64 combined with the default downscaling rule (discard25lowbits) yields the exact uint32 midpoint0x80000000. This is the supported switch interpretation, not continuous half-pedaling. Six numeric tests now pass, including both threshold neighbors, ignored lowbits and signed-boundary values.
