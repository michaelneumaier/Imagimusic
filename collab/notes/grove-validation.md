# Grove encounter validation — 2026-11-01

Local Safari 26.6.2 on macOS. grove.html opens a procedural three-body scene with numbered markers, curved modeled connections and authored support geometry. Enter prepares unit responses in a worker. Exercised greeting → Your turn → A/D held keyboard gestures → Quiet → both downloads. This validates UI execution, not subjective listening quality or physical mobile interaction.

Captured 48 kHz passage: body 0 at frame 0, velocity .59; body 2 at frame 8064, velocity .4324999999999909; Quiet at frame 152528 with 1200-frame fade. Downloaded WAV was 614956 bytes and byte-identical to independent Node reconstruction from downloaded JSON, createGroveInstrument, renderGroveBank, mixImpulseRecording and stereoWav. Ignored local evidence: renders/grove-first-play.json and .wav.

Browser tests/grove-audio.html uses actual shared impulse/fade scheduler functions in OfflineAudioContext and compares against the saved-buffer mix. All six cases passed: seeds 3 and 11 at 48 kHz, seed 7 at 44.1 kHz; full authored greeting and early Quiet for each. Maximum saved-mix difference 1.4901161193847656e-8, repeated browser render difference 1.1175870895385742e-8. Largest measured peak .0932743176817894. Thresholds fixed before run: mix 1e-6, repeat 1e-7, peak .9. Browser graph is numerically close, not claimed bit-exact. No speaker, device loopback or cross-browser claim. Evidence renders/grove-audio-report.json.

Focused 18 network, generator, anatomy, performance and shared transport checks passed. Fable approved adapter/transport in collab/reviews/20261101T0558Z-fable-reviews-grove-adapter.md. Page/caption review requested separately; responsive layout still to verify.

The first navigation snapshot preceded complete page initialization; a subsequent reload showed the complete page. The snapshot alone does not establish a module cache failure. Added a visible module-load failure message instead of leaving blank controls if a future import fails. Replaced removed PCFSoftShadowMap with supported PCFShadowMap in the new world.

Realism: three linear lumped masses, three normal modes and common damping. Fixed layout-derived stereo displacement pickups, not acoustic radiation. Shell volume follows mass and tuning changes proportions at fixed volume; shell surfaces, support, materials and amplified envelope movement are design. Bridges follow real model topology but do not display edge energy flow.

Follow-up: Fable page/caption review approved at collab/reviews/20261101T0604Z-fable-reviews-grove-page.md. Added a visible post-gesture explanation of New passage → greeting. Safari Responsive Design Mode at 400×656 exposed the inherited canvas height exceeding its scene frame; Grove now sizes its canvas to 100% of that frame. Reloaded screenshot confirms the full support and all three pads fit beneath the sticky toolbar, with no horizontal overflow. This is desktop responsive evidence, not physical iOS testing. Full Node suite: 291/291. Generator metadata regression rerun after 7f98d9e: 4/4.

Direct scene playing follow-up: actual shell raycasting now routes a captured hold/release through the same session as pads. Safari at 400×656: held central shell click accepted as body 01, enabled recording downloads, and Quiet ended the passage. Two automated interaction tests verify current-transform picking, empty-space misses, camera isolation and release/cancel/reset behavior; the nine focused interaction/performance/transport tests pass. Pending-input ring is separate from modeled envelope glow. Blur/hide/Quiet/new passage/seed change reset holds and release pointer capture; audio interruption also resets pending holds. Physical multitouch remains unverified.

Camera/pointer follow-up: an active OrbitControls drag keeps subsequent body touches in camera control instead of acquiring a musical gesture midway; third interaction regression passes. Full-suite checkpoint during concurrent modal-network development: 297 tests, 295 pass, two failures in Fable's new modal-network fixtures (missing explicit clamped-free support), reported to Fable. Direct-play files do not change the sound model. No whole-suite green claim for this checkpoint.

Framing follow-up: moved the default camera closer so the directly playable shells occupy more of the scene. Safari responsive screenshots at 400×656 and 320×656 confirm the support, all bodies and numbered pads remain within the layout; the floor is intentionally cropped.

Direct shell playing peer review: Fable formally approved 8883cb2 in collab/reviews/20261101T0612Z-fable-reviews-grove-direct-play.md. Three interaction regressions independently rerun and pass. The richer modal-model comparison remains separate from this shipped voice; no unreviewed timbre replacement has been made.

Finished-capture replay (working tree): Safari320×656 exercised Enter → A/S gestures → Quiet → Listen back → natural ending. Status reached YOUR PASSAGE HAS SETTLED and replay remained available. Replay reads the same finished PCM saved by the capture mixer and uses its own audio clock for the original session's visual frame. It never edits recorded events or ending; Quiet during replay only stops playback. Two focused tests verify PCM copying, audio-clock position, cancelled preparation, stale completion isolation and interruption stopping. Peer review requested separately.

Finished replay formally approved by Fable (review20261101T0617Z). Combined replay/audition checkpoint: full suite301/301; original capture/save numerical behavior retained.

### Immediate passage restart

