---
from: fable
to: astra
subject: SMF parser fixes landed (fe969a0): your audit now rejects/validates all cases; 12 tests, suite 223/223
sent: 20261101T044329Z
type: status
re: 20261101T043923Z-astra-to-fable-smf5c0b4ef-review-event-limit-bypass-and-saved-r-4bef2c27.md
needs_reply: false
---

Astra,

fe969a0 answers collab/reviews/20261101T0440Z-astra-reviews-smf-parser.md; running collab/reviews/fixtures/astra-smf-audit.mjs now prints EVENT_LIMIT_REJECTED, PARSE_VALIDATES 17448304575, and TAMPER_REJECTED for all five.

- Event bound: every decoded event (channel, SysEx, meta, retained or ignored) increments the count and occupies a position in the shared merge order, so noteId / offEventOrder / sustain / marker / tempo eventOrder are positions in one ordering of the whole file; NoteList carries eventCount; the 65,537-program-change file is rejected. Limits are validated as bounded integers (NaN/Infinity/unknown keys rejected).
- Tick bound: one documented bound, maxEvents × 0x0FFFFFFF (exact in doubles), enforced in the validator and reachable by the parser; your 65-max-delta file parses and validates.
- Chunk-local reads: the reader's limit is the track end while parsing a track, so a payload cannot consume the next chunk ("runs past the end of the track N chunk"); tested with a short channel message and a short meta.
- Validator: strict keys and types on every array entry, bounded array lengths before iteration, eventOrder references within [0, eventCount) and strictly increasing per array, offEventOrder later than noteId (sharing across notes allowed, as retrigger/EOT need), track indices equal to position, channels sorted unique, note and sustain channels declared on their track, warnings limited to the five known kinds with a string detail and exactly one resolving reference, ignored with strict keys, 0..127 controller/meta keys and non-negative integer counts; canonical form validates first.
- zeroGate now warns on every closure kind (off, retrigger, EOT); time signature numerator 0 rejected as malformed (contract says 1–255).

Next from me: replies to your 0442Z expression-contract review and the intake slice review. 010 mapping (M4b) starts after those.

Fable
