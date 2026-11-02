import test from 'node:test';
import assert from 'node:assert/strict';
// The grove scene draws body labels on a canvas; under Node a minimal stand-in is enough, since nothing here renders.
globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ({ font: '', fillStyle: '', textAlign: '', fillText() {} }) }) };
const { createGroveScene, applyGroveScene, STRIKE_DOT_RADIUS, haloOpacity } = await import('../src/grove/scene.js');
const { composeGrove } = await import('../src/score/grove.js');

const pose = scene => scene.bodies.map(b => [b.form.scale.x, b.strike.visible, b.strike.material.opacity, b.strike.position.y, b.strike.scale.x, b.gesture.visible]);
const strikes = [{ body: 0, age: 0.1, strikeU: 0.6, remembered: true }, { body: 1, age: 0.1, strikeU: 0.6 }];   // 0.6 is the page's strike position (positions[1])

test('every existing route is unchanged: without the option no dot is ever shown, and the rings are identical with it', () => {
  const plain = createGroveScene(composeGrove({ seed: 3 })), marked = createGroveScene(composeGrove({ seed: 3 }));
  applyGroveScene(plain, { envelope: [0.2, 0.1, 0], strikes });
  applyGroveScene(marked, { envelope: [0.2, 0.1, 0], strikes }, [], [], { distinguishRemembered: true });
  assert.deepEqual(plain.bodies.map(b => b.strikeDot.visible), [false, false, false], 'default off');
  assert.deepEqual(pose(plain), pose(marked), 'rings, shells and hands identical whether or not the distinction is on');
  assert.deepEqual(plain.bodies.slice(0, 2).map(b => b.strike.visible), [true, true], 'both strikes keep their ring');
});

test('with the option on, only a newly played strike gets the rim dot, following the ring\'s height, scale and fading opacity, clear of shell and core', () => {
  const scene = createGroveScene(composeGrove({ seed: 3 }));
  applyGroveScene(scene, { strikes }, [], [], { distinguishRemembered: true });
  const [remembered, played, idle] = scene.bodies;
  assert.equal(remembered.strikeDot.visible, false, 'a remembered strike adds nothing');
  assert.equal(played.strikeDot.visible, true);
  assert.equal(played.strikeDot.material.opacity, played.strike.material.opacity);
  assert.equal(played.strikeDot.position.y, played.strike.position.y, 'at the ring\'s height for the page strike position 0.6');
  assert.equal(played.strikeDot.position.x, STRIKE_DOT_RADIUS * played.strike.scale.x, 'on the rim, just outside the ring, scaled with it');
  assert.ok(STRIKE_DOT_RADIUS > 0.65 && STRIKE_DOT_RADIUS > 0.28, 'outside the ring radius and well outside the core radius: not inside the body');
  assert.equal(idle.strikeDot.visible, false);
  applyGroveScene(scene, { strikes: [{ body: 1, age: 0.29, strikeU: 0.6 }] }, [], [], { distinguishRemembered: true });
  assert.ok(played.strikeDot.material.opacity < 0.01 && played.strikeDot.material.opacity === played.strike.material.opacity, 'it fades with the ring and has no motion of its own');
  applyGroveScene(scene, { strikes: [{ body: 1, age: 0.05, strikeU: 0.6 }] }, [], [], { distinguishRemembered: false });
  assert.equal(played.strikeDot.visible, false, 'turning the option off hides an already visible dot while the ring stays');
  assert.equal(played.strike.visible, true);
  applyGroveScene(scene, { strikes: [] }, [], [], { distinguishRemembered: true });
  assert.equal(played.strikeDot.visible, false, 'gone with the ring');
});

test('Follow the ring: off is the baseline halo mapping on every route; on changes only the halo gain to a fixed function of the envelope', () => {
  const baseline = level => 0.15 + Math.min(0.65, level * 2);
  const off = createGroveScene(composeGrove({ seed: 3 })), on = createGroveScene(composeGrove({ seed: 7 })), levels = [0, 0.0107, 0.03, 0.061, 0.2];
  for (const level of levels) {
    applyGroveScene(off, { envelope: [level, level, level], strikes }, [], [], { distinguishRemembered: true });
    assert.deepEqual(off.bodies.map(b => b.halo.material.opacity), [baseline(level), baseline(level), baseline(level)], 'byte-identical baseline when the option is absent or false');
    applyGroveScene(off, { envelope: [level, level, level], strikes }, [], [], { followRing: false });
    assert.equal(off.bodies[0].halo.material.opacity, baseline(level));
  }
  const everything = s => s.bodies.map(b => [b.form.scale.x, b.shell.material.emissiveIntensity, b.core.material.emissiveIntensity, b.halo.scale.x, b.halo.material.color.getHex(), b.strike.visible, b.strikeDot.visible]);
  applyGroveScene(on, { envelope: [0.061, 0.0107, 0.03], strikes }, [], [], { followRing: false }); const before = everything(on);
  applyGroveScene(on, { envelope: [0.061, 0.0107, 0.03], strikes }, [], [], { followRing: true });
  assert.deepEqual(everything(on), before, 'nothing but the halo opacity changes');
  assert.deepEqual(on.bodies.map(b => +b.halo.material.opacity.toFixed(3)), [0.76, 0.257, 0.45], 'one fixed constant: 0.15 + min(0.65, level × 10)');
  assert.equal(haloOpacity(0.065, true), 0.8, 'the cap begins at an envelope of 0.065'); assert.equal(haloOpacity(1, true), 0.8); assert.equal(haloOpacity(-1, true), 0.15);
});
