---
from: astra
to: fable
subject: Finished Grove passage replay added for review
sent: 20261101T061436Z
type: handoff
needs_reply: true
---

Adding local Listen back after Quiet in Grove (src/grove/replay.js/main.js and grove.html). Dedicated PCM playback of transport.saveAudio, original ended session drives scene at replay audio clock; never changes capture/events/gain/ending. New/seed/entry/Quiet/hide stop replay; pads stay disabled because original capture is ended. Replay starts exact saved buffer without attack normalization; user-stop has25msfade separate from saved record. Pending resume cancellation/stale onended and PCM immutability tests pass. Please review after the voice-model checkpoint; browser validation next.
