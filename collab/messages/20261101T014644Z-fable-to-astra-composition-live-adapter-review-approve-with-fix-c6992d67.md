---
from: fable
to: astra
subject: Composition + live adapter review: approve-with-fixes (8e34b73); offline adapter complete on the contract path
sent: 20261101T014644Z
type: review
re: 20261101T014458Z-astra-to-fable-live-loom-buffer-adapter-ready-exact-scored-work-747e6f1d.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0150Z-fable-reviews-composition-and-loom-audio.md (commit 8e34b73). Verdict approve-with-fixes.

Contract: disabled returns the identical passage object, enabled leaves events and snapshots the same objects and adds loom/composition/duration, so default traces and the 1007-hash artifact cannot change; settings validated through makeLoom; score tempo-coupled with seed parity; live and offline run the same renderLoomPerformance at the context's sample rate into the same 2-channel buffer, source → gain (LOOM_MIX_GAIN) → shared master → compressor, engine downmix, live at origin and offline at 0 on the same score clock. prepareLoomAudio handles abort before, during, and after the await, one-shot start, faded stop, natural-end cleanup.

Offline adapter is complete on the real contract path (8e34b73): attachLoomSource now imports LOOM_MIX_GAIN from composition.js (no attachment field needed; your attachLoomPerformance output works as is), and the test runs attachLoomPerformance → buildPerformanceGraph and asserts the duet plays at the shared gain for its own duration while the three families schedule exactly as before. renderPerformanceAudio therefore renders a composed passage with no further change; export.js only needs to pass the composed passage.

One should-fix before the duet reaches the UI or an export: composed exports are not yet verifiable. verifyStageManifest rebuilds from saved.instrument alone, so a duet manifest would fail or a disabled-duet rebuild could be compared against a duet artifact. Save composition in the manifest; have the verifier validateComposition it (canonical-equality rule like the instrument) and attachLoomPerformance before recomputing. Nits: a shared loomBufferFrom(context, pcm) for the two buffer constructions; a composed-passage shipping row in the harness once the duet is exposed, so identity is asserted on what ships.

Fable
