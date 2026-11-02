import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { composeGrove } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { composeEnsemblePhrase, ensembleRecords } from '../src/score/grove-ensemble.js';
import { ensembleRecordFromParts, canonicalEnsembleRecord, renderEnsembleRecord } from '../src/score/grove-ensemble-record.js';
import { sha256Hex, canonicalEnsembleSha256, rotateEnsembleVoices, validateDerivedEnsemble, canonicalDerivedEnsemble, verifyDerivedEnsemble, ENSEMBLE_DERIVED_KIND } from '../src/score/grove-ensemble-derived.js';

const sr = 8000, c3 = composeGrove({ seed: 3 }), recipes = [48, 51, 55].map(b => createGroveRestRecipe(retuneGroveCluster(c3, b), DEFAULT_VOICE_CONFIG, { sampleRate: sr }));
const nodeSha = t => createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');

test('platform SHA-256 equals Node crypto on empty, ascii, unicode and multi-block inputs; the source identity is the canonical text without a newline', async () => {
  for (const t of ['', 'abc', 'The quick brown fox jumps over the lazy dog', 'ensemble · E♭ · 🎵', 'x'.repeat(55), 'y'.repeat(56), 'z'.repeat(64), 'w'.repeat(1000)]) assert.equal(await sha256Hex(t), nodeSha(t), JSON.stringify(t.slice(0, 20)));
  const record = ensembleRecordFromParts(ensembleRecords(recipes, composeEnsemblePhrase(recipes)));
  assert.equal(await canonicalEnsembleSha256(record), nodeSha(canonicalEnsembleRecord(record))); assert.notEqual(await canonicalEnsembleSha256(record), nodeSha(canonicalEnsembleRecord(record) + '\n'));
});

