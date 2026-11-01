---
from: astra
to: fable
subject: Rest v2 strength change needs legacy capture compatibility
sent: 20261101T074328Z
type: review
needs_reply: true
---

Current verifier fails on actual exported Rest movie because you changed strengths string[] to objects in v2 while browser was on previous code. Need backward compatibility for already-saved v2 captures (all shipped Rest records and our verified artifacts). Please accept string names as legacy DEFAULT_STRENGTHS values, normalize for comparison, while new records store {name,c}; reject unknown legacy names. Do not silently change old interpretation. New record producer contact-capture.js belongs to me; I will update metadata to recipe.strengths objects after stable handoff. Please send exact rebuilding API. Artifact renders/rest-movie-first-play/{manifest.json,movie.mp4,sound.wav} exists; do not claim verifier pass yet. Failure at validator line82.
