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

## Repeatability counterexample, 01:01 UTC

Safari06162ed harness: 4/7. Full render maxDiff2.2649765014648438e-5, RMS2.103986057715196e-7, PCM16 differing274samples (max1 step); air maxDiff7.636845111846924e-6. No-compressor maxDiff2.9802322387695312e-8 still yields29 differing PCM16samples. Report renders/stage-render-report-731-0101.json. Prior graph-pinning result did not establish closure of collection/disconnect effects. A summation-only diagnosis and revised repeatability contract are unapproved; additional controlled experiments required. AAC receives Float32 AudioBuffer, not PCM16.

## Keeper integration preview

Hand-follows-mallet rigs added through stage.performers binding in live/export. Safari default reports6 Keepers and0 unassigned strikes; played live and inspected. Follow-camera smoke90frames3s1057546bytes, first hash8c3aa45b/lastb26e43ee. Decoded frame near first contact inspected. Artifact renders/conservatory-keepers-study.mp4. Node suite104/104. Planner same-slot preparation/recovery overlap fix requested; integration review pending. Bellows pump actors and per-actor inspection are still outstanding.

## Source-finish controlled experiment, harness v4

Full-render exact repeatability remains failing (default7.294118404388428e-6;99 differingPCM16samples). Three paired controls support a source-finish relationship: lone12s stopped differs5.82e-11 near10.0294s vs firststop10.02895s, never-stopped identical; garden12s stopped differs7.45e-9, never-stopped identical; dampedlone6s differs5.82e-11 near1.21877s vs firststop1.21842s, never-stopped identical. All three never-stopped controls exactlyequal. These are diagnostic residual-tone renders, not a shippingfix. Nexttest: exactgainzero before deferredstop, verifyfullpassage/sharedlive-offlinegraph andtail. Versionedv4JSONsaved under renders; Fablehasreport.

## Silent source retention, harness v5

Safari 26.6.2, seed731, 48kHz, modal gains explicitly zero at intended cutoff: full passage and air-choir candidate each produce identical Float32 samples across two renders (1,609,893 samples each, maxDiff0). Report: renders/stage-render-report-v5-731-20261101T012420.json. Current as-live default still fails (maxDiff1.4290213584899902e-5,132 differingPCM16samples); overall harness8/11 because those negative controls remain. As-live vs candidate maxDiff1.430511474609375e-5,RMS9.420577486070944e-8,113 differingPCM16samples. This is evidence for candidate repeatability on this setup, not cross-browser identity or exact live/offline equality. Before default adoption: dense voice-steal stop-time override, candidate boundedness/tail verification, and repeat run after fixes. Node suite123/123.

## Candidate accepted after dense-steal fix, harness v6

Safari26.6.2/48kHz/seed731: full and air repeated candidate renders identical Float32 (1,609,893 samples). Explicit boundedness, tail and length assertions pass: full peak.1941275299/RMS.0294930753; air peak.1684181094/RMS.0262624237; last50ms2.94138e-6 both, duration33.5394375s. Dense-steal graph fix reviewed: deferred stop applied after ALL scheduling, including retired nodes; node test verifies six forced steals with zero gain at fade end. Report renders/stage-render-report-v6-731-20261101T012811.json. Approved Fable switching renderPerformanceAudio default; final default-path/movie smoke still pending. Overall diagnostic9/12 retains expected as-live repeatability failures.

## Full movie after retained-source default adoption

Safari full seed731/follow-camera export produced renders/conservatory-repeatable-731.mp4 (8,233,416bytes) and matching JSON. ffprobe: H2641280x720,30fps,1007frames,33.566667s; AAC48kHz mono33.561333s (5.334ms duration difference). Decoded PCM peak.19349216; first10ms window above RMS.001 starts.35s, matching score. Decoded5s frame inspected: garden/tine/choir, Keeper arms and stage rendered correctly. New tools/verify-stage-manifest.mjs reconstructs all1007 projected state+camera hashes from saved instrument, with0 differences and matching frame/audio counts and timing metadata. Its mutation test rejects changed hashes, camera mode, dimensions, frame count, audio sample count and video duration. This verifies timeline/state and output streams; codec bytes remain implementation-dependent. v7 shipping-default audio harness still running separately at this checkpoint.

Shipping-default verification complete: harness v7 finished12/12. Full and air default renders both maxDiff0,PCM16identical,1,609,893samples; boundedness/tail/length assertions pass. Explicit as-live negative controls still report their real differences and are not shipping assertions. Report renders/stage-render-report-v7-731-20261101T013518.json. This run began before the v8 first-difference-metric addition, so its atSeconds fields still locate MAX difference only. No further audio algorithm change occurred during the run.
