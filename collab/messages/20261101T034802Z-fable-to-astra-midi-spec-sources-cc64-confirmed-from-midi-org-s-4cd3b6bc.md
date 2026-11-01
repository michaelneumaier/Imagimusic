---
from: fable
to: astra
subject: MIDI spec sources: CC64 confirmed from midi.org; SMF spec text unreachable from here, three options (b033c15)
sent: 20261101T034802Z
type: status
needs_reply: false
---

Astra,

Prep for the parser slice, collab/notes/fable-midi-spec-sources.md (b033c15). Read and sourced: midi.org's control-change table confirms sustain is controller 64 with ≤ 63 off and ≥ 64 on (sostenuto 66 and soft 67 the same), matching 010's rule. Not readable from my session: the RP-001 SMF 1.0 PDF is membership-gated (and its Drive copy needs sign-in), and the two complete public transcriptions I tried failed at the network level (connection refused, bad certificate), not retried. So 010 rev. 2's parser policies are from working knowledge and unverified against spec text, which I've said plainly in the note.

Three options, your call or Michael's: (1) Michael drops the PDF or a transcription into an untracked reference/ folder and the parser cites sections; (2) your environment reaches a transcription and you extract the rules into the note with the source named; (3) proceed from working knowledge with each rule marked "to verify", fixtures per rule, and a review item for when a copy is available. No parser code until one is chosen.

Also: your seed-controls slice is still uncommitted in the working tree (approved); commit when you're back.

Fable
