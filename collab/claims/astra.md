# Astra active claims

M2 committed e09464e. Astra owns main.js, audio.js, model.js, scene.js, bellows-audio.js, bellows-scene.js, bellows-ui.js, index.html/style.css and integration tests.
Shared stage active: vendor/three, src/stage/**, stage.html, stage.css, tests/stage*.js. Build bodies/lighting/cameras against Fable's state/bindings API; integrate existing canvases when API lands. README owned.
Fable owns state.js, bindings.js, clock.js, geometry.js, dynamics.js, their tests and docs/decisions. No edits there without handoff.
Mailbox polled at work checkpoints under continuing goal.
Export active: src/stage/export.js, vendor/mediabunny/**, tests/export-smoke.html/js. Fable owns src/stage/render-audio.js and stage-render tests. Stage input metadata now imported from Fable's catalogue; no edits to his source.

Lab state migration: src/snapshots.js, tests/snapshots.test.js and owned lab renderers; plain snapshots replace audio-engine objects.

Inspector route overlay: src/stage/route-overlay.js and inspector integration, stage.html.

Procedural camera direction: src/stage/director.js, layout.js, world/projection/main/export integration, tests/director.test.js.

Keeper scene foundation: src/stage/keeper-rig.js, tests/keeper-rig.test.js. Pure two-link articulation, endpoint-preserving reach checks; planner remains Fable-owned.

Keeper integration: src/stage/keepers.js, projection/main/export, stage.html, tests/keepers.test.js; Fable owns src/perform planner.

Bellows pump operators and per-actor inspection: keepers/projection/inspector, tests/keepers.test.js.

Damper state/inspection binding fixes and full-recovery scene configuration in owned stage files; tests/stage.test.js and tests/keepers.test.js.

Per-actor declared bindings now in owned keepers/projection/main/export/inspector with regression test; pending Fable shared metadata commit before checkpoint.

Loom playable study: loom.html, src/loom/**, tests/loom*.js. Pure signed-mode stereo buffer adapter and a 3D two-body study using existing lighting/world, pending coupling model commit/review.

Loom scored passage: src/loom/performance.js and tests/loom-performance.test.js; coherent repeated-strike superposition, pure arbitrary-time frame and stereo render for later stage integration.

Loom async preparation: src/loom/render-job.js, render-worker.js and tests/loom-render-job.test.js, cancel/supersede safe worker ownership and transfer.

Export artifact verification: tools/verify-stage-manifest.mjs and tests/verify-stage-manifest.test.js, regenerate full projected timeline/camera and validate metadata independently of encoded bytes.

Shared stage frame sampler: src/stage/frame.js, main/export/verifier integration, tests/stage-parity.html/js for real-browser scene pose replay at AudioContext timestamps and full-passage event boundaries.

Loom reusable scene and silent timeline: src/loom/scene.js, main.js/loom.html integration, tests/loom-scene.test.js. Declared seven bindings and arbitrary-time pose reset, no patch schema change yet.

Optional Loom ensemble: src/stage/composition.js, layout/world/director/frame/projection, tests/composition.test.js, future live Loom audio adapter. Fable requested offline render-audio adapter under existing ownership; no edits to it here.

FM tensioner visual study: src/tensioner/**, tensioner.html, tests/tensioner-scene.test.js. Fable owns src/fm.js and tests/fm.test.js. Scene consumes agreed plain tensionerState fields; no independent sound model.

FM ensemble integration: src/tensioner/performance.js; composition v2 + attachComposition; stage scene/frame/director/live adapter/main/export/verifier and tests. Fable requested offline render-audio FM adapter under existing ownership.

Explicit phrase integration: src/stage/performance.js createPerformanceFromEvents and tests/explicit-performance.test.js. Fable owns authoring score math/schema after contract reconciliation; Astra owns voice compilation and stage/export integration. Legacy route retained.

Authored performance assembly: src/stage/authored-performance.js and tests/authored-performance.test.js, consumes Fable's agreed compileScoreEvents recipe, attaches only enabled children with explicit timing, extends hold without trimming decay. Canonical score/export/UI integration follows generator handoff.

Score-event inspection: src/stage/score-inspection.js, inspector.js, main.js, tests/score-inspection.test.js. Resolve actual compiled voice/event identities back to authored section and anchor/weight; no scene hash changes.

Audition page: audition.html, src/audition/main.js, audition.css. Compare verified local legacy/conversation movies with single-source listening, selectable cadence/wide conversation view, and Fable's scoped analysis plots.

MIDI2 numeric boundary: src/midi2/values.js and tests/midi2-values.test.js. Spec-backed integer/fixed-point conversion helpers only; Fable owns event model and parser. No runtime integration until expression contract review.

Visual polish at Michael's request: src/stage/surface-lighting.js, world.js, bodies.js, director.js, stage.html, verifier camera mode allowlist, tests/director.test.js. Procedural studio reflections/material finish plus deterministic musical orbit camera.

MIDI file intake: src/midi/read-file.js and tests/midi-read-file.test.js. Local File-to-validated-NoteList/provenance boundary with pre-read byte limit and AbortSignal; not connected to stage until parser/mapping review clears.

MIDI desk: midi.html, midi.css, src/midi/desk.js, src/midi/preview.js and tests/midi-preview.test.js. Local intake UI with bounded note/track preview and parser warnings, progressing to mapping controls when Fable's compiler lands.

Imported stage adapter: src/stage/imported-performance.js and tests/imported-performance.test.js. Canonical imported source/plan, explicit child disabling, refusal of unresolved assignments or assigned-but-disabled children; preserve chosen settings and return mapping report for export/inspection.

Mapping UI: src/midi/mapping-desk.js, src/midi/desk-table.js and midi.html/css/desk.js. Per-channel instrument choices and excerpt/velocity controls, actual compiler report preview; stage transfer follows review.

MIDI stage handoff: src/midi/stage-transfer.js, tests/midi-stage-transfer.test.js plus owned mapping desk/main UI. Per-import session keys; validated source transfer; imported playback and export.

Experience direction: collab/notes/astra-spirituality-psychedelia.md — capture Michael's holistic intent and propose experiential design principles to Fable for vision integration; no runtime or roadmap displacement.

Listening doorway active: listen.html, listen.css, src/listen/**, tests/listen-*.test.js; reusable Loom physics/worker/scene, inviting curated passages with quiet/seek/reduced-motion and optional interpretation, links from owned index/stage. Fable owns src/score/loom-journey.js + its tests/contract, requested by mailbox.

Expressive bodies 011c: src/expressive/**, expressive.html, expressive.css, tests/expressive-*.test.js/html/js. Pure mapping/performance adapter, per-note scene, existing Bellows graph render and exact-buffer playback; Fable retains evaluator/fixture ownership.

Call and answer 013: touch.html/css, src/touch/**, tests/touch-*; direct touch/keyboard Loom instrument, gentle cues, captured local performance, existing coupled-pair model. Fable owns src/score/call-answer.js/tests and proposal definitions.

Grove 014: grove.html/css, src/grove/**, tests/grove-*; procedural network anatomy, playable encounter and recorded local performance. Fable owns network model in coupling layer and seeded generator/ritual in src/score/grove.js. Model topology drives visible connections; materials/layout are interpreted, no edge-energy flow claim.

Grove voice audition: grove-voices.html/css, src/grove/voices.js; local report/WAV A/B playback and scoped metric display. Fable owns comparison tool and generated artifact contract.

Optional Grove voice integration: src/grove/** and shared impulse transport/session buffer-slot routing, tests/grove-* and touch-transport. Fable requested pure signed-mode recipe in src/score/grove-voice.js; no v1 Grove schema changes.

Grove movie export: src/grove/movie-plan.js, export.js, world fixed-size option; tests/grove-movie-plan.test.js and grove-export-smoke harness. Frozen capture/model timeline plus supplied saved stereo PCM, independent local render world; no capture-schema changes.

Rest worklet scheduling: src/grove/contact-events.js and tests/grove-contact-events.test.js; integer sample-frame application acknowledgements, stable event order, bounded per-passage identities. Fable owns contact model/record renderer; no live route change before shared-stepper equivalence.

Rest shared-engine worklet: src/grove/contact-worklet.js and contact-prepare-worker.js; tests/grove-contact-audio.html/js. Imports Fable's src/rest/engine.js; per-body contact composition, actual applied acknowledgements and fatal stop. Offline browser equivalence only until admission and capture v2 integration are validated.

Rest capture adapter: src/grove/contact-capture.js and tests/grove-contact-capture.test.js; translate complete audio-thread acknowledgement streams into Fable's validated v2 record, with browser replay equivalence.

Rest live host: src/grove/contact-host.js, contact-job.js, contact-render-worker.js, worklet state snapshots and tests/grove-contact-host.test.js. Context/worker lifecycle, acknowledged picture/capture, offline saved audio, then UI integration.

Rest playable route: rest.html, rest.css, src/grove/rest-main.js and grove.html link. Explicit optional study with immediate strikes, held damping contacts, shared invitation and local recording downloads.

Rest replay: src/grove/rest-replay-picture.js, contact-picture-worker.js, rest-main UI, shared replay deferred PCM support and related tests. Worker-derived 60fps sampled model picture paired with exact saved PCM; no capture mutation.

Rest movie extension: movie-plan/export/shared controls, movie-plan-worker.js and Rest UI. Reconstruct Rest v2 model and exact ending, worker preparation, actual held-contact rings in rendered film.

First-minute experience: listen.html/listen main, grove.html, rest.html/rest-main; initial action/keyboard hints, consistent Escape, Rest scene reveal, exploratory next gesture after invitation.

First-use doorway: welcome.html/welcome.css, entry links in owned index/listen/Grove/Rest pages. Lightweight three-choice landing without audio/WebGL preparation; existing lab retained.

Optional Rest exploration UI: rest.html/css and rest-main.js; feed processed audio acknowledgements to Fable's guide, choose the body from the player's first accepted strike, and clear guidance across passage lifecycle changes. Model fixes remain Fable-owned.

Alternate Grove comparison: src/grove/rest-comparison.js, rest-comparison-worker.js and tests/grove-rest-comparison.test.js; preserve source capture, reconstruct target with explicit seed and source gesture parameters, render target audio/picture off-thread, report omitted strikes. UI follows core validation.
Comparison lifecycle: src/grove/rest-comparison-session.js and tests/grove-rest-comparison-session.test.js; cancel/supersede work without replacing a prior comparison or mutating the source passage.
Comparison UI integration: Rest main/html/css and optional namespace/filename metadata in shared movie-controls; explicit target selection, one replay owner, target scene and separate comparison downloads/film, original capture retained.


Powered encounter input: src/grove/powered-gesture.js and tests/grove-powered-gesture.test.js; single active contact across overlapping pointer/keyboard holds, explicit lift/reset, model-independent command emitter. Future powered worklet/host remain Astra-owned, pending Fable engine contract.

Powered sustained picking: optional acceptHit/change hooks in src/grove/interaction.js and tests/grove-interaction.test.js; existing strike/Rest callers unchanged, captured pointer motion reports local height or temporary off-shell lift.
Powered preparation worker: src/grove/powered-prepare-worker.js, builds only two c1 zones (27 combined states), fixed2s source and5s encounter at actual context sample rate; draft API consumer awaiting Fable's handoff.
Powered audio-thread processor: src/grove/powered-processor.js, powered-worklet.js, tests/grove-powered-processor.test.js; shared affine engine, sample-acknowledged contact/Quiet scheduling, explicit source cutoff and appended fade. Draft record integration awaits Fable zero-length-force policy.
Powered real-browser parity: tests/grove-powered-audio.html/js; OfflineAudioContext at48/44.1kHz, actual late MessagePort input, exact stereo samples and Quiet endpoint with downloadable hashes.
Powered capture adapter: src/grove/powered-capture.js and tests/grove-powered-capture.test.js; save only ordered processed acknowledgements, actual origin/Quiet and truncated source under new powered v2 record contract.
Powered live host: src/grove/powered-host.js, powered-render-worker.js, tests/grove-powered-host.test.js; explicit begin/Quiet/resume lifecycle, capture snapshots, cancellable preparation, exact same-browser worker replay and acknowledged visual state. UI follows host checks.
Powered playable surface: powered.html, powered.css, src/grove/powered-main.js, powered-picture-worker.js; two-position held contact, driven/release phases, local replay and saves; optional link from Rest after browser review.
Powered first-use: host and UI accept a currently held contact during preparation, drop released intent before audio starts, preserve acknowledged-only display; mark body01 visibly before playing.
Powered body identification: optional bodyLabels in src/grove/scene.js, custom readable sprite above body01, existing scene labels unchanged by default.
Powered startup timing: powered-worklet/host diagnostic fields and tests/grove-powered-startup.html/js; measure requested origin versus first process block and actual origin, separate from device-output latency.
Optional response history: src/grove/response-trace.js and tests/grove-response-trace.test.js plus powered UI; bounded sampled low-band history, fixed radial mapping, gaps remain gaps, no audio/model/export changes.
Trace causes: src/grove/response-causes.js and response-cause-arcs.js plus tests/grove-response-causes.test.js; actual acknowledged source/contact intervals, clipped to playhead, retained across Quiet, deterministic record replay.
Browser return lifecycle: powered-host/replay/page handling and tests; explicit park closes audio while retaining complete capture, persisted pagehide retains scene. Review analogous Rest/reopen owned lifecycle after powered evidence.
Return/first-use follow-up: reopen-main.js persisted-page cancellation and replay parking; powered.html moves optional trace beside finished encounter tools, collection unchanged.
Rest cached return: contact-host park/newPassage renewal, rest-main persisted lifecycle, focused host tests; retain only finished captures, completed comparisons/films and scene, cancel pending jobs.
Grove film cached return: main.js keeps completed movie URLs/listeners on persisted departure, cancels pending movie work; existing quiet/stop behavior remains. Current Listen/Touch/Expressive handlers do not dispose their transports.
Adaptation prototype review: collab/reviews/*astra* and local renders/bridge-metric-review counterexample; independent spring-power identity audit and experience constraints, no edits to Fable's model prototype.
Variant audition boundary: src/grove/rest-variant.js and tests/grove-rest-variant.test.js; explicit target Grove, strict all-gesture preservation, record-only reconstruction; experiment adapter only, no production UI yet.
Structural audition surface: variant-audition.html and src/grove/variant-audition.js; local explicit original/changed fixture playback on one shared audio element, optional study unlinked from main routes.
Fixture regeneration: tools/render-rest-variant.mjs renders fixed 20% bridge comparison from supplied finished Rest JSON; bounded through variant adapter, matching gain required.
Bridge-work audit: tools/audit-bridge-work.mjs independent interval-by-interval endpoint-power quadrature, preserves pre-impulse right endpoints, reports production differences and spring storage residual for supplied Rest capture.
Repeated adaptation evaluation: tools/render-adaptation-study.mjs and local renders/adaptation-study; same authored phrase re-applied to each successive structure, one/three-step audition records, declared model gain, full history, no production integration.
Three-stage audition: adaptation-audition.html and src/grove/adaptation-audition.js, shared local-audition-player.js extraction for existing variant page; explicit one-source playback, report-derived stage facts, no main route integration.
Optional adaptation anatomy: src/grove/structure-diagram.js plus adaptation-audition details; static saved-layout snapshots, fixed stiffness-to-width scale, no vibration or energy-flow depiction.
Personal saved-gesture experiment: src/grove/rest-adaptation.js, rest-adaptation-worker.js, tests/grove-rest-adaptation.test.js; bounded selected Rest file -> preserved original plus one explicit k=.5 variant, strict same-gesture/equal-gain pair, worker only before UI.
Own-gesture comparison surface: adapt.html and src/grove/adapt-main.js; local bounded file intake, cancellable worker, original/changed explicit replay, optional relative-connection views, changed-record download, cached-return preservation.
Saved instrument identity: src/grove/rest-instrument-identity.js, reopen-main.js and focused tests; compare canonical structure and voice before promising a curated Rest link. Changed structures must not be identified by seed alone.
Playable structure handoff: src/grove/rest-play-handoff.js and focused tests, adapt UI and rest UI; bounded session-only canonical pair+voice with explicit token, fresh live capture at current context rate, visible original/changed choice. Preserve comparison by browser return; never substitute a seed for the saved instrument.
Pair arrival refinement: rest.html/rest.css/rest-main.js; compact repeatable-gesture invitation, optional rule/hand mapping disclosure, clear original return and replacement notice. Short model invitation if supplied remains Fable-owned.
Short pair demonstration integration: src/grove/rest-main.js and rest.html; use Fable's pair score through existing invitation button, concise phase cues, safe early-Quiet wording, original/changed explicit selection, no autoplay or extra control.
Prepared example entry: assets/examples/rest-pair-gesture.json and adjacent provenance note; small canonical authored record for bounded workbench intake, no automatic audio or user-record substitution. Workbench button follows verified fixture.
Prepared example verification/provenance: tests/grove-rest-example.test.js; canonical fixture drift guard and full adaptation admission. Explicit prepared-example origin through session handoff and kept filename; own file remains first intake choice.
Workshop discovery: welcome.html/welcome.css; one clearly marked structural-experiment link under the existing workshop disclosure, header link opens that disclosure, three main doors unchanged. Native visitor path to prepared comparison and play verified before handoff.
Prepared-result arrival: adapt.html/adapt-main.js; accepted current preparation reveals and focuses its result heading without starting audio; respect reduced motion and hidden-page state. Addresses observed mobile result belowfold.
Workbench first screen: adapt.html/adapt.css scoped layout; both own-file and prepared-example actions visible at320×656, detailed file constraints optional, prepared source name human-readable.
Optional connection attention cue: scene.js bridge highlight method, Rest pair UI and pure cue helper/tests; static highlight of the actual most relatively changed connection, exact ratio caption, default off, no energy-flow animation or sound change.
Open musical phrase continuity: tests/grove-contact-continuation.test.js; verify authored opening followed by later live commands shares one processor/capture and rebuilds exactly, plus early Quiet cancels pending authored events. No new model or UI until score review.
Open phrase encounter: pulse.html, pulse.css, src/grove/pulse-main.js; separate optional prototype with authored opening, acknowledged release to untimed live response, explicit Quiet and local keeping. Existing Rest invitations unchanged.
Open-phrase preparation: src/grove/pulse-prepare-worker.js; keep measured phrase composition off the main thread and cancel it on departure.
Open-phrase listening evidence: tools/render-open-phrase-study.mjs and local renders/open-phrase-study; fixed opening and neighbor answer at three declared delays, equal gain/common ending, exact record/WAV reconstruction, no scoring or appeal claims.
Recurrence audition: tools/render-open-phrase-recurrence.mjs and shared tools/open-phrase-player.mjs; matched one/two-cycle opening and same delayed answer, explicit differing opening lengths, local reproducible artifacts only.
Optional listening note: tools/open-phrase-player.mjs; collapsed free-text note for the whole study, explicit local text download with selected-example context, no rating, network submission or automatic storage.
Harmonic ensemble audition: tools/render-harmonic-groves.mjs and local renders/harmonic-groves; three separately validated whole-cluster instruments, matched histories unison/triad, fixed1/3mixgain, per-part evidence and shared listening player. No cross-grove coupling or playback-rate transposition.

- Harmonic study link wording: tools/open-phrase-player.mjs optional escaped playLinkLabel, preserving existing studies default.
Project home/catalog: project.html, project.css, src/project-catalog.js and welcome.html project-home link. Local showcase with live route inventory, milestone/roadmap/vision/history archive and restart checkpoint.
Catalog restart resilience: tools/prepare-project-home.mjs; existing project-catalog.js availability handling for generated study links, local-only.

Project home return path: index.html brand destination and accessible label only.
Reproducible preliminary benchmark: tools/measure-ensemble-engine-cost.mjs, Node-only evidence with explicit excluded browser overhead.
Notebook readability: src/project-notebook.js, project.html/project.css and project-catalog.js dialog integration; conservative structural formatting plus exact raw-source disclosure.
Isolated ensemble browser diagnostic: tests/ensemble-diagnostic.html, tests/ensemble-diagnostic-main.js, tests/ensemble-diagnostic-prepare-worker.js. Silent live-worklet computation equivalence, no production host or realtime-output claim.
Ensemble capture support: src/grove/contact-capture.js and tests/grove-contact-capture.test.js opt-in silent snapshots (ordinary default unchanged); future src/grove/ensemble-capture.js, tools/keep-ensemble-diagnostic.mjs once model API agreed.
tests/grove-ensemble-capture.test.js: late-origin alignment, silent-contact preservation, contradictory completion refusal.

Ensemble encounter design: collab/notes/astra-three-groves-encounter.md; concrete first-minute interaction, visuals, implementation and evaluation gates.

Ensemble reopening: ensemble-reopen.html, src/grove/ensemble-import.js, ensemble-import-worker.js, ensemble-reopen-main.js, tests/grove-ensemble-import.test.js. Bounded local saved-record reader, explicit playback, cancellable worker.
Reader discovery: project-catalog.js and reopen.html cross-link; collab/notes/astra-ensemble-reader.md evidence.

Experimental ensemble host: src/grove/ensemble-host.js, ensemble-prepare-worker.js, ensemble-render-worker.js, tests/grove-ensemble-host.test.js. Shared context, acknowledged live capture, lifecycle and worker keeping; not a performance clearance.

Experimental playing surface: ensemble.html, ensemble.css, src/grove/ensemble-main.js.

Hold lifecycle verification: src/grove/hold-control.js, tests/grove-hold-control.test.js and ensemble-main.js integration. Distinct pointer/key/assistive ownership and cancellation, not audio acknowledgement state.

Listening-level prototype: src/grove/listening-level.js, tests/grove-listening-level.test.js, ensemble-host.js and ensemble.html/main.js. Explicit playback-only gain with sample ceiling; canonical capture/render unchanged.
Listening graph browser diagnostic: tests/listening-level.html and tests/listening-level-browser.js; muted offline Web Audio verification of gain/ceiling at 0 and20dB.

Rest/reopen listening integration: contact-host.js, replay.js, listening-control.js, rest-main.js/rest.html, reopen-main.js/reopen.html, ensemble-reopen-main.js/ensemble-reopen.html and focused host/replay/control tests. Explicit opt-in stage leaves other routes unchanged.
Interim listening-level disclosure: pulse.html, powered.html, grove.html and adapt.html until their paired live/replay integration.
Pulse/adaptation listening configuration: pulse.html/adapt.html and their main modules. Existing reviewed18dB stage and shared single-instrument preference, matching both comparison branches.

Powered listening integration: powered-host.js, powered-main.js, powered.html and powered-host tests. Same optional stage lifecycle and18dB shared live/replay control.
