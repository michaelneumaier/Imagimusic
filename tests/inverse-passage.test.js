import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { composeGrove } from '../src/score/grove.js';
import { createInversePhrase, inverseAnatomySha256 } from '../src/score/grove-inverse-phrase.js';
import { keepInversePassage, validateInversePassage, canonicalInversePassage, inversePassageSha256, reopenInversePassage, INVERSE_PASSAGE_KIND } from '../src/score/grove-inverse-passage.js';

const anatomy = JSON.parse(readFileSync(new URL('./fixtures/inverse-kept-chain.json', import.meta.url), 'utf8'));
const at = '2026-11-02T09:50:00.000Z';
const clone = v => JSON.parse(JSON.stringify(v));
const digest = await inverseAnatomySha256(anatomy.grove);
const phrase = createInversePhrase([{ body: 1, time: 3.25 }, { body: 0, time: 3.65 }, { body: 2, time: 3.65 }], { at, sampleRate: 48000, anatomySha256: digest });

test('keep, canonicalise, hash and reopen a passage: the phrase and the retained original anatomy travel together; the fit is recomputed', async () => {
  const kept = await keepInversePassage(anatomy, phrase, { at, title: 'three touches on the chain' });
  assert.equal(kept.kind, INVERSE_PASSAGE_KIND); assert.ok(Object.isFrozen(kept) && Object.isFrozen(kept.anatomy.grove) && Object.isFrozen(kept.phrase.events));
  assert.deepEqual(Object.keys(kept).sort(), ['anatomy', 'kept', 'kind', 'phrase', 'version']);
  const text = await canonicalInversePassage(kept), again = JSON.parse(text);
  assert.equal(await canonicalInversePassage(again), text); assert.equal(await inversePassageSha256(again), await inversePassageSha256(kept));
  assert.ok(text.length < 16 * 1024, 'fits the bounded reader');
  const opened = await reopenInversePassage(again);
  assert.equal(opened.candidate.status, 'within-tolerance'); assert.ok(Math.abs(opened.candidate.residual.maxAbsCents - 0.07814716005039295) < 1e-12);
  assert.equal(opened.candidate.source, 'kept'); assert.ok(opened.bound.familyRatioBound > 1); assert.deepEqual(opened.phrase, clone(phrase));
  assert.ok(Object.isFrozen(opened) && Object.isFrozen(opened.phrase));
});

test('refusals: a phrase from another anatomy, an edited anatomy, an edited phrase, extra or missing fields, a foreign kind, a loose time, a long title', async () => {
  const kept = clone(await keepInversePassage(anatomy, phrase, { at }));
  const other = composeGrove({ seed: 7 }); other.bodies.forEach(b => b.mass = .02);
  const foreignPhrase = createInversePhrase([{ body: 0, time: 1 }], { at, sampleRate: 48000, anatomySha256: await inverseAnatomySha256(other) });
  await assert.rejects(keepInversePassage(anatomy, foreignPhrase, { at }), /different anatomy/);
  const editedAnatomy = clone(kept); editedAnatomy.anatomy.grove.bridges[0].coupling = 0.0099; await assert.rejects(validateInversePassage(editedAnatomy), /different anatomy/);
  const editedPhrase = clone(kept); editedPhrase.phrase.events[1].at = 0.5; await assert.rejects(validateInversePassage(editedPhrase), /spanSeconds|sample grid|must not decrease/);
  const residual = { ...clone(kept), residual: { maxAbsCents: 0 } }; await assert.rejects(validateInversePassage(residual), /exactly the fields/);
  const missing = clone(kept); delete missing.phrase; await assert.rejects(validateInversePassage(missing), /exactly the fields/);
  const foreignKind = { ...clone(kept), kind: 'imagimusic-inverse-candidate' }; await assert.rejects(validateInversePassage(foreignKind), /kind must be/);
  const looseTime = clone(kept); looseTime.kept.at = 'Nov 2 2026'; await assert.rejects(validateInversePassage(looseTime), /YYYY-MM-DD/);
  await assert.rejects(keepInversePassage(anatomy, phrase, { at, title: 'x'.repeat(81) }), /1\.\.80/);
  await assert.rejects(keepInversePassage(anatomy, phrase, { at: 'yesterday' }), /YYYY-MM-DD/);
  const nan = clone(kept); nan.phrase.spanSeconds = NaN; await assert.rejects(reopenInversePassage(nan), /spanSeconds/);
  await assert.rejects(reopenInversePassage(null), /must be an object/);
});

test('no async mutation gap: a caller that mutates the object after calling canonical or reopen does not change the result', async () => {
  const record = clone(await keepInversePassage(anatomy, phrase, { at }));
  const expected = await canonicalInversePassage(clone(record));
  const pending = canonicalInversePassage(record); record.kept.title = 'changed after the call'; record.phrase.events[0].body = 2;
  assert.equal(await pending, expected);
  const fresh = clone(await keepInversePassage(anatomy, phrase, { at }));
  const opening = reopenInversePassage(fresh); fresh.anatomy.grove.loss = 1.9; fresh.phrase.spanSeconds = 7;
  const opened = await opening; assert.equal(opened.record.anatomy.grove.loss, anatomy.grove.loss); assert.equal(opened.phrase.spanSeconds, phrase.spanSeconds);
});

test('keeping copies: later mutation of the inputs never reaches the kept record', async () => {
  const a = clone(anatomy), p = clone(phrase);
  const kept = await keepInversePassage(a, p, { at });
  a.grove.loss = 1.9; p.events[0].body = 2;
  assert.equal(kept.anatomy.grove.loss, anatomy.grove.loss); assert.equal(kept.phrase.events[0].body, 1);
  assert.throws(() => { kept.phrase.events[0].body = 0; }, TypeError);
});
