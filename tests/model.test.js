import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH, MATERIALS, frequency, modesFor, envelope, makeScore, renderSamples, encodeWav, validatePatch } from '../src/model.js';
test('pitch and mode definitions obey tuning and Nyquist limits', () => {
  assert.equal(frequency(69), 440);
  for (const material of Object.keys(MATERIALS)) {
    const modes = modesFor(100, { ...DEFAULT_PATCH, material }, 22050);
    assert.ok(modes.every(mode => mode.frequency < 22050 * .45 && mode.decay > 0));
  }
});
test('higher damping shortens every mode; brighter strikes excite upper modes', () => {
  const dark = modesFor(60, { ...DEFAULT_PATCH, brightness: 0, damping: 0 });
  const bright = modesFor(60, { ...DEFAULT_PATCH, brightness: 1, damping: 1 });
  bright.forEach((mode, i) => { assert.ok(mode.decay < dark[i].decay); if (i) assert.ok(mode.amplitude > dark[i].amplitude); });
  assert.equal(envelope(-.1, 1), 0); assert.equal(envelope(0, 1), 0);
  assert.ok(envelope(.1, 1) > envelope(1, 1)); assert.equal(envelope(10, 1), 0);
});
test('a saved seed reproduces its score and a new seed changes the phrase', () => {
  assert.deepEqual(makeScore(DEFAULT_PATCH), makeScore({ ...DEFAULT_PATCH }));
  assert.notDeepEqual(makeScore(DEFAULT_PATCH), makeScore({ ...DEFAULT_PATCH, seed: 42 }));
  const events = makeScore(DEFAULT_PATCH);
  assert.equal(events.length, 32); assert.ok(events.every((e, i) => e.index >= 0 && e.index < 8 && (i === 0 || e.time > events[i-1].time)));
});
test('instrument import rejects malformed, hostile, and unbounded settings', () => {
  assert.deepEqual(validatePatch(DEFAULT_PATCH), DEFAULT_PATCH);
  for (const invalid of [null, {}, { ...DEFAULT_PATCH, material: '__proto__' }, { ...DEFAULT_PATCH, tempo: 0 }, { ...DEFAULT_PATCH, damping: NaN }, { ...DEFAULT_PATCH, seed: .4 }, { ...DEFAULT_PATCH, brightness: '1' }]) assert.throws(() => validatePatch(invalid));
});
test('offline render is finite, deterministic, audible, and includes a quiet tail', () => {
  const patch = { ...DEFAULT_PATCH, damping: .8, tempo: 160 };
  const samples = renderSamples(patch, 8000, 2);
  assert.deepEqual(samples, renderSamples(patch, 8000, 2));
  assert.ok(samples.every(value => Number.isFinite(value) && Math.abs(value) <= .981));
  assert.ok(samples.some(value => Math.abs(value) > .001));
  assert.ok(samples.slice(-100).every(value => Math.abs(value) < .0001));
  const wav = new DataView(encodeWav(samples, 8000));
  assert.equal(wav.getUint32(24, true), 8000); assert.equal(wav.getUint32(40, true), samples.length * 2);
  assert.equal(wav.byteLength, 44 + samples.length * 2);
});
