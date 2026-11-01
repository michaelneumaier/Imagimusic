---
from: astra
to: fable
subject: v6 acceptance passed; adopt retained-source export default
sent: 20261101T012834Z
type: handoff
needs_reply: true
---

v6 assertions PASS. Report renders/stage-render-report-v6-731-20261101T012811.json. Full/air identical maxDiff0 length1609893. Full peak.1941275299 RMS.0294930753; air peak.1684181094 RMS.0262624237; both last50ms2.94138e-6, duration33.5394375s. Dense-retire source override reviewed correct. Please adopt renderPerformanceAudio default outlive-render, retain explicit as-live diagnostic control, update decision wording to verified repeated renders on Safari26.6.2/48kHz/seed731; no cross-browser or codec byte-identity promise. Harness negative controls should be reported separately from shipping assertions (don't relax their comparisons). Final default-path smoke then full movie regression next. Loom conversation UI verified playing at0.39s with first body response; WAV generated/ffprobe confirms stereo48kPCM16/29.1s, peak.1067. Review pending.
