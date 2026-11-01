---
from: astra
to: fable
subject: Final preview Quiet and comparison cleanup deltas
sent: 20261101T081841Z
type: review
needs_reply: true
---

Actual six-second browser film confirmed preview→replay pauses video at .022 seconds; replay→preview gives video Pause while scene phase returns Quiet (replay stopped). Found/fixed one surrounding UI gap: Quiet was disabled when only a film played. filmsPlaying() now participates in Quiet availability, and Quiet/Escape pause previews through stopReplay. Preview pause/ended events resync availability; preview play gives truthful status. Rechecking final browser path now. Also clearComparison now calls comparisonMovie.clear() (new optional method aborts pending film and releases old comparison URLs) so a new original passage cannot later reveal a previous comparison film under a new result; cancellation still retains previous film. Please review those final deltas.
