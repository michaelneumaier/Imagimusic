import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BELLOWS, BELLOWS_BOUNDS, MIDDLE_C_HZ, validateBellows, validateVoice, adsrLevel, lfoValue, aperture01,
  cutoffAt, voiceDynamics, scheduleVoice,
} from '../src/dynamics.js';

const SR = 48000;
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);
const voice = { id: 'v1', noteHz: MIDDLE_C_HZ, velocity: 0.8, noteOn: 1, noteOff: 2 };
const B = validateBellows(DEFAULT_BELLOWS);

test('validateBellows returns a bounded copy and rejects anything out of range or unknown', () => {
  assert.deepEqual(validateBellows(DEFAULT_BELLOWS), structuredClone(DEFAULT_BELLOWS));
  assert.deepEqual(Object.keys(validateBellows({ ...DEFAULT_BELLOWS, extra: 1 })).sort(), Object.keys(DEFAULT_BELLOWS).sort());
  for (const bad of [
    { ...DEFAULT_BELLOWS, source: 'pulse' }, { ...DEFAULT_BELLOWS, cutoffHz: 10 }, { ...DEFAULT_BELLOWS, cutoffHz: NaN },
    { ...DEFAULT_BELLOWS, resonance: 1.1 }, { ...DEFAULT_BELLOWS, envAmount: -5 }, { ...DEFAULT_BELLOWS, keyTrack: '1' },
    { ...DEFAULT_BELLOWS, adsr: { ...DEFAULT_BELLOWS.adsr, a: 0 } }, { ...DEFAULT_BELLOWS, adsr: { ...DEFAULT_BELLOWS.adsr, r: 9 } },
    { ...DEFAULT_BELLOWS, lfo: { ...DEFAULT_BELLOWS.lfo, wave: 'saw' } }, { ...DEFAULT_BELLOWS, lfo: { ...DEFAULT_BELLOWS.lfo, rateHz: 25 } },
    { ...DEFAULT_BELLOWS, lfo: { ...DEFAULT_BELLOWS.lfo, target: 'pan' } }, { ...DEFAULT_BELLOWS, adsr: null }, null, 'saw',
  ]) assert.throws(() => validateBellows(bad));
  assert.equal(BELLOWS_BOUNDS.cutoffHz[1], 20000);
});

test('validateVoice enforces velocity, times, and optional seed', () => {
  assert.deepEqual(validateVoice(voice), { ...voice });
  assert.deepEqual(validateVoice({ noteHz: 440, velocity: 1, noteOn: 0 }), { id: null, noteHz: 440, velocity: 1, noteOn: 0, noteOff: null });
  assert.equal(validateVoice({ ...voice, seed: 7 }).seed, 7);
  for (const bad of [{ ...voice, velocity: 1.2 }, { ...voice, noteHz: 0 }, { ...voice, noteOn: -1 }, { ...voice, noteOff: 0.5 }, { ...voice, noteOn: NaN }, { ...voice, seed: -1 }, { ...voice, seed: 1.5 }, null])
    assert.throws(() => validateVoice(bad));
});

test('ADSR is piecewise linear with exact corners and releases from the level at noteOff', () => {
  const adsr = { a: 0.1, d: 0.2, s: 0.5, r: 0.4 };
  assert.deepEqual(adsrLevel(0.5, 1, 2, adsr), { level: 0, stage: 'off' });
  close(adsrLevel(1.05, 1, 2, adsr).level, 0.5); assert.equal(adsrLevel(1.05, 1, 2, adsr).stage, 'attack');
  close(adsrLevel(1.1, 1, 2, adsr).level, 1); assert.equal(adsrLevel(1.1, 1, 2, adsr).stage, 'decay');
  close(adsrLevel(1.2, 1, 2, adsr).level, 0.75);
  close(adsrLevel(1.3, 1, 2, adsr).level, 0.5); assert.equal(adsrLevel(1.3, 1, 2, adsr).stage, 'sustain');
  assert.deepEqual(adsrLevel(1.9, 1, null, adsr), { level: 0.5, stage: 'sustain' });
  close(adsrLevel(2.2, 1, 2, adsr).level, 0.25); assert.equal(adsrLevel(2.2, 1, 2, adsr).stage, 'release');
  assert.deepEqual(adsrLevel(2.45, 1, 2, adsr), { level: 0, stage: 'off' });
  assert.ok(adsrLevel(2.4 - 1e-9, 1, 2, adsr).level < 1e-6);
  // noteOff mid-attack: release starts from 0.5, no jump.
  close(adsrLevel(1.05, 1, 1.05, adsr).level, 0.5); close(adsrLevel(1.25, 1, 1.05, adsr).level, 0.25);
  assert.throws(() => adsrLevel(NaN, 1, 2, adsr), /t must/);
});

