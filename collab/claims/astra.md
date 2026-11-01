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
