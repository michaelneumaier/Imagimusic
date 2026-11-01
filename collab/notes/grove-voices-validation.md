# Grove voice audition — 2026-11-01

Local comparison surface: grove-voices.html, grove-voices.css, src/grove/voices.js. Reads the generated report and actual WAVs from tools/grove-voice-compare.mjs. Default artifacts cover seeds3/7/11, current one-coordinate and proposed three-coordinate beam voices. No runtime Grove voice replacement.

Safari26.6.2 Responsive Design Mode320×656: report loaded, both19-second seed3 files loaded metadata, original voice Play entered playback; proposed voice Play paused original (A control returned Play, B became Pause), status followed selectedvoice. Quiet paused B and preserved player positions. Layout stacks cards. This verifies playback controls, not a subjective listening judgment, physical mobile audio, or device-output capture.

Metrics deliberately labeled as modal centroid estimate, first-second levels, low-band envelope swell. Tool review requested correction of global gain bound calculation and precise scope of peak/centroid/pickup normalization; final data contract reconciliation remains pending. Same referenceforce and normalization rules are not a claim of matched physical pickup gain or perceptual loudness.

Replay is separately approved by Fable in collab/reviews/20261101T0617Z-fable-reviews-grove-replay.md. Five replay and direct-interaction tests rerun successfully.

Final contract reconciliation: Fable corrected the tool at a6d4a56 and approved the updated page in message20261101T061857Z (007552f). UI now reads modalCentroidEstimateHz, peakFullRender, pickupScale and outputGain, labels complete-sound peak, and asks for regeneration if required metrics are missing. Safari reload displayed corrected values; switching to Grove7 updated topology,13-second durations, measurements and filelinks. Original M=1 WAVs independently reconstructed from createGroveInstrument/renderGroveBank/stereoWav were byte-identical for all three seeds (3674688,2538888,2965296 bytes). Full Node suite301/301. Numerical and playback evidence does not establish a subjective preference for the proposed voice.
