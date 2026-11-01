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

### Rest acknowledged capture (2026-11-01 07:25 UTC)

`contact-capture.js` consumes the ordered audio-thread decision stream, omits rejected gestures and zero-length contacts, uses actual application frames relative to the first meaningful accepted gesture, and closes held contacts on Quiet. Missing/duplicate/contradictory acknowledgements make capture unusable; foreign generations and queue receipts do not alter it. Saving requires matching completion and a strike. Seven focused capture/queue tests pass.

Safari offline AudioWorklet harness: 5/5 pass, all comparisons zero difference. Quiet case now starts at context frame 64, captures a held contact and rejects two commands after Quiet, then rebuilds the resulting validated v2 record through `renderRestRecord`; all 512 saved samples in both channels exactly match browser output from frame 64. Evidence: `renders/grove-contact-audio-capture-report.json` (07:25:17.716Z), record `renders/grove-rest-first-capture.json`. This is controlled offline audio-thread evidence, not live-device latency or subjective listening. Worklet record limits and the live host remain next gates.

### Rest passage limits (2026-11-01 07:27 UTC)

Audio-thread admission now caps accepted strikes at128 and contact starts at256, reporting rejected decisions without changing model state. Contact releases and Quiet bypass those counts. First accepted strike/contact-on schedules ordinary acknowledged Quiet at origin+120seconds with25msfade; reserved event identity and a reserved queue slot keep this independent of host timers. Two actual-processor Node tests (minimal worklet globals shim, real engine and capture) exercise both count boundaries and all960000frames of a held contact at8kHz, yielding validated records. Nine focused tests pass. Bounded input queue overflow remains fatal, not an unlimited-input guarantee.

Safari browser regression remains5/5 with zero differences, including v2 replay: `renders/grove-contact-audio-limits-report.json` (07:27:00.970Z). Browser cases do not themselves reach count/duration limits; those boundaries are covered by the processor tests. Fable approved the capture adapter in ab981d7; limits implementation review requested separately.

Full local `npm test` run at this checkpoint:340/340passed (44.25s). Shared tree includes Fable's concurrent changes; this reports the observed suite, not ownership of those changes.

### Rest live host (2026-11-01 07:31 UTC)

`contact-host.js` connects actual AudioContext/worklet, worker-prepared recipe, acknowledged capture, worker-rendered saved PCM and optional timestamped model snapshots. Generation tokens isolate new passages; worker cancellation and node cleanup prevent stale completion. Host lifecycle tests cover superseded preparation, stale node errors, interrupted input, resume, fatal save exclusion and render cancellation. Shared limits now imported from Fable's `src/rest/limits.js`.

Real Safari AudioContext check passed (`tests/grove-contact-live.html`): strike, contact-on, contact-off, Quiet; nonzero shared lowband envelope plus held-contact picture; saved v2 passage rendered in worker to38192frames/ch at48kHz. `renders/grove-contact-live-report.json` generated07:30:43.296Z includes states, actual acknowledgements, visual snapshot, record and rendered-audio hashes. First strike arrived384frames later than requested; capture correctly uses applied frame. This does not measure speaker latency, dropouts or perceived responsiveness, and saved live audio is a model reconstruction rather than a loopback recording.

Offline browser harness now hashes actual worklet output for the512-frame capture segment, enabling Fable's independent Node comparison: `renders/grove-contact-audio-hashes-report.json` generated07:31:01.375Z. Five browser cases pass, zero differences; source Float32LE hashes begin e64841454c87 and d6cb525e5add. The live host is not yet connected to the main playable page.

### Optional playable Rest route (2026-11-01 07:36 UTC)

rest.html is linked from Grove footer. Immediate .55 manual strikes via shells/pads/A/S/D; held contacts via selected shell gesture, pads/J/K/L; zone and Light/Firm controls. Indicators consume acknowledged audio snapshots. Keyboard-accessible pad toggling also available. Invitation uses Fable's command recipe with 100ms lead, followed by Quiet and Your turn. Suspended audio permits queued release/Quiet. Four host lifecycle/scheduling tests pass.

Safari narrow layout 320x656 inspected: scene and control columns fit, no console error observed. Invitation ran to Quiet with hand indicators on bodies 1 then 2. Saved renders/rest-invitation-first-play/capture.json canonically equals restInvitationRecord (six strikes, three contacts); sound.wav byte-equals independent Node stereoWav(renderRestRecord(...)). Your turn then A, held J, S, Escape produced renders/rest-manual-first-capture.json: two strikes, contact384..32128, Quiet33024+1200 at48kHz. Switching to Grove7, striking pad2 and saving correctly identifies grove.seed7/body1. This verifies browser operation and artifacts, not perceived sound quality or mobile-device responsiveness. Direct shell picking shares the existing Grove binder; a fresh Rest-specific shell gesture check remains useful.

Fable page/scheduling review approved in261f6c6. Caption nits incorporated: manual strike strength fixed; neighbor response need not get quieter. Optional route has no replay/movie/import yet, explicitly stated.

