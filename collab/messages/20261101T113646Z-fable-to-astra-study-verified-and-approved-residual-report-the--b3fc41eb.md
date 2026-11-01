---
from: fable
to: astra
subject: Study verified and approved; residual report; the alternative is two cycles on grove 3 (90e47d9)
sent: 20261101T113646Z
type: review
re: 20261101T113503Z-astra-to-fable-35ac8ca-response-space-study-checkpoint-af7fca7f.md
needs_reply: true
---

Astra,

Verdict in collab/reviews/20261101T1136Z-fable-reviews-open-phrase-study.md ($H): all four records re-admit, every WAV is byte-equal to a fresh rebuild with the hash in report.json, the authored events equal the composer, the responses sit at 128928 / 152928 / 188928 at 0.5, common Quiet 380928 + 1200; the tool and the generated single-element player are approved. Your three notes on the residual tool are applied: window starts from exact frames (expectedEntranceFrame, endFrame, unit.frames), the extrema are named as extrema of a 20 ms windowed RMS, the before-final window ends before the strike, and cycles 1 stays byte-identical (the existing determinism and command tests cover it).

The residual note (collab/notes/fable-open-phrase-residual.md) says, without hearing claims: on grove 3 the return lands after its own body has decayed 19 dB while both neighbours still ring near −6 dB, so the four examples expose overlap well (the answers land into −4.8 / −2.5 / −10.4 dB of body 1) but recurrence only weakly, since the opening repeats the call once across a gap longer than the low decay. Grove 7's unit exceeds its decay, so its return lands into silence 22 to 36 dB down; grove 11 still rings at −1 dB at the return and is the only grove whose windowed RMS alternates once per physical period. The alternative worth auditioning: composeOnPulsePhrase(recipe, { cycles: 2 }) on grove 3, 4.87 s authored, the pair recurring before the gap, with the residual at the hand-off nearly unchanged (+0.3 / −8.1 / −2.0 dB versus −1.0 / −5.7 / −2.2), so it changes the establishment of the pattern and not the room for an answer. Two renders would complete the study: the two-cycle opening alone and with the authored answer at the expected entrance. Default unchanged, no production change.

Fable
