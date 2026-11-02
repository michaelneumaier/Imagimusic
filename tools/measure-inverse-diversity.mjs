// Study, not a solver wrapper (corrected after Astra's review: sampling at the 8 kHz period, not 1 ms, so no admitted tuning can alias; profiles unrounded): how different are the accepted fits for one target across solver seeds, and how differently do they answer the
// same touch. Definitions are printed with the table so the numbers mean one thing. No perceptual claim; "the same body" is said only when the
// canonical grove digests are equal.
//   usage: node tools/measure-inverse-diversity.mjs [fixture.json] [seed,seed,...]
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { searchThreeResonanceGroves } from '../src/score/grove-inverse.js';
import { canonicalGrove } from '../src/score/grove.js';
import { createInverseInstrument, INVERSE_DISPLACEMENT_GAIN, INVERSE_PICKUP_BODIES } from '../src/inverse/instrument.js';

export const DIVERSITY_DEFINITIONS = Object.freeze({
  search: 'searchThreeResonanceGroves(target, { baseMidi: 48, seed, budget: { restarts: 6, iterations: 300, maxEvaluations: 60000 } }), the workshop page\'s options; one seed per run.',
  identity: 'two fits are the same body only if sha256(canonicalGrove(grove)) are equal; everything else is a numeric distance, never a novelty or perceptual claim.',
  response: 'for each touch body b in 0..2, the instrument\'s analytic frame(b, i / 8000) for i = 0..16000 (2 s inclusive at the 8000 Hz sample period, 16001 samples, above twice the family\'s highest admitted tuning of 600 Hz so no alias; no zero padding, the window is shorter than any strike); left = displacement[pickup 0] × gain, right = displacement[pickup 2] × gain (INVERSE_PICKUP_BODIES, INVERSE_DISPLACEMENT_GAIN); RMS over the window; dB = 20·log10(max(rms, 1e-15)), the floor only guarding log of zero (no window here is zero). Profile values are kept unrounded; rounding happens only in the printed tables.',
  rightMinusLeftDb: 'dB(right RMS) − dB(left RMS) for one touch; a channel-balance figure of the pickups, not loudness.',
  responseDifferenceDb: 'between two fits, the largest over the three touches of |rightMinusLeftDb(A) − rightMinusLeftDb(B)|; also reported per pickup: the largest over touches and pickups of |dB(rms A) − dB(rms B)|.',
  couplingDifference: 'largest absolute difference between corresponding bridge couplings (dimensionless ratios) of two fits with the same topology.',
  centsDifference: 'largest absolute difference in cents between corresponding body tunings (hz) of two fits with the same topology.',
});

const digest = grove => createHash('sha256').update(canonicalGrove(grove)).digest('hex');
const db = x => 20 * Math.log10(Math.max(x, 1e-15));
export function responseProfile(grove) {
  const inst = createInverseInstrument(grove, { sampleRate: 8000 }), out = [];
  for (let body = 0; body < 3; body++) {
    let l = 0, r = 0, n = 0;
    for (let i = 0; i <= 16000; i++) { const d = inst.frame(body, i / 8000).displacement; const L = d[INVERSE_PICKUP_BODIES[0]] * INVERSE_DISPLACEMENT_GAIN, R = d[INVERSE_PICKUP_BODIES[1]] * INVERSE_DISPLACEMENT_GAIN; l += L * L; r += R * R; n++; }
    const left = db(Math.sqrt(l / n)), right = db(Math.sqrt(r / n));
    out.push({ touch: body + 1, leftDb: left, rightDb: right, rightMinusLeftDb: right - left });
  }
  return out;
}
export function distances(a, b) {
  const sameBody = a.digest === b.digest;
  const responseDifferenceDb = Math.max(...a.profile.map((p, i) => Math.abs(p.rightMinusLeftDb - b.profile[i].rightMinusLeftDb)));
  const pickupDifferenceDb = Math.max(...a.profile.map((p, i) => Math.max(Math.abs(p.leftDb - b.profile[i].leftDb), Math.abs(p.rightDb - b.profile[i].rightDb))));
  const couplingDifference = Math.max(...a.grove.bridges.map((e, i) => Math.abs(e.coupling - b.grove.bridges[i].coupling)));
  const centsDifference = Math.max(...a.grove.bodies.map((body, i) => Math.abs(1200 * Math.log2(body.hz / b.grove.bodies[i].hz))));
  return { sameBody, responseDifferenceDb, pickupDifferenceDb, couplingDifference, centsDifference };   // unrounded; tables round for display
}
export function measureDiversity(target, seeds) {
  const fits = [];
  for (const seed of seeds) {
    const report = searchThreeResonanceGroves(target, { baseMidi: 48, seed, budget: { restarts: 6, iterations: 300, maxEvaluations: 60000 } });
    for (const c of report.candidates) fits.push(c.grove ? { seed, topology: c.topology, status: c.status, maxAbsCents: c.residual.maxAbsCents, evaluations: c.evaluations, grove: c.grove, digest: digest(c.grove), profile: responseProfile(c.grove) } : { seed, topology: c.topology, status: c.status });
  }
  const pairs = [];
  for (const topology of ['chain', 'triangle']) { const set = fits.filter(f => f.topology === topology && f.grove); for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) pairs.push({ topology, a: set[i].seed, b: set[j].seed, ...distances(set[i], set[j]) }); }
  return { target, seeds, definitions: DIVERSITY_DEFINITIONS, fits: fits.map(({ grove, profile, ...f }) => ({ ...f, hz: grove?.bodies.map(b => b.hz), couplings: grove?.bridges.map(b => b.coupling), profile })), pairs };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = JSON.parse(readFileSync(process.argv[2] ?? new URL('../tests/fixtures/inverse-kept-chain.json', import.meta.url), 'utf8'));
  const seeds = (process.argv[3] ?? '19,1,7,23,42,101,2024').split(',').map(Number);
  const study = measureDiversity(fixture.target ?? fixture, seeds);
  console.log('| seed | topology | status | max cents | hz | couplings | R−L dB per touch | digest |\n|---|---|---|---|---|---|---|---|');
  for (const f of study.fits) console.log(`| ${f.seed} | ${f.topology} | ${f.status} | ${f.maxAbsCents?.toFixed(4) ?? ''} | ${f.hz?.map(h => h.toFixed(2)).join(' / ') ?? ''} | ${f.couplings?.map(k => k.toFixed(4)).join(' / ') ?? ''} | ${f.profile?.map(p => p.rightMinusLeftDb.toFixed(1)).join(' / ') ?? ''} | ${f.digest?.slice(0, 12) ?? ''} |`);
  console.log('\n| topology | pair | same body | response diff dB | pickup diff dB | coupling diff | cents diff |\n|---|---|---|---|---|---|---|');
  for (const p of study.pairs) console.log(`| ${p.topology} | ${p.a} vs ${p.b} | ${p.sameBody} | ${p.responseDifferenceDb.toFixed(2)} | ${p.pickupDifferenceDb.toFixed(2)} | ${p.couplingDifference.toFixed(4)} | ${p.centsDifference.toFixed(2)} |`);
  console.log('\nDefinitions:'); for (const [k, v] of Object.entries(DIVERSITY_DEFINITIONS)) console.log(`- ${k}: ${v}`);
}