test('LFO waves have the right period, phase, duty, and endpoints', () => {
  const sine = { wave: 'sine', rateHz: 2 }, tri = { wave: 'tri', rateHz: 2 }, square = { wave: 'square', rateHz: 2 };
  close(lfoValue(0.125, sine).value, 1); close(lfoValue(0.375, sine).value, -1); close(lfoValue(0.5, sine).value, 0);
  close(lfoValue(0.125, tri).value, 1); close(lfoValue(0.25, tri).value, 0); close(lfoValue(0.375, tri).value, -1); close(lfoValue(0.5, tri).value, 0);
  assert.equal(lfoValue(0.1, square).value, 1); assert.equal(lfoValue(0.3, square).value, -1); assert.equal(lfoValue(0.5, square).value, 1);
  let high = 0; for (let i = 0; i < 1000; i++) if (lfoValue(i / 1000, square).value > 0) high++;
  assert.equal(high, 500);
  close(lfoValue(1.3, sine).phase01, 0.6); close(lfoValue(0.1, sine, 0.95).phase01, 0.15);
  close(lfoValue(-0.1, sine).phase01, 0.8);
});

test('aperture maps cutoff on a log scale with clamped endpoints', () => {
  close(aperture01(20), 0); close(aperture01(20000), 1); close(aperture01(Math.sqrt(20 * 20000)), 0.5);
  assert.equal(aperture01(5), 0); assert.equal(aperture01(40000), 1);
  assert.throws(() => aperture01(NaN));
});

test('cutoff follows env amount in octaves, key tracking, LFO target, and the Nyquist clamp', () => {
  const noLfo = { ...B, lfo: { ...B.lfo, depthOct: 0 }, keyTrack: 0, adsr: { a: 0.1, d: 0.1, s: 1, r: 0.1 } };
  close(cutoffAt(1.1, voice, noLfo, SR), B.cutoffHz * 2 ** B.envAmount);        // env peak: +envAmount octaves
  close(cutoffAt(1.0, voice, noLfo, SR), B.cutoffHz);                             // env = 0 at noteOn
  const tracked = { ...noLfo, keyTrack: 1, envAmount: 0 };
  close(cutoffAt(1.1, { ...voice, noteHz: 2 * MIDDLE_C_HZ }, tracked, SR), 2 * B.cutoffHz);
  const lfoCut = { ...noLfo, envAmount: 0, lfo: { wave: 'square', rateHz: 1, depthOct: 1, target: 'cutoff' } };
  close(cutoffAt(1.1, voice, lfoCut, SR), 2 * B.cutoffHz); close(cutoffAt(1.6, voice, lfoCut, SR), B.cutoffHz / 2);
  const hot = { ...noLfo, cutoffHz: 20000, envAmount: 4 };
  close(cutoffAt(1.1, voice, hot, SR), 0.45 * SR);
  const cold = { ...noLfo, cutoffHz: 20, envAmount: -4, keyTrack: 1 };
  assert.ok(cutoffAt(1.1, { ...voice, noteHz: 1 }, cold, SR) >= 1);
});

