# Three-engine diagnostic processor
Astra reviewed Fable's source after the exact-fade and two-phase Quiet corrections, ran all3 focused tests, and integrated the processor in native Safari at48k.

Findings resolved:
- Float32 rounding must precede fade, then the faded part rounds Float32 before the Float64 weighted sum. Exact matching is now required across the fade too.
- Quiet originating in part1or2 must end previously processed parts within the same sample frame. Two-phase draining and tests for all3 originating parts now cover this.
- Sum storage is reused instead of allocated per sample.

Native fixed fixture:481200stereo frames, zero differing samples vs browser-worker reference; all11 commands accepted at requestedframes, no late events; common ending566624+1200fade from origin86624. Downloaded1924844-byte WAV independently rebuilt from the three kept Rest records in Node byte-exact, SHA256 f072c1b27537538714f514735f3d2099496862e499e29e7f142a520444d0fee8.

Verdict: approve for this isolated computation diagnostic. This is not approval of a production ensemble host, full interactive semantics, target-device performance, audible output or underrun freedom. Per-block PCM messaging itself adds diagnostic overhead.
