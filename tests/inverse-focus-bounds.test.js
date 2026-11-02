import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ({ font: '', fillStyle: '', textAlign: '', fillText() {} }) }) };
const { Box3, Vector3 } = await import('../vendor/three/build/three.module.js');
const { createInverseScene } = await import('../src/inverse/scene.js');
const { composeGrove } = await import('../src/score/grove.js');
const { inverseFocusBounds, FOCUS_PADDING, TOUCH_RING_RADIUS } = await import('../src/inverse/focus-bounds.js');

const limit = [0, 1, 2].map(body => ({ body, age: 0.299, envelope: [1, 1, 1] }));
const atMax = scene => { scene.update({ strikes: limit }); scene.root.updateMatrixWorld(true); };
const size = box => box.getSize(new Vector3()).toArray().map(v => +v.toFixed(2));

test('each body box holds its form at maximum widening, halo, label and largest touch ring; each connection box holds both bodies and the curve', () => {
  for (const seed of [3, 7, 11, 19, 31]) {
    const scene = createInverseScene(composeGrove({ seed })); atMax(scene);
    const focus = inverseFocusBounds(scene);
    assert.equal(focus.bodies.length, 3); assert.equal(focus.bridges.length, scene.bridges.length);
    scene.bodies.forEach((body, i) => { for (const part of [body.form, body.halo, body.label, body.strike]) assert.ok(focus.bodies[i].containsBox(new Box3().setFromObject(part)), `seed ${seed} body ${i}: ${part.type} inside`); });
    for (const [k, bridge] of scene.bridges.entries()) {
      const f = focus.bridges[k]; assert.deepEqual([f.a, f.b], [bridge.spec.a, bridge.spec.b]);
      assert.ok(f.bounds.containsBox(new Box3().setFromObject(bridge.curve)), 'curve inside'); for (const i of [f.a, f.b]) { assert.ok(f.bounds.containsBox(focus.bodies[i].clone().expandByScalar(-FOCUS_PADDING)), 'unpadded body inside'); }
      assert.ok(f.bounds.containsBox(new Box3().setFromObject(scene.bodies[f.a].strike)) && f.bounds.containsBox(new Box3().setFromObject(scene.bodies[f.b].strike)), 'both rings inside');
    }
    assert.ok(focus.bodies.every(b => size(b).every(Number.isFinite)));
  }
});

test('bounds are static (the same scene at maximum widening gives the same boxes), padded once, and the helper mutates nothing', () => {
  const scene = createInverseScene(composeGrove({ seed: 3 })); atMax(scene);
  const before = inverseFocusBounds(scene), widths = scene.bodies.map(b => b.form.scale.x), ringScales = scene.bodies.map(b => b.strike.scale.x);
  scene.update({ strikes: [] }); scene.root.updateMatrixWorld(true);
  scene.bodies.forEach((b, i) => assert.ok(b.form.scale.x < widths[i], 'silence narrows the forms, so the contract is to measure at maximum widening'));
  atMax(scene); const again = inverseFocusBounds(scene);
  assert.deepEqual(again, before, 'the same scene at maximum widening gives the same boxes');
  assert.deepEqual(scene.bodies.map(b => b.form.scale.x), widths); assert.deepEqual(scene.bodies.map(b => b.strike.scale.x), ringScales);
  // Padded once: rebuild body 0's unpadded box here (form, halo, label, ring guard) and expand it once.
  const body = scene.bodies[0], expected = new Box3();
  for (const part of [body.form, body.halo, body.label]) expected.union(new Box3().setFromObject(part));
  const c = body.anchor.getWorldPosition(new Vector3());
  expected.expandByPoint(c.clone().add(new Vector3(-TOUCH_RING_RADIUS, -0.03, -TOUCH_RING_RADIUS))).expandByPoint(c.clone().add(new Vector3(TOUCH_RING_RADIUS, 0.03, TOUCH_RING_RADIUS))).expandByScalar(FOCUS_PADDING);
  assert.ok(before.bodies[0].min.distanceTo(expected.min) < 1e-9 && before.bodies[0].max.distanceTo(expected.max) < 1e-9, 'body box = unpadded union expanded once');
  const bridge = before.bridges[0], pair = scene.bridges[0], unpaddedPair = before.bodies[bridge.a].clone().expandByScalar(-FOCUS_PADDING).union(before.bodies[bridge.b].clone().expandByScalar(-FOCUS_PADDING)).union(new Box3().setFromObject(pair.curve)).expandByScalar(FOCUS_PADDING);
  assert.ok(bridge.bounds.min.distanceTo(unpaddedPair.min) < 1e-9 && bridge.bounds.max.distanceTo(unpaddedPair.max) < 1e-9, 'connection box = union of unpadded body boxes and curve, expanded once');
  assert.throws(() => inverseFocusBounds({}), /needs a scene/);
});

test('measured dimensions of generated Grove fixtures (composeGrove seeds 3 and 7, not the searched default candidates) are reported for the framing work', () => {
  for (const seed of [3, 7]) { const scene = createInverseScene(composeGrove({ seed })); atMax(scene); const f = inverseFocusBounds(scene);
    console.log(`seed ${seed} ${composeGrove({ seed }).topology}: body boxes ${f.bodies.map(b => size(b).join('x')).join(' | ')}; connection boxes ${f.bridges.map(b => `${b.a + 1}-${b.b + 1} ${size(b.bounds).join('x')}`).join(' | ')}; playing ${size(scene.playingBounds).join('x')}`); }
});
