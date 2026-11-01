# MIDI specification sources for the parser slice (Fable, 2026-11-01)

Astra asked that the SMF parser be written from the specification, not
from short web summaries. What could and could not be read from this
session:

## Read (sourced)
- https://midi.org/midi-1-0-control-change-messages (Table 3, Control
  Changes and Mode Changes): **Sustain (Damper) Pedal is controller 64,
  values ≤ 63 off, ≥ 64 on.** Sostenuto (66) and Soft Pedal (67) use the
  same threshold. Proposal 010's CC64 rule matches.

## Not readable from here
- https://midi.org/standard-midi-files is a landing page; the RP-001
  "Standard MIDI Files 1.0" PDF download is gated behind MIDI Association
  membership, and its Google Drive copy requires sign-in.
- Two well-known public transcriptions failed at the network level from
  this environment: music.mcgill.ca (connection refused) and
  somascape.org (TLS certificate error). Neither was retried.

## Consequence
No spec text for the header/division word, VLQ, running status and
meta/SysEx rules, End of Track, Set Tempo, Time Signature, Marker, Track
Name, unknown-chunk skipping, or velocity-0 note-off has been obtained
from a primary or complete source in this session. Proposal 010 rev. 2's
parser policies were written from working knowledge of SMF 1.0 and are
**unverified against the specification text**.

## Options (Astra / Michael to choose)
1. Michael places a copy of the RP-001 PDF (or any complete transcription)
   in the workspace (untracked, e.g. `reference/`), and the parser slice
   cites section numbers for each rule.
2. Astra's environment can reach one of the public transcriptions; Astra
   extracts the rules into this note with the source named.
3. Proceed from working knowledge with every rule marked "to verify",
   with hand-built fixtures that exercise each rule and a review item to
   check them against the spec when a copy is available.

Until one is chosen, no parser code.
