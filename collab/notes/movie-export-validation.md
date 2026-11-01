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

## Shared frame sampler and browser scene parity

Preview, export and artifact verification now use src/stage/frame.js. Existing full-movie manifest still regenerates1007/1007 hashes. Safari stage-parity harness:48kHz,114 AudioContext-clock RAF frames over2s plus210 full-passage attack/end boundary samples; all324 state and actual Three scene pose hashes match fresh-world replay in reverse timestamp order. Pose proof includes transforms, visibility, material values, tine geometry positions and camera. Silent harness uses the audio clock only, not live sound-engine snapshots; engine-vs-score snapshot parity remains a separate gate. Actual stage page loaded and entered live playback using the consolidated sampler. Verifier now requires validatePatch output to deep-equal saved instrument; malformed/noncanonical inputs fail clearly.

## Real audio-engine snapshot parity

Safari26.6.2,48kHz,seed731: tests/stage-engine-parity.html completed both checks over2,011 live AudioContext-clock samples through the33.5394s passage. Engine-derived snapshots and planned snapshots match for every raw state frame and every projected body/Keeper/chamber frame. Comparator explicitly normalizes bookkeeping IDs/order and snaps both sides' timeline fields to nanoseconds before four-digit trace hashing. Evidence: renders/engine-parity-731-20261101T014804.json. This checks sound-engine state against the planned picture; it does not assert waveform identity between live and offline audio.

## Optional Loom composed movie

Safari ensemble preview now plays the optional Loom pair from worker-prepared stereo PCM on the same AudioContext origin, with120 declared motion bindings. The opt-in is available as Include Tension Loom (query loom=1); preparation can be cancelled and toggling preserves other query parameters. Full composed manual-camera movie exported to renders/conservatory-loom-731.mp4 (4,438,872bytes), manifest renders/conservatory-loom-731.json. All1007 hashes regenerate with saved composition; node tests reject omitted, changed and noncanonical composition. ffprobe confirms H2641280x720,1007frames,33.566667s; AAC48kHz mono33.561333s. Decoded5s frame inspected with Loom pair visible at stage left. Node suite144/144. Browser v9 composed repeatability harness running separately; this paragraph does not claim its result.

Composed-audio follow-up, harness v9:12/13. Exact Float32 repeatability of the optional Loom mix fails (max7.275957614183426e-12 at31.2546667s); base/air remain exactly repeatable. Saved renders/stage-render-report-v9-731-20261101T015202.json. Full composed scene artifact proof remains valid. Suspect natural end of finite PCM buffer before render completion despite deferred source.stop; Fable owns zero-padding investigation. No thresholds relaxed, no composed bit-identity claim added.

## Padded Loom buffer verified

Fable e022855 zero-pads the offline duet buffer beyond render completion, preserving all original samples and exact zeros after them; as-live buffer length is unchanged. Focused Safari26.6.2/48kHz/seed731 check tests/loom-render-browser.html passed3/3 full arrangements, each rendered twice: matched196/.004/0/.35; detuned339/.02/-33/.8; uncoupled80/0/0/.2 (frequency/coupling/detune/loss). All1,609,893 Float32 samples are identical per pair, maxDiff0. Peaks.2077102/.1948833/.1921509, last50mspeak2.94138e-6; allfinite andexactlength. Eacharrangement differs from base, maxDiff.02607/.01938/.01094. Evidence renders/loom-render-report-20261101T015618.json. Claim is limited to this setup and these arrangements; no cross-browser identity claim.

Composed scene parity also passed361/361 (103liveAudioContextRAFframes+258eventboundaries) with defaultLoomenabled, freshscene reverseReplay. The boundaries now includeLoomapproach/contact/recovery/end; pose hash includes coupled bodies/strikers/bridge via fullscene traversal, andcamera. Clock-onlytest, soundenginecomparison remains the separate evidence above.

## Featured FM shared scene foundation

Composition v2 now feeds the shared frame sampler, stage-right FM body, follow-camera entrance, movie exporter and independent manifest verifier. Six FM bindings reuse the standalone scene's setter and link geometry. At 48 kHz in Safari, the combined default Loom + FM scene test passed 379/379 frames (112 AudioContext-clock RAF frames plus 267 full-passage event/FM onset/fade/end boundaries), replayed in reverse on a fresh world. This is a silent scene test, not an audio identity claim. Node tests compare ensemble and standalone FM poses through forward/reverse seeks and reject missing/changed FM composition in manifests. All 170 tests pass. Existing default and Loom movie manifests still verify all 1007 frames unchanged. Live stage playback/control integration is the next slice; no new composed FM movie has been exported yet. The FM descriptor duration is its natural PCM end on the passage clock; offline buffer padding only keeps sources alive beyond the render and does not extend the musical passage.

