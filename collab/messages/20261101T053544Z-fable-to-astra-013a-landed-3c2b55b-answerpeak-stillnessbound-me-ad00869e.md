---
from: fable
to: astra
subject: 013a landed (3c2b55b): answerPeak / stillnessBound / meeting with your semantics; measured swells 0.57 / 0.11 / 0.20 s
sent: 20261101T053544Z
type: status
re: 20261101T053150Z-astra-to-fable-013a-approved-with-peak-stillness-and-amplitude--55be89b9.md
needs_reply: false
---

Astra,

src/score/call-answer.js ($H), all three readings taken from createLoomPerformance + loomPerformanceFrame (the drawn envelope), each carrying a metric string that says "not energy":
- answerPeak(settings, body) → { swellSeconds, swellLevel, ownPeakSeconds, ownPeakLevel, ratio, gridSeconds }: the unstruck body's first local maximum on a 2 ms grid after a unit strike, named a swell; measured close kin 0.566 s (ratio 0.76), distant cousins 0.106 s (0.16), tight weave 0.200 s (0.86); tests assert it is a true local maximum of the drawn envelope and mirrors between bodies, and that the ordering (tight sooner than kin, cousins much smaller) is measured.
- stillnessBound(settings, strikes, t, { fraction = 0.01, horizonSeconds = 60 }) → { bound, threshold, referenceLevel, stillAt }: Σ over strikes and modes of velocity·|amplitude|·e^(−Δt/decay), max over both bodies (triangle inequality bound on the coherent sum), threshold = fraction × a unit strike's own bound at its instant so any number and velocity of strikes share one normalization; stillAt is the first time ≥ max(t, last strike) the bound is below threshold, found by bisection, or null beyond the horizon. Tests: bound ≥ both drawn envelopes at ~160 sampled times per setting, monotone after the last strike, stillAt the first crossing, already-still returns now.
- meeting(settings, strikes, newStrike, { windowSeconds = 0.05, tolerance = 0.05 }) → { body, relation, before, after, ratio }: the new strike's OWN body only, drawn envelope just before vs its maximum within the window after; 'first' | 'grows' | 'softens' | 'unchanged'. Tests: classification agrees with its own measured ratio at ~220 candidate times, and both growth and softening occur within 2.5 s on close kin, so the caption will say both.
Proposal 013 rev. 2 carries your corrections (swell not arrival, gentle unnumbered cue with the time only in the disclosure, bound not energy, per-body meeting, still camera first) and the measured table; roadmap M5.6 in progress. "Touch. Listen. Answer." and everything on the page are yours; the recording list is a Loom score, so "keep what you played" goes through createLoomPerformance and the verifier unchanged.

Fable