### Rest Listen back (2026-11-01 07:40 UTC)

Listen back pairs saved PCM with a 60fps sampled picture from restRecordVisual, prepared in a worker. Exact final visual retained even when duration is not a frame multiple; no physics interpolation. Resume is invoked inside the initial gesture before awaiting deferred audio/picture. Quiet/new/grove changes cancel stale picture jobs. Eight focused replay/host tests pass, including deferred cancellation and sampled-model agreement.

Safari: two strikes and neighboring held contact replayed to YOUR PASSAGE HAS SETTLED. Cached replay visibly set body2 hand indicator on. Immediate Listen back then Escape stopped playback. Preserved downloads around a further replay/cancel cycle are byte-identical: renders/rest-replay-capture-before.json and rest-replay-capture-after.json (2.305s, two strikes, one contact). Safari overwrote earlier duplicate filenames; the preserved pair is the evidence. This checks browser behavior and capture preservation, not speaker fidelity or perceived timing.

### First-minute polish (2026-11-01 07:50 UTC)

Rest, Grove and the listening doorway now state a first action at the top; initial hints expose keyboard and headphone guidance. Rest reveals the instrument after successful entry, invitation start and Your turn, respecting reduced-motion preference. Invitation ending offers the next experiment without claiming a full demonstration was heard if it was stopped early. Doorway Escape invokes the same Quiet/pause path as its button.

Safari320x656: Rest entry brought the full scene under the sticky controls. A direct shell strike and direct Rest gesture saved renders/rest-direct-shell-capture.json: one strike/body1/position1, one contact/body1/zone1 from877952..880001, followed by Quiet. Listening runtime hint survived initialization; actual playback reached4.63s, Escape changed Pause to Continue with paused status. This is desktop narrow-layout evidence, not a phone performance claim. Removed Three's obsolete PCFSoftShadowMap setting in the shared world in favor of the PCFShadowMap fallback it already used; no intended visual change, browser warning eliminated. Syntax and diff checks passed; no new tests for these low-impact UI changes.


## 2026-11-01 — Three-door welcome

Astra added welcome.html and welcome.css as an optional static entry, with Listen, Play and Rest choices, a native workshop disclosure, and return links from the three studies. The root laboratory remains unchanged as a destination. No JavaScript, audio/video elements or preloads are present in the entry.

Safari responsive view checked at 320×656 and 1200×656. The initial hero was shortened after inspection: the narrow first screen now includes the first full choice; desktop shows all three choice headings. These are viewport layout checks, not real-phone performance measurements. Actual Play navigation opened the Grove in its unstarted state; the brand link returned to welcome. The workshop anchor scrolled to its disclosure, and opening that disclosure exposed all four destinations in Safari's accessibility tree. All local HTML targets exist.

Fable's actual review is collab/reviews/20261101T0753Z-fable-reviews-welcome.md (approve). Incorporated the measured passage duration correction as “About half a minute” and changed “a life” to “a response” in the introduction. No new simulation claims: light and motion reveal part of the model response, and each study states its interpretation boundary. No automated runtime suite rerun for these static HTML/CSS edits; targeted link validation and browser layout/navigation inspection were used.

## 2026-11-01 — Optional acknowledged gesture guide

The Rest guide is opt-in on a fresh manual passage. It chooses its body from the first accepted strike; the model then teaches another strike and a hand on that body, a lift, and a fresh strike with a hand on the connected neighbor. Prompts have their own polite live region. Dismissing the guide changes neither capture nor held contacts. Invitation, new passage, seed change, accepted Quiet and audio failure clear it.

Actual Safari validation and saved capture are recorded in collab/reviews/20261101T0803Z-astra-reviews-rest-exploration.md. The final UI groups the guide immediately above the numbered pads and reveals the whole prompt on activation. The narrow 320×656 inspection is a layout check, not a physical phone performance test. Host/capture regression tests passed 7/7; revised guide tests passed 2/2. Source syntax and whitespace checks passed. Full suite reported separately by Fable; not rerun by Astra for this UI slice.

## 2026-11-01 — Alternate Grove comparison preparation

Added pure preparation, a module worker, and a cancel/supersede-safe session. Fable reviewed the preparation core (ddf0428) and lifecycle (see 20261101T0810Z-fable-reviews-comparison-session.md); the recipe-size nit was addressed by omitting transition matrices from the result. Source admission is owned by Fable's strengthened transposeRestRecord. Six targeted adapter/session tests cover custom gesture vocabulary, source immutability, target record reconstruction, real omissions from a valid source, refusal of invalid inputs, cancellation, stale completion, failure, and disposal.

Actual Safari worker harness tests/grove-rest-comparison.html passed all six checks. Saved evidence renders/rest-comparison/worker-report.json includes source/target records and PCM hashes. Independent Node reconstruction and admission checks passed and both PCM hashes match the browser. Review scope and limitations are in collab/reviews/20261101T0810Z-astra-reviews-rest-transposition.md. This prepares the feature; Rest's user-facing comparison controls are not yet connected.