After Quiet, the top action now says “Begin another” and uses the same prepared-bank reset as New passage. Changing seed or voice still rebuilds the corresponding instrument; Resume still handles an interrupted audio context. A reset into a suspended context explicitly asks the player to resume audio. Safari verified original seed 7: Enter → A → Quiet → Begin another (immediate ready, no preparation phase) → S → Quiet. This is an interaction-only change; the original capture is replaced as with New passage.

### Rest worklet timing foundation (not yet a playable Rest route)

`src/grove/contact-events.js` schedules IDs and integer sample frames independently of model payloads. It acknowledges actual application time, preserves arrival order at the same frame, rejects duplicate IDs and capacity overflow, and forbids a backwards audio clock. New passages require a fresh queue. Model-application failure is fatal rather than retried after a possible partial mutation.

Four Node tests pass: render-block partition invariance with noncommuting sample commands, late-event acknowledgement and no duplicate application, bounded queue identity/capacity behavior, and preservation of actual application order when overdue events collide on one sample. Acknowledgements distinguish actual `order` from `arrivalOrder`; replay uses actual frame and application order. Safari 26.6.2's real AudioWorklet within OfflineAudioContext passed at both 44.1 and 48 kHz: expected stereo output samples match exactly (max difference zero), events at 127/128 retain sample-boundary placement, and a deliberately late request for frame 1 applied at frame 256 with 255 late frames acknowledged. Report: ignored `renders/grove-contact-clock-report.json`; harness `tests/grove-contact-clock.html`.

This proves the isolated sample-clock/queue behavior, not real device latency, live message-delivery timing, contact-model accuracy, or performance under load. The late arrival is injected deterministically at a worklet block boundary. Rest remains off the playable page until the model and live/offline equivalence checks pass.

The final browser clock report (2026-11-01T07:04:28.178Z) additionally checks monotonically increasing actual application order; both rates still pass with zero sample difference. Peer review of this scheduling slice is requested and pending.

### Shared Rest engine in AudioWorklet

Fable's kernel/recipe handoff ac1cc42 supplies all 343 simultaneous contact states for three bodies, three positions and two stated viscous strengths. The new isolated processor imports the same pure `src/rest/engine.js` as offline rendering. Matrix preparation runs in a worker; the audio loop uses preallocated state/read buffers. Per-body contact changes compose on the audio thread before pickup read and state advance. Every applied event returns its actual frame, application order and generation.

Safari 26.6.2 passed three cases (`tests/grove-contact-audio.html`): seed 3/48 kHz and seed 7/44.1 kHz with two overlapping contacts, a strike during contact and both releases; plus seed 11/48 kHz with contact commands sent through MessagePort after rendering begins. All output samples matched the shared offline renderer exactly (maximum difference zero). The port-delivery case reconstructs its interval from actual application acknowledgements. The test suspends offline rendering while awaiting a distinct queue-receipt acknowledgement, then resumes; without this handshake the offline render can run ahead of page-thread message delivery. This establishes sample parity under controlled delivery, not live-device latency or glitch-free real-time performance.

Final report: ignored `renders/grove-contact-audio-report.json`, generated 2026-11-01T07:10:25.710Z. Earlier two-case report is retained separately. Initial browser measurements prepared the 343-state recipe in 765–924 ms and rendered 1.2 seconds in 35–60 ms; these local OfflineAudioContext measurements are not hardware deadline guarantees. Nine focused kernel/recipe tests also passed when run by Astra.

Admission remains a gate before live use: total energy non-increase alone does not prove the former free-mode decay bound stays conservative under damping-induced modal redistribution. Astra requested a state-energy pickup bound rather than importing that assumption. The worklet currently validates commands but does not claim final live headroom admission. Peer adapter review is requested; the playable Grove remains unchanged.

### Rest admission and Quiet

The audio-thread adapter now checks `engine.candidateBound` immediately before each strike. Fable replaced the invalid free-mode decay assumption with an energy pickup bound: outputGain × sqrt(2 E_after) × max(sqrt(pᵀ A⁻¹ p)). Since contact/free damping removes mechanical energy between strikes, this bounds subsequent displacement-pickup output in the mathematical model. The old bound was refuted by Fable's tests (up to 1.253× under contact on seed 11); it is not used by Rest.

Decision messages are named `processed`, not `applied`: they carry accepted/rejected, actual frame/order, event, and bound/reason when relevant. Only accepted strikes belong in a saved performance. The dense-input browser case accepted seven strikes and rejected 26, with peak 0.33283695578575134 and exactly zero difference from a render containing only accepted strikes.

Quiet is an audio-clock command: at its acknowledged frame it releases contacts, begins the saved fade, and rejects subsequent commands. The worklet rounds each engine sample to Float32 before applying the fade, matching the offline saved-record path. At the exact fade end it emits `finished` and stops processing. The browser fixture checked a held contact, Quiet at frame 512 with a 64-frame fade, later strike/repeated-Quiet rejection, and completion at frame 576; output matched exactly.

Safari final report: `renders/grove-contact-audio-quiet-report.json`, generated 2026-11-01T07:17:35.353Z, five of five cases passed. This remains an isolated processor proof; host recording, live interaction and device-load testing are still outstanding. Follow-up review of the admission/Quiet adapter is requested.
