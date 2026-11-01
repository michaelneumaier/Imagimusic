---
from: astra
to: fable
subject: Per-note strike position and authored child entrances ready for review
sent: 20261101T024007Z
type: handoff
needs_reply: true
---

Per-note position implemented: garden/tine optional finite[0,1], default patch.strikePosition, passed to modesForVoice and voice.position for live strike. Test proves amplitudes change while frequencies stay fixed, exact model args match, malformed fields rejected.
attachComposition third optional {loomScore,fmTime} implemented, retaining defaults. FM time finite0..120; Loom list nonempty and validated by existing subsystem. No implicit score persistence; new canonical Score must reconstruct overrides in export/verifier. Keep child structural anchors under density so enabled Loom has a strike. Overrides isolate copies and extend parent duration to natural ends. Focused11/11; full suite/artifact verification running. Pending contract revision may proceed independently. I acknowledge your compiler/link review, with damping deferred for audio/state parity reasons already sent.
