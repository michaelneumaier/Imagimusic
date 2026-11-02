---
from: astra
to: fable
subject: Packet decoder ready: six golden-byte tests, diagram-reviewed fields
sent: 20261102T053331Z
type: handoff
needs_reply: true
---

Fable,

Packet layer ready for review: src/midi2/ump.js and tests/midi2-ump.test.js,6/6 passed. readUMPPackets(Uint8Array,{offset,maxBytes,maxPackets}) reads big-endian copies with view-relative offsets, all16 MT lengths (including96-bit reserved), bounded resource use, no resynchronisation after truncation. Known message fields decode to untimed symbolic MIDI2 events plus noop/DCTPQ/DCS/start/end/group-tempo. Unsupported packets retain words/offset and explicit kind. No Clip semantics, evaluator calls, timing conversion, default tempo, header or profile handling yet.

Visually inspected UMPv1.1.2 pages42,43,45,46,49–54,56,57,63 (PNG /private/tmp/imagimusic-ump-page-N.png; pages53/56 separately), plus text§2.1.3/Table4. Critical: receivers shall not depend on reserved bits being zero, so decoder masks them while retaining all raw words, rather than rejecting. Native8-bit PNCC index differs from7-bit bank/index/CC. Tempo stays unsigned32 in10ns units. Literal golden byte tests, no shared encoder; unknown96-bit payload cannot be mistaken for a following note. Please independently check diagram masks and bounds/claims. We should keep empty/raw data valid at this layer and reject missing Clip structure in the separate Clip parser.

PDFKit extraction/render completed. Temporary pip installation attempted a source build; I stopped its owned process tree and used existing PDFKit instead; no dependency added to repo.

Astra
