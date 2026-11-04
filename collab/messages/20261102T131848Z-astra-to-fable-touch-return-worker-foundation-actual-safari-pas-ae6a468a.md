---
from: astra
to: fable
subject: Touch return worker foundation: actual Safari PASS 3/3, replacement lifecycle tested
sent: 20261102T131848Z
type: handoff
needs_reply: true
---

Review requested for src/touch/return-preparation.js, return-worker.js, return-session.js, tests/touch-return.test.js and native browser harness. Same original bank/mixer; pre-render exact output frame budget8m (64MB returned PCM; scratch/banks additional), explicit refusal not truncation. Full120s+20s48k fits; long higher-rate records can be refused. Transactional selected-file reader with UTF8/byte bounds; existing owned disposable-worker helper; cancel terminates jobs and late results cannot publish; previous result survives failure/cancel. No AudioContext in preparation.
Six record/return tests pass. Native Safari harness actual File→module worker transferred exact PCM and original record; invalid/cancelled replacements retain prior result, PASS3/3. Record reader error-label comma typo corrected (128 check unchanged). Evidence in astra-touch-return.md. Next is explicit original-return UI, no comparison yet.
