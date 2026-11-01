import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH, validatePatch, tineModes, modesForVoice, TINE_INDEX, renderTineSamples } from '../src/model.js';

test('physical voice frequencies come from editable dimensions and shape-weighted excitation', () => {
  const original = tineModes(DEFAULT_PATCH);
  const shorter = tineModes({ ...DEFAULT_PATCH, geometry: { ...DEFAULT_PATCH.geometry, lengthM: .04 } });
  assert.ok(Math.abs(shorter[0].frequency / original[0].frequency - (.065 / .04) ** 2) < 1e-9);
  assert.deepEqual(modesForVoice(TINE_INDEX, DEFAULT_PATCH).map(m=>m.frequency), original.map(m=>m.frequency));
  const node = tineModes(DEFAULT_PATCH, 48000, { position: .783 });
  assert.ok(node[1].amplitude < .001);
});
test('physical patch migration and limits protect the playable and offline paths', () => {
  const older = { ...DEFAULT_PATCH, version: 2 }; delete older.geometry;
  assert.deepEqual(validatePatch(older).geometry, DEFAULT_PATCH.geometry);
  assert.throws(() => validatePatch({ ...DEFAULT_PATCH, geometry: { ...DEFAULT_PATCH.geometry, lengthM: 1e-9 } }));
  assert.throws(() => validatePatch({ ...DEFAULT_PATCH, geometry: { ...DEFAULT_PATCH.geometry, material: '__proto__' } }));
});
test('physical tine offline output is audible, bounded and has a quiet complete tail', () => {
  const samples = renderTineSamples(DEFAULT_PATCH, 8000);
  assert.ok(samples.some(v => Math.abs(v) > .001));
  assert.ok(samples.every(v => Number.isFinite(v) && Math.abs(v) < 1));
  assert.ok(samples.slice(-100).every(v => Math.abs(v) < .0001));
  assert.deepEqual(samples, renderTineSamples(DEFAULT_PATCH, 8000));
});