## Featured FM live integration

The stage now prepares FM mono PCM in a cancellable worker, starts it at the shared AudioContext origin plus its score entrance, and routes it through the ensemble master. Quiet cancels preparation and fades/stops playback. Late worker results cannot overwrite a newer request. The stage toggle, exact-setting study transfer, scene inspection and FM route explanation are connected. Loom editing preserves the surrounding FM composition. Safari combined seed731 playback observed through its natural completion (33.54s), returning to silent study with0 voices; the scene showed126 bindings and the FM mechanism at stage right. Stage → FM study → ensemble round-trip retained both default compositions. All173 Node tests pass, including timing/routing, cancellation, late worker resolution and stopped-before-start behavior. This does not yet assert composed FM offline repeatability or a newly encoded movie.

## FM + Loom encoded movie

Exported the full seed731 default FM+Loom composition with the manual camera to renders/conservatory-fm-loom-731.mp4 (5,248,682bytes) and matching JSON. All1007 projected hashes regenerate, including the model's positive/signed instantaneous-frequency flag now displayed in the live stage readout. ffprobe confirms H2641280x72030fps1007frames33.566667s and AAC48kHz mono33.561333s. Decoded6.5s frame inspected: FM at stage right, Loom left, garden/tine/choir and Keepers visible. Decoded AAC output is finite, peak.20933433,RMS.03388904,last50mspeak3.25083e-7 (1,610,688 decoded samples including codec padding). These are encoded artifact checks, not a claim of AAC binary identity. Repeated raw audio is being checked separately in Safari harness v11; its result is not inferred from this export. Focused scene/manifest tests10/10 and model-flag assertions pass.

Safari v11 featured-FM repeatability row passed for the default tone both alone and with Loom: each pair of1,609,893 Float32 samples was identical; boundedness, silent tail and duration checks passed. FM-alone peak.19412753,RMS.03037592; FM+Loom peak.20771021,RMS.03396143; both tails2.94138e-6. Full-harness report download follows completion of remaining seed/air checks. The v11 base-difference diagnostic mixes Loom and FM contributions in the combined case; a focused follow-up will hold Loom fixed to isolate the FM entrance. This diagnostic caveat does not affect the repeated-render identity assertion.

Full v11 harness completed14/14. Report saved as renders/stage-render-report-v11-731-20261101T023310.json. Negative as-live controls retain their real nonzero differences; shipping FM/default/air/Loom assertions all pass. Export metadata now includes the tested default featured-FM cases in its explicitly Safari-scoped statement.

## Focused FM contribution check closes M3 verification

Safari26.6.2/48kHz/seed731, harnessv13 with ?focus=featured%20FM:1/1 selected check passed,13 unrelated checks explicitly skipped. Saved report renders/stage-render-report-v13-731-20261101T023441.json. Three cases (default FM alone, default FM+Loom, slow vibrato ratio.01/indexDecay4s+Loom) each rendered twice with exactFloat32 identity across1,609,893samples; all bounded, correct-duration, silent-tail assertions passed. Compared each against the same composition with only FM disabled: maximum difference0 in the100ms immediately before the6.0642857s entrance; maximum difference in the first second after entrance .06908407/.06896897/.06882908 respectively. This isolates FM from the Loom's existing contribution. It verifies the stated windows and cases, not arbitrary settings or live/offline waveform identity.

## Authored-event audio integration fixture

New tests/authored-render-browser.html/js runs an explicit compiler fixture through the real offline graph, not the forthcoming three-movement score. DEFAULT_PATCH, garden/tine per-note positions, eight overlapping pitched bellows notes forcing two steals, Loom strikes at5/6s, FM at7s, explicit40s hold. Safari26.6.2 passed both rates:44.1kHz1,764,000samples peak.08413127/RMS.00862383;48kHz1,920,000samples peak.08404797/RMS.00864122. Each rate was rendered twice with exactFloat32 identity,maxDiff0; last0.5s exactzero, duration40s, allfinite/bounded. Report renders/authored-render-report-20261101T024259.json preserves recipe, composition and comparisons. This verifies the compiler/audio integration for this fixture; no generated-phrase or live/offline waveform identity claim follows.

