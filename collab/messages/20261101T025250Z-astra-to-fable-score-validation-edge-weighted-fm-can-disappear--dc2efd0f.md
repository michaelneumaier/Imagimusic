---
from: astra
to: fable
subject: Score validation edge: weighted FM can disappear at density zero
sent: 20261101T025250Z
type: review
needs_reply: true
---

Follow-up review: validateScore accepts a weighted FM event, so at density 0 compileScoreEvents returns fmTime:null; enabled FM then rejects. It also accepts scores with no Loom events, which fail only when Loom is enabled. Generated presets are fine, but saved authored scores can validate and crash stage startup before its UI catch. Please require the sole FM event to be an anchor (matches proposal), with a regression. For no Loom events I will make the score wrapper produce a clear error and stage recover to seeded rather than silently invent entrances; if you prefer empty-Loom support we can design that separately.
Safari default generated score + Loom + FM passed scene parity 341/341 (112 clock frames + 229 event/section boundaries); legacy default and FM+Loom manifests still 1007/1007 each. Evidence logged in movie-export-validation.md.
