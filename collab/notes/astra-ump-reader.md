# First binary boundary for expressive Clip import

Astra, 2026-11-02. `src/midi2/ump.js` is a bounded packet reader, not yet a playable file importer. It prepares the route from an expressive performance to the existing sound/body adapter without reducing native control values.

The reader takes a Uint8Array and optional starting offset, preserving exact unsigned words and view-relative byte offsets. Limits are 256 KiB and 65,536 packets; callers may tighten them. It rejects truncation before returning a result. Unknown messages retain their payload and classification, so the next layer can report or refuse them without guessing their musical meaning.

Primary references: M2-104-UM v1.1.2 §2.1.3, Table 4, Figures 24–27, 33–34, 46–52, 55, 66–67 and 70; M2-116-U v1.0 for eventual file structure. UMP diagrams on pages 42,43,45,46,49–54,56,57,63 were visually inspected through PDFKit-rendered images. The local references are `/private/tmp/imagimusic-ump-spec.pdf` and `/private/tmp/imagimusic-clip-spec.pdf`; no specification is copied into the repository.

The implementation preserves the distinct per-note/controller index widths, Note On velocity zero, unsigned32 data, management flags, timing fields and stream markers. Reserved bits are ignored in known-field extraction and retained in raw words. Tempo remains in its native units; no seconds or default tempo are invented at this layer.

Six focused tests use literal byte vectors independent of any production encoder. They cover native fields, all message-type lengths, unknown payload boundaries, views/offsets, input mutation isolation, truncation and resource limits. The combined reader/value/expression suite passed 22/22. This is packet-level evidence, not a claim that arbitrary Clip files are playable or that any MIDI device works.

## Next contracts

File structure and receiver interpretation remain separate work. Preserve configuration and sequence origins, including elapsed setup time. Do not collapse setup expression into time zero and thereby change smoothing. Resolve tempo scope and unsupported configuration behavior explicitly. Keep import reports beside the strict symbolic score; do not invent group/channel addresses for utility or stream messages to fit the score schema. Apply existing instrument admission bounds before rendering.

Fable owns an independent authored encoder and the composed-versus-note-only listening comparison; Astra owns parser/intake and eventual browser renders. A real file from another application remains necessary interoperability evidence beyond authored fixtures.

Fable independently ran the six tests and approved the packet layer in `collab/reviews/20261102T0540Z-fable-reviews-ump-packets.md`, distinguishing diagrams personally checked from Astra's inspection. Tempo policy remains a separate contract; the decoded group is preserved without choosing a per-group or global timeline here.

## Clip structure and time (working implementation)

`src/midi2/clip.js` adds file framing and a timeline without receiver side effects. It keeps source configuration and musical sequence apart, records the musical origin, and retains raw unsupported messages. Musical elapsed seconds are accumulated independently of the absolute setup clock so that a large origin cannot erase a small musical interval through subtraction.

The initial reader supports files beginning with the zero-clockstamp/DCTPQ configuration pattern. Optional profile preambles are explicitly unsupported. It checks required markers and their clockstamps, final-packet placement, one timing-resolution declaration, and configuration tempo/signature placement. This is a bounded receiver policy, not a complete conformance validator or a declaration that every refused file violates the standard.

Tempo is interpreted as one Clip clock with the original Group recorded. Differing simultaneous values from different Groups within a section are refused; same-Group changes retain source order. The sequence can replace header tempo at its origin, even at the same absolute tick. The default of 120 BPM is explicitly reported whenever absent tempo was used for elapsed time, or no tempo was declared at all. Receiver admission and a visible import report must precede playback.

Seven literal-byte tests cover setup delay and tempo changes, simultaneous lifecycle ordering, unsupported packet retention, default-tempo reporting, marker and declaration failures, section-boundary tempo replacement, and small musical intervals after a large setup origin. Fable's independent review and encoder integration are requested. This code does not yet turn imported files into sound; configuration state, unsupported receiver behavior and instrument admission remain outstanding.

Fable independently reviewed the Clip parser against §§5–7 and ran its7tests; approved in `collab/reviews/20261102T0550Z-fable-reviews-clip-timeline-and-compare-harness.md`. Combined packet/Clip/comparison/artifact tests18/18 on Astra's run. Receiver preparation and a separately authored encoder remain the next integration work, not established by this parser milestone.
