# Proposal 004: One stage, one state bus, inspectable causality

*Fable, 2026-11-01, at Astra's request: how the lab becomes one cohesive
procedural world after M2, without losing the thing that makes it honest.*

## The principle, restated as an architecture

Today three families each own a canvas and read their own engine's objects.
A cohesive world needs one rule: **the picture reads only a StateFrame, and
every visible motion is a declared binding from a StateFrame field to a
scene parameter.** If a binding is data, the "why did this move?" question
answers itself: follow the binding back to the state field, and the state
field back to the patch parameters that produced it.

```
engines (garden, tine, bellows, loom…) ──► collectState(t) ──► StateFrame
                                                                  │
                     Bindings (data: target ◄ field, map, spring) ┼──► Stage (2D today, 3D next)
                                                                  │
                                            Inspector: pick a part ──► binding ──► field ──► patch params
```

## Pieces

### 1. State bus: `src/state.js` (Fable)

`collectState(t, { garden, tine, bellows, loom })` returns one `StateFrame`
per ARCHITECTURE Contract 1 (`v: 1`, `t`, `voices[]`, `global`, `out`). Each
engine contributes pure `VoiceState` fragments it already computes:

- garden/tine: `exciter` (striker pose, position), `damper`, `modes[].energy`
  (from `envelope` × amplitude × releaseLevel), `resonator` = slot id
- bellows: `voiceDynamics` output verbatim (`env`, `lfo`, `filter`, `source`,
  `amp`, `bellows`) plus the stolen-fade override
- global: LFO phases for idle pendulums, master `out.rms`

No engine state is read by the stage directly. A frame is a plain object, so
it hashes: `traceHash(frame)` gives the motion-trace regression for free
(same seed, same patch, same hash sequence, in 2D or 3D, live or offline).

### 2. Bindings as data: `src/bindings.js` (Fable schema, both populate)

```js
{ id: 'choir.slot3.iris.aperture',
  target: 'choir/slot3/iris',  param: 'aperture',          // scene node path + parameter
  field:  'voices[slot=3].filter.aperture01',               // StateFrame path
  inputs: ['patch.bellows.cutoffHz', 'patch.bellows.envAmount', 'patch.bellows.lfo.*', 'voice.noteHz'],
  map:    v => v,                                           // pure; units in, scene units out
  spring: { k: 400, c: 30, x0: 0, v0: 0 } }                 // optional; deterministic reset
```

`applyBindings(frame, bindings, scene, dt)` is the only code that moves the
scene. Springs integrate with the frame clock, never wall time. `inputs` is
what the inspector shows; the honest-label text for each family lives next
to its bindings so captions can't drift from behavior.

### 3. Clock: `src/clock.js` (Fable)

`WallClock` (AudioContext time) and `FrameClock` (fixed 1/60, `reset()`
restores every spring to `x0, v0`). Live uses the wall clock; a render uses
the frame clock over the offline audio timeline. This is what makes
deterministic video a consequence of the stage rather than a separate
project, so Astra's "3D first" and my "video first" stop being a choice.

### 4. The stage: `src/stage/` (Astra)

One floor, one light rig, three islands joined by a visible rail (the
future bridge for Tension Loom), with the energy route readable left to
right: **exciters → resonators → chambers → horns**. Bodies are simple
physically-shaded primitives: tines as extruded bars with their real
length/thickness, chambers as cylinders with an iris disk, bellows as a
stacked accordion, pendulums as rods with bobs. Same bindings in 3D as in 2D;
the 2D canvases become the fallback and the regression oracle.

Stack per decision 001: Three.js is the first dependency. Proposal: vendor a
pinned `three.module.js` under `vendor/` with an import map, no bundler, so
the dependency-free rule survives in spirit (one file, one version, in the
repo) and `node:test` stays pure-JS.

### 5. Performer actor: `src/perform/` (Astra scene, Fable planner)

Mallets, pumpers, and the hand that holds the damper are a separate actor
that reads the score with lookahead (the existing `strikerPose` logic
generalized): approach, contact on the audio timestamp, recover. Bodies never
move themselves; performers move bodies, bodies make sound.

### 6. Cameras and the inspector (Astra UI, Fable logic)

- Three procedural shots: establishing (whole route), follow-the-exciter
  (tracks the busiest performer), inspection (slow-motion dolly into one
  mechanism; audio time-stretched or paused, labeled).
- Inspector: click a part → its binding chain lights up along the route
  (horn ← chamber ← bellows ← voice ← patch), with live values and the family
  label (physical / interpreted). `explainBinding(id, frame, patch)` is pure
  and tested.

## Migration in three reviewed slices

| Slice | Content | Done when |
| --- | --- | --- |
| A. Bus + bindings (2D) | `state.js`, `bindings.js`, `clock.js`; existing canvases rewired to read the bus; trace hash regression | Same seeded phrase gives identical hash sequences live and offline; no canvas reads an engine object |
| B. 3D stage | vendored Three, stage islands, same bindings, materials by family | Side-by-side with 2D: identical trace hashes; a stranger reads the route left to right |
| C. Performer, cameras, inspector, render | performer actor, three shots, inspector, FrameClock video capture (WebCodecs or PNG + ffmpeg) | One button renders the seeded phrase to video with audio; inspector answers "why did this move?" for every bound part |

Tension Loom (003) lands after slice B, as the first family born in 3D and the
reason the rail exists.

## What this protects

- Causality: the picture can only move through bindings; bindings cite their
  inputs; captions are generated from the same data.
- Determinism: one clock interface, springs with declared reset state,
  hashable frames.
- Honesty: each family's label (physical / interpreted / interpreted-physical)
  travels with its bindings.

## Decisions for Astra

1. Approve the bus + bindings as the seam, and slice order A → B → C.
2. Vendored pinned Three.js with an import map (no bundler) vs. adopting npm +
   Vite now. I recommend vendoring for this milestone.
3. Ownership as sketched (Fable: state, bindings schema, clock, inspector
   logic, trace regression; Astra: stage, bodies, cameras, performer scene,
   UI, capture). Reassign freely.
