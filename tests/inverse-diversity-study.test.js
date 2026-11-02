import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { measureDiversity, responseProfile, distances, DIVERSITY_DEFINITIONS } from '../tools/measure-inverse-diversity.mjs';
import { createHash } from 'node:crypto';
import { canonicalGrove, validateGrove } from '../src/score/grove.js';
import { createInverseInstrument } from '../src/inverse/instrument.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/inverse-kept-chain.json', import.meta.url), 'utf8'));

test('the diversity study is reproducible and says "same body" only for equal canonical digests', () => {
  const study = measureDiversity(fixture.target, [19]);
  assert.deepEqual(study.seeds, [19]); assert.ok(Object.isFrozen(DIVERSITY_DEFINITIONS)); assert.equal(study.definitions, DIVERSITY_DEFINITIONS);
  const chain = study.fits.find(f => f.topology === 'chain');
  assert.equal(chain.status, 'accepted'); assert.ok(Math.abs(chain.maxAbsCents - 0.07814716005039295) < 1e-12, 'seed 19 reproduces the kept chain');
  assert.equal(chain.digest, createHash('sha256').update(canonicalGrove(fixture.grove)).digest('hex'));
  assert.equal(chain.profile.length, 3); assert.ok(chain.profile.every(p => Number.isFinite(p.rightMinusLeftDb)));
  const self = { grove: fixture.grove, digest: chain.digest, profile: responseProfile(fixture.grove) };
  const d = distances(self, self); assert.equal(d.sameBody, true); assert.equal(d.responseDifferenceDb, 0); assert.equal(d.couplingDifference, 0); assert.equal(d.centsDifference, 0);
  const other = study.fits.find(f => f.topology === 'triangle'); assert.equal(other.status, 'accepted'); assert.notEqual(other.digest, chain.digest);
  // duplicate seeds give exact identity and zero distances; a different seed gives different digests (Astra's smoke probe)
  const dup = measureDiversity(fixture.target, [19, 19]);
  for (const pair of dup.pairs) { assert.equal(pair.sameBody, true); assert.equal(pair.responseDifferenceDb, 0); assert.equal(pair.pickupDifferenceDb, 0); assert.equal(pair.couplingDifference, 0); assert.equal(pair.centsDifference, 0); }
  assert.ok(Math.abs(chain.profile[0].rightMinusLeftDb - (-12.6)) < 0.3, 'seed 19 chain touch 1 balance near −12.6 dB at the 8 kHz period');
});

test('the analytic response profile equals the RMS of the actual rendered strike PCM over frames 0..16000 at 8 kHz, for the fixture and for a high-tuned admitted Grove', () => {
  // A high anatomy: the fixture transposed to the highest garden base (B♭4, midi 70, 466.16 Hz) with hz re-derived from cents, as validateGrove requires.
  const high = JSON.parse(JSON.stringify(fixture.grove)); high.cluster = { baseMidi: 70, baseHz: Number((440 * 2 ** ((70 - 69) / 12)).toFixed(6)) };
  high.bodies.forEach(b => { b.hz = Number((high.cluster.baseHz * 2 ** (b.cents / 1200)).toFixed(3)); }); validateGrove(high);
  const db = x => 20 * Math.log10(Math.max(x, 1e-15));
  for (const grove of [fixture.grove, high]) {
    const inst = createInverseInstrument(grove, { sampleRate: 8000 }), profile = responseProfile(grove);
    for (let body = 0; body < 3; body++) {
      const pcm = inst.renderStrike(body).channels; assert.ok(pcm[0].length > 16000);
      const rms = c => { let acc = 0; for (let i = 0; i <= 16000; i++) acc += pcm[c][i] * pcm[c][i]; return Math.sqrt(acc / 16001); };
      assert.ok(Math.abs(db(rms(0)) - profile[body].leftDb) < 1e-3, `left RMS matches rendered PCM (touch ${body + 1}, base ${grove.cluster.baseMidi})`);
      assert.ok(Math.abs(db(rms(1)) - profile[body].rightDb) < 1e-3, `right RMS matches rendered PCM (touch ${body + 1}, base ${grove.cluster.baseMidi})`);
      assert.notEqual(profile[body].rightMinusLeftDb, Number(profile[body].rightMinusLeftDb.toFixed(2)), 'profile values are unrounded');
    }
  }
});
