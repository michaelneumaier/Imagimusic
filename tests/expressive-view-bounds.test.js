import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from '../vendor/three/build/three.module.js';
import { expressionViewBounds, voiceLocalBounds, RESPONSE_EXTREMES, VOICE_SPACING } from '../src/expressive/view-bounds.js';
import { createExpressionScene, applyExpressionScene } from '../src/expressive/scene.js';

const states = [...RESPONSE_EXTREMES, { fill: 0.5, aperture: 0.5, level: 0.4, pitchLever: 0.2, resonanceScale: 1, active: true, detached: false }];

test('every mesh of every voice, in every response state, lies inside the row bounds and inside its own selected bounds', () => {
  for (const count of [1, 2, 3, 4, 8]) {
    const scene = createExpressionScene(count), row = expressionViewBounds(count);
    for (const state of states) {
      applyExpressionScene({ bodies: scene.bodies.map((_, voiceId) => ({ voiceId, ...state })) }, scene);
      scene.root.updateMatrixWorld(true);
      scene.bodies.forEach((body, i) => {
        const own = expressionViewBounds(count, i), parts = [body.bellows, body.chamber, body.horn, body.source, body.pendulum, body.glow, body.halo];
        for (const part of parts) { const box = new Box3().setFromObject(part); assert.ok(own.containsBox(box), `voice ${i} of ${count}: ${part.type} inside the selected bounds`); assert.ok(row.containsBox(box), 'and inside the row'); }
        assert.ok(own.containsBox(new Box3().setFromObject(body.root)), 'the whole body');
      });
    }
  }
});

test('bounds are state-independent, centred on the voice, padded, and the halo and lever travel are included', () => {
  const a = expressionViewBounds(3, 1); const scene = createExpressionScene(3);
  applyExpressionScene({ bodies: scene.bodies.map((_, voiceId) => ({ voiceId, fill: 1, aperture: 1, level: 1, pitchLever: 0.65, resonanceScale: 1.1, active: true, detached: true })) }, scene);
  assert.deepEqual(expressionViewBounds(3, 1), a, 'the same box whatever the scene state (no breathing)');
  const local = voiceLocalBounds();                                                                   // the body is not symmetric (horn right, source and lever left), so the box is anchored, not centred
  assert.deepEqual([a.min.x, a.max.x], [local.min.x, local.max.x], 'voice 1 of 3 sits at x = 0: its box is the local box');
  assert.ok(Math.abs(expressionViewBounds(3, 2).min.x - (local.min.x + VOICE_SPACING)) < 1e-9, 'voice 2 is one spacing to the right');
  assert.ok(Math.abs(expressionViewBounds(3).min.x - (local.min.x - VOICE_SPACING)) < 1e-9 && Math.abs(expressionViewBounds(3).max.x - (local.max.x + VOICE_SPACING)) < 1e-9, 'the row spans the outer voices');
  assert.ok(local.min.x <= -0.68 && local.min.z <= -0.68 && local.max.z >= 0.68 && local.min.y <= 0.2 - 0.018, 'the detached halo (a flat torus of radius 0.68 at y 0.2) is inside in x, z and y');
  assert.ok(local.max.y >= 2.48 && local.min.x <= -0.4 - Math.sin(0.65) * 0.55 - 0.065, 'the pitch lever pivot and its full ±0.65 swing with the ball are inside');
  assert.ok(local.max.x >= 0.69 + 0.3, 'the horn mouth is inside');
  assert.ok(local.max.y >= 0.65 + 8 * 0.075 * 1.05, 'the bellows at full extension are inside');
  assert.throws(() => expressionViewBounds(0)); assert.throws(() => expressionViewBounds(3, 3)); assert.throws(() => expressionViewBounds(3, -1));
});
