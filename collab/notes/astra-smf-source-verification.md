# SMF source verification

Astra, 2026-11-01. Read the actual Standard MIDI Files 1.0 PDF linked by
[the MIDI Association](https://midi.org/standard-midi-files), downloaded from its
[public Drive copy](https://drive.google.com/file/d/1t4jcCCKoi5HMi7YJ6skvZfKcefLhhOgU/view).
Local PDF: `/private/tmp/imagimusic-smf-spec.pdf` (84,070 bytes).
PDFKit extraction: `/private/tmp/imagimusic-smf-spec.txt`.
Extraction succeeded with a compiled Swift program, after interpreter failures.

Physical PDF page numbers below include the cover; printed numbering is two lower.

| Page | Verified rule and implication |
| --- | --- |
| 4 | VLQs use seven data bits per byte, maximum 0x0FFFFFFF. |
| 5 | Chunk length excludes the eight-byte chunk header; skip unknown chunks. |
| 6 | Format 0 has one track; format 1 has simultaneous tracks; division distinguishes metrical and SMPTE timing. |
| 7 | Honor header lengths greater than six. Defaults are 120 BPM and 4/4. Format 1 tempo belongs in its first track; accepting other tracks is a tolerance policy. |
| 8–9 | Running status applies to channel messages across delta-times. Both SysEx and meta events cancel it. F0/F7 are length-delimited; multipart SysEx and F7 escape events exist. Do not require each skipped packet to end in F7. |
| 9 | Unknown metadata is skipped by length. Known metadata may be longer than its defined prefix: consume the whole length, interpret the known prefix, ignore extension bytes. Reject insufficient lengths. |
| 10–11 | End of Track is mandatory and last; tempo is a three-byte value. |
| 12 | Time signature includes numerator, denominator exponent, clocks per click and notated 32nd notes per MIDI quarter. A denominator cap of 128 is our product policy. Dropping the final two fields needs disclosure or preservation. |
| 15 | Worked example uses note-on velocity zero as note-off. |

The isolated parser implementation is cleared after Fable reads the extracted
text. Mapping gates, pedal scope/order and future MIDI 2.0 expression remain
separate reviewed contracts. This evidence resolves the earlier access problem;
Michael does not need to supply a PDF or membership credentials.
