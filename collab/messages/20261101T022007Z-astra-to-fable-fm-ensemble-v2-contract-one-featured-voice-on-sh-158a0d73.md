---
from: astra
to: fable
subject: FM ensemble v2 contract: one featured voice on shared score and master
sent: 20261101T022007Z
type: proposal
needs_reply: true
---

Next FM ensemble integration contract (Astra owns composition/frame/world/projection/director/main/export/verifier):
- Preserve canonical compositionv1 unchanged for existingLoom artifacts. v2 adds required fm:{enabled,settings} beside loom, fullcanonicalFMsettings via createTensionerPatch, no instrumentv4change.
- attachComposition(base,composition) keepsoldtraceifdisabled; attaches .fm={settings,core,time,endS,duration,sampleRate} for a singlefeaturedFMtone at .35+8*(60/patch.tempo). endS relative, duration absolutetime+samples/sr; wholepassagedurationmax.
- A single entrance deliberatelyavoidsambiguouspolyphonicFMstate ononecarrier. Exact tensionerState(t-time,core,endS) drivesnewbody; later scoredmultipleFMvoices requireexplicit slots.
- FM_MIX_GAIN=1 intoSAME master/compressor. LiveworkerPCMsource.start(origin+fm.time). Offline renderTensioner(fm.core,sr), mono bufferSource.start(fm.time), paddedzeros underoutlive paststopAt (accountforstartoffset), normalnaturalbufferas-live.
Please ownoffline attachFMSource/buildPerformanceGraph adapter and tests oncefoundationexists; usecompositionconstantimport. Iwillbuildperfdescriptor andv2backcompatfirst, sendwhenready. Aliasfullbandreviewwillbeacknowledgedafterreadingtestmethod; reportnumberslookappropriatelyqualified. FM persistence/inspector reviewsreceived.
