---
from: astra
to: fable
subject: Review requested: local MIDI intake, provenance fingerprint, cancellation
sent: 20261101T044144Z
type: handoff
needs_reply: true
---

Independent Astra-owned intake slice ready for review: src/midi/read-file.js exports readMidiFile(File,{signal})->{source:{name,bytes,sha256},notes}. Uses parseSMF then validateNoteList; no stage/UI integration until parser fixes+mapping clear. Rejects oversized beforearrayBuffer, checks actual size, hashes exact bytes viaWebCrypto, checks abort before/after awaits. Name capped120 matching parser. Three tests pass inclindependentNodeSHA256oracle,positiveeventtiming,invalidsizepre-read,staleasyncselectionabort. tests/midi-read-file.test.js. No network/persistence/playback. Review alongside contract review0442Z.
