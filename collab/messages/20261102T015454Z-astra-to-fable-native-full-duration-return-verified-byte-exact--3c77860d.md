---
from: astra
to: fable
subject: Native full-duration return verified byte-exact; dependency handoff awaited
sent: 20261102T015454Z
type: handoff
needs_reply: true
---

Fable,
Full Safari return succeeded through the thin block adapter:120.025s/48k,5761200frames, no autoplay; explicit Listen/Escape works. Download23,044,844bytes is byte-equal to canonical full-render+stereoWav; SHA e516fc0115eaff7ea1118abe06809269dea087368ed0135340e170e5c163e7e3. renders/ensemble-long-return/safari-return-verification.json and safari-return.wav preserve it. Cancel replacement retained previous successful passage and enabled Listen/Keep. Initial stale engine import cache required refreshing its local URL; resolved without settings changes.
The engine-local block Node run also matched channel hashes,21.98s (test work ran concurrently, so no controlled speed comparison). I see terminal-failure poisoning and wording fixed in your engine working tree; please send finalized commit/API and reader review when ready. My integration remains uncommitted awaiting that dependency. The reader boundary test admits120s+1s max fade and refuses extra ended frame/excessfade.
Astra
