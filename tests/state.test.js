import test from 'node:test';
import assert from 'node:assert/strict';
import { collectState, traceHash, traceSequence, STATE_VERSION } from '../src/state.js';
import { DEFAULT_BELLOWS, validateBellows, voiceDynamics } from '../src/dynamics.js';
import { FrameClock } from '../src/clock.js';

const gardenVoice = { id: 7, slot: 2, noteHz: 196, velocity: 0.8, noteOn: 1, end: 5, position: 0.4, approach: 0.18,
  modes: [{ frequency: 196, amplitude: 0.19, decay: 1.2 }, { frequency: 455, amplitude: 0.1, decay: 0.8 }] };
const bellowsVoice = { id: 3, slot: 1, noteHz: 220, velocity: 0.7, noteOn: 1, noteOff: 2, bellows: validateBellows(DEFAULT_BELLOWS) };
const snaps = { garden: { voices: [gardenVoice], dampers: [] }, bellows: { voices: [bellowsVoice] }, sampleRate: 48000 };

test('collectState builds a versioned frame from plain snapshots with per-family voice states', () => {
  const frame = collectState(1.5, snaps);
  assert.equal(frame.v, STATE_VERSION); assert.equal(frame.t, 1.5);
  assert.deepEqual(frame.global.families, ['garden', 'bellows']);
  const g = frame.voices.find(v => v.family === 'garden'), b = frame.voices.find(v => v.family === 'bellows');
  assert.equal(g.id, '7'); assert.equal(g.resonator, 'garden/2'); assert.equal(g.modes.length, 2); assert.ok(g.modes[0].energy > 0 && g.level > 0);
  assert.equal(g.exciter.pos01, 0.4); assert.equal(g.stage, 'decay');
  assert.equal(b.resonator, 'bellows/1'); assert.equal(b.modules.filter.type, 'filter'); assert.ok(b.modules.filter.aperture01 > 0);
  assert.equal(b.stage, 'sustain'); assert.ok(b.level > 0);
  assert.equal(frame.out.measuredRms, null); assert.ok(frame.out.modeledIntensity > 0 && frame.out.modeledIntensity < 1);
});

test('voices appear during their visible approach, drop after their end, and dampers register as pressure', () => {
  const before = collectState(0.9, snaps).voices.find(v => v.family === 'garden');
  assert.equal(before.stage, 'attack'); assert.ok(before.exciter.visible && before.modes.every(m => m.energy === 0));
  assert.equal(collectState(0.5, snaps).voices.filter(v => v.family === 'garden').length, 0);
  assert.equal(collectState(5.5, snaps).voices.filter(v => v.family === 'garden').length, 0);
  const damped = collectState(1.5, { ...snaps, garden: { ...snaps.garden, dampers: [2] } }).voices.find(v => v.family === 'garden');
  assert.equal(damped.damper.pressure, 1);
  const releasing = collectState(1.52, { garden: { voices: [{ ...gardenVoice, fadeAt: 1.5, fadeDuration: 0.06, fadeFrom: 1 }] } }).voices[0];
  assert.equal(releasing.stage, 'release'); assert.ok(releasing.level < collectState(1.5, snaps).voices[0].level);
});

test('a stolen bellows voice fades only after stolenAt, never before (future-steal bug guard)', () => {
  const stolen = { ...bellowsVoice, noteOff: null, stolenAt: 1.6, stolenFade: 0.04 };
  const at = t => collectState(t, { bellows: { voices: [stolen] } }).voices[0];
  assert.equal(at(1.5).level, collectState(1.5, { bellows: { voices: [{ ...bellowsVoice, noteOff: null }] } }).voices[0].level);
  assert.ok(Math.abs(at(1.62).level / at(1.6).level - 0.5) < 1e-9);
  assert.equal(at(1.62).stage, 'release');
  assert.equal(collectState(1.7, { bellows: { voices: [stolen] } }).voices.length, 0);
});

test('a stolen bellows voice freezes amp/env at stolenAt then fades, matching the audio engine mid-attack', async () => {
  const { bellowsState } = await import('../src/bellows-audio.js');
  const slow = validateBellows({ ...DEFAULT_BELLOWS, adsr: { a: 1, d: 0.5, s: 0.5, r: 0.5 } });
  const snap = { id: 9, slot: 0, noteHz: 220, velocity: 0.8, noteOn: 1, noteOff: null, bellows: slow, stolenAt: 1.5, stolenFade: 0.04 };
  const frozen = voiceDynamics(1.5, snap, slow, 48000);
  const engineVoice = { ...snap, patch: { bellows: slow }, stolenAmp: frozen.amp.level, stolenEnv: frozen.env.level };
  for (const t of [1.5, 1.52, 1.535]) {
    const mine = collectState(t, { bellows: { voices: [snap] } }).voices[0], theirs = bellowsState(engineVoice, t, 48000);
    assert.ok(Math.abs(mine.level - theirs.amp.level) < 1e-12, `amp at ${t}: ${mine.level} vs ${theirs.amp.level}`);
    assert.ok(Math.abs(mine.modules.env.level - theirs.env.level) < 1e-12, `env at ${t}`);
    assert.ok(Math.abs(mine.exciter.fill01 - theirs.bellows.fill01) < 1e-12, `fill at ${t}`);
  }
  // Frozen, not drifting: halfway through the fade the env is half of its value at the steal, not half of the live attack.
  const half = collectState(1.52, { bellows: { voices: [snap] } }).voices[0];
  assert.ok(Math.abs(half.modules.env.level - frozen.env.level * 0.5) < 1e-12);
  assert.ok(Math.abs(half.modules.env.level - voiceDynamics(1.52, snap, slow, 48000).env.level * 0.5) > 1e-4);
  // Filter and LFO keep following their automation during the fade.
  assert.equal(half.modules.lfo.phase01, voiceDynamics(1.52, snap, slow, 48000).lfo.phase01);
});

