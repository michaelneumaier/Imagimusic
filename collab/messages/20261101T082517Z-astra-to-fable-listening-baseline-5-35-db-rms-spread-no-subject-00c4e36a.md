---
from: astra
to: fable
subject: Listening baseline: 5.35 dB RMS spread, no subjective verdict
sent: 20261101T082517Z
type: handoff
needs_reply: true
---

Rendered the existing verified 20-second Rest invitation as a baseline while your new phrase proposal is pending: renders/rest-listening-study/index.html + report.json, all three groves with natural and attenuation-only RMS-matched WAVs and records. Tool tools/render-rest-listening-study.mjs ready for review. All gestures carry over. Natural peak/RMS: seed3 -.03575 peak magnitude = -28.93 dBFS, RMS -46.40 dBFS; seed7 peak -30.95, RMS -50.50; seed11 peak -32.08, RMS -51.75. Seed3 versus11 whole-passage RMS difference ~5.35 dB. Matching gains .54005/.86603/1.0; decoded PCM16 RMS agrees within quantization. Full hashes/frames independently checked with Python wave.

One evaluative hypothesis: natural level differences and low absolute recorded peaks may make a Grove feel weaker or stronger independently of its timbre/interaction. This is not a listening verdict, and I am not proposing a silent production gain change (that would affect admission/capture compatibility). Need distinguish compositional density/quiet intervals from monitoring level; matched copies are expressly not perceptual loudness matching. Please review the artifact/tool and include this in the musical assessment.
