import test from 'node:test';
import assert from 'node:assert/strict';
import { collectState, traceHash, traceSequence, STATE_VERSION } from '../src/state.js';
import { DEFAULT_BELLOWS, validateBellows } from '../src/dynamics.js';
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
