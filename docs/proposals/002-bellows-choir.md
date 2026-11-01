# Proposal 002: Bellows Choir, the first interpreted synth mechanism

*Fable, 2026-11-01. For Astra's approval before implementation. Split proposed:
Fable owns the pure control model + tests; Astra owns scene, audio adapter, UI.*

## Why this family next

Michael's brief is about **familiar electronic synthesized sounds** acquiring
bodies. The garden and the tine prove the physical mode. Bellows Choir is the
first *interpreted* mode: a subtractive synth voice (source → filter →
amplifier, with an envelope and an LFO) whose every control becomes a visible
mechanism. It is the moment a filter sweep stops being a knob and becomes a
chamber opening.

## The mechanism (what the viewer sees)

| Synth control | Mechanism | Driven by |
| --- | --- | --- |
| Source (reed / saw / air) | A reed, a toothed wheel, or an open jet at the chamber inlet | `source.level` |
| Amp envelope (ADSR) | A **bellows** that is squeezed on attack, held partly closed through sustain, and relaxes on release | `env.level`, `env.stage` |
| Filter cutoff | A **chamber iris** whose aperture is the cutoff on a log scale | `filter.aperture01` |
| Filter resonance | The chamber's membrane **tautness** (it shivers more when resonant) | `filter.resonance` |
| Filter envelope amount | A **linkage** from the bellows to the iris; longer linkage = more sweep | `patch.bellows.envAmount` |
| LFO | A **pendulum** hanging from the chamber, visibly rodded to the iris or the reed | `lfo.value`, `lfo.phase01` |
| Output | A **horn** whose flare brightens with output level | `amp.level` |

Energy route: bellows → air → source → chamber → horn. The pendulum and the
linkage are the "why did this move?" answers.

## Contract: `src/dynamics.js` (pure, deterministic, no DOM, no audio)

Everything is a function of **engine time**. No hidden accumulators, so render
mode and live mode produce identical control values for identical inputs.

```js
// Patch block (v4), validated and bounded by validatePatch like the others:
patch.bellows = {
  source: 'reed' | 'saw' | 'air',       // reed = pulse-ish, saw = bright, air = filtered noise
  cutoffHz: 20..20000,                  // base cutoff
  resonance: 0..1,                      // 0 = soft chamber, 1 = screaming
  envAmount: -4..4,                     // octaves of cutoff sweep from the amp envelope
  keyTrack: 0..1,                       // how much cutoff follows pitch
  adsr: { a: 0.001..4, d: 0.001..4, s: 0..1, r: 0.01..8 },   // seconds, sustain 0..1
  lfo: { wave: 'sine'|'tri'|'square', rateHz: 0.05..20, depthOct: 0..2, target: 'cutoff'|'pitch'|'amp' },
};

// Pure functions
adsrLevel(t, noteOn, noteOff, adsr) -> { level: 0..1, stage: 'attack'|'decay'|'sustain'|'release'|'off' }
  // noteOff = null while held. Release starts from the level at noteOff (no jump). Exponential-ish segments.
lfoValue(t, lfo, phase0 = 0)        -> { value: -1..1, phase01: 0..1 }
cutoffAt(t, voice, patch, sampleRate) -> Hz, clamped to [20, 0.45 * sampleRate]
  // cutoffHz * 2^(envAmount * env.level) * 2^(lfo.depthOct * lfo.value if target==='cutoff') * (noteHz/261.6)^keyTrack
aperture01(cutoffHz)                 -> log2(cutoffHz / 20) / log2(1000)   // 20 Hz → 0, 20 kHz → 1
voiceDynamics(t, voice, patch, sampleRate) -> StateFrame-ish VoiceState fragment:
  {
    env:    { level, stage },
    filter: { cutoffHz, resonance, aperture01 },
    lfo:    { value, phase01 },
    source: { kind, level },           // level = env.level for reed/saw; for 'air' also the airflow
    amp:    { level },                 // env.level × velocity
    bellows: { fill01 }                // 1 - env.level for the picture: squeezed on attack, relaxed on release
  }
scheduleVoice(voice, patch, sampleRate) -> list of { t, param, value, ramp: 'linear'|'exp'|'target' }
  // What the audio adapter needs to pre-schedule Web Audio automation for a planned (score) note:
  // cutoff, gain, and LFO as timed segments on the engine timeline, so live and offline agree.
```

`voice` = `{ id, noteHz, velocity, noteOn, noteOff }`. All functions throw on
non-finite input and clamp to the patch bounds; nothing silently substitutes.

## Audio adapter (Astra), suggested

- `OscillatorNode` (sawtooth) or `square` with a pulse-width trick for reed;
  `AudioBufferSourceNode` white noise for air.
- `BiquadFilterNode` lowpass, `Q` from resonance (0..1 → 0.5..18 on a log scale).
- Cutoff and gain automation from `scheduleVoice` using `setValueAtTime` +
  `exponentialRampToValueAtTime` segments (the LFO as a sampled segment list at
  ~100 Hz, or as a real `OscillatorNode` → `GainNode` → `filter.frequency`
  for live; both allowed, `voiceDynamics` is the ground truth the picture uses).
- Offline render: evaluate `voiceDynamics` per sample block and run a tiny
  two-pole lowpass in JS (I can supply `biquadLowpass(samples, cutoffPerBlock, q)`
  as part of dynamics.js if you want the WAV path dependency-free).

## Tests I will write (node:test)

- ADSR: monotone attack, decay reaches sustain, release continues from the
  current level with no jump when noteOff lands mid-attack, `off` after release.
- LFO: period correct, square has 50% duty, phase01 wraps, deterministic.
- Cutoff: envAmount octaves exact, keyTrack 1 doubles per octave, clamped to
  Nyquist guard, aperture01 endpoints.
- `voiceDynamics` is a pure function: same inputs twice → deep-equal output;
  evaluated at random t order → same values as sequential.
- `scheduleVoice` segments are monotone in t and reproduce `voiceDynamics`
  samples within tolerance at segment boundaries.

## What stays honest

Caption: "Interpreted mechanism: the sound is a subtractive synth; the chamber,
bellows, and pendulum are driven by the synth's control state." No claim that
the chamber filters air.

## Decision needed from Astra

1. Approve the contract (or amend names/ranges); then I implement `src/dynamics.js` + `tests/dynamics.test.js`.
2. Say whether you want the dependency-free JS biquad for offline WAV.
3. Patch version bump to 4 with a `bellows` block; you own `validatePatch`, I'll send the bounds table.
