import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { composeGrove } from '../src/score/grove.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, renderRestRecord } from '../src/score/grove-rest.js';
import { composeEnsemblePhrase, ensembleRecords } from '../src/score/grove-ensemble.js';
import { stereoWav } from '../src/loom/model.js';
import { validateEnsembleRecord, ensembleRecordFromParts, canonicalEnsembleRecord, renderEnsembleRecord, ensembleRecordLength, ENSEMBLE_MIX_ARITHMETIC, ENSEMBLE_RECORD_KIND } from '../src/score/grove-ensemble-record.js';

const sr = 8000, c3 = composeGrove({ seed: 3 }), recipes = [48, 51, 55].map(b => createGroveRestRecipe(retuneGroveCluster(c3, b), DEFAULT_VOICE_CONFIG, { sampleRate: sr }));
const sha = b => createHash('sha256').update(Buffer.from(b)).digest('hex');

test('ensemble record: three Rest records on one clock, validated, canonical, rendered with the declared mix; silent parts keep contacts and sound nothing', () => {
  const phrase = composeEnsemblePhrase(recipes), parts = ensembleRecords(recipes, phrase), record = ensembleRecordFromParts(parts);
  assert.equal(record.kind, ENSEMBLE_RECORD_KIND); assert.deepEqual(record.parts.map(p => p.silent), [false, false, false]); assert.equal(ensembleRecordLength(record), phrase.endFrame + parts[0].ended.fadeFrames);
  const canon = canonicalEnsembleRecord(record); assert.equal(canonicalEnsembleRecord(JSON.parse(JSON.stringify(record))), canon, 'canonical form survives a JSON round trip');
  const out = renderEnsembleRecord(record), offline = parts.map((r, i) => renderRestRecord(r, recipes[i]));
  for (let ch = 0; ch < 2; ch++) for (let k = 0; k < out.channels[ch].length; k++) assert.equal(out.channels[ch][k], Math.fround(offline.reduce((s, p) => s + p.channels[ch][k] * (1 / 3), 0)));
  // A silent part: identity plus its contacts, no events; validated by the ordinary Rest rules; renders exact zeros and the mix follows.
  const silent = { ...parts[2], events: [], contacts: [{ body: 0, zone: recipes[2].zones.length - 1, strength: recipes[2].strengths.findIndex(s => s.name === 'firm'), start: 100, end: 2000, order: 0 }] };
  const withSilent = ensembleRecordFromParts([parts[0], parts[1], silent]); assert.deepEqual(withSilent.parts.map(p => p.silent), [false, false, true]);
  const out2 = renderEnsembleRecord(withSilent); assert.ok(out2.parts[2].channels[0].every(v => v === 0), 'silent part renders zeros');
  for (let k = 0; k < 2000; k++) assert.equal(out2.channels[0][k], Math.fround(offline[0].channels[0][k] * (1 / 3) + offline[1].channels[0][k] * (1 / 3) + 0 * (1 / 3)));
  // Refusals: unknown field, wrong mix gain, altered arithmetic text, differing ending, silent flag lying, different voice, wrong part index, oversized ending.
  const bad = f => { const r = JSON.parse(JSON.stringify(record)); f(r); return r; };
  // admission: false skips only the admission simulation; structure and identity are still enforced, and the option must be a boolean.
  assert.equal(validateEnsembleRecord(record, { admission: false }).length, 3); assert.throws(() => validateEnsembleRecord(bad(r => { r.parts[1].silent = true; }), { admission: false }), /silent must be true exactly/); assert.throws(() => validateEnsembleRecord(record, { admission: 'no' }), /boolean/);
  assert.throws(() => validateEnsembleRecord(bad(r => { r.extra = 1; })), /unknown field/); assert.throws(() => validateEnsembleRecord(bad(r => { r.mixGain = 0.5; })), /fixed at 1\/3/);
  assert.throws(() => validateEnsembleRecord(bad(r => { r.mixArithmetic = ENSEMBLE_MIX_ARITHMETIC + ' '; })), /verbatim/); assert.throws(() => validateEnsembleRecord(bad(r => { r.parts[1].record.ended.frame += 1; })), /common ending|no gesture after Quiet|differs/);
  assert.throws(() => validateEnsembleRecord(bad(r => { r.parts[1].silent = true; })), /silent must be true exactly/); assert.throws(() => validateEnsembleRecord(bad(r => { r.parts[2].index = 1; })), /index must be 2/);
  assert.throws(() => validateEnsembleRecord(bad(r => { r.parts[0].record.events[0].velocity = 2; })), /velocity/); assert.throws(() => validateEnsembleRecord(bad(r => { r.ended.frame = 121 * sr; r.parts.forEach(p => { p.record.ended.frame = 121 * sr; }); })), /beyond 120 s/);
  // A part's grove is validated on its own terms (a different in-bounds grove is a different instrument, which the file may legitimately hold); an out-of-bounds one is refused.
  assert.throws(() => validateEnsembleRecord(bad(r => { r.parts[0].record.grove.bridges[0].coupling = 0.05; })), /coupling|within/);
  // Parts must share one voice: a part recorded with a one-position voice is refused beside default-voice parts.
  const oneVoice = createGroveRestRecipe(recipes[1].grove, { ...DEFAULT_VOICE_CONFIG, positions: [DEFAULT_VOICE_CONFIG.positions[1]] }, { sampleRate: sr });
  const silentOther = { ...parts[1], voice: oneVoice.voice, zones: oneVoice.zones, strengths: oneVoice.strengths.map(st => ({ name: st.name, c: st.c })), outputGain: oneVoice.outputGain, events: [], contacts: [] };
  assert.throws(() => ensembleRecordFromParts([parts[0], silentOther, parts[2]]), /voice differs/);
});

test('ensemble record rebuilds the kept Safari capture from the diagnostic byte for byte', { skip: !(() => { try { readFileSync('renders/ensemble-browser-check/report.json'); return true; } catch { return false; } })() }, () => {
  const rep = JSON.parse(readFileSync('renders/ensemble-browser-check/report.json', 'utf8')), record = ensembleRecordFromParts(rep.records), out = renderEnsembleRecord(record);
  assert.equal(sha(stereoWav({ sampleRate: out.sampleRate, channels: out.channels })), sha(readFileSync('renders/ensemble-browser-check/captured.wav')));
});
