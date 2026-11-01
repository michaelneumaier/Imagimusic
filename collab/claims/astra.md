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