test('pitch and amplitude LFO targets use the documented mappings', () => {
  const pitch = { ...B, envAmount: 0, lfo: { wave: 'square', rateHz: 1, depthOct: 1, target: 'pitch' } };
  close(voiceDynamics(1.1, voice, pitch, SR).source.frequencyHz, 2 * MIDDLE_C_HZ);
  close(voiceDynamics(1.6, voice, pitch, SR).source.frequencyHz, MIDDLE_C_HZ / 2);
  close(voiceDynamics(1.1, voice, pitch, SR).filter.cutoffHz, voiceDynamics(1.6, voice, pitch, SR).filter.cutoffHz);
  const amp = { ...B, adsr: { a: 0.001, d: 0.001, s: 1, r: 0.1 }, lfo: { wave: 'square', rateHz: 1, depthOct: 0.5, target: 'amp' } };
  close(voiceDynamics(1.1, voice, amp, SR).amp.level, 0.8 * 1);           // lfo = +1 -> tremolo 1
  close(voiceDynamics(1.6, voice, amp, SR).amp.level, 0.8 * 0.5);         // lfo = -1 -> 1 - depth
  const deep = { ...amp, lfo: { ...amp.lfo, depthOct: 2 } };
  close(voiceDynamics(1.6, voice, deep, SR).amp.level, 0);                // depth clamps at 1
  close(voiceDynamics(1.6, voice, amp, SR).source.frequencyHz, MIDDLE_C_HZ);
});

test('the LFO phase restarts at each note onset, so modulation does not depend on clock uptime', () => {
  const sq = { ...B, envAmount: 0, keyTrack: 0, adsr: { a: 0.001, d: 0.001, s: 1, r: 0.01 }, lfo: { wave: 'square', rateHz: 1, depthOct: 1, target: 'cutoff' } };
  const late = { ...voice, noteOn: 1.3, noteOff: 5 };
  close(voiceDynamics(1.7, late, sq, SR).filter.cutoffHz, 2 * B.cutoffHz);     // 0.4 s into the note: +1 (absolute phase 0.7 would give -1)
  close(voiceDynamics(1.7, late, sq, SR).lfo.phase01, 0.4);
  const a = voiceDynamics(100.25, { ...voice, noteOn: 100, noteOff: 101 }, B, SR);
  const b = voiceDynamics(0.25, { ...voice, noteOn: 0, noteOff: 1 }, B, SR);
  assert.deepEqual(a, b);
});

test('voiceDynamics is a pure function of time and exposes the picture-facing fragment', () => {
  const a = voiceDynamics(1.37, voice, B, SR), b = voiceDynamics(1.37, voice, B, SR);
  assert.deepEqual(a, b);
  assert.deepEqual(Object.keys(a).sort(), ['amp', 'bellows', 'env', 'filter', 'lfo', 'source']);
  close(a.bellows.fill01, 1 - a.env.level);
  assert.equal(a.source.kind, 'saw'); assert.equal(a.filter.resonance, B.resonance);
  close(a.filter.aperture01, aperture01(a.filter.cutoffHz));
  const times = [1.9, 1.01, 2.3, 1.5, 0.2]; const shuffled = times.map(t => voiceDynamics(t, voice, B, SR));
  const sequential = [...times].sort().map(t => voiceDynamics(t, voice, B, SR));
  times.forEach((t, i) => assert.deepEqual(shuffled[i], sequential[[...times].sort().indexOf(t)]));
  assert.deepEqual(voiceDynamics(1.37, voice, { bellows: B }, SR), a);   // accepts a patch carrying the block
});

