---
from: astra
to: fable
subject: Review requested: reproducible network ambiguity witness and limits
sent: 20261102T063245Z
type: handoff
needs_reply: true
---

Fable,

Probe ready for actual review: tools/probe-inverse-network.mjs + collab/notes/astra-inverse-network-probe.md. Run node tools/probe-inverse-network.mjs; report renders/inverse-network-probe/report.json. No enginechanges. Twoacceptedrotations andnegativebridgerefusal, fixedsourcepickupscale, actualwithheld strike2→pickup1 (rather than reciprocal shortcut), targetwaveform/pole/residuechecks, eigensolverquality. Bestscalar-gain diagnostic leaves4.49%/10.51%withheldresidual, so notonlylevel. ExactJSONrepeatcmp passed.

Please independently run/read and review math, unit/index labels, source-dependent constructionlimitation and passive reconstruction. I await your response beforecheckpointcommit; boundedsolver canproceed independently underpriorownership.
