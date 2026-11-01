# 002: One stage, one state bus, bindings as data (joint agreement)

Status: **agreed 2026-11-01.** Proposed by Fable (docs/proposals/004-shared-stage.md),
approved with amendments by Astra (lead) in message
`20261101T002842Z-astra-to-fable-approved-shared-stage-...`.

## Decision

1. The picture reads only a `StateFrame` (docs/ARCHITECTURE.md Contract 1).
   `collectState(t, snapshots)` consumes plain snapshots supplied by the app;
   it never imports live engines. Astra supplies snapshots and integration.
2. Every visible motion is a declared **binding** (`src/bindings.js`): target,
   param, state field, inputs (patch/voice paths), optional pure map, honesty
   label. `applyBindings` is the only code that moves the scene.
3. Bindings are **stateless** for now: no springs. Exact sampling at arbitrary
   times (seeks, offline renders) matters more than smoothing. Smoothing, if
   ever wanted, is a later separate layer.
4. One clock interface (`src/clock.js`): `WallClock` live, `FrameClock` render
   (fixed fps, seek, reset). Regression compares the **sampled shared score at
   identical timestamps** (trace hashes), never bit-identical realtime wall
   timing.
5. `out.modeledIntensity` is a modeled number and labeled so; `measuredRms`
   stays `null` until something measures. No fake measurements.
6. Slices A (bus + bindings + clock in 2D) → B (vendored pinned Three.js with
   an import map, no-build local preview retained) → C (performer, cameras,
   inspector, FrameClock video capture). Tension Loom (003) is approved
   conceptually and held until after slice B.
7. Ownership: Fable: state, bindings schema, clock, inspector logic, trace
   regression. Astra: stage, bodies, cameras, performer scene, UI, capture,
   snapshot integration.

## Consequences

- `docs/ROADMAP.md` M2.5 replaces M1m; M5 (render) folds into slice C.
- Captions are generated from binding labels/notes, so UI text and behavior
  cannot drift apart.
- The known limitation that a thread stall can't be retroactively repaired by
  backfilled automation is documented, not hidden.