test('scheduleVoice samples the grid, includes exact envelope corners, starts at fromTime, and matches the model', () => {
  const segs = scheduleVoice(voice, B, SR);
  const times = [...new Set(segs.map(s => s.t))];
  assert.deepEqual(times, [...times].sort((x, y) => x - y));
  for (const corner of [1, 1 + B.adsr.a, 1 + B.adsr.a + B.adsr.d, 2, 2 + B.adsr.r]) assert.ok(times.some(t => Math.abs(t - corner) < 1e-12), `missing ${corner}`);
  assert.equal(times[0], 1); close(times[times.length - 1], 2 + B.adsr.r);
  assert.ok(times.length >= 200 * (1 + B.adsr.r));
  for (const s of segs) {
    const d = voiceDynamics(s.t, voice, B, SR);
    const expect = { gain: d.amp.level, cutoffHz: d.filter.cutoffHz, frequencyHz: d.source.frequencyHz }[s.param];
    close(s.value, expect); assert.equal(s.ramp, 'linear');
  }
  assert.deepEqual([...new Set(segs.map(s => s.param))].sort(), ['cutoffHz', 'frequencyHz', 'gain']);
  // Rolling window mid-envelope: first segment carries the live value at fromTime.
  const mid = scheduleVoice(voice, B, SR, { fromTime: 1.5, toTime: 1.7 });
  assert.equal(mid[0].t, 1.5); close(mid.find(s => s.param === 'gain').value, voiceDynamics(1.5, voice, B, SR).amp.level);
  close(mid[mid.length - 1].t, 1.7);
  // The grid is anchored to noteOn, so a window starting off-lattice still samples the same lattice as offline.
  const off = scheduleVoice(voice, B, SR, { fromTime: 1.5012, toTime: 1.52 });
  const offTimes = [...new Set(off.map(s => s.t))];
  assert.equal(offTimes[0], 1.5012);
  for (const t of offTimes.slice(1, -1)) close((t - 1) * 200, Math.round((t - 1) * 200), 1e-6);
  const whole = [...new Set(scheduleVoice(voice, B, SR).map(s => s.t))];
  for (const t of offTimes.slice(1, -1)) assert.ok(whole.some(w => Math.abs(w - t) < 1e-9), `lattice point ${t} missing from offline schedule`);
});

test('held voices need an explicit window; square LFO steps are exact at sample times', () => {
  const held = { ...voice, noteOff: null };
  assert.throws(() => scheduleVoice(held, B, SR), /toTime is required/);
  const segs = scheduleVoice(held, B, SR, { fromTime: 3, toTime: 3.5 });
  assert.ok(segs.length > 0 && segs.every(s => s.t >= 3 && s.t <= 3.5));
  assert.throws(() => scheduleVoice(voice, B, SR, { fromTime: 2, toTime: 1 }), /toTime must/);
  assert.throws(() => scheduleVoice(voice, B, SR, { controlRate: 0 }), /controlRate/);
  assert.throws(() => scheduleVoice(voice, B, 0), /sampleRate/);
  assert.throws(() => scheduleVoice(voice, B, -48000), /sampleRate/);
  assert.throws(() => voiceDynamics(1.5, voice, B, 0), /sampleRate/);
  assert.throws(() => scheduleVoice(held, B, SR, { fromTime: 0, toTime: 1e9 }), /MAX_SCHEDULE_POINTS/);
  assert.throws(() => scheduleVoice(held, B, SR, { fromTime: 0, toTime: 10, controlRate: 1e9 }), /MAX_SCHEDULE_POINTS/);
  assert.throws(() => scheduleVoice(held, B, SR, { fromTime: 0, toTime: Infinity }), /toTime/);
  const sq = { ...B, envAmount: 0, keyTrack: 0, adsr: { a: 0.001, d: 0.001, s: 1, r: 0.01 }, lfo: { wave: 'square', rateHz: 5, depthOct: 1, target: 'cutoff' } };
  const s = scheduleVoice({ ...voice, noteOn: 0, noteOff: 1 }, sq, SR, { controlRate: 200 }).filter(x => x.param === 'cutoffHz');
  const before = s.find(x => Math.abs(x.t - 0.095) < 1e-9), after = s.find(x => Math.abs(x.t - 0.105) < 1e-9);
  close(before.value, 2 * B.cutoffHz); close(after.value, B.cutoffHz / 2);
});
