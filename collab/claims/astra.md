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

Ordinary Grove listening: src/touch/transport.js (optional downstream stage, default bypass), tests/touch-transport.test.js, src/grove/main.js and grove.html. Paired live/replay control; saved sound/film unchanged.

Generated study listening: tools/open-phrase-player.mjs, tools/render-harmonic-groves.mjs, src/grove/media-listening.js and tests/media-listening.test.js. One media source and downstream stage shared across examples; canonical WAVs unchanged.

Optional ensemble introduction: ensemble-host.js/main.js, ensemble.html, tests/grove-ensemble-host.test.js and own introduction adapter. Bounded audio-clock authored schedule, fresh passage only, always cancellable by Quiet; Fable retains score/model and processor ownership.

Phone encounter and homepage milestone: ensemble.html/css, project.html/css, src/project-catalog.js; compact optional-introduction controls and surface current playable milestone without performance claims.

Direct ensemble replay: ensemble-main.js and ensemble.html, reusing reviewed replay/listening-control modules. Explicit listening after Quiet, same live/replay preference, static picture disclosed, capture unchanged.

Long ensemble return investigation: collab/notes/astra-ensemble-long-return.md and local renders/ensemble-long-return; measure full-duration fixture and define reader contract before changing bounded admission. Reader UI/import integration remains Astra-owned; Fable retains canonical renderer/model.
Long-return reproducibility: tools/measure-ensemble-return.mjs, authored full-duration fixture and canonical PCM hashes with Node-only timing/memory snapshot.
Mix-only prototype: src/grove/ensemble-mix.js and tests/grove-ensemble-mix.test.js; use existing validated recipes and public Rest engine, retain only final stereo mix, compare exactly to Fable's unchanged canonical full renderer. No reader limit expansion until integration agreement.
Full-duration reader integration: ensemble-import.js/tests, ensemble-reopen-main.js/html, ensemble.html and project-catalog.js; two-minute ending plus schema fade, unchanged byte/rate bounds, cancellable worker and elapsed preparation display, thin mix adapter once Fable's block API is ready.
Homepage return milestone: project.html current-edge sentence and Nov2 history entry, documenting direct replay and full-duration reader with limits left explicit in catalog/reader.
Derived return interaction proposal: collab/notes/astra-ensemble-derived-return.md; optional post-passage preparation, separate labelled result, original preserved, no automatic playback. Implementation waits for Fable's provenance/model contract.
Derived-return lifecycle: src/grove/ensemble-return-session.js and tests/grove-ensemble-return-session.test.js; immutable source snapshot, cancellable injected preparation, stale-result exclusion, previous derived result retained on retry failure and cleared only by explicit source replacement. No model/schema ownership change.
Derived-return preparation: ensemble-return-prepare.js/worker and tests; share bounded source parsing with ensemble-import.js, await rotation/hash API, produce separate canonical wrapper and exact mix, no playback. Fable owns model/schema.
Derived-return listening study: tools/render-ensemble-return-study.mjs and optional playLinkHref in open-phrase-player.mjs; authored original/rotation pair at shared gain, local canonical records/WAVs and provenance, no subjective listening verdict.
Derived reader: ensemble-import.js/tests, ensemble-reopen-main.js/html and reopen.css fingerprint wrapping; strict wrapper unwrapping with original byte/rate/duration bounds, declared-source label, derived download naming and ordinary-record reset.
Derived study discovery: src/project-catalog.js and tools/prepare-project-home.mjs; catalog the authored pair and include its reproducible local preparation alongside existing generated studies.
Derived-return encounter: ensemble.html/css/main.js; collapsed post-passage invitation, explicit cancellable preparation, shared single replay path, labelled separate keeping, source cleared only after a successful new mount and preserved across failed/cancelled starts.
Remembered-opening review: collab/reviews/*astra* and notes/astra-ensemble-seed.md; evaluate host scheduling, source preservation, boundary semantics and first-minute experience before approving a new schema or implementing it.
Continuation barrier prototype: src/grove/ensemble-continuation-barrier.js and tests/grove-ensemble-continuation-barrier.test.js; all-id acknowledgement accounting, observed audio clock, terminal cancellation; no live integration or new schema yet.
Continuation host integration: ensemble-host.js and tests/grove-ensemble-host.test.js; separate fresh-only integer-frame scheduler, barrier-fed acknowledgements/clock, Quiet cancellation, frame-clamped new input and retained completed metadata. No UI or wrapper yet.
Production continuation integration evidence: tests/grove-ensemble-continuation-live.test.js; real processor/host under mocked Web Audio plumbing, remembered-to-personal continuity and early Quiet capture/render parity, not device performance.
Continuation source retention: src/grove/ensemble-continuation-source.js and tests/grove-ensemble-continuation-source.test.js; prepare candidate source transactionally through an injected job, keep last validated original across failed/cancelled retries and live host replacement, immutable snapshots, generation cancellation. No schema ownership.
Continuation source preparation: ensemble-continuation-prepare.js/worker and focused tests; bounded ordinary source parsing, validated canonical text/source hash and same-rate continuation plan, off-thread, no playback.
Ordinary source policy guard: continuation-prepare.js, return-prepare.js and their tests; reject derived/seeded wrapper kinds before generic reader parsing so future reopening support cannot silently permit chained transformations.
Seeded keeping adapter: ensemble-seeded-keep.js/worker and tests; bounded source/capture snapshots, model wrapper construction, independent source verification before canonical text, explicit256KiB output refusal; no playback.
Continued-passage reader: ensemble-import.js, ensemble-reopen-main.js/html, ensemble-provenance.js and focused import/presentation tests; bounded seeded wrapper parsing, declared-history labels, signed handoff wording, ordinary/derived reset, explicit playback and distinct WAV name.
Continuation encounter keeping lifecycle: src/grove/ensemble-continuation-keep-session.js and focused tests; immutable source/capture/ledger snapshot, cancellable verified keeping, preserved capture after verification failure, stale-result exclusion and explicit origin. Encounter integration remains Astra-owned.
Continuation encounter integration: ensemble.html/css and src/grove/ensemble-main.js; optional silent source preparation then explicit playback/handoff, retained original outside host keeping, verified continuation downloads/retry and preserved sound, cancellation and native checks.
Remembered-passage showcase: project.html/project.css and src/project-catalog.js; current-edge invitation, short path to the optional memory flow, accurate milestone/history and checkpoint link. No change to engine or peer-owned docs.
Handoff playing-surface proximity: ensemble.html; move existing demonstration/model notes below voice controls so native narrow continuation arrival exposes playing controls beside the instrument. Preserve all disclosures and accessible references.
Continuation listening-study audit: tools/verify-ensemble-continuation-study.mjs and own review; independently compare canonical source/wrapper, actual kept answer history, rendered WAVs and player/report identities before catalog integration.
Generated-study narrow title: tools/open-phrase-player.mjs; responsive heading size only, keep desktop44px and reduce narrow to32px so authored listening choices arrive sooner. Preserve player/audio behavior.
Continuation study discovery: tools/prepare-project-home.mjs, src/project-catalog.js and project.html; fifth generated study with availability handling and current-edge listening link after independent source/history/WAV audit.
Close-view prototype: src/grove/view-framing.js and tests/grove-view-framing.test.js; geometry-bounded static camera fit respecting actual aspect and zoom, no sound/model change. Ensemble/world integration follows peer review of astra-ensemble-close-view.md.
Close-view integration: src/grove/world.js optional static focus framing; ensemble.html/css/main.js camera-only Together/C/E-flat/G controls, persistent unseen-voice caption, no host commands. scene.js remains unchanged for peer coordination.
Remembered-strike visual provenance: ensemble-host.js and grove-ensemble-continuation-live.test.js; accepted acknowledgement membership in current continuation plan, explicit false for ordinary/authored-new strikes, unchanged marker age and kept files. Fable requested for scene/marker style; ensemble toggle remains Astra-owned and waits for agreed interface.
Visual-response scale audit: tools/measure-ensemble-picture-response.mjs and local renders/ensemble-picture-response; production snapshot envelopes and current scene mapping magnitudes for the authored demonstration, not listening or perceptual-quality scores.
Close-view showcase: project.html and src/project-catalog.js; searchable Look closer invitation, concise history entry and notebook link for the reviewed optional view. No claim of improved pulse perception or sound/model change.
Remembered-mark encounter: ensemble.html/css/main.js; optional default-off checkbox and near-picture legend, fifth scene options argument distinguishRemembered, no persistence/audio changes. Fable owns marker/scene implementation and focused tests.
Frozen marker visual check: tests/grove-marker-preview.html and tests/grove-marker-preview.js; real scene at actual default strike position and fixed cue age, silent labelled diagnostic for native visibility inspection. No scene ownership or production audio change.
Body-study discovery and independent review: src/project-catalog.js, tools/prepare-project-home.mjs and own review/audit under renders/ensemble-body-audit. Four authored comparisons, actual page mix, no hearing claims; Fable owns producer and study artifacts.
Connected-body encounter: ensemble.html/css/main.js and grove-ensemble-continuation-live.test.js. Close-view body01/02/03 buttons with existing live-input gates; static readable labels through returned scene label objects, restore in Together; keep all main voice/hand controls onbody01. No engine/scene source or schema edits.
Direct close-body taps: src/grove/body-tap.js, tests/grove-body-tap.test.js and ensemble adapter/copy. Same-body down/up raycasts, bounded tap versus scroll/cancel, same active gate and acknowledged markers; buttons remain. No engine/scene source changes.
Direct-body hit selection: src/grove/body-picking.js and tests/grove-body-picking.test.js; stable identities from selected scene shell/core only, fresh camera/viewport mapping, no cue targets.

Family geometry exploration: tests/grove-family-preview.html/js and own family notes; silent production-scene diagnostic across candidate seeds and actual ensemble views before any live chooser integration.
Family framing checks: tests/grove-view-framing.test.js, extend actual maximum-response bounds check across the candidate seeds before choosing runtime families.
Family encounter transaction: src/grove/ensemble-family-mount.js, tests/grove-ensemble-family-mount.test.js, ensemble.html/css and ensemble-main.js; staged visual replacement with successful mount, pending selection isolated, remembered opening uses source groves.
Family showcase: project.html and src/project-catalog.js; optional family discovery invitation and linked implementation/evidence note, retain remembered-passage entry path.
Family listening audit: tools/verify-ensemble-family-study.mjs and own review; independently check curated anatomy, identical gesture vocabulary/timing, silent parts, report identities and exact block-mix WAVs before catalog inclusion. Fable owns producer.
Family-study discovery: src/project-catalog.js, tools/prepare-project-home.mjs and project.html; seventh generated study and direct home invitation after independent artifact audit.
Listening-to-playing bridge: tools/open-phrase-player.mjs optional selected-case link; src/grove/ensemble-family-arrival.js, ensemble-main.js and focused parser tests for curated query arrival, silent until explicit Begin. Fable owns family-study link metadata.
Family response diagnostic: tools/sample-family-picture-response.mjs and tests/grove-response-preview.html/js; sample actual authored family-study records into silent frozen/playable visual inspection, without scene-source or audio changes.

Follow-the-ring encounter: ensemble.html and ensemble-main.js; default-off visual option, near-picture response caption and explicit reduced-motion status. No host/audio/record changes.
Follow-the-ring discovery: project.html current-edge sentence and notebook link; no extra catalog card.

MIDI2 packet reader: src/midi2/ump.js and tests/midi2-ump.test.js; bounded UMP framing/native field decode ahead of Clip timing integration; preserve unsupported packet evidence.

Expressive comparison render: tests/expressive-compare-render.html/js and tools/finalize-expressive-compare.mjs; browser repeat renders from pinned score/patch snapshots, WAV/report identity verification and shared listening page.

Expressive comparison artifact tests: tests/expressive-compare-artifacts.test.js; explicitly synthetic fixtures verify corruption and rehashed semantic mismatches are refused, not browser audio evidence.

Clip structure and time: src/midi2/clip.js and tests/midi2-clip.test.js; preserve configuration/sequence origin and raw packets, explicit receiver tempo policy, no rendering or evaluator configuration changes.

Expression listening discovery: src/project-catalog.js, tools/prepare-project-home.mjs and project.html; catalog verified browser-rendered comparison, explicitly report manual browser preparation for fresh checkouts.

Clip score adapter: src/midi2/clip-score.js and tests/midi2-clip-score.test.js; bounded binary-to-symbolic import preserving setup timing and source end, refusing note-specific setup, reporting unsupported payloads without fabricated events. No playback until origin-aware render integration.

Clip playback window: src/expressive/clip-performance.js, tests/expressive-clip-performance.test.js and optional endSeconds in performance.js; preserve End-of-Clip silence plus release, render full setup then crop at first sample at/after origin, same source time for picture. No production import UI yet.

Clip browser verification: tests/expressive-clip-render.html/js; silent real OfflineAudioContext comparison of origin-aware crop against separately rendered full source, repeatability, sample bounds and release silence. Literal independent fixture, no encoder dependency or device-audio claim.

Expressive Clip encounter: expressive.html/css and src/expressive/main.js; optional local file preparation, bounded read, retained prior study on rejection, explicit Listen, source-origin picture timing, reported unsupported content and cancellation on source/page changes. Existing symbolic studies preserved.

External Clip fixtures: tests/fixtures/jazz-soft-clips/** and tests/midi2-external-clips.test.js; pin unchanged MIT-licensed upstream sample bytes and provenance, validate declared notes/timing/groups and explicit subset refusals without executing upstream code.

Expressive close view: expressive.html/css/main.js and src/expressive/view-framing.js if needed; explicit all/selected view, fixed full-response geometry framing, view-only choice and caption, no audio/score/save changes. Fable requested to own view-bounds.js and its geometry tests.

Expressive view controller tests: tests/expressive-view-framing.test.js; camera fit, stable view between animation frames, hidden picture-body selection and return of orbit limits. Injected boxes until Fable's full-response bounds handoff.

Home attention paths: project.html/project.css/src/project-catalog.js; two concise routes in current-edge panel, optional existing memory instructions, expressive close-view discovery and accurate notebook/history. No welcome-page, model or peer docs edits.

Inverse-network feasibility probe: tools/probe-inverse-network.mjs and collab/notes/astra-inverse-network-probe.md; constructive ambiguity example using unchanged coupledNetwork, exact shared target pickup and withheld gesture comparisons. No optimizer, runtime or acoustic-body claim; Fable owns independent assessment.

Network ambiguity audition: tools/render-inverse-network-study.mjs, generated renders/inverse-network-study; render the probe's admitted networks under identical target and withheld impulses, shared scale/fade, hashed source report and PCM artifacts. Explicit listening only, no catalog integration or Grove-voice substitution.

Native media diagnostic: tests/inverse-network-media.html; explicit local WAV playback with observable metadata/events to distinguish Safari native-control display from a real load failure. No production player change until observed evidence.

Inverse workshop instrument adapter: src/inverse/instrument.js and tests/inverse-instrument.test.js; immutable validated canonical Grove → exact three-mass coupledNetwork strike response, one fixed displacement gain across candidates, bounded finite stereo render and matching visible envelopes. No Grove voice partials, no solver edits.

Inverse preparation lifecycle: src/inverse/prepare-worker.js, src/inverse/jobs.js and tests/inverse-jobs.test.js; terminate replaced/cancelled search or render workers, ignore stale results, transfer only completed candidate PCM. No autoplay or UI integration yet.

Inverse playing transport: src/inverse/transport.js and tests/inverse-transport.test.js; explicit strikes at the AudioContext clock, maximum eight overlapping responses, Quiet, no candidate replacement during a ring, observable per-strike picture times. No automatic resume or playback.

Inverse native preparation diagnostic: tests/inverse-worker-browser.html; explicit silent real module-worker search, cancellation and candidate PCM transfer verification. Browser result is separate from audio-device evidence.

Inverse workshop encounter: inverse.html/inverse.css/src/inverse/main.js; authored editable resonance target, bounded cancellable search, explicit candidate preparation and listening, touchable three-mass schematic, visible fit and realism limits. No solver/model edits or publishing.

Inverse workshop discovery: project.html/src/project-catalog.js and own workshop note; concise home invitation, catalog entry, current roadmap/history and source notebook link. Preserve established attention paths; no general audio-inference claim.

Inverse spatial prototype: src/inverse/picture.js, src/inverse/scene.js, tests/inverse-picture.test.js and tests/inverse-anatomy-preview.html/js; reuse Grove artistic forms in a silent diagnostic with actual fitted candidates, fixed envelope display gain and static full-response bounds. No production page integration or shared scene edits yet.

Inverse close framing: src/inverse/scene.js, tests/inverse-scene-bounds.test.js and existing silent preview; fixed body/bridge/halo/touch-mark bounds separate from ornamental support, compare overview and closer framing without changing geometry or sound.

Inverse spatial picking: src/inverse/picking.js and tests/inverse-picking.test.js; stable raycast identities for actual shell/core meshes and bridge tubes, no support/halo/cue targets, no audio side effects. Fable requested to own focus-bounds.js and its tests separately.

Inverse spatial mount: src/inverse/spatial-view.js and tests/inverse-spatial-view.test.js; synchronous preflight picture plus transactional transport mount, retained prior scene/focus on failure, resource cleanup and static view selection. Production integration in inverse.html/css/main.js follows these checks; numbered controls remain available.

Inverse spatial discovery: project.html and src/project-catalog.js; extend the existing workshop entry and history, link the evidence note without a duplicate catalog card.

Inverse repeated-touch invitation: inverse.html/css/src/inverse/main.js; retain only the last admitted body index and source topology for this visit, offer an explicit gated repeat on the current anatomy, no autoplay or new schema. Fable owns the comparison design note.

Inverse view continuity: src/inverse/spatial-view.js, tests/inverse-spatial-view.test.js and main.js; preserve body/overview choice across successful mounts, map bridge views by unordered endpoints, disclose fallback for absent connections, retain prior view/fallback on failed mount.

Inverse live diagnostic: tests/inverse-live-preview.html/js; explicit fitted-chain preparation and audio-clock strike, separate RAF/resize/manual-render counts and sampled visual levels, no production changes or inferred device-audio claims.

Inverse listening level: src/inverse/transport.js, tests/inverse-transport.test.js, inverse.html/css/main.js; shared visitor-controlled 0..4 monitoring gain with default1, bounded smooth live changes, unchanged PCM/model/display and candidate-independent level.

Inverse gain render diagnostic: tests/inverse-level-render.html/js; actual OfflineAudioContext output for mute, unity, fourfold scale and interrupted live ramps through production transport, with explicit offline state facade and no device playback.

Inverse first entry: inverse.html/css and src/inverse/main.js; reveal response only after first successful mount, retain across later work, collapse empty initial grid and clarify the starting-example action.

Inverse candidate maps: src/inverse/candidate-diagram.js, main.js and inverse.css; static numbered schematic from actual candidate edges to aid choice before preparation, no coupling-strength or response encoding.

Inverse saved instrument intake: src/inverse/read-file.js, tests/inverse-read-file.test.js; bounded selected local UTF-8 bytes with cancellation checks. Later owned UI/worker integration consumes Fable canonical saved-candidate contract; no schema edits here.

Inverse keep/reopen integration: inverse.html/css, src/inverse/main.js and prepare-worker.js; explicit local keeping, validated single-candidate reopening without replacing the prepared instrument, separate preparation/listening and cancelled intake preservation. Fable owns src/score/grove-inverse-kept.js and schema tests.

Inverse browser return verification: tests/inverse-kept-browser.html/js and tests/fixtures/inverse-kept-chain.json; real local File read, disposable worker reopen/preparation, byte/PCM conservation and refusal/cancel/retry evidence, distinct from native file-picker/production UI checks.

Inverse catalog continuity: project.html and src/project-catalog.js; describe kept-anatomy return and add history milestone after native verification, preserving model and evidence limits.

Inverse shared-gesture scheduling: src/inverse/transport.js and tests/inverse-transport.test.js, later main/html integration; atomic bounded audio-clock source scheduling, pending-slot accounting, no premature picture response, Quiet cancels future sources. Fable owns phrase score and rationale.

Inverse shared-gesture encounter and offline verification: inverse.html/css/src/inverse/main.js and tests/inverse-gesture-render.html/js; explicit listening gate, pending-aware locks and status, visitor touch memory preserved; real offline schedule and cancellation comparison. Fable owns authored score.

Inverse cross-anatomy gesture reminder: inverse.html and src/inverse/main.js; remember the last admitted phrase only within current results, offer the existing action on another prepared anatomy after explicit listening, no record or visitor-touch mutation.

Inverse manual-touch receipts: src/inverse/transport.js and tests/inverse-transport.test.js; expose the actual scheduled AudioContext origin after admission for later visitor-phrase capture, preserve the existing boolean strike API and rollback/gain/overlap behavior. No capture or schema integration yet.

Inverse visitor phrase capture: src/inverse/phrase-capture.js and tests/inverse-phrase-capture.test.js, later inverse.html/css/main.js integration; explicit transactional visit-local draft, admitted audio-clock receipts only, eight-touch/eight-second limits, natural-tail replay and previous phrase preservation on cancel. Fable owns src/score/grove-inverse-phrase.js and its tests/contract.

Inverse phrase render verification: tests/inverse-phrase-render.html/js; actual offline audio-clock manual receipt capture, same-anatomy replay and cross-anatomy PCM reference checks. Explicit silent diagnostic, no device-audio or visitor-preference claim.

Inverse visitor phrase encounter: inverse.html/css and src/inverse/main.js; optional capture disclosure, visible draft state, Done/Quiet distinction, same-phrase replay across candidates and current-results lifecycle gates, consuming reviewed receipt and capture modules.

Inverse portable passage integration: src/inverse/phrase-capture.js, main.js, prepare-worker.js, inverse.html/css, capture tests and inverse browser harnesses; precomputed declared-origin digest, retained original anatomy, atomic reopened phrase installation and explicit local keep/open. Fable owns phrase v2 and portable passage schema/tests.

Inverse phrase continuity across questions: main.js/inverse.html plus home/catalog/history; preserve completed original across searches, explicit Forget, digest-based comparison invitation and original target disclosure. No solver/model/schema edits; Fable owns diversity-study proposal.

Inverse repeat-search encounter: inverse.html/src/inverse/main.js, later evidence note; one explicit bounded search of displayed target/tolerance/base family with incremented solver seed, retained original phrase, exact prior/original anatomy identity labels. No distance thresholds or solver wrappers.

Inverse original-anatomy return: inverse.html/src/inverse/main.js and own evidence note; explicit silent preparation from retained original record while preserving displayed discoveries, original-target fit labeling and existing capture/replay gates.

Inverse encounter hierarchy: inverse.html/inverse.css and own evidence note; candidate-first results, secondary repeat-search action, grouped phrase-making versus saving/forgetting and optional record detail. No runtime state changes or new presentation mode.

Home/catalog explore-and-return copy and bounded entry review: project.html, src/project-catalog.js; welcome.html/listen.html/expressive.html stage-link labels aligned with The Conservatory, preserving Three Groves as the separate playable ensemble.

Grove-family entry clarity: src/project-catalog.js and grove-voices.html; distinguish one three-body instrument from three separate Groves, correct stale original-only voice copy, direct partials entry using existing query parameter.

Grove greeting handoff: src/grove/main.js and own validation note; existing top Begin becomes explicit Your turn while authored greeting is playing, using existing fresh-passage reset and preserving suspended/resume gates.

Single-Grove response diagnostic: tests/grove-touch-preview.html/js, uses production original/partials sessions and scene with frozen time, no audio. Existing baseline versus optional floor-ring mapping comparison; no product behavior changes.

Inverse local-sound boundary: src/inverse/sound-file.js and tests/inverse-sound-file.test.js; bounded selected-file reader and pure uncompressed RIFF/WAVE parser preserving sample rate/channels. No microphone, decoder context, resampling or estimator claim.

Inverse sound boundary native diagnostic: tests/inverse-sound-browser.html/js; generated real File read/parse and cancellation check, no picker or playback. Evidence in collab/notes/astra-inverse-sound-input.md.

Local inverse sound inspection: inverse-sound.html/css; src/inverse/sound-inspection.js, sound-summary.js, sound-worker.js; tests/inverse-sound-summary.test.js. Worker parsing, waveform and exact-file identity only; no resonance estimator or microphone.

Extensible WAV compatibility: sound-file parser/summary/inspection metadata and owned tests; documented uncompressed PCM/float subformats, no channel remix or rate conversion. Fable source untouched.

Listening-to-touch continuity: listen.html/src/listen/main.js and touch.html/src/touch/main.js; carry the selected journey through existing study/bridge query parameters, explicit silent entry, no model or transport changes.

Touch staged connection choice: owned main/html UI; quiet and preserve current passage when selecting another connection, replace only on explicit Enter. Shared transport remains unchanged.

Touch saved-passage return foundation: src/touch/record.js and tests/touch-record.test.js; strict bounded validation/reconstruction of existing Touch v1 gestures using the original session admission rules. Future return UI remains within src/touch ownership; Rest/adaptation schemas untouched.

Touch return preparation: src/touch/return-preparation.js, return-worker.js, return-session.js and tests/touch-return.test.js; bounded off-main-thread original reconstruction and transactional file replacement. Reuses owned disposable-worker lifecycle; no comparison yet.

Touch return page: touch-return.html/css and src/touch/return-main.js, plus entry links in owned Touch/catalog files after native validation. Original sound and analytic two-body replay, explicit start/Quiet, local saves; no derived comparison.

Touch comparison foundation: src/touch/comparison.js, return-preparation.js record entry point, tests/touch-comparison.test.js. Explicit known connection target, all source gestures retained/admitted, source unchanged. No comparison UI or derived-file schema in this slice.

Touch comparison interface: comparison-worker.js and return page main/html/css. Separate original/comparison controls, explicit silent preparation, one replay owner, named WAV copies, changed settings/pickup scaling visible; source remains unchanged.

Home living overview: project.html current edge, roadmap/history and source-notebook links for Touch return/comparison and local WAV inspection. Preserve Three Groves access and distinguish implemented local paths from unevaluated listening and pending reviews.

Touch return portable chosen version: touch-return.html, src/touch/return-main.js and tests/touch-comparison.test.js. Save shown version as existing standalone v1 gestures, explicitly without original/comparison history; preserve source separately.

Touch return still-picture choice: owned return HTML/CSS/main. Respect reduced-motion preference on initial load and allow explicit opt-in/out; static resting model picture, unchanged playback and exports, accurate caption.

Independent duration audit: tools/audit-sound-study-duration.mjs and collab/notes/astra-sound-duration-audit.md. Read-only import of Fable's estimator; paired actual truncated samples versus full recording at identical spectral windows, with explicit available durations and source hash. No estimator or production edits.

Listening-position continuity: src/listen/main.js, src/touch/main.js, tests/listen-transport.test.js. URL-only quiet return marker, tied to originating study; no gestures/audio storage and no autoplay.

Passage-history sampling study: tools/audit-touch-history-sampling.mjs and collab/notes/astra-touch-history-sampling.md. Analytic model samples only, no production rendering or sound changes; evaluate interpolation and exact-event/ending boundaries against dense sampled references.

Touch history foundation: src/touch/history.js, history-worker.js, tests/touch-history.test.js. Bounded deterministic full-passage visual-envelope history, exact gesture metadata and split strike boundaries; independent worker, no production page integration yet.

Touch history diagnostic: tests/touch-history-diagnostic.html/js and history-worker.js text input adapter. Silent real-worker view with explicit fixed scale, exact gesture list and bounded file intake; no production link yet.

Touch history comparison: src/touch/history-comparison.js, history-comparison-worker.js, tests/touch-history-comparison.test.js, and owned diagnostic UI. Shared duration/ceiling, explicit settings/pickup scaling, original retained; no audio or production integration.

Optional circular history diagnostic: src/touch/history-layout.js, tests/touch-history-layout.test.js and owned diagnostic. Same samples/shared axes/strike breaks; named static time-circle alternative, strips default, no product promotion or audio changes.

Live Touch still-picture choice: touch.html/css and src/touch/main.js. Match replay's explicit listening preference, initially respecting reduced motion; retain sound, gestures and keyboard/pad feedback while hiding body/striker animation.

History browser boundary harness: tests/touch-history-browser.html/js. Real module workers, exact builder parity, cancellation after dispatch and superseded replacement retention; silent, no timing-based simulated workload.

Custom Touch connection continuity: src/touch/connection-link.js, tests/touch-connection-link.test.js and owned live/return UI. Exact four-setting local URL route for valid non-preset instruments; explicit silent entry, no gestures in URL, known preset links preserved.

Touch connection discovery study: tools/study-touch-connections.mjs and collab/notes/astra-touch-connection-study.md. Fixed tuning/loss and identical admitted gestures across six declared connections, real PCM metrics and optional local listening artifacts. No model edits or automatic product preset expansion.

Loom-to-Touch design handoff: loom.html/src/loom/main.js and owned Touch main/footer. Reuse existing settings URL contracts for a quiet bidirectional instrument handoff; no study score or old live gestures carried.

Loom first-use layout: loom.html, loom.css and src/loom/main.js. Primary strike controls before the scene; bounded scene height; native wheel scroll remains page navigation, drag orbit retained. Shared world/stage styles untouched.

Touch passage filenames: src/touch/keep-name.js, tests/touch-keep-name.test.js and owned live Touch UI. Optional local filename label, no record-schema or audio change; paired WAV/JSON names and visible download guidance.

Touch return filename continuity: owned return-main.js/touch-return.html and shared keep-name helper. Retain opened labels on original export; distinguish comparison filenames and expose both names before downloading.

Touch recurrence study: tools/study-touch-recurrence.mjs and tests/touch-recurrence-study.test.js. Three authored timing patterns with identical instrument, alternating sides, strengths, first/last gesture and Quiet; local generated listening/gesture artifacts, no production model changes.

Touch meeting audit: tools/audit-touch-meeting.mjs and tests/touch-meeting-audit.test.js. Compare the existing before/after cue against a matched no-new-touch window. Shared Fable-owned call-answer logic is unchanged; owned Touch copy clarifies the metric.

Two-millisecond touch listening study: tools/study-touch-interference.mjs and its evidence note. Local rendered controls with identical prefix, one added right gesture or its two-millisecond shift; source records and WAVs only, no production behavior edits.

Touch close views: src/touch/view-framing.js, tests/touch-view-framing.test.js and owned Touch UI. Optional body-specific fixed framing, stable full-admission bounds, previous orbit restoration, visual-only isolation with both pads and audio retained.

Saved Touch close-view continuity: touch-return.html/src/touch/return-main.js and shared touch-view.css. Reuse live camera bounds and control styles; focus choice changes only the picture during original/comparison replay.

Completed November 3 independent research maintenance (ownership returned to stable; evidence in collab/notes/astra-sound-study-review-fixes.md): Astra took responsibility for the review fixes in tools/study-sound-file-target.mjs and tests/inverse-sound-study.test.js while Fable is unavailable, under the lead's reassignment role and Michael's explicit continue-without-Fable direction. Both paths were clean before edits. Preserve prior findings as historical; revise observation-window metadata, one-to-one truth matching, and threshold terminology. No production estimator promotion.

Completed sound candidate reliability study (stable): tools/study-sound-candidates.mjs, tests/sound-candidate-study.test.js and own evidence note. Controlled amplitude/spacing/noise sweep using the corrected research estimator, explicit one-to-one threshold-candidate metrics and residuals; no production acceptance rule.

Completed local source audition (stable): inverse-sound.html/css, src/inverse/sound-inspection.js, sound-worker.js, sound-audition.js and tests/inverse-sound-audition.test.js / inverse-sound-browser.js. Explicit playback of decoded source through existing replay lifecycle; declared attenuation, untouched analysis samples, replacement/cancel/visibility quiet.

Completed source listening position (stable): owned inverse-sound page and inspection code. Optional clock-driven marker across the unchanged channel waveforms, reduced-motion default, narrow playback control layout; no analysis or sound change.

Completed solo continuation checkpoint (stable): docs/ROADMAP.md M18 heading/current checkpoint and append-only docs/LOG.md, plus owned project history. Lead-maintained status reconciliation while Fable is unavailable; preserve historical entries and distinguish shipped local behavior, research and pending reviews.

Completed joint decay research (stable): tools/study-joint-decay.mjs, tests/joint-decay-study.test.js and own evidence note. Bounded fixed-frequency exponential mixture fit with explicit supplied frequencies, independent residual reconstruction, and known-answer controls; no production estimator or shared physics edits.

Completed joint-fit listening study (stable): tools/render-joint-decay-study.mjs, generated local renders/joint-decay-study, own evidence note and catalog entry. Same-gain source/reconstruction WAVs, actual withheld noisy suffix metrics, explicit supplied-frequency limitations; one player and no automatic target handoff.

Completed estimated-frequency fit study (stable): tools/study-estimated-joint-decay.mjs and focused tests/evidence note. Feed all threshold-passing spectral candidates into the bounded joint fit without ground-truth selection, refuse counts outside its 1..4-mode scope, and score actual withheld observations only afterward. No production promotion.

Completed bounded frequency-refinement study (stable): tools/study-refined-modes.mjs and focused tests/evidence note. Preserve initial spectral candidate count and estimates, jointly vary frequencies within explicit non-crossing bounds and decays within 0.1..8 s, then score unseen suffixes. No new production acceptance rule.

Completed explicit mode alternatives study (stable): tools/study-mode-alternatives.mjs, focused tests and evidence. Fixed hypothesis grid around spectral candidates, train/validation/final-test split, no final-test-guided selection and no automatic physical target declaration.

Completed playable resonance-sketch foundation (stable): src/sketch/model.js and tests/resonance-sketch.test.js. Construct independent unit-mass damped oscillators from explicitly supplied fitted modes; retain quadratures as displacement/velocity initial conditions, declared pickup scaling and bounded audition renders. This does not identify geometry or imply an impulse-only exciter.

Completed sketch playback transport (stable): src/sketch/transport.js and tests/sketch-transport.test.js. Worker-friendly PCM preparation, explicit-running-context activation, conservative per-activation overlap reservations, Quiet fade retaining reservations until stop, and audio-clock model envelopes. No automatic audio resume.

Completed sketch worker/browser boundary (stable): src/sketch/prepare-worker.js and tests/sketch-transport-browser.html/js. Real worker transfer/cancellation and silent OfflineAudioContext graph checks; fixed scheduling clock explicitly scoped, no hardware-output claim.

Completed first playable resonance-sketch page (stable): sketch.html, sketch.css, src/sketch/main.js and owned project catalog. Six explicitly supplied study interpretations, worker preparation, user-started listening, individual/whole activation and optional envelope picture. Model limits and per-sketch pickup gain visible; no automatic inference or geometric recovery.

Completed shared sketch gesture (stable): owned src/sketch/transport.js, main.js, sketch.html and transport Node/browser harnesses. One explicit authored three-activation pattern on the audio clock, future envelopes remain silent, Quiet cancels queued activations, and busy sketches refuse comparison playback. Preserve distinct source interpretations and declared gain differences.

Completed sketch decay variation (stable): src/sketch/variation.js, tests/sketch-variation.test.js and owned sketch page. Explicit bounded decay multiplier, unchanged supplied frequencies/quadratures/pickup gain, staged controls and clear return to fitted decays; variations are creative constructions, not new recording fits.

Completed returnable sketch address (stable): src/sketch/address.js, tests/sketch-address.test.js and owned sketch UI. Bounded versioned fragment embeds exact source parameters and staged multiplier after preparation, silent reopening without generated-report dependency, explicit address update and declared-label limits.

Completed sketch milestone reconciliation (stable): lead-owned current M18 checkpoint in docs/ROADMAP.md, append-only docs/IDEAS.md and docs/LOG.md, owned project history. Reconcile completed research and play/shape/return work, preserve prior evidence, name next creative/modeling/evaluation boundaries while Fable is unavailable.

Completed spatial sketch construction study (stable): src/sketch/spatial.js, tests/sketch-spatial.test.js, tools/study-sketch-space.mjs and own evidence note. Authored sine mode shapes on a dimensionless line, signed activation/pickup projections, one source gain across positions, zero-node behavior and explicit absence of inferred geometry/local material law. No existing page or kept-address schema change in this foundation slice.

Completed first spatial sketch page (stable): sketch-space.html/css, src/sketch/space-main.js and spatial-worker.js, tests/sketch-space-browser.html/js, owned sketch.html/main.js handoff. Explicit kept-source handoff, staged activation/pickup profiles and signed weights, worker-rendered fixed-gain audition, node silence, Quiet/visibility cancellation, source-return link; spatial positions remain visit-local and are labelled as such.

Completed spatial pair comparison (stable): owned sketch-space.html and space-main.js. Explicit visit-local held pair, current/held audition through one replay lifecycle, exact prepared identities and fixed gain, draft independence and release; no new persistence or model change.

Completed spatial narrow-layout refinement (stable): owned sketch-space.html/css. Adjacent current/held listening choices, preparation next to position controls, direct listening/position navigation and an optional numerical table; preserve visible authored profiles and all existing IDs/transport behavior.

Completed spatial layout navigation (stable), src/sketch/space-main.js: scroll buttons preserve the source-bearing URL fragment.

Completed spatial checkpoint reconciliation (stable): docs/ROADMAP.md and owned project.html history; record completed spatial study and preserve remaining geometry ambition.

Completed geometry impulse study (stable): owns new src/tine/impulse.js, tests/tine-impulse.test.js, tools/study-tine-impulse.mjs and collab/notes/astra-tine-impulse.md. Consume Fable-owned geometry.js unchanged; dimensional modal mass, velocity-only point impulse, signed pickup and independent mechanical checks. Foundation before a page.

Completed tine audible boundary (stable): owns src/tine/render.js and render-worker.js, tests/tine-render.test.js and tine-browser.html/js. Fixed velocity pickup gain, explicit alias/headroom refusal, ending fade, real worker/offline replay parity before an encounter page.
Completed first tine encounter (stable): owns new tine.html, tine.css, src/tine/main.js. Staged length/width/strike/pickup, static dimensioned plan view, explicit worker preparation, fixed-gain current/held comparison and quiet lifecycle. No changes to garden or shared model.

Completed tine discovery (stable): owned src/project-catalog.js entry; docs/ROADMAP.md continuation evidence and next encounter boundary.

Completed tine encounter refinement (stable): owns tine.html/css and src/tine/main.js. Bring preparation next to controls, add source-independent focus/scroll navigation, compact narrow introduction and verify keyboard preparation focus.
Completed tine checkpoint reconciliation (stable): owns project.html history append and docs/ROADMAP.md current evidence; next visual response remains separate from static geometry.
Completed tine full-control-range admission (stable): owns render.js gain correction, tine-render test and UI-range study tool. Uniform gain 100 instead of 200 admits all displayed settings without per-body normalization; update page captions and verify browser parity again.

Completed first tine response picture (stable): owns src/tine/envelope.js, response-view.js, tests/tine-envelope.test.js and owned tine.html/css/main.js integration. Optional fixed-scale modal displacement-envelope bands follow the replay clock; distinguish bound from signed phase, mechanical decay from audition ending, prepared identity from draft.

Tine response checkpoint also updates owned catalog copy, M18 and evidence notes.

Completed tine response reading (stable): owns tine.html/css and response-view.js; picture-only modal selector, readable HTML scale and compact explanation. Audio remains the four-mode prepared response; inspect narrow layout and mode switching.

Completed tine return record (stable): owns new src/tine/address.js, tests/tine-address.test.js and owned tine.html/main.js integration. Strict versioned page-grid design, captured from successful preparation; address keep/reopen stays quiet and independent of held/draft state. Unsupported addresses require explicit reset.

Tine phrase foundation: owns new src/tine/phrase.js and tests/tine-phrase.test.js. Bounded repeated impulses share one modal body; sum state before energy, preserve overlapping tails, explicit single ending and aggregate headroom/displacement refusal. No page change until core evidence exists.

Tine phrase integration: owns envelope.js/response-view.js/render-worker.js/main.js/tine.html plus tine browser and envelope tests. Prepare single and phrase atomically; comparison audition choice is explicit; pictures sum only arrived impulse bounds, preserving fixed scale and quiet saved return.

Homepage geometry invitation: owns project.html and existing homepage evidence/roadmap/log. Feature the now-playable geometry comparison among the two primary invitations; retain the expressive route nearby and give a concrete prepare/hold/change/keep path without implying acoustic recovery or measured appeal.

Tine timing variation: owns src/tine/timing.js, preparation.js, tests/tine-timing.test.js and existing worker integration. Two bounded gaps vary timing with unchanged strengths; prepare both comparison phrases as one result so no partial rhythm update is installed.

Tine body-and-rhythm return: owns new phrase-address.js/tests plus address.js validation export and existing main/html/catalog integration. Separate strict phrase record preserves v1 body-only interpretation; capture successful prepared identity and committed timing, quiet rehydrate with explicit preparation.

Tine live-state foundation: owns new src/tine/live-kernel.js and tests/tine-live-kernel.test.js. Four-mode exact homogeneous state transition, impulses applied at current sample frame, bounded eight-touch/four-second admission and eight-second render span. Verify analytic parity and rejected-event immutability before any live browser integration.

Tine live-pass lifecycle: owns new src/tine/live-pass.js, live-worklet.js and tests/tine-live-pass.test.js. Explicit one-shot start, four-second touch window/eight-second total pass, sample-defined 25 ms ending, acknowledged command identity and applied frames. No live user interface until actual browser worklet validation.

Tine live host and playing surface: owns new live-session.js/tests, tine-play.html/css and play-main.js plus prepared-body link in owned tine page. One context per pass, explicit readiness, bounded input, applied acknowledgements, quiet ending and interruption cleanup; capture remains internal until reconstruction is verified.

Tine live reconstruction: owns new src/tine/live-record.js and tests/tine-live-record.test.js; strict body/sample-frame/ending record, all-or-refuse validation and exact same-pass reconstruction before keep/replay UI. Browser live harness integration owned.

Tine replay integration: owns live-capture.js/live-render-worker.js, capture tests and play-main.js/tine-play.html controls. Preserve prior complete PCM across pending/failed/interrupted attempts, asynchronous reconstruction, explicit replay and Quiet, no portable record UI yet.

Tine live quiet return: owns live-address.js/tests, live-capture record loader and play-main/tine-play keep/reopen integration. Explicit address update from completed capture only; strict bounded fragment, silent asynchronous reconstruction, no autoplay or implicit overwrite.

Live tine discovery: owns project.html and src/project-catalog.js copy/catalog update for the completed shape→play→replay→keep route and its history milestone; local preview only.

Live tine phrase/body comparison: owns live-comparison.js, live-comparison-worker.js and tests. Preserve the source record, exact event frames/strengths/rate/ending and relative positions; vary dimensions only, re-admit the entire candidate, fixed pickup gain and no loudness matching. UI follows verified pair rendering.

Live comparison controls: owns live-comparison-session.js/tests and playing-page optional comparison disclosure. Source-bound pair ownership, staged dimensions, preserved pair on cancel/failure, explicit auditions and original live/kept identity.

Candidate playing continuation: owned play-main/tine-play link from prepared comparison candidate to quiet body-only playing in a new tab. Preserve source page and kept pass; no implied performance transfer or automatic body switch.
