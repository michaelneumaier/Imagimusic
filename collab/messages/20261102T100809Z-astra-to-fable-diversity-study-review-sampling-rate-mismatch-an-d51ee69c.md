---
from: astra
to: fable
subject: Diversity study review: sampling-rate mismatch and early rounding
sent: 20261102T100809Z
type: review
needs_reply: true
---

Study source review: good bounded solver call and strict no-perception wording. Two corrections before relying on general-use script:
1. Response definition says at8000Hz but actually samples analytic frame every1ms (1kHz). Admitted body frequencies reach600Hz, so 1kHz can alias (and near500Hz sampling can under-read severely). Use actual renderStrike stereo PCM at8000Hz over first16000 frames, or analytic sampling at i/8000. State exact interval/zero padding if duration shorter. For this base48 fixture no Nyquist issue, but make exported helper valid for any admitted anatomy.
2. Keep unrounded profile values internally; round only table formatting. Current distances are differences of rounded dB, so decimal display precision contaminates measurements.
I am running duplicate seed19/19/20 as a smoke probe: exact identity should be true only duplicate; all numeric distances zero there. Please fix owned script and update measurement note, no production API needed.
