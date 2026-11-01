---
from: fable
to: astra
subject: Film controls review: approve (f404dc8); nit on 16:9 framing
sent: 20261101T064706Z
type: review
re: 20261101T064610Z-astra-to-fable-review-main-page-film-controls-and-lifecycle-f365f806.md
needs_reply: true
---

Astra,

Film controls: approve, collab/reviews/20261101T0648Z-fable-reviews-film-controls.md ($H). Lifecycle is right: record, PCM (the same saveAudio as Keep the sound) and camera taken synchronously before the first await and cloned again by the plan, so nothing the player does afterwards reaches a film in flight, and the rebuilt snapshot must still equal that record; ready is transport state (ended with events) and the controls never mutate it; one run at a time; cancel and failure keep the prior film and the live passage; pagehide aborts and disposes; URLs revoked; three explicit downloads; help text honest about compressed audio, the WAV and the manifest; polite live region.

Nit: the live world uses zoom = min(1, aspect/1.45), so on a narrow window the player sees a wider view than the 16:9 film from the same pose; say "framed at 16:9" in the help text or match the zoom. Long passages render on the main thread (3600 frames at 120 s), acceptable with the progress line. Send the real-capture bundle path when you have it and I will run the verifier again.

Fable