test('bellows voices exist only from noteOn: a scheduled future breath does not appear before its onset', () => {
  const future = { ...bellowsVoice, id: 4, noteOn: 3, noteOff: 4 };
  const at = t => collectState(t, { bellows: { voices: [bellowsVoice, future] } }).voices.map(v => v.id);
  assert.deepEqual(at(1.5), ['3']); assert.deepEqual(at(3), ['4']); assert.deepEqual(at(2.9), []);
  assert.equal(collectState(1.5, snaps).voices.find(v => v.family === 'bellows').noteOn, 1);
  assert.equal(collectState(1.5, snaps).voices.find(v => v.family === 'garden').noteOn, 1);
});

test('explicit engine-frozen steal levels win over the model fallback (repeated stop mid-steal)', () => {
  const snap = { ...bellowsVoice, noteOff: null, stolenAt: 1.6, stolenFade: 0.04, stolenAmp: 0.1, stolenEnv: 0.25 };
  const at = t => collectState(t, { bellows: { voices: [snap] } }).voices[0];
  assert.ok(Math.abs(at(1.6).level - 0.1) < 1e-12 && Math.abs(at(1.6).modules.env.level - 0.25) < 1e-12);
  assert.ok(Math.abs(at(1.62).level - 0.05) < 1e-12 && Math.abs(at(1.62).exciter.fill01 - 0.875) < 1e-12);
  const fallback = collectState(1.62, { bellows: { voices: [{ ...snap, stolenAmp: undefined, stolenEnv: undefined }] } }).voices[0];
  assert.ok(Math.abs(fallback.level - voiceDynamics(1.6, snap, snap.bellows, 48000).amp.level * 0.5) < 1e-12);
  assert.ok(Math.abs(at(1.5).level - collectState(1.5, { bellows: { voices: [{ ...bellowsVoice, noteOff: null }] } }).voices[0].level) < 1e-12, 'explicit levels apply only after stolenAt');
});

test('held dampers are global state visible on idle slots, and choir LFO settings are note-local', () => {
  const frame = collectState(1.5, { ...snaps, garden: { voices: [], dampers: [5, 2] }, tine: { voices: [], dampers: [8] } });
  assert.deepEqual(frame.global.dampers, { garden: [2, 5], tine: [8] });
  assert.equal(frame.voices.filter(v => v.family !== 'bellows').length, 0);
  assert.deepEqual(collectState(1.5, { bellows: snaps.bellows }).global.dampers, { garden: [], tine: [] });
  const changed = validateBellows({ ...DEFAULT_BELLOWS, lfo: { wave: 'square', rateHz: 7, depthOct: 1, target: 'pitch' } });
  const voices = [bellowsVoice, { ...bellowsVoice, id: 4, slot: 2, bellows: changed }];
  const [a, b] = collectState(1.5, { bellows: { voices } }).voices;
  assert.deepEqual([a.modules.lfo.target, a.modules.lfo.rateHz, a.modules.lfo.wave], ['cutoff', DEFAULT_BELLOWS.lfo.rateHz, 'sine']);
  assert.deepEqual([b.modules.lfo.target, b.modules.lfo.rateHz, b.modules.lfo.wave], ['pitch', 7, 'square']);
  assert.ok(typeof a.modules.lfo.value === 'number' && typeof b.modules.lfo.phase01 === 'number');
});

test('a held bellows voice persists and a finished one is dropped after its release', () => {
  assert.equal(collectState(50, { bellows: { voices: [{ ...bellowsVoice, noteOff: null }] } }).voices.length, 1);
  assert.equal(collectState(2 + DEFAULT_BELLOWS.adsr.r + 0.01, snaps).voices.filter(v => v.family === 'bellows').length, 0);
  assert.throws(() => collectState(NaN, snaps));
});

test('traceHash is stable across key order and float noise, and changes with state', () => {
  const a = collectState(1.5, snaps), b = collectState(1.5, snaps);
  assert.equal(traceHash(a), traceHash(b));
  assert.equal(traceHash({ x: 1, y: { p: 2, q: 3 } }), traceHash({ y: { q: 3, p: 2 }, x: 1 }));
  assert.equal(traceHash({ x: 0.123456789 }), traceHash({ x: 0.12345 + 1e-9 }));
  assert.notEqual(traceHash(a), traceHash(collectState(1.6, snaps)));
  assert.match(traceHash(a), /^[0-9a-f]{8}$/);
});

test('the same snapshots sampled on a FrameClock give an identical trace sequence every time (offline == offline)', () => {
  const times = new FrameClock({ fps: 30, start: 0.5 }).times(3);
  const one = traceSequence(times, snaps), two = traceSequence(times, structuredClone(snaps));
  assert.deepEqual(one, two); assert.equal(one.length, 75);
  assert.notDeepEqual(one, traceSequence(times, { ...snaps, garden: { voices: [{ ...gardenVoice, velocity: 0.5 }] } }));
});
