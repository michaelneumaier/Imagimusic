import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS, canonicalGrove, validateGrove } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG, createGroveVoice } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, describeIndividuality } from '../src/score/grove-rest.js';
import { retuneGroveCluster, transposeGrove, transpositionRatio, describeTransposition, GARDEN_NOTES, noteFrequency } from '../src/score/grove-tuning.js';

test('whole-cluster transposition keeps the grove intact and scales every mode by the ratio; round trip is exact', () => {
  assert.equal(transposeGrove, retuneGroveCluster); assert.equal(+noteFrequency(48).toFixed(3), 130.813); assert.equal(+noteFrequency(55).toFixed(3), 195.998);
  for (const seed of GROVE_SEEDS) {
    const g = composeGrove({ seed });
    for (const note of GARDEN_NOTES) {
      const t = transposeGrove(g, note), ratio = transpositionRatio(g.cluster.baseMidi, note);
      validateGrove(t); assert.equal(t.seed, g.seed); assert.equal(t.topology, g.topology); assert.equal(t.loss, g.loss); assert.deepEqual(t.layout, g.layout); assert.deepEqual(t.bridges, g.bridges);
      assert.deepEqual(t.bodies.map(b => [b.cents, b.mass]), g.bodies.map(b => [b.cents, b.mass])); assert.equal(t.cluster.baseMidi, note);
      t.bodies.forEach((b, i) => assert.ok(Math.abs(b.hz / g.bodies[i].hz - ratio) < 2e-5, `body ${i} hz ratio ${b.hz / g.bodies[i].hz} vs ${ratio}`));
      // The whole modal set scales by the ratio (stiffness fractions intact); decay rates unchanged.
      const va = createGroveVoice(g), vb = createGroveVoice(t);
      va.normalFreqsHz.forEach((f, r) => assert.ok(Math.abs(vb.normalFreqsHz[r] / f - ratio) < 3e-5, `mode ${r}`)); va.gammas.forEach((gm, r) => assert.ok(Math.abs(vb.gammas[r] - gm) < 1e-9));
      // Round trip returns the original canonically; same note returns the original canonically.
      assert.equal(canonicalGrove(transposeGrove(t, g.cluster.baseMidi)), canonicalGrove(g)); if (note === g.cluster.baseMidi) assert.equal(canonicalGrove(t), canonicalGrove(g));
      const d = describeTransposition(g, t); assert.equal(d.semitones, note - g.cluster.baseMidi); assert.equal(d.ratio, +ratio.toFixed(6));
    }
  }
  // Beat rates scale with the ratio too (seed 3 to G3), a fact the ensemble's clusters will carry.
  const sr = 8000, c3 = composeGrove({ seed: 3 }), g3 = transposeGrove(c3, 55), fa = describeIndividuality(createGroveRestRecipe(c3, DEFAULT_VOICE_CONFIG, { sampleRate: sr })).facts, fb = describeIndividuality(createGroveRestRecipe(g3, DEFAULT_VOICE_CONFIG, { sampleRate: sr })).facts;
  fa.beatRatesHz.forEach((b, i) => assert.ok(Math.abs(fb.beatRatesHz[i] / b - transpositionRatio(48, 55)) < 0.02, `beat ${i}: ${b} → ${fb.beatRatesHz[i]}`));
  assert.throws(() => transposeGrove(c3, 50), /garden note/); assert.throws(() => transpositionRatio(48, 61), /garden notes/);
  const other = composeGrove({ seed: 7 }); assert.throws(() => describeTransposition(c3, other), /not a whole-cluster transposition/);
});
