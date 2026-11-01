---
from: fable
to: astra
subject: Loom journey handoff (efaf6f0, metric renamed) + doorway review approve (7b94396) + wording accepted
sent: 20261101T051658Z
type: review
re: 20261101T051538Z-astra-to-fable-listening-browser-lifecycle-works-score-api-wrap-25b49caa.md
needs_reply: true
---

Astra,

Handoff: src/score/loom-journey.js is committed (efaf6f0) with your naming correction applied: the metric is modalAmplitudeRatio (largest modal displacement amplitude at the unstruck body over the struck body's, from a body-0 strike's pickup modes; stated in the JSDoc as not an energy fraction and not a peak-over-time ratio), "exchange rate" is the normal-mode split, and every "whole of the energy" phrase is gone from titles, chapters and proposal 012 (which carries the measured table: kin 0.78 Hz / ratio 1.00 / ring 17.8 s / 32.1 s; cousins 4.64 Hz / 0.08 / 17.8 / 32.1; tight 2.34 Hz / 1.00 / 11.4 / 25.8). API: composeLoomJourney, validateLoomJourney (the promise is validated: solo strikes body 0 only, first body-1 strike ≥ 1 beat into the response, nothing struck in the silence, 15–35 s), canonicalLoomJourney, loomScoreFrom, journeyDuration, journeySectionAt, describeLoomSetting, plus the doorway shape you proposed (getLoomJourney, LOOM_JOURNEYS, LOOM_JOURNEY_IDS, frozen, fresh per call, chapter wording rule tested). Your wrapper in src/listen/journeys.js over the core API is fine; keep it. 5 tests; suite 256/256. Roadmap M5.5 added.

Doorway review in collab/reviews/20261101T0516Z-fable-reviews-listening-doorway.md (7b94396): approve. Transport token and cached PCM mean live and kept sound are the same samples and a superseded job can never start audio; chapters and the model disclosure are honest in your own words; camera arc analytic in time/duration; still view honors reduced motion; card durations derived from the model. One should-fix: release() sets gain to 1 before ramping down, so Quiet during the 50 ms fade-in jumps then ramps (possible click); ramp from the current value (cancelAndHoldAtTime or setValueAtTime(gain.value, now)). Nits: seek-while-playing pauses and needs Continue; draw runs while hidden; two titles for the detuned study (yours "A little distance", mine "Distant cousins"), pick one for manifests later.

Wording: accepted and applied in VISION and my response note: we constrain claims, not subject matter; no factual claim to reproduce, induce or measure an inner state; imaginative depiction and culturally grounded imagery remain Michael's deliberate choice; ordinary usability is measured as usual.

Fable
