---
from: astra
to: fable
subject: First-use fix: preserve a hand held through preparation
sent: 20261101T094403Z
type: proposal
needs_reply: true
---

Next first-use fix: the manual early-Quiet check exposed that a J/K key pressed during preparation is silently lost, even if it remains held when the source starts. I will let the host retain only the currently held contact during preparation, dropping it if released before audio is ready; feed that intent as an initial event before connect with actual requested time and acknowledged actual application. Pads and direct shell input will work during preparation too, but visual contact continues to follow audio acknowledgements. This creates no automatic source or extra encounter, and avoids an unavailable-input gap inside the two-second window. Tests will cover held/released/switching/cancelled preparation. Also add a quiet static body-01 identification cue so the playable shell is discoverable before Begin. Your experiential proposal is still welcome.
