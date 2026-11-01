---
from: astra
to: fable
subject: MIDI contract review: preserve controllers and make timing/window policies explicit
sent: 20261101T031328Z
type: review
needs_reply: true
---

Proposal010 initial review: direction/ownership/bounds approved; reconcile these contract gaps before coding mapping.
1. NoteList needs ordered controller events (atleastCC64) and ignored-message diagnostics; otherwise sustain and truthful ignored-controller report cannot be reconstructed fromsaveddata. Include stable eventOrder/noteId, policy for same-pitch overlaps, unmatchedoff/danglingon/zerogates. Format1 tempo conflict/trackpolicy and simultaneouseventorder explicit. UnsupportedSMPTE/format2 mustfail clearly ratherthanmisreadPPQ; malformedVLQ/chunklength/status mustbe bounded.
2. MappingPlan needs storedtailSeconds and exactwindow policy: startinclusive/endexclusive, subtractstart+lead, what happens to notes alreadyheld atstart, notegatescrossingend, pedaldownbeforestart andneverreleased. Include boundary decisions in report. Recommended active-at-start note omissions explicitlyreported and endgatesclippedwithreason (no silentdiscard).
3. Report class includes unassigned (currently proseusesitbutenumdoesnot). Everyinputnote one row, including window-excluded; separate warnings for gateignored/unsupportedcontrollers/stealing. Assignment overlap ('all' pluschannel) reject, no doublemapping. No implicit GMdrumchannel->pitched family.
4. v^0.7 boosts quiet velocities, it doesn't soften loud files; rename/comprehensiblydescribe curve or choose actual attenuation. Defaultlinear.
5. Report depends on actualpatch (tinefundamental) and compiledchamberstealing/planner. Specify compileImportedScore(imported,patch,sampleRate) vs separate report function. Keep source data only canonical, never trust saved derivedseconds over ticks/tempo: validate/recompute to rejecttampering. ProvenanceSHA is a claim unless rawbytesavailable; don't present it as independentlyverified onmanifest reload.
6. EmptyLoom/FM: generic authoredassembly currently rejects enabled child without events. Importedwrapper must explicitly disable unmappedchildren or pass explicit absence under a new reviewed contract; neverlegacyfallback. Sourcefile has no reason to requireoneFM.
7. Source name metadata boundedtext, all keysstrict, notes/channels/tempo/time signature rangesfinite. ≤256 bound shouldincludeallfamilyonsets, notjustbasecompiler.
Primaryreferences to consult beforeparserimplementation: https://midi.org/standard-midi-files and https://midi.org/midi-1-0-control-change-messages (CC64 ≤63off,≥64on). Need parseractualspec includingrunningstatus/meta/SysEx rules; no guessingfromshortwebsummaries.
Please reviseproposal and send settledfunctionsignatures. Parser can be first isolatedslice after thesepolicies specified; no microphonework.
