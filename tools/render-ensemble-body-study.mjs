// "One Grove, three bodies": four authored cases on the C Grove of Three Groves, rendered offline from ordinary ensemble records
// (C active, E♭ and G silent, the page's fixed one-third mix): the same strike on body 01, on 02, on 03, and on 01 and 02 together.
// Proposal: collab/notes/fable-play-the-bodies.md. Measurements only; no claim about hearing.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { composeGrove } from '../src/score/grove.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, validateRestRecord } from '../src/score/grove-rest.js';
import { createRestEngine, visualFromState } from '../src/rest/engine.js';
import { ensembleRecordFromParts, canonicalEnsembleRecord, renderEnsembleRecord, validateEnsembleRecord } from '../src/score/grove-ensemble-record.js';
import { stereoWav } from '../src/loom/model.js';
import { openPhrasePlayer } from './open-phrase-player.mjs';

const out = process.argv[2] ?? 'renders/ensemble-body-study', sampleRate = 48000, sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const groves = [48, 51, 55].map(note => retuneGroveCluster(composeGrove({ seed: 3 }), note)), recipes = groves.map(grove => createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate }));
const position = 1, velocity = 0.5, ended = { frame: 6 * sampleRate, fadeFrames: 1200 };                 // the page's gesture; 6 s then the page's fade
const restRecord = (recipe, events) => ({ version: 2, kind: 'imagimusic-grove-rest', grove: recipe.grove, voice: recipe.voice, sampleRate, outputGain: recipe.outputGain, zones: recipe.zones, strengths: recipe.strengths, events, contacts: [], ended: { ...ended } });
const cases = [
  ['body-01', 'C struck on body 01', [0]], ['body-02', 'C struck on body 02', [1]], ['body-03', 'C struck on body 03', [2]], ['body-01-02', 'C struck on 01 and 02 together', [0, 1]],
];
/** Envelope share: the picture's low-band envelope per body, sampled every 480 frames over the first 3 s after the strike, summed, divided by the three-body total. */
function envelopeShares(recipe, bodies) {
  const e = createRestEngine(recipe); for (const body of bodies) e.strike(position, body, velocity);
  const sums = new Array(recipe.bodies).fill(0);
  for (let i = 0; i < 3 * sampleRate; i++) { if (i % 480 === 0) visualFromState(recipe, e.state, e.key).envelope.forEach((x, b) => { sums[b] += x; }); e.step(); }
  const total = sums.reduce((a, b) => a + b, 0); return sums.map(x => +(x / total).toFixed(3));
}
await fs.mkdir(out, { recursive: true });
const report = { version: 1, sampleRate, kind: 'ordinary ensemble records (imagimusic-grove-ensemble v1): C active, E♭ and G silent, fixed one-third mix as on the Three Groves page', origin: 'Authored: the page\'s own strike (position 1, velocity 0.5) on the named bodies of the C Grove at frame 0; 6 s, then the page\'s fade; no normalisation; rendered offline from the kept records. Not a personal performance or a device recording.', tunings: groves.map((g, i) => ({ grove: ['C', 'E♭', 'G'][i], bodiesHz: g.bodies.map(b => +b.hz.toFixed(1)) })), shareDefinition: 'low-band envelope per body from visualFromState, sampled every 480 frames over the first 3 s, summed, divided by the three-body total; a share of the picture\'s envelope, not of mechanical energy', cases: [] };
const playerCases = [];
for (const [name, label, bodies] of cases) {
  const events = bodies.map((body, order) => ({ frame: 0, order, body, position, velocity }));
  const parts = [restRecord(recipes[0], events), restRecord(recipes[1], []), restRecord(recipes[2], [])];
  parts.forEach((r, i) => validateRestRecord(r, recipes[i]));                                           // each part admitted on its own instrument
  const record = ensembleRecordFromParts(parts); validateEnsembleRecord(record, { admission: true });  // combined admission
  const text = canonicalEnsembleRecord(record) + '\n'; await fs.writeFile(path.join(out, name + '.json'), text);
  const pcm = renderEnsembleRecord(record), wav = Buffer.from(stereoWav(pcm)); await fs.writeFile(path.join(out, name + '.wav'), wav);
  const again = renderEnsembleRecord(JSON.parse(text)); assert.deepEqual(again.channels, pcm.channels, 'the kept record reconstructs the WAV exactly');
  let peak = 0; for (const ch of pcm.channels) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const shares = envelopeShares(recipes[0], bodies);
  report.cases.push({ name, label, bodies: bodies.map(b => b + 1), file: name + '.wav', recordFile: name + '.json', recordSha256: sha(text), wavSha256: sha(wav), frames: pcm.channels[0].length, peak, peakDbfs: +(20 * Math.log10(peak)).toFixed(1), envelopeShare: shares });
  playerCases.push({ name, label, file: name + '.wav', wavSha256: sha(wav), frames: pcm.channels[0].length, peak });
}
report.limitation = 'Offline renders of authored records; the envelope share describes the picture\'s projection over a 3 s window and says nothing about what is heard or seen; nothing is claimed about audibility, beating or preference.';
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
await fs.writeFile(path.join(out, 'index.html'), openPhrasePlayer({
  title: 'One Grove, three bodies',
  intro: 'The C Grove of Three Groves holds three connected bodies. The same strike lands on body 01, on 02, on 03, and on 01 and 02 together. E♭ and G stay silent; the mix is the page\'s.',
  question: 'What changed? What would you touch next?',
  disclosure: 'Reduced vibrating-body models with virtual pickups. Authored ensemble records with only the C Grove active, rendered offline; the same strike position and velocity as the Three Groves page, the same duration and fade, no normalisation; not a personal performance or a device recording. Levels are the model\'s own. Nothing is claimed about how this sounds.',
  cases: playerCases, playLinkLabel: 'Play Three Groves ↗', playLinkHref: '../../ensemble.html', listeningDb: 20, listeningKey: 'imagimusic-ensemble-listening-db',
}));
console.log('One Grove, three bodies → ' + out + ': ' + report.cases.map(c => `${c.name} peak ${c.peakDbfs} dBFS share ${c.envelopeShare.join('/')}`).join(' | '));
