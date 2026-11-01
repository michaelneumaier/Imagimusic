import test from 'node:test';
import assert from 'node:assert/strict';
import { excitationWeight, strikerPose, releaseLevel } from '../src/excitation.js';
import { DEFAULT_PATCH, modesFor, validatePatch } from '../src/model.js';

test('midpoint suppresses even string-basis modes while off-center excites them', () => {
  assert.ok(excitationWeight(1, .5, 1) < 1e-12);
  assert.ok(excitationWeight(1, .25, 1) > .99);
  assert.equal(excitationWeight(0, 0, 1), 0);
  assert.ok(excitationWeight(3, .13, .2) < excitationWeight(3, .13, .9));
});
test('geometry mode shapes may replace the interpreted strike basis', () => {
  assert.equal(excitationWeight(0, .5, 1, x => x * x), .25);
});
test('striker reaches the sounding surface on the audio timestamp and recovers', () => {
  assert.equal(strikerPose(1, 2).visible, false);
  assert.ok(strikerPose(1.9, 2).reach > 0);
  assert.equal(strikerPose(2, 2).reach, 1);
  assert.equal(strikerPose(2, 2).contact, 1);
  assert.ok(strikerPose(2.1, 2).reach < 1);
  assert.equal(strikerPose(2.5, 2).visible, false);
});
test('version 1 instrument files migrate without losing their seed or settings', () => {
  const legacy = { ...DEFAULT_PATCH, version: 1 }; delete legacy.strikePosition; delete legacy.release;
  const upgraded = validatePatch(legacy);
  assert.equal(upgraded.version, 3); assert.equal(upgraded.seed, legacy.seed);
  assert.equal(upgraded.strikePosition, .37); assert.equal(upgraded.release, .18);
  assert.throws(() => validatePatch({ ...DEFAULT_PATCH, release: 0 }));
});
test('strike position changes spectrum without changing mode frequencies', () => {
  const center = modesFor(60, DEFAULT_PATCH, 48000, { position: .5 });
  const edge = modesFor(60, DEFAULT_PATCH, 48000, { position: .2 });
  assert.deepEqual(center.map(m=>m.frequency), edge.map(m=>m.frequency));
  assert.ok(center[1].amplitude < 1e-12); assert.ok(edge[1].amplitude > .01);
});
test('repeated release can begin at the existing amplitude without jumping', () => {
  const voice = { fadeAt: 2, fadeDuration: .2, fadeFrom: .4 };
  assert.equal(releaseLevel(voice, 2), .4);
  assert.ok(Math.abs(releaseLevel(voice, 2.1) - .2) < 1e-12);
  assert.equal(releaseLevel(voice, 3), 0);
});