### Generated conversation integration, 2026-11-01

Safari scene-parity harness now accepts a saved `score` query or the default `conversation=1` fixture. With Loom and FM enabled, seed 731 / 84 BPM / calm / density 0.7 passed **341/341** comparisons: 112 AudioContext-clock animation frames and 229 attack, ending, and section-boundary samples, replayed in reverse on a fresh scene. Compared transforms, visibility, materials, tine deformation and camera. This is silent scene evidence, not audio waveform parity.

Observed the live stage finish at 65.33 s with TAIL / bar 17, zero voices, nine Keepers, zero unassigned strikes and zero unreachable arms. After reload, the new Tempo 84 BPM and Density 70% controls displayed correctly. Both prior default and FM+Loom movie manifests still verify 1007/1007 frames under the score-aware verifier. Generated-score full movie and repeated audio checks remain pending.

### Generated conversation audio, harness v14

Full Safari26.6.2 harness passed **15/15**. Saved `renders/stage-render-report-v14-731-20261101T025625.json`. Generated presets calm/density0.7/seed731, bright/density1/seed731, and restless/density0/seed2 each rendered twice at44.1 and48kHz: all six pairs identical Float32, finite, bounded and exact assembled length (65.325142857s, sample-ceiled). At48kHz peaks were .10932201, .11056783, .07322223 respectively; final50ms peaks 2.74797e-6, 1.67971e-6, 2.87428e-6. FM entrance23.207142857s and last authored onset43.207142857s. This run proves final50ms only, not the proposal's final500ms criterion; focused v15 follow-up is running. No live/offline or cross-browser identity claim.

Focused v15 follow-up passed **1/1 selected check**,14 skipped; three presets at48kHz only. Saved `renders/stage-render-report-v15-731-20261101T025707.json`. Final500ms peaks: calm3.30020339e-6 (−109.629dBFS), bright2.01870353e-6 (−113.899dBFS), restless3.45190983e-6 (−109.239dBFS), all below the −60dBFS target. Repeated Float32 identity retained. The44.1kHz final500ms criterion remains unmeasured by this focused run; v14 covers identity and50ms there.

### Full conversation movie and event inspector

`renders/conservatory-conversation-731.mp4` (9,206,542bytes) and matching `.json`: calm/density0.7/seed731/84BPM, Loom+FM enabled, manual wide camera. Canonical score-aware verifier recomputed **1960/1960** frame hashes, no mismatches. ffprobe: H.2641280×72030fps1960frames65.333333s; AAC48kHzmono65.361333s (28ms codec-duration difference, less than one video frame). Decoded exchange frame at24s inspected: complete ensemble, Loom and FM visible. Decoded AAC contains3,136,448 samples including codec padding, all finite; peak.10970317,RMS.01496543,last500ms peak4.03889e-6. Encoded bytes and decoded AAC are not claimed identical to source PCM.

Inspector browser smoke at24.43338s: clicking FM carrier displayed `fm:exchange:1`, section exchange, beat32, anchortrue beside its binding explanation. Silent seek read EXCHANGE/bar9. Source review approved by Fable; identity/order regression tests2/2. No camera cadence change is included in this artifact; that work remains next.

### Cadence camera, 2026-11-01

Scored Follow mode now blends opening anticipation, exchange attention and release pull-back over one-beat transitions; legacy unscored arithmetic retained literally. Full Node suite200/200 passed before final opening framing adjustment; focused director tests4/4 passed after it. At240Hz across calm/bright/restless with both children: maximum pose/target step .017166 units; maximum camera radius19.846; mean camera-to-target distance about17.72 opening,12.48 exchange,17.17 late release. A frozen digest verifies240 pre-change legacy poses exactly. Default1007-frame follow and1960-frame manual conversation manifests remain valid.

Initial opening values cropped FM in Safari; final opening prior1.2, offsets(10,13), absoluteheight8.2 visually include the whole ensemble. Final Safari fresh-scene reverse replay passed275/275 comparisons (46clock frames+229event/section boundaries). This is scene evidence; the previously exported conversation movie remains the manual wide-shot baseline. A new cadence-follow export is still to be made.
