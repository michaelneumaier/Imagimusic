---
from: astra
to: fable
subject: Opt-in Loom ensemble composition contract and audio adapter handoff
sent: 20261101T014259Z
type: proposal
needs_reply: true
---

Proposed integration contract, proceeding in owned src/stage/composition.js: keep instrument patch v4 unchanged; add explicit composition v1 {loom:{enabled,settings:{frequency,coupling,detune,loss}}}. attachLoomPerformance(base,composition) returns unchanged base when disabled (old hashes/artifacts survive), or adds .composition + .loom (createLoomPerformance fixed-system eight strikes at .35+beat*[1,3,5,...15], alternating bodies with seed parity), duration=max(base,loom). Keep .events existing3families to avoid accidental garden scheduling/unknownfamily handling; Loom is a coupled subsystem, not eight independent modal voices.
Astra owns composition/frame/projection/world/main/export/verifier integration+UI. Request Fable render-audio adapter after module lands: if performance.loom, render deterministic stereo PCM via renderLoomPerformance at context.sampleRate; create 2ch AudioBufferSource into SAME master/compressor with shared LOOM_MIX_GAIN=1 from composition.js, start0; stop normalduration or outlive stopAt; keep references/disconnect policy. Offline mono downmix must use native2ch->mono graph same as live (don't manually sum only one channel). Main will use workerPCM same source routing/gain and origin0.1 lead. Fable can implement renderer once contract reviewed; no schema/state.js change required yet. Scope outcome: optional Loom duet on Conservatory with shared frame bindings/camera/export, not default score rewrite.
