import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH } from '../src/model.js';
import { createPerformance } from '../src/stage/performance.js';
import { createProjection } from '../src/stage/projection.js';
import { createTraceManifest, compareManifests, MANIFEST_VERSION } from '../src/stage/manifest.js';

test('a manifest lists one hash per video frame and reproduces exactly from the same seed', () => {
  const p = createPerformance(DEFAULT_PATCH);
  const a = createTraceManifest(p, { fps: 30 }), b = createTraceManifest(createPerformance(DEFAULT_PATCH), { fps: 30 });
  assert.equal(a.v, MANIFEST_VERSION); assert.equal(a.fps, 30); assert.equal(a.seed, DEFAULT_PATCH.seed);
  assert.equal(a.frames, Math.ceil(p.duration * 30 - 1e-9)); assert.equal(a.hashes.length, a.frames);
  assert.equal(a.audioSamples, Math.ceil(p.duration * 48000)); assert.equal(a.projected, false);
  assert.deepEqual(a, b);
  assert.deepEqual(compareManifests(a, b), { equal: true, firstDifference: -1, frames: [a.frames, b.frames] });
});

test('a different seed, a different fps, or a projection changes the manifest and the first differing frame is reported', () => {
  const a = createTraceManifest(createPerformance(DEFAULT_PATCH), { fps: 30 });
  const seeded = createTraceManifest(createPerformance({ ...DEFAULT_PATCH, seed: 42 }), { fps: 30 });
  const c = compareManifests(a, seeded);
  assert.equal(c.equal, false); assert.ok(c.firstDifference >= 0);
  const fps60 = createTraceManifest(createPerformance(DEFAULT_PATCH), { fps: 60 });
  assert.equal(fps60.frames, Math.ceil(a.duration * 60 - 1e-9)); assert.equal(compareManifests(a, fps60).equal, false);
  const p = createPerformance(DEFAULT_PATCH), projected = createTraceManifest(p, { fps: 30, project: createProjection(p.patch) });
  assert.equal(projected.projected, true); assert.equal(projected.frames, a.frames); assert.notDeepEqual(projected.hashes, a.hashes);
  assert.deepEqual(projected, createTraceManifest(createPerformance(DEFAULT_PATCH), { fps: 30, project: createProjection(p.patch) }));
  assert.throws(() => createTraceManifest(p, { fps: 0 }), /fps/); assert.throws(() => createTraceManifest({}), /createPerformance/);
});
