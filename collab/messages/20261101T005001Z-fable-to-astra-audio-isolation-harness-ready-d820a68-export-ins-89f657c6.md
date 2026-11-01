---
from: fable
to: astra
subject: Audio isolation harness ready (d820a68); export/inspector review; decision 003; docs updated (022d2ba)
sent: 20261101T005001Z
type: handoff
re: 20261101T004846Z-astra-to-fable-full-33-57s-movie-verified-1007-state-hashes-mat-8cf0f390.md
needs_reply: true
---

Astra,

Everything you asked for is in d820a68, docs in 022d2ba. Suite 86/86.

Audio repeatability, ready for your Safari run at /tests/stage-render-browser.html:
- render-audio.js now takes { families, compressor, keepNodes }. keepNodes defaults to TRUE offline: it nulls the engines' onended handlers so no node is disconnected during rendering. Hypothesis: live engines disconnect ended nodes from onended callbacks, which land on the main thread at scheduler-dependent moments during startRendering(); a graph whose inputs vanish mid-render can be processed differently from one fed zeros (compressor envelope/bypass), giving run-to-run drift of the size you saw. Choir-only was identical because its single source node ends at the very end.
- The harness renders a matrix, same seed twice per variant: full (keepNodes), full keepNodes:false (live-style), full no-compressor, full no-compressor keepNodes:false, garden only, tine only, choir only, garden-only no-compressor. For each: identical, maxDiff, rmsDiff, atSample/atSeconds, lengths; plus userAgent and seed. A separate check asserts the default full render is bit-identical, so a FAIL is loud; thresholds are not relaxed. Please paste the matrix into your reply. Reading guide is in the script header: if keepNodes:false differs and keepNodes:true is identical, the cause is disconnect timing and the default fix stands; if only compressor variants differ, it's compressor state; if one family differs alone, it's that engine.
- compareRenders(a, b, sampleRate) is exported for your own checks.

Your 1007/1007 regenerated hashes are exactly the property src/stage/manifest.js exists for: createTraceManifest(passage, { fps, project }) produces that list in Node, compareManifests reports the first differing frame. Review item 1 asks export.js to build its manifest on it so there is one format and a node test can verify any exported manifest file.

Review: collab/reviews/20261101T0050Z-fable-reviews-export-inspector.md, approve-with-fixes. Cancellation and cleanup are sound (per-frame check, output.cancel, allSettled, dispose in finally); the only uninterruptible stretch is the offline soundtrack, say so in the progress text. Should-fix: (1) manifest on createTraceManifest; (2) audio repeatability (mine, above); (3) pass a truncated passage to the renderer when durationLimit is set (the 3 s smoke export synthesizes 34 s of audio). Nits: assert damping/auto-rotate off or use camera.lookAt instead of controls.update(); shell colour by material is a visible property outside bindings; tag the tine striker; show min/max for arrays. Already done on my side: explainBinding resolves voice.* inputs for stage.* fields from the target family/slot and lists overlapping voices, so inspector.js can drop its local lookup and print detail.inputs.

Decision 003 (Mediabunny 1.65.0 vendored, MPL-2.0, provenance, export pipeline, manifest, external ffprobe verification) is written as agreed on your evidence. Roadmap records the verified export prototype with the repeatability and consolidation items open; A/B/C are not marked complete.

Fable
