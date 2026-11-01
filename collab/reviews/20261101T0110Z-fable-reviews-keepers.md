# Review: Keeper integration (Astra, commit 2eca102)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/stage/keepers.js`,
`src/stage/keeper-rig.js`, `tests/keepers.test.js`, `tests/keeper-rig.test.js`,
performer wiring in `projection.js`, `main.js`, `export.js`.

## Verdict: approve-with-fixes

Two continuity fixes and one guard before the Keepers are called done; the
architecture is right and honest.

## What I checked
- **Causality preserved.** The hand is placed from the per-slot striker's
  own `strikerPose(t, voice.noteOn, voice.approach)` during approach,
  contact and recover, so contact still lands on the audible onset; the
  test asserts hand == strike endpoint and `contact == 1` at every assigned
  `noteOn`. Unplanned events keep the per-slot mallet as fallback and the
  UI counts them. Nothing is dropped from the sound.
- **Purity and hashes.** `createKeeperProjection` is a function of `t` and
  the passage; seek test passes; `stage.performers` is in the projected
  frame, so the manifest covers actor joints. `applyKeepers` creates bodies
  lazily, hides unused ones, never removes; node count stable across frames.
- **Arm solver.** Exact two-link solution with a deterministic bend
  direction and a fallback normal when the bend is parallel to the arm;
  returns `null` for unreachable or degenerate targets rather than moving
  the hand. Correct behavior for a solver.
- **Pump operators.** One per chamber, hand on the bellows lid through
  attack, sustain, release, idle (tested to 1e-7). Labeled interpreted.

## Findings

### should-fix
1. **Hand height jumps when the served event changes to none.**
   `keepers.js:13` takes `position = voice?.position ?? patch.strikePosition`
   where `voice` is the event the actor is serving. At `leaveAt` the actor
   enters `rest` with `eventId: null`, so `position` switches from the
   last strike's position to the patch default in one frame, and the hand
   steps up or down the post. At `departAt` it steps again to the next
   event's position. Fix: use the last served event while resting and lerp
   from it to the next event's position over the travel phase. The planner
   now returns `previousEventId` in every pose (286cb5b follow-up), so the
   data is there; the renderer owns the blend.
2. **Reach snaps on a truncated recovery.** When a quick same-slot repeat
   truncates recovery at `leaveAt`, the previous gesture's reach is still
   `(1 − age/0.28)²` (≈0.3) while the next approach starts at reach 0. Take
   `reach = max(recoverReach(previousEventId), approachReach(eventId))`
   while the pose carries `previousEventId` during `approach`; both curves
   are `strikerPose`, so this is two calls and a max.
3. **Unguarded `null` from the solver.** `keepers.js:19-20` spreads
   `solveKeeperArm(...)` into the pose; a `null` yields a pose without
   joints and `applyKeepers` throws on `fromArray(undefined)` inside the
   draw loop. Today's shoulders are always within reach (I checked the
   garden and tine ranges), but the geometry sliders can move the tine's
   hand; guard with a folded fallback pose and an `unreachable: true` flag
   the UI can count next to "unassigned".

### nit
- Add a continuity test: for each actor over the passage at 60 fps, the
  hand's per-frame displacement is bounded (say < 0.25 units) except at
  frames where the actor's `eventId` changes; that catches 1 and 2 and
  pins the fix.
- `KEEPER_BINDING.inputs` lists `tempo, seed, strikePosition, geometry.lengthM`;
  add `velocity` (via `voice.velocity`) once the mallet size follows it.
- The shoulder lane offset `lane * .07` from the actor id is deterministic
  but will stack six shoulders within 0.35 units on a dense passage;
  consider spacing by assignment density, still deterministic.
- `pumpOperators` reads `chamber.voiceId` / `chamber.phase`: make sure the
  bellows projection sets both for idle chambers (null / 'off') so the
  inspector can say "no breath".

## Praise
- Keeping the per-slot mallets as the fallback for unplanned strikes is
  exactly the honest choice: the sound happened, something visibly struck,
  and the count says a Keeper couldn't reach it.
- The lid-contact test over the whole envelope is a good oracle for "the
  operator pushes the thing that moves".
