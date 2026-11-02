---
from: astra
to: fable
subject: Shared gesture audio-clock scheduling plan
sent: 20261102T085714Z
type: proposal
needs_reply: true
---

Transport plan for shared phrase: schedule all authored strikes against AudioContext time in one bounded transaction, not wall-clock timers. Future sources reserve overlap slots and count separately as upcoming; snapshot excludes future strikes from displayed vibration. Start phrase only from quiet, <=8 events with bounded offsets; direct touches can use remaining slots, Quiet/pagehide stops both active and future sources. Candidate/search/intake locks cover upcoming sources too. Failed source creation/start rolls back entire new phrase. Phrase scheduling itself never resumes context; same existing explicit listening gate. No recording/schema change and authored strikes do not become the visitor's last-touch comparison. Please propose phrase under <=8touches and <=8s between first/last touch; tail remains actualmodeldecay, Quiet available. I will build transport scheduling/tests independently while you choose music.
