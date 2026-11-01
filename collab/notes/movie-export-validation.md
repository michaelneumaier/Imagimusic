# Movie export validation — Astra

Initial browser: Safari, local http://127.0.0.1:8080. Verified supported AVC video and AAC audio encoders through the actual browser; no microphone or screen capture is involved.

- Three-second smoke movie downloaded: 357,571 bytes. Independent ffprobe: H.264 1280×720, 30/1 fps, exactly90 frames/3.000000 seconds. AAC48kHz audio3.006667 seconds (encoder framing/padding). Decoded frame1.5s inspected and contains the complete 3D scene.
- Full bronze variation seed2230671998: first export produced1007 state hashes at30fps. Independent Node replay of patch+snapshots+projection matched all1007 hashes, zero mismatches. Initial two immediate downloads resulted in only the manifest being saved by Safari; fixed UI to download movie alone and provide separate Save render manifest action.
- Laboratory transfer browser check: selected Bronze, Discover variation, Play this instrument in3D; stage opened seed2230671998 with91 bindings and no transfer error.
- Full real-browser soundtrack harness: finite and bounded, peak0.19412753 RMS0.02949307, tail peak2.94138e-6 over50ms. Exact repeated PCM test FAILED: peak difference2.26423e-5. Air repeated render also failed. Fable investigating component-level cause. Do not describe browser PCM as bit-identical or relax thresholds without evidence.
- Preview graph/score regression and current pure suite passed81 tests including sample rates44.1/48kHz and forced choir stealing. Existing 2D lab canvas migration remains incomplete.

Review and verification outstanding: peer export/inspector review, full movie stream/trace verification, cancellation and inspector UI smoke, audio-repeatability diagnosis. Hardware encoder byte-identical output is not a requirement; deterministic score/state and correctly synchronized valid output are.

Full corrected download independently verified:3,774,302bytes, H2641280×72030fps1007frames33.566667s; AAC48kHz33.561333s. Difference5.334ms, under one frame. Artifact copied to ignored renders/conservatory-2230671998.mp4 with manifest and preview.

Decoded full movie audio: peak0.18548082, first10ms window above RMS0.001 at0.35s, matching the first scheduled onset0.35s. Real UI cancellation returned "Movie render cancelled" and re-enabled play/view/seek/export. Real raycast click selected garden/slot5 mode1 and displayed its zero idle energy plus Bronze/brightness/damping/strike-position controls; no guessed voice velocity when idle.

## Follow-up: shared manifest and state migration

Safari three-second smoke after canonical createTraceManifest integration: 90 frames, 355828 bytes, first hash d5d8809a, last hash 1c5b1f30. Export now uses the common manifest schema with full patch stored separately as instrument. All 91 Node tests pass. Laboratory canvases consume plain StateFrames; browser choir rendering checked. Peer review requested before treating migration as closed.

Pinned offline graphs reduced but did not eliminate Safari PCM differences: default max 5.960464477539063e-8; no compressor 2.9802322387695312e-8; isolated choir identical in this run, garden and tine still differ. Air variant max 1.8402934074401855e-6. Report: renders/stage-render-report-731.json (local ignored artifact). Exact PCM repeatability remains unresolved; thresholds unchanged.

## Procedural camera smoke

Three timeline shots added (ensemble drift, score attention, tine dolly), plus manual orbit. Camera pose is included in the projected frame and applied through a declared binding; export uses the identical director and records camera mode. Follow shot Safari export: 90 frames, 3 s, 1059452 bytes, hashes 5c00de39 through c14175f2. ffprobe confirms H264 1280x720/90 frames/3 s, AAC 3.006667 s. Decoded 1.5 s frame inspected: correct stage framing. Artifact renders/conservatory-camera-study.mp4. Safari mode selection and scrub to 14.73 s checked. Full tests 95/95; peer review pending.
