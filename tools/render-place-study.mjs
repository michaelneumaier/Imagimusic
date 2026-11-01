// Place comparison under the powered driver (collab/notes/fable-contact-sweep.md): one identical source and gain per grove, four cases:
// free · a hand on the driven body at u = 0.3 with c = 1 N·s/m (a specified coefficient, not a named strength) · a hand on the bridged
// neighbour at u = 1 with c = 4 · the reference firm hand (c = 60) at the driven body's tip. Numeric u is authoritative; names follow the
// agreed orientation (u increases down the shell toward the lower bridge: 0.3 upper, 0.6 middle, 1 bridge tip).
//   node tools/render-place-study.mjs <seed> <output-directory>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { composeForcedStudy, renderForcedStudy } from '../src/score/forced-study.js';
import { stereoWav } from '../src/loom/model.js';
const [seedArg, destination] = process.argv.slice(2), seed = Number(seedArg);
if (!GROVE_SEEDS.includes(seed) || !destination) { console.error('usage: node tools/render-place-study.mjs <3|7|11> <output-directory>'); process.exit(2); }
const strengths = { c1: 1, c4: 4, firm: 60 }, sr = 48000;
const reference = composeForcedStudy(createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }));
// Two rest zones (0.3 and 1) and three coefficients keep the contact-state count at 343; the driver's strike position (u = 0.6) is a position, not a zone.
const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths });
const study = composeForcedStudy(recipe, { strength: 'firm' });
if (Math.abs(study.driver.amplitude - reference.driver.amplitude) > 1e-12 * reference.driver.amplitude) throw new Error('the source must be identical to the reference study (amplitude depends on gain, pickups and direction, not on strengths).');
const idx = name => recipe.strengths.findIndex(st => st.name === name), zone = u => recipe.zones.indexOf(u);
const body = study.driver.body, neighbor = study.neighbor;
study.cases = [
  { id: 'free', contacts: [], description: 'no resting contact' },
  { id: 'driven-u0.3-c1', contacts: [{ body, zone: zone(0.3), strength: idx('c1') }], description: `hand on the driven body ${body + 1} at u = 0.3 (upper zone), c = 1 N·s/m per unit shape (a specified coefficient)` },
  { id: 'neighbor-u1-c4', contacts: [{ body: neighbor, zone: zone(1), strength: idx('c4') }], description: `hand on the bridged neighbour body ${neighbor + 1} at u = 1 (bridge tip), c = 4 N·s/m` },
  { id: 'driven-u1-c60', contacts: [{ body, zone: zone(1), strength: idx('firm') }], description: `reference: firm hand (c = 60) on the driven body ${body + 1} at u = 1 (bridge tip)` },
];
study.placeComparison = { source: 'identical to renders/forced-study for this grove: same driver frequency, amplitude, duration and gain', orientation: 'u increases down the shell toward the lower bridge: 0.3 upper, 0.6 middle, 1 bridge tip; numeric u is authoritative', scope: 'results hold for these tested cases (one sinusoid at the body tuning, 2 s on, 3 s released); no universal claim' };
const out = resolve(destination); mkdirSync(out, { recursive: true });
const rendered = renderForcedStudy(study), sha = b => createHash('sha256').update(Buffer.from(b)).digest('hex');
const cases = rendered.cases.map((c, i) => { const wav = Buffer.from(stereoWav(c.pcm)), file = `grove-${seed}-${c.id}.wav`; writeFileSync(join(out, file), wav); const { pcm, ...rest } = c; return { ...rest, description: study.cases[i].description, u: study.cases[i].contacts[0] ? study.zones[study.cases[i].contacts[0].zone] : null, c: study.cases[i].contacts[0] ? study.strengths[study.cases[i].contacts[0].strength].c : null, file, wavSha256: sha(wav), pcmSha256: pcm.channels.map(ch => sha(new Uint8Array(ch.buffer, ch.byteOffset, ch.byteLength))) }; });
const report = { generated: new Date().toISOString(), study, frames: rendered.frames, forcedFrames: rendered.forcedFrames, releaseFrame: rendered.releaseFrame, markers: rendered.markers, cases,
  method: 'One identical sample-held sinusoidal force history and fixed model gain, rendered under four contact states by the exact affine zero-order-hold step; contacts remain through the release; no boost, limiting or matching; predicted bound and observed peak reported separately; traces as in the forced study.',
  interpretation: 'Measurements describe these files for these tested cases only. Whether a hand at the upper zone or on the neighbour sounds like shaping a continuing response rather than stopping it is a listening question these numbers cannot answer.' };
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
const db = x => (20 * Math.log10(Math.max(x, 1e-12))).toFixed(1);
console.log(JSON.stringify({ out, seed, amplitudeN: study.driver.amplitude, cases: cases.map(c => ({ id: c.id, u: c.u, c: c.c, peakDbfs: db(c.observedPeak), rmsForcedDbfs: db(c.rmsForced), rmsRingDbfs: db(c.rmsRing), releaseOverForced: +(c.rmsRing / c.rmsForced).toFixed(2) })) }, null, 2));
