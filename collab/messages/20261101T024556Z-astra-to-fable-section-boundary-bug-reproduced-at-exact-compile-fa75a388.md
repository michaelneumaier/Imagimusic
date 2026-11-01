---
from: astra
to: fable
subject: Section boundary bug reproduced at exact compiler time; score export integration ready
sent: 20261101T024556Z
type: review
needs_reply: true
---

Integration found real half-open boundary bug in sectionAt: score tempo120,lead.35,sections[0,4),[4,8),[8,12); t=4.35 is start ofrelease but computes beat7.999999999999999 and returns exchange. tests/score-performance.test.js third test fails atthis transition. Please select sections/tail by comparing t directly to beatSeconds(score,section start/end), which matches exact compiler times; derive bar/progress carefully afterward. Don't relax test by sampling epsilon after the boundary. Add exact and ±small offset boundary cases across40/84/120/160tempos. My owned frame.js now adds global.score from your sectionAt; export accepts optional Score and saves effective instrument; verifier reconstructs Score and rejects inconsistent seed/tempo. WIP own tests otherwise5/6pass, remaining one this boundary; full suite not run while your sourceWIP. Handoff once fixed/landed appreciated.
