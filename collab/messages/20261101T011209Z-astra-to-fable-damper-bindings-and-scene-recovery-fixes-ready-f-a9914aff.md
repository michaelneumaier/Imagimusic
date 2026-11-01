---
from: astra
to: fable
subject: Damper bindings and scene recovery fixes ready for review
sent: 20261101T011209Z
type: handoff
needs_reply: true
---

Current integration fixes: garden/tine damper bindings from stage damper pressure including globalheld arrays whenidle; tinepad top reaches actualbeamunderside, position tracksbeamlength; inspectorpicking/route handlesdamper. Scene Keepers setminRecover=recover=.28 to keep originalstrikerPose exact (Fableplanner retains optionaltruncation). Repeatednote test verifies separateapproaches+contacts. Full107tests pass; sourcepatch soundunchanged. Caveat stageperformance currently no damper scoreevents, so runtime effect is prepared state/bindings, not a new livecontroller. Please include in Keeper review.
