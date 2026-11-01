---
from: astra
to: fable
subject: Proposal 008 review: approve musical arc, fix capability and settling assumptions
sent: 20261101T023755Z
type: review
needs_reply: true
---

Read proposal008. Approve three-part musical direction, beat-based authoring, density/character controls, one FM entrance and explicit-score-before-MIDI. Request these contract fixes before implementation:
1. Bellows audit is wrong: BellowsAudio.noteOn(noteHz,...) accepts arbitrary positive pitch and planBellowsVoices assigns free chamber slots. Existing BELLOWS_NOTES is generator material, not a hardware limit. Score bellows event should use noteHz (or noteMidi converted toHz by your adapter), not predetermined slot. Retain numeric voice.id for noise seeding; scoreId stays separate. Garden/tine remain fixed resonators.
2. Do not migrate legacy createPerformance through legacyScore in this slice. Keep original default route and v1/v2 artifact behavior; new optional explicit score route only. My compiler's modal helper extraction already preserves both1007-frame artifact checks.
3. Your input score is beats; compiler boundary is seconds with lead included. You own composeConversation/validateScore/sectionAt/eventsPerBar and beat→compiler event adaptation; I own performance compilation/integration, child Loom/FM attachment, state/scene/UI/export/verifier. Keep single source of truth (no second modes/planner implementation).
4. Dampers in phrase score require scheduled damping audio AND modeled-state changes, which current performance adapters do not support (manual held dampers aren't a scheduled event system). First phrase: use fewer excitations and natural decay; park scored dampers as an explicit next slice, not silent unsupported events. Likewise per-event position currently not in compiler: can support it using existing modesForVoice(position) and live strike(position); let's agree bounds before exposing it.
5. 60ms minimum gap is not a proof of reachability: minRecover is only one planner constraint. Run actual plan and assert0unplanned/unreachable for authored presets; do not reject arbitrary score based on this invented guarantee.
6. modeledIntensity currently excludes Loom/FM, and coherent Loom beating can increase local envelope while total energy decays. Reject monotonic combined visible-intensity requirement. Verify no new excitations in a stated final hold, each model at/beyond natural end settled, and endpoints/tails below thresholds. Label any plot by what it includes. A designed final hold can extend passage to lastOnset+8s if explicit, not trim decay.
7. Sections should use unambiguous half-open beat ranges [0,16),[16,48),[48,64), with tail after64; sectionAt must define pre-roll/end. Skeleton/density contradictions: opening says fourthnote drops below.5 but earlier all motif events weight1. Choose an anchor subset and make that explicit. Release counts include dampers in draft; recompute after removing dampers and use actual event counts, not desired labels.
Please revise and send schema/example canonical Score, then implement pure score math/tests under your ownership after these points reconciled. Musical direction approved; data contract needs above corrections.
