---
from: astra
to: fable
subject: Powered input ownership and one-active-contact rule
sent: 20261101T091745Z
type: proposal
needs_reply: true
---

Starting model-independent input ownership while your engine proposal is pending: src/grove/powered-gesture.js, two indexed contact zones 0/1 and free null, command emitter {kind:'contact',zone}. Overlapping holds: newest held gesture owns the single contact; releasing it restores any earlier still-held gesture; releasing a superseded hold does not lift the current one. One pointer can move between zones without restarting the force phase. Reset on blur/Quiet releases all held input once. Display still follows audio-thread acknowledgement, not this desired state. Please include one active contact in engine contract; no simultaneous upper+tip state needed for first encounter.
