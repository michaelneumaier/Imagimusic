// "The same touch, three families": the Three Groves page's strike on body 01 of the C Grove for each curated family (seeds 3, 7, 11),
// rendered offline from ordinary ensemble records (C active, E♭ and G silent, the page's fixed one-third mix); the same gesture, duration
// and fade, no normalisation. A sibling of tools/render-ensemble-body-study.mjs (which is unchanged). Measurements only; no claim about hearing.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, validateRestRecord } from '../src/score/grove-rest.js';
import { createRestEngine, visualFromState } from '../src/rest/engine.js';
import { ensembleRecordFromParts, canonicalEnsembleRecord, renderEnsembleRecord, validateEnsembleRecord } from '../src/score/grove-ensemble-record.js';
import { stereoWav } from '../src/loom/model.js';
import { openPhrasePlayer } from './open-phrase-player.mjs';

const out = process.argv[2] ?? 'renders/ensemble-family-study', sampleRate = 48000, sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const seeds = [...GROVE_SEEDS], names = { 3: 'Pair and neighbour', 7: 'Chain', 11: 'Close triangle' };
const position = 1, velocity = 0.5, body = 0, ended = { frame: 6 * sampleRate, fadeFrames: 1200 };          // the page's gesture on body 01; 6 s then the page's fade
const restRecord = (recipe, events) => ({ version: 2, kind: 'imagimusic-grove-rest', grove: recipe.grove, voice: recipe.voice, sampleRate, outputGain: recipe.outputGain, zones: recipe.zones, strengths: recipe.strengths, events, contacts: [], ended: { ...ended } });
/** Envelope share: the picture's low-band envelope per body, sampled every 480 frames over the first 3 s after the strike, summed, divided by the three-body total. */
function envelopeShares(recipe) {
  const e = createRestEngine(recipe); e.strike(position, body, velocity); const sums = new Array(recipe.bodies).fill(0);
  for (let i = 0; i < 3 * sampleRate; i++) { if (i % 480 === 0) visualFromState(recipe, e.state, e.key).envelope.forEach((x, b) => { sums[b] += x; }); e.step(); }
  const total = sums.reduce((a, b) => a + b, 0); return sums.map(x => +(x / total).toFixed(3));
}
await fs.mkdir(out, { recursive: true });
const report = { version: 1, sampleRate, kind: 'ordinary ensemble records (imagimusic-grove-ensemble v1), one per family: C active, E♭ and G silent, fixed one-third mix as on the Three Groves page', origin: 'Authored: the page\'s own strike (position 1, velocity 0.5) on body 01 of the C Grove at frame 0 for each curated family; 6 s, then the page\'s fade; no normalisation; rendered offline from the kept records. Not a personal performance or a device recording.', shareDefinition: 'low-band envelope per body from visualFromState, sampled every 480 frames over the first 3 s, summed, divided by the three-body total; a share of the picture\'s envelope, not of mechanical energy', cases: [] };
const playerCases = [];
for (const seed of seeds) {
  const groves = [48, 51, 55].map(note => retuneGroveCluster(composeGrove({ seed }), note)), recipes = groves.map(g => createGroveRestRecipe(g, DEFAULT_VOICE_CONFIG, { sampleRate }));
  const parts = [restRecord(recipes[0], [{ frame: 0, order: 0, body, position, velocity }]), restRecord(recipes[1], []), restRecord(recipes[2], [])];
  parts.forEach((r, i) => validateRestRecord(r, recipes[i]));
  const record = ensembleRecordFromParts(parts); validateEnsembleRecord(record, { admission: true });
  const name = `family-${seed}`, text = canonicalEnsembleRecord(record) + '\n'; await fs.writeFile(path.join(out, name + '.json'), text);
  const pcm = renderEnsembleRecord(record), wav = Buffer.from(stereoWav(pcm)); await fs.writeFile(path.join(out, name + '.wav'), wav);
  assert.deepEqual(renderEnsembleRecord(JSON.parse(text)).channels, pcm.channels, 'the kept record reconstructs the WAV exactly');
  let peak = 0; for (const ch of pcm.channels) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const g = groves[0], label = `${names[seed] ?? 'Family'} · ${seed} · body 01 struck`;
  report.cases.push({ name, seed, label, file: name + '.wav', recordFile: name + '.json', recordSha256: sha(text), wavSha256: sha(wav), frames: pcm.channels[0].length, peak, peakDbfs: +(20 * Math.log10(peak)).toFixed(1),
    anatomy: { bodiesHz: g.bodies.map(b => +b.hz.toFixed(1)), masses: g.bodies.map(b => +b.mass.toFixed(4)), bridges: g.bridges.map(e => ({ a: e.a + 1, b: e.b + 1, coupling: +e.coupling.toFixed(4) })), loss: g.loss }, envelopeShare: envelopeShares(recipes[0]) });
  playerCases.push({ name, label, file: name + '.wav', wavSha256: sha(wav), frames: pcm.channels[0].length, peak });
}
const peaks = report.cases.map(c => c.peakDbfs); report.relativeLevels = `peaks ${peaks.join(' / ')} dBFS for families ${seeds.join(' / ')}; the loudest and quietest differ by ${(Math.max(...peaks) - Math.min(...peaks)).toFixed(1)} dB; nothing normalised`;
report.limitation = 'Offline renders of authored records; the anatomy (tuning, mass, bridges, loss) is the generator\'s, the envelope share describes the picture\'s projection over 3 s; nothing is claimed about audibility, distinctness, preference or feeling. Families are not ranked.';
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
await fs.writeFile(path.join(out, 'index.html'), openPhrasePlayer({
  title: 'The same touch, three families',
  intro: 'One strike on body 01 of the C Grove, the strike the Three Groves page makes, for each generated family: Pair and neighbour, Chain, Close triangle. E♭ and G stay silent; the mix and level are the page\'s.',
  question: 'What continues after the touch, in each? What changes in the way it rings?',
  disclosure: 'Reduced vibrating-body models with virtual pickups. Authored ensemble records, one per family, rendered offline; the same strike position and velocity as the Three Groves page, the same duration and fade, no normalisation, so the families keep their own relative levels (' + report.relativeLevels + '). Not a personal performance or a device recording. The families differ in generated tuning, mass, connections and loss together; nothing is claimed about how any of them sounds, and none is preferred.',
  cases: playerCases, playLinkLabel: 'Play Three Groves ↗', playLinkHref: '../../ensemble.html', listeningDb: 20, listeningKey: 'imagimusic-ensemble-listening-db',
}));
console.log('The same touch, three families → ' + out + ': ' + report.cases.map(c => `${c.name} peak ${c.peakDbfs} dBFS share ${c.envelopeShare.join('/')}`).join(' | '));
