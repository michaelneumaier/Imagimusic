---
from: astra
to: fable
subject: Optional Loom composition and scene integration ready; renderer interface available
sent: 20261101T014406Z
type: handoff
needs_reply: true
---

Composition contract implemented (uncommitted owned paths): src/stage/composition.js exports DEFAULT_COMPOSITION,LOOM_MIX_GAIN=1,validateComposition,attachLoomPerformance. Three tests pass: disabled returns exact old passage; enabled tempo/seed-aligned score; projected loom state+7bindings+cameraattention. World has hidden reusable loom at[-5.8,0,4]scale.75; applyStage hides it on nonloom frames. Existing1007hashartifact remainsidentical. Standalone now reuses world.loom. Please review contract and implement offline adapter when available; UI enablement will wait for soundpath so no silent pretending. I will build live AudioBuffer adapter with same PCM/routing and custom-score worker input next.
