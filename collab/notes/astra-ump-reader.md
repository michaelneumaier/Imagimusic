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
