import test from 'node:test';
import assert from 'node:assert/strict';
import { measureGroveVisual, MAPPING } from '../tools/measure-grove-visual-ranges.mjs';
import { haloOpacity, HALO_GAIN_BASELINE, HALO_GAIN_FOLLOW } from '../src/grove/scene.js';

test('the visual-range study is reproducible, linear in velocity, and uses the scene\'s own mapping', () => {
  const half = measureGroveVisual({ seed: 3, voice: 'original', velocity: 0.5 }), full = measureGroveVisual({ seed: 3, voice: 'original', velocity: 1 });
  assert.equal(half.body, 1); assert.equal(half.peak.length, 3); assert.ok(Object.isFrozen(MAPPING)); assert.equal(half.admitted, true);
  assert.equal(half.envelopeKind, 'full three-mode network envelope'); assert.equal(measureGroveVisual({ seed: 3, voice: 'partials', velocity: 0.5 }).envelopeKind, 'voice low-band envelope');
  // Astra's native diagnostic reading, Grove 3 original, body 2, v 0.5 at 1 s: [0.014895, 0.060615, 0.020975]
  [0.014895, 0.060615, 0.020975].forEach((v, i) => assert.ok(Math.abs(half.at[1][i] - v) < 5e-6, `1 s envelope body ${i + 1} matches the native reading`));
  assert.throws(() => measureGroveVisual({ seed: 3, voice: 'original', velocity: 2 }), /Invalid Grove gesture|not admitted/);
  const fine = measureGroveVisual({ seed: 3, voice: 'original', velocity: 0.5, step: 0.0002, seconds: 0.5 });   // a step below the old rounding advances
  assert.ok(fine.peakAt[0] > 0 && fine.peakAt[0] < 0.5, 'a fine step advances and finds a neighbour peak inside the window');
  assert.throws(() => measureGroveVisual({ seed: 3, voice: 'original', velocity: 0.5, step: 0 }), /finite positive/);
  full.peak.forEach((p, i) => assert.ok(Math.abs(p - 2 * half.peak[i]) < 1e-12, 'velocity scales the envelope linearly'));
  assert.ok(Math.abs(half.peak[1] - 0.0980) < 5e-4, `seed 3 struck peak at v 0.5 near 0.098 (got ${half.peak[1]})`);
  assert.ok(half.neighbourToStruck[0] > 0.2 && half.neighbourToStruck[0] < 0.3 && half.neighbourToStruck[2] > 0.25 && half.neighbourToStruck[2] < 0.32, 'seed 3 neighbours peak at 0.23..0.28 of the struck body');
  const d = full.displayAtPeak[1], level = full.peak[1];
  assert.equal(d.haloBaseline, haloOpacity(level, false)); assert.equal(d.haloFollow, haloOpacity(level, true));
  assert.equal(d.pulse, Math.min(.2, level * .6)); assert.equal(d.shell, .025 + Math.min(.7, level * 2)); assert.equal(d.core, .1 + Math.min(1.2, level * 3));
  assert.equal(HALO_GAIN_BASELINE, 2); assert.equal(HALO_GAIN_FOLLOW, 10);
  const partials = measureGroveVisual({ seed: 3, voice: 'partials', velocity: 0.5 });
  assert.ok(partials.peak[1] / half.peak[1] > 0.4 && partials.peak[1] / half.peak[1] < 0.5, 'the partials voice gives about 0.46 of the original envelope');
});
