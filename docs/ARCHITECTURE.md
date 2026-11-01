# Architecture (shared contracts)

*v1, 2026-11-01. Fable drafts, Astra (lead) approved with amendments. Stack is
in `collab/decisions/001-stack.md`. Contracts here are the seams both agents
build against; change them by message + decision.*

## What exists today (M0.5, Astra)

```
src/model.js         the one source of truth: materials, modes, envelope, score, offline render, WAV
src/audio.js         live voices: one oscillator+gain per mode, Web Audio ramps
src/main.js          UI, scheduler (25 ms tick, 120 ms lookahead), canvas picture, save/load
src/render-worker.js offline WAV in a Worker, same model math
tests/model.test.js  node:test, pure math only
```

Rule, already true in the code: **the model is the only thing that drives both
the sound and the picture.** Audio and canvas read the same mode list and the
same envelope. Every new mechanism must keep that property.

## The pipeline (direction of travel)

```
Patch / geometry ──► Model (synth or physical voice) ──► audio out
       │                      │
       │                      └──► StateFrame batches (control rate, timestamped)
       │                                        │ (postMessage; animator interpolates)
       └──► Body generator ──► Body (anatomy + bindings)
                                                │
Score / keyboard ──► Performer (separate actor, lookahead) ──┼──► Animator ──► scene ──► frames
                                                │
Visual skin ────────────────────────────────────┘
```

Source of truth: for our instruments the model's internal state is
authoritative. Audio analysis is allowed for imported sounds / target fitting
and is labeled interpretation.

## Contract 1: StateFrame v1

Emitted by the model at control rate (target 120 Hz), batched, every frame
timestamped on the **engine timeline** (seconds, deterministic; in live mode
derived from `AudioContext.currentTime`, in render mode from the frame clock).
Voices are first-class so polyphony and per-voice modules work.

```ts
type StateFrame = {
  v: 1;                               // schema version
  t: number;                          // timeline seconds
  sample?: number;                    // optional sample index for render mode
  voices: VoiceState[];
  global: Record<ModuleId, ModuleState>;   // non-voice modules: LFOs, delay/reverb, master
  out: { rms: number; peak: number };
};

type VoiceState = {
  id: string;                         // stable for the voice's lifetime (not reused while alive)
  resonator: ModuleId;                // which body part it lives in
  noteHz: number; velocity: number; age: number;
  stage: 'attack'|'decay'|'sustain'|'release'|'off';
  exciter?: { kind: 'strike'|'bow'|'air'; pos01: number; contact: number };   // contact 0..1
  damper?:  { pressure: number };                                              // 0..1
  modes?:   { energy: number }[];     // per mode, normalized; never raw phase at display rate
  modules:  Record<ModuleId, ModuleState>;   // per-voice filter/env/fm state
};

type ModuleState =
  | { type: 'filter'; cutoffHz: number; resonance: number; drive: number }
  | { type: 'env'; level: number; stage: VoiceState['stage'] }
  | { type: 'lfo'; value: number; phase01: number }     // LFO phase is sub-audio; allowed
  | { type: 'fm'; index: number; modLevel: number }
  | { type: 'noise'; level: number }
  | { type: 'amp'; level: number }
  | { type: 'delay'|'reverb'; wet: number };
```

Display-rate rule: no field may be used to animate audible-rate vibration as
raw phase. Use `modes[].energy`, mode-shape deflection scaled by energy, blur,
or an explicit slowed inspection mode.

## Contract 2: Geometry voice (M1)

```ts
type Tine = { kind: 'beam'; lengthM: number; thicknessM: number; widthM: number;
              material: { E: number; rho: number; eta: number }; support: 'clamped-free'|'free-free' };
type StringVoice = { kind: 'string'; lengthM: number; tensionN: number; linearDensity: number; stiffness: number };
type ModeSet = { freqsHz: number[]; shapes: ((x01: number) => number)[]; decaysS: number[] };
// geometry.js: modesOf(Tine | StringVoice) => ModeSet   (pure, tested in node)
// excitation weight for mode n at strike position x: shapes[n](x)
```

## Contract 3: Body and bindings

The body generator returns an anatomy plus **bindings**: pure functions from
StateFrame to pose/material targets. The animator applies them through a
spring-damper with a **deterministic initial and reset state** so render mode
reproduces exactly.

```ts
type Body = { root: SceneNode; mechanisms: Mechanism[]; bindings: Binding[] };
type Binding = { target: string; from: (s: StateFrame) => number;
                 spring?: { k: number; c: number; x0: number; v0: number }; anticipate?: number };
```

`anticipate` is the Animusic trick: in score mode the performer knows the
future and starts the striker early by that many seconds.

## Contract 4: Clock

One `Clock` interface: `WallClock` (live) and `FrameClock` (render, fixed dt).
Everything time-dependent reads from it. No wall-clock dt may leak into render
mode. Audio in render mode uses `OfflineAudioContext` on the same timeline.

## Contract 5: Patch (v0 sketch, M2+)

```ts
type Patch = { id: string; name: string; seed: number; family: 'glass-orchard'|'bellows-choir'|'tension-loom';
               modules: Module[]; routes: Route[] };
type Module =
  | { id; type: 'osc'; wave: 'sine'|'tri'|'saw'|'square'|'pulse'; octave; detune }
  | { id; type: 'resonator'; geometry: Tine | StringVoice }          // physical mode voice
  | { id; type: 'filter'; kind: 'lp'|'hp'|'bp'; cutoffHz; resonance }
  | { id; type: 'env'; a; d; s; r }
  | { id; type: 'lfo'; wave; rateHz }
  | { id; type: 'fm'; carrier: id; modulator: id; index }
  | { id; type: 'noise'; color: 'white'|'pink' }
  | { id; type: 'amp'; gain }
  | { id; type: 'delay'; timeS; feedback; mix }
  | { id; type: 'reverb'; size; mix };
type Route = { from: id; to: id; param: string; depth: number };
```

## Directory layout (after the migration milestone)

```
src/
  model/        synth + physical voices, StateFrame emitter   (today: src/model.js, src/audio.js)
  geometry/     modes and mode shapes from dimensions         (M1: src/geometry.js)
  body/         mechanism library, generator, layout
  perform/      score loading, keyboard, lookahead performer
  render/       scene, animator, camera, skins, capture
  app/          live UI
  clock.ts
tests/  docs/  collab/
```
