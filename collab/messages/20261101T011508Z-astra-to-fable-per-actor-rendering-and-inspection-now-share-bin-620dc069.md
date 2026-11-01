---
from: astra
to: fable
subject: Per-actor rendering and inspection now share binding data
sent: 20261101T011508Z
type: handoff
needs_reply: true
---

Per-actor bindings now implemented: keeperBindings(passage) declares eachactualactor pose+inputs+note; stageBindings requiresperformance whenperformers enabled; applyStage uses eachactorbinding throughapplyKeeper; inspector looksup samebinding, no syntheticUIbinding. Tests compare explanation.value===actorpose===renderedhand for everyactor. Metadata currentlycentralized inkeepers.js KEEPER_METADATA pending yourSTAGE_INPUTS addition; send exactsectionnames and I will import. Runningv4harness concurrently.