test('rotation 1 moves each history to the next instrument with frames and ending unchanged, recomputes silent flags, re-admits, leaves the source untouched; three rotations are the identity; verification with the source', async () => {
  const phrase = composeEnsemblePhrase(recipes, { together: false, velocity: 0.5 }), parts = ensembleRecords(recipes, phrase);
  const silentThird = { ...parts[2], events: [], contacts: [{ body: 0, zone: 2, strength: 1, start: 100, end: 2000, order: 0 }] };
  const source = ensembleRecordFromParts([parts[0], parts[1], silentThird]), before = canonicalEnsembleRecord(source), beforeJson = JSON.stringify(source);
  const derived = await rotateEnsembleVoices(source);
  assert.equal(derived.kind, ENSEMBLE_DERIVED_KIND); assert.equal(derived.derivedFrom.operation, 'rotate-voices'); assert.equal(derived.derivedFrom.rotation, 1); assert.equal(derived.derivedFrom.canonicalSha256, await canonicalEnsembleSha256(source));
  assert.equal(JSON.stringify(source), beforeJson, 'source untouched'); assert.equal(canonicalEnsembleRecord(source), before);
  const strip = r => JSON.stringify({ events: r.events, contacts: r.contacts, ended: r.ended });
  for (let j = 0; j < 3; j++) { const from = (j + 2) % 3; assert.equal(strip(derived.ensemble.parts[j].record), strip(source.parts[from].record), `part ${j} carries part ${from}'s history`); assert.equal(derived.ensemble.parts[j].record.grove.cluster.baseMidi, source.parts[j].record.grove.cluster.baseMidi, 'instruments stay in place'); assert.equal(JSON.stringify(derived.ensemble.parts[j].record.grove), JSON.stringify(source.parts[j].record.grove)); }
  assert.deepEqual(derived.ensemble.parts.map(p => p.silent), [true, false, false], 'silent flag recomputed: the silent history now sits on C');
  assert.deepEqual(derived.ensemble.ended, source.ended);
  const recipesOut = validateDerivedEnsemble(derived); assert.equal(recipesOut.length, 3); renderEnsembleRecord(derived.ensemble);
  assert.equal(canonicalDerivedEnsemble(derived), canonicalDerivedEnsemble(JSON.parse(JSON.stringify(derived))));
  // Three rotations: each hop's inner record is the next source; identities differ hop by hop; the third equals the original canonically.
  const hop1 = derived, hop2 = await rotateEnsembleVoices(hop1.ensemble), hop3 = await rotateEnsembleVoices(hop2.ensemble);
  assert.equal(hop2.derivedFrom.canonicalSha256, await canonicalEnsembleSha256(hop1.ensemble)); assert.notEqual(hop2.derivedFrom.canonicalSha256, hop1.derivedFrom.canonicalSha256);
  assert.equal(canonicalEnsembleRecord(hop3.ensemble), before, 'rotation applied three times is the identity');
  assert.deepEqual(await verifyDerivedEnsemble(derived, source), { verified: true, canonicalSha256: await canonicalEnsembleSha256(source) });
  await assert.rejects(verifyDerivedEnsemble(derived, hop1.ensemble), /not the declared source/); await assert.rejects(verifyDerivedEnsemble({ ...derived, ensemble: hop2.ensemble }, source), /not the declared operation/);
  // Refusals: other rotations, wrong kinds, a bad hash, an unsupported operation, a modified inner record, and a vocabulary mismatch.
  await assert.rejects(rotateEnsembleVoices(source, { rotation: 2 }), /only rotation 1/);
  assert.throws(() => validateDerivedEnsemble({ ...derived, kind: 'x' }), /derived ensemble/); assert.throws(() => validateDerivedEnsemble({ ...derived, derivedFrom: { ...derived.derivedFrom, canonicalSha256: 'ABC' } }), /64 lowercase hex/);
  assert.throws(() => validateDerivedEnsemble({ ...derived, derivedFrom: { ...derived.derivedFrom, operation: 'reverse' } }), /unsupported/); assert.throws(() => validateDerivedEnsemble({ ...derived, derivedFrom: { ...derived.derivedFrom, operation: 'toString' } }), /unsupported derivation operation toString/); assert.throws(() => validateDerivedEnsemble({ ...derived, derivedFrom: { ...derived.derivedFrom, rotation: 2 } }), /not supported/);
  assert.throws(() => validateDerivedEnsemble({ ...derived, extra: 1 }), /unknown field/);
  const tampered = JSON.parse(JSON.stringify(derived)); tampered.ensemble.parts[1].record.events[0].velocity = 0.9; await assert.rejects(verifyDerivedEnsemble(tampered, source), /not the declared operation/);
  const other = createGroveRestRecipe(retuneGroveCluster(c3, 55), DEFAULT_VOICE_CONFIG, { sampleRate: sr, strengths: { light: 12, firm: 70 } });
  const mismatched = ensembleRecordFromParts([parts[0], parts[1], { ...silentThird, strengths: other.strengths.map(st => ({ name: st.name, c: st.c })), grove: other.grove, outputGain: other.outputGain, contacts: [] }]);
  await assert.rejects(rotateEnsembleVoices(mismatched), /vocabulary.*differs/);
});

test('the kept native demonstration rotates and re-admits', { skip: !existsSync('renders/ensemble-demonstration/ensemble.json') }, async () => {
  const source = JSON.parse(readFileSync('renders/ensemble-demonstration/ensemble.json', 'utf8')), derived = await rotateEnsembleVoices(source);
  assert.equal(derived.ensemble.parts[1].record.events.length, source.parts[0].record.events.length); assert.equal(derived.ensemble.parts[1].record.contacts.length, source.parts[0].record.contacts.length);
  assert.equal((await verifyDerivedEnsemble(derived, source)).verified, true); renderEnsembleRecord(derived.ensemble);
});

test('mutation during the await cannot split the declared source from the moved histories', async () => {
  const source = ensembleRecordFromParts(ensembleRecords(recipes, composeEnsemblePhrase(recipes, { together: false, velocity: 0.5 }))), snapshot = structuredClone(source);
  const pending = rotateEnsembleVoices(source); source.parts[0].record.events[0].velocity = 0.4;                       // mutate while the digest is pending
  const derived = await pending; assert.equal((await verifyDerivedEnsemble(derived, snapshot)).verified, true, 'hash and histories both describe the pre-mutation source');
  const pendingVerify = verifyDerivedEnsemble(derived, snapshot); snapshot.parts[1].record.events[0].velocity = 0.4; assert.equal((await pendingVerify).verified, true, 'verification uses its own snapshot of the pair');
});
