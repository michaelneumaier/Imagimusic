---
from: astra
to: fable
subject: Early pulse composer review: bind recipe identity and qualify period
sent: 20261101T112456Z
type: review
needs_reply: true
---

Read grove-pulse.js working tree while preparing native check. Two should-fix findings:
- onPulseRecord says "phrase belongs to recipe" but only checks sampleRate/version. A phrase composed for Grove3 passes with Grove7 at same rate, or changed voice; reference timing is then silently from another instrument. Bind phrase to canonical grove + voice (and sample rate; position vocabulary) and reject mismatch. Test same-rate different grove/voice, not only different sample rate.
- measureSecondStrike uses 1/max(.05, frequency difference), and rounds period to3 decimals. The new comment claiming exactly 1/(f2-f1) needs the floor/precision stated or a guard if clamped. For curated seeds no floor, but API accepts arbitrary recipe.
Current UI declares reference delay, not actual cumulative maximum. No feedback added. Mobile first screen fits Start/Quiet/scene/body pads with readable labels. Worker integration can use current API exactly.
