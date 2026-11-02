import test from 'node:test';
import assert from 'node:assert/strict';
// The grove scene draws body labels on a canvas; under Node a minimal stand-in is enough, since nothing here renders.
globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ({ font: '', fillStyle: '', textAlign: '', fillText() {} }) }) };
const { createGroveScene, applyGroveScene } = await import('../src/grove/scene.js');
const { composeGrove } = await import('../src/score/grove.js');

const pose = scene => scene.bodies.map(b => [b.form.scale.x, b.strike.visible, b.strike.material.opacity, b.strike.position.y, b.strike.scale.x, b.gesture.visible]);
const strikes = [{ body: 0, age: 0.1, strikeU: 0.6, remembered: true }, { body: 1, age: 0.1, strikeU: 0.6 }];   // 0.6 is the page's strike position (positions[1])

test('every existing route is unchanged: without the option no centre is ever shown, and the rings are identical with it', () => {
  const plain = createGroveScene(composeGrove({ seed: 3 })), marked = createGroveScene(composeGrove({ seed: 3 }));
  applyGroveScene(plain, { envelope: [0.2, 0.1, 0], strikes });
  applyGroveScene(marked, { envelope: [0.2, 0.1, 0], strikes }, [], [], { distinguishRemembered: true });
  assert.deepEqual(plain.bodies.map(b => b.strikeCentre.visible), [false, false, false], 'default off');
  assert.deepEqual(pose(plain), pose(marked), 'rings, shells and hands identical whether or not the distinction is on');
  assert.deepEqual(plain.bodies.slice(0, 2).map(b => b.strike.visible), [true, true], 'both strikes keep their ring');
});

test('with the option on, only a newly played strike gets the filled centre, sharing the ring\'s position, scale and fading opacity', () => {
  const scene = createGroveScene(composeGrove({ seed: 3 }));
  applyGroveScene(scene, { strikes }, [], [], { distinguishRemembered: true });
  const [remembered, played, idle] = scene.bodies;
  assert.equal(remembered.strikeCentre.visible, false, 'a remembered strike adds nothing');
  assert.equal(played.strikeCentre.visible, true);
  assert.equal(played.strikeCentre.material.opacity, played.strike.material.opacity);
  assert.equal(played.strikeCentre.position.y, played.strike.position.y); assert.equal(played.strikeCentre.scale.x, played.strike.scale.x);
  assert.equal(idle.strikeCentre.visible, false);
  applyGroveScene(scene, { strikes: [{ body: 1, age: 0.29, strikeU: 0.3 }] }, [], [], { distinguishRemembered: true });
  assert.ok(played.strikeCentre.material.opacity < 0.01 && played.strikeCentre.material.opacity === played.strike.material.opacity, 'it fades with the ring and has no motion of its own');
  applyGroveScene(scene, { strikes: [] }, [], [], { distinguishRemembered: true });
  assert.equal(played.strikeCentre.visible, false, 'gone with the ring');
});

test('the centre is a declared overlay cue: drawn without the depth test and after opaque meshes, so the core cannot occlude it at the page position', () => {
  const scene = createGroveScene(composeGrove({ seed: 3 })), body = scene.bodies[1];
  applyGroveScene(scene, { strikes }, [], [], { distinguishRemembered: true });
  assert.equal(body.strikeCentre.material.depthTest, false); assert.equal(body.strikeCentre.material.depthWrite, false); assert.ok(body.strikeCentre.renderOrder > body.core.renderOrder);
  assert.equal(body.strikeCentre.position.y, (0.5 - 0.6) * 2.6 * body.spec.scale[1], 'at the ring\'s height for the page strike position');
  assert.ok(Math.abs(body.strikeCentre.position.y) < 0.28 * body.spec.scale[1], 'which lies within the opaque core\'s radius: the overlay is what makes it visible, and a native rendered check is still the proof');
});
