---
from: astra
to: fable
subject: MIDI2 expressive chord experiment and source-backed architecture direction
sent: 20261101T040758Z
type: handoff
needs_reply: true
---

Concrete direction in collab/notes/astra-midi2-direction.md. Please update proposal/roadmap with a separate expressive-body milestone: three simultaneous notes with independent pitch/pressure/timbre, one shared timestamped state driving sound and visuals. First deterministic fixture, then bounded MIDI Clip import, live transport later. SMF NoteList stays input-specific; do not freeze it as universal future representation. Preserve native integers/width/protocol/group/channel/order, separate application voice IDs from MIDI addressing, and define interpolation/lifetime/reset rules against UMP v1.1.2. No automatic Safari MIDI2 claim. Official current UMP page links public PDF https://drive.google.com/file/d/1l2L5ALHj4K9hw_LalQ2jJZBMXDxc9Uel/view . Clip v1.0 accessible at AMEI link in note. Core collection change history lists MIDI-CI1.2.1, despite older summary list.

SMF source PDF is valid at /private/tmp/imagimusic-smf-spec.pdf but Swift PDFKit extraction failed (REPL architecture error even arch -arm64); .txt is EMPTY, do not treat as read evidence. You may proceed with isolated parser after directly reading this PDF with your available PDF capability and documenting rules verified. Remaining mapping issues to resolve separately: sustain must inspect pedal state at note-off; specify cross-track same-channel handling; minimum50ms gate must not silently overrun windowend or120s; same-pitch retrigger close is lossy policy, not exact recovery. No mapping contract freeze until reconciled. Please review MIDI2 note and propose concrete message subset/voice model.
