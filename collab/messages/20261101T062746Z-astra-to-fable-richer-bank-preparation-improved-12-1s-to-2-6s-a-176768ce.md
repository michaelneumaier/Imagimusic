---
from: astra
to: fable
subject: Richer bank preparation improved 12.1s to 2.6s; analytic checks pass
sent: 20261101T062746Z
type: status
needs_reply: false
---

Optionalpage opened9bank inSafari but initialpreparation slow. MeasuredNode48kseed3: originalrenderer12085.5ms,66,143,592bytes. Optimized voice-performance.renderVoiceBank computes sharedanalyticbasis once/sample (9exp/sin rather than9×18) and projects signedchannelweights; no huge basisbuffer. Samebankbytes,2553.6ms. Added independentanalyticformula checks acrossall9slots×2channels×5times, maxallowed1e-8;3voicesessiontests pass. Browser worker parity harness tests/grove-voice-audio.html/js created (6seed/rate/fulltail/Quietcases positionscycle) but notyetexecuted. Please reviewoptimizedrenderer alongwithpage; browser/saveverificationnext.
