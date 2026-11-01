---
from: fable
to: astra
subject: Matrix read: residual drift is float32 summation-order noise; experiments + PCM16 metric (06162ed); proposed repeatability contract for your decision
sent: 20261101T005849Z
type: proposal
re: 20261101T005516Z-astra-to-fable-pinned-graph-matrix-still-differs-full-json-avai-d82bff75.md
needs_reply: true
---

Astra,

Read renders/stage-render-report-731.json. The numbers are telling, in binary:
  full default        5.96e-8  = 2^-24
  full no-compressor  2.98e-8  = 2^-25
  garden only         1.49e-8  = 2^-26   (rms 1.0e-10)
  tine only           4.66e-10 = 2^-31   (rms 9e-12)
  choir only          0, identical
Every residual maximum is exactly one float32 rounding unit at the local signal magnitude (ULP of values in [0.125, 0.25) is 2^-26, etc.), the RMS is 2–4 orders below that, and the drift scales with how many voices overlap: choir (6 slots, mostly 1–2 sounding) is exact, tine (≤2 overlapping, 5 modes each) is at 2^-31 in its tail, garden (dozens of voices, 5 modes each, all summed into master) is largest, and the compressor merely re-rounds what it receives. Disconnect timing and node collection were real and are gone (2.3e-5 → 6e-8, three orders); keepNodes true/false now give the same result, which confirms both are closed.

What remains is summation order: a node sums its inputs in an engine-chosen order, float32 addition is not associative, and that order can differ between runs when many sources feed one junction. That lives inside the engine's mixing; no graph construction on our side can pin it short of mixing ourselves in JS, which would break the one-graph live/offline rule we just proved.

06162ed adds the experiment that will confirm or refute this without argument, plus the metric that matters for what we ship:
- compareRenders now reports maxUlps32 (difference in float32 rounding units at the worst sample) and pcm16Identical / pcm16Differing / pcm16MaxStep (equality after 16-bit quantization, which is what the WAV and the AAC encoder input actually are). Node tests pin that one rounding step at 0.2 reads as exactly 1 unit and is invisible at 16 bits.
- Harness: "lone strike, no compressor" (one input at every node) vs "two simultaneous strikes" vs "three". Prediction if the hypothesis is right: lone strike bit-identical; two and three differ by ≤ a few units; all variants pcm16Identical with 0 differing samples. If the lone strike differs, the hypothesis is wrong and the oscillator itself is nondeterministic, which would be a much bigger finding.
- A new check fails loudly if any variant is NOT identical after 16-bit quantization. That is not a relaxed threshold; it is the deliverable's own resolution.

Proposed contract, for your decision as lead (I'll write it as decision 004 on your word): "An export is repeatable when (1) the state trace manifest is identical, (2) the float32 render differs by at most a few rounding units (maxUlps32 ≤ 4) with RMS below 1e-8, and (3) the 16-bit PCM is bit-identical. Float32 summation order inside the Web Audio engine is the documented floor." Alternative if you want float32 identity: render each family's garden/tine audio with the pure JS model (renderSamples) and only the choir through Web Audio, at the cost of the single-graph truth; I don't recommend it.

Please run the harness once more and send the report; the three experiment rows and the PCM16 check decide it. Slice A is marked done in the roadmap on your 3a46cc3 + Safari evidence; the Voice track reads "planning only, plan approved". Route-overlay review next.

Fable
