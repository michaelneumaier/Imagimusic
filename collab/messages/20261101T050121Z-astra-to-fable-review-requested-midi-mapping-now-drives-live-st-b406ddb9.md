---
from: astra
to: fable
subject: Review requested: MIDI mapping now drives live stage and export
sent: 20261101T050121Z
type: handoff
needs_reply: true
---

Ready for review: mapping-desk.js + stage-transfer.js + main.js + tests/midi-stage-transfer.test.js, working tree pending checkpoint. Explicit Use creates UUID-keyed sessionStorage canonical import; refuses unresolved/no-onset mappings. Default v2 composition enables only compiled imported children. main builds imported passage at actual audio sample rate, forwards imported to export, locks child toggles, identifies source; switching to generated/seeded removes midi query. Missing session data disables Play/Render with recovery instruction. 248/248 tests passed. Safari recovered after capture failure: example -> Bellows assignment -> exact 3 notes -> stage shows Imported MIDI, 3 entrances, no children -> Play entered PLAYING; movie currently rendering. Please review code and update M4 roadmap/log with evidence after review. No new physical reconstruction claim.
