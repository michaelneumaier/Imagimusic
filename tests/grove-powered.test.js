import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, renderRestRecord, restInvitationRecord, composeRestInvitation } from '../src/score/grove-rest.js';
import { composeForcedStudy, renderForcedStudy } from '../src/score/forced-study.js';
import { createPoweredRecipe, composeEncounterRecord, renderPoweredRecord, validatePoweredRecord, validatePoweredAdmission, poweredRecipeForRecord, canonicalPoweredRecord, poweredAmplitudeLimit, POWERED_RECORD_KIND, POWERED_RECORD_VERSION, POWERED_FORCE_LAW } from '../src/score/grove-powered.js';
import { createPoweredEngine, poweredForceAt, createForceSequence, forceRotation, contactStateKey } from '../src/rest/powered-engine.js';

test('powered engine parity: constant contacts equal the audited forced study; zero force equals the Rest route; switches are continuous and within budget', () => {
  const sr = 8000;
  for (const seed of GROVE_SEEDS) {
    const base = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1, firm: 60 } }), recipe = createPoweredRecipe(base);
    // (a) Constant-contact parity with the forced study: the study's sample-held Math.sin source and the record's declared recurrence differ by rounding only (1e-9 of amplitude), so parity holds below 1e-6 of peak, not bit-exactly.
    const study = composeForcedStudy(base, { forceSeconds: 1, ringSeconds: 1.5, strength: 'firm' }), studyOut = renderForcedStudy(study);
    const rec = composeEncounterRecord(recipe, { forceSeconds: 1, ringSeconds: 1.5 });
    assert.ok(Math.abs(rec.driver.amplitude - study.driver.amplitude) < 1e-12 * study.driver.amplitude, 'the same declared amplitude (half the ceiling)');
    for (const [caseIndex, contacts] of [[0, []], [1, [{ body: 0, zone: 1, strength: 1, start: 0, end: rec.ended.frame }]]]) {
      const r = { ...rec, contacts: contacts.map((c, i) => ({ ...c, order: i })) }, pcm = renderPoweredRecord(r, recipe), ref = studyOut.cases[caseIndex].pcm;
      // The study has no fade and ends at the natural Quiet frame; the record's fade is appended after it, so every reference frame is comparable.
      assert.equal(ref.channels[0].length, rec.ended.frame); assert.equal(pcm.channels[0].length, rec.ended.frame + rec.ended.fadeFrames);
      let worst = 0, peak = 0;
      for (let ch = 0; ch < 2; ch++) for (let i = 0; i < ref.channels[ch].length; i++) { worst = Math.max(worst, Math.abs(pcm.channels[ch][i] - ref.channels[ch][i])); peak = Math.max(peak, Math.abs(ref.channels[ch][i])); }
      assert.ok(worst / peak < 1e-6, `${seed} case ${caseIndex}: powered record vs forced study ${worst / peak} of peak`);
    }
    // (b) Zero amplitude with strikes and contacts equals the Rest route (the invitation needs the default three zones and strengths).
    const full = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), fullPowered = createPoweredRecipe(full);
    const inv = restInvitationRecord(full, composeRestInvitation(full, { tempo: 120 }));
    const powered = { ...inv, kind: POWERED_RECORD_KIND, version: POWERED_RECORD_VERSION, driver: { body: 0, position: 1, frequencyHz: full.grove.bodies[0].hz, amplitude: 0, startFrame: 0, forcedFrames: 1, rotation: forceRotation(full.grove.bodies[0].hz, sr), law: POWERED_FORCE_LAW } };
    const a = renderPoweredRecord(powered, fullPowered), b = renderRestRecord(inv, full); let worst = 0, peak = 0;
    for (let i = 0; i < a.channels[0].length; i++) { worst = Math.max(worst, Math.abs(a.channels[0][i] - b.channels[0][i])); peak = Math.max(peak, Math.abs(b.channels[0][i])); }
    assert.ok(worst / peak < 1e-7, `${seed}: zero force equals the Rest route (${worst / peak})`);
    // (c) A contact switch during the drive: continuous state, no reset, budget holds at every sample.
    const e = createPoweredEngine(recipe), d = rec.driver, norm = recipe.driver.directionNorm; let integral = 0; const sw = Math.floor(0.4 * sr), key1 = contactStateKey([{ zone: 0, strength: 0 }, null, null]);
    let before = null, after = null; const seq = createForceSequence(d);
    for (let i = 0; i < 1.2 * sr; i++) { if (i === sw) { before = e.state; e.setContacts(key1); after = e.state; } const f = seq.next(); e.step(f); integral += Math.abs(f) / sr; assert.ok(Math.sqrt(2 * e.energy()) <= norm * integral + 1e-12, `budget at ${i}`); }
    assert.ok(before.every((v, k) => v === after[k]), 'switching contacts leaves the state untouched');
  }
});

test('powered record: its own kind, driver bounded by the declared budget, strikes admitted against their share, rebuilds from the record alone', () => {
  const sr = 8000, base = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1, firm: 60 } }), recipe = createPoweredRecipe(base);
  const rec = composeEncounterRecord(recipe, { contacts: [{ body: 0, zone: 0, strength: 0, start: 4000, end: 12000 }] });
  assert.equal(rec.kind, POWERED_RECORD_KIND); assert.notEqual(rec.kind, 'imagimusic-grove-rest');
  const rebuilt = poweredRecipeForRecord(JSON.parse(JSON.stringify(rec))); assert.equal(canonicalPoweredRecord(rec, rebuilt), canonicalPoweredRecord(rec, recipe));
  const p1 = renderPoweredRecord(rec, recipe), p2 = renderPoweredRecord(rec, rebuilt); assert.ok(p1.channels[0].every((v, i) => v === p2.channels[0][i]));
  const rejects = (f, re) => { const r = structuredClone(rec); f(r); assert.throws(() => validatePoweredRecord(r, recipe), re); };
  rejects(r => { r.driver.amplitude *= 1.01; }, /exceeds the declared budget/);
  rejects(r => { r.driver.startFrame = r.ended.frame - 10; }, /stop at or before Quiet/);
  rejects(r => { r.driver.body = 1; }, /must match the powered recipe/);
  rejects(r => { delete r.driver.startFrame; }, /exactly/);
  rejects(r => { r.kind = 'imagimusic-grove-rest'; }, /not a powered record/);
  const loud = structuredClone(rec); loud.events = Array.from({ length: 12 }, (_, i) => ({ frame: 100, order: 10 + i, body: 1, position: 2, velocity: 1 })); loud.contacts = [];
  validatePoweredRecord(loud, recipe); assert.throws(() => validatePoweredAdmission(loud, recipe), /strikes' share/);
});

test('early Quiet truncates the force at the applied frame, contacts end there, the fade is appended; a zero-length driver is valid and silent', () => {
  const sr = 8000, base = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1, firm: 60 } }), recipe = createPoweredRecipe(base);
  const planned = composeEncounterRecord(recipe, { contacts: [{ body: 0, zone: 0, strength: 0, start: 2000, end: 20000 }] });
  const quiet = 6000, early = { ...planned, driver: { ...planned.driver, forcedFrames: Math.min(planned.driver.forcedFrames, quiet - planned.driver.startFrame) }, contacts: [{ body: 0, zone: 0, strength: 0, start: 2000, end: quiet, order: 0 }], ended: { frame: quiet, fadeFrames: planned.ended.fadeFrames } };
  validatePoweredRecord(early, recipe);
  const pcm = renderPoweredRecord(early, recipe); assert.equal(pcm.channels[0].length, quiet + early.ended.fadeFrames, 'length is Quiet plus the appended fade');
  const peak = Math.max(...Array.from(pcm.channels[0]).map(Math.abs)), last = Math.abs(pcm.channels[0][quiet + early.ended.fadeFrames - 1]);
  assert.ok(last <= peak / early.ended.fadeFrames + 1e-9, 'the last sample carries the final fade factor 1/fadeFrames, as in the Rest route (the fade reaches zero one sample past the end)');
  // The truncated passage equals the planned one sample for sample before Quiet (same force, same contact until then).
  const full = renderPoweredRecord(planned, recipe); for (let i = 0; i < quiet; i++) assert.equal(pcm.channels[0][i], full.channels[0][i]);
  const empty = { ...planned, driver: { ...planned.driver, forcedFrames: 0 }, contacts: [], ended: { frame: 0, fadeFrames: planned.ended.fadeFrames } };
  validatePoweredRecord(empty, recipe); const silent = renderPoweredRecord(empty, recipe); assert.equal(silent.channels[0].length, planned.ended.fadeFrames); assert.ok(silent.channels[0].every(v => v === 0), 'no sample fabricated');
  assert.equal(planned.ended.frame, planned.driver.startFrame + planned.driver.forcedFrames + Math.round(3 * sr), 'natural ending is start + forced + ring; the fade is appended');
});

test('powered records rebuild in the verifier path and have a sequential picture that marks the driver interval', async () => {
  const { rebuildGrovePcm } = await import('../tools/verify-grove-movie.mjs');
  const { poweredRecordPictureFrames } = await import('../src/score/grove-powered.js');
  const sr = 8000, base = createGroveRestRecipe(composeGrove({ seed: 11 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1 } }), recipe = createPoweredRecipe(base);
  const rec = composeEncounterRecord(recipe, { contacts: [{ body: 0, zone: 1, strength: 0, start: 3000, end: 9000 }], forceSeconds: 1, ringSeconds: 1 });
  const a = rebuildGrovePcm(JSON.parse(JSON.stringify(rec))), b = renderPoweredRecord(rec, recipe);
  assert.ok(a.channels.every((c, ch) => c.every((v, i) => v === b.channels[ch][i])), 'the verifier rebuild is the record renderer');
  const pic = poweredRecordPictureFrames(rec, recipe, { fps: 30 });
  assert.equal(pic.frames.length, Math.ceil(pic.duration * 30) + 1);
  assert.ok(pic.frames[3].driverActive && !pic.frames.at(-1).driverActive, 'driver active early, released at the end');
  assert.deepEqual(pic.frames[Math.round(0.5 * 30)].contacts, [{ zone: 1, strength: 0 }, null, null], 'the contact in force is reported');
  assert.ok(pic.frames.at(-1).envelope.every(v => v === 0), 'terminal frame silent after the fade');
  assert.ok(pic.frames.slice(1, 20).some(f => f.envelope[0] > 0), 'the driven shell moves under the driver');
});

test('the declared force sequence is a bit-exact recurrence that tracks the closed form; tampered rotation constants are rejected', () => {
  const sr = 8000, base = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1 } }), recipe = createPoweredRecipe(base);
  const rec = composeEncounterRecord(recipe), d = rec.driver, seq = createForceSequence(d); let worst = 0;
  for (let i = 0; i < rec.ended.frame; i++) { const f = seq.next(), g = poweredForceAt(d, sr, i); worst = Math.max(worst, Math.abs(f - g)); }
  assert.equal(createForceSequence(d).next(), 0, 'the first force sample is exactly zero (sin 0)');
  assert.ok(worst < 1e-9 * d.amplitude, `recurrence vs closed form over the drive: ${worst / d.amplitude} of amplitude`);
  assert.equal(seq.next(), 0, 'exactly zero after the drive');
  const again = createForceSequence(d); const a = Array.from({ length: 100 }, () => again.next()), b = createForceSequence(d); assert.ok(a.every(v => v === b.next()), 'deterministic: identical sequences from the same declared constants');
  const bad = structuredClone(rec); bad.driver.rotation.sin += 1e-9; assert.throws(() => validatePoweredRecord(bad, recipe), /rotation/);
  const missing = structuredClone(rec); delete missing.driver.rotation; assert.throws(() => validatePoweredRecord(missing, recipe), /exactly/);
});

test('early Quiet at frame 1 with one forced frame: the only applied force is zero, the record is valid, and no sample is fabricated', () => {
  const sr = 8000, base = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1 } }), recipe = createPoweredRecipe(base);
  const planned = composeEncounterRecord(recipe), early = { ...planned, driver: { ...planned.driver, forcedFrames: 1 }, contacts: [], ended: { frame: 1, fadeFrames: planned.ended.fadeFrames } };
  validatePoweredRecord(early, recipe);
  const pcm = renderPoweredRecord(early, recipe); assert.equal(pcm.channels[0].length, 1 + early.ended.fadeFrames); assert.ok(pcm.channels.every(c => c.every(v => v === 0)), 'f0 = 0, so silence throughout');
});

test('version 2 contract: the force law is declared, the budget sums the actual recurrence samples, and the planned amplitude sits exactly at its share of the ceiling', () => {
  const sr = 8000, base = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1 } }), recipe = createPoweredRecipe(base);
  const rec = composeEncounterRecord(recipe); assert.equal(rec.version, 2); assert.equal(rec.driver.law, 'rotation-recurrence-v1');
  const seq = createForceSequence(rec.driver); let integral = 0; for (let n = 0; n < rec.driver.forcedFrames; n++) integral += Math.abs(seq.next()) / sr;
  const bound = recipe.outputGain * recipe.driver.energyFactorMax * recipe.driver.directionNorm * integral;
  assert.ok(Math.abs(bound - 0.5 * recipe.admissionCeiling) < 1e-12, `the declared drive's budget is exactly half the ceiling (${bound})`);
  assert.ok(Math.abs(poweredAmplitudeLimit(recipe, rec.driver) - rec.driver.amplitude) < 1e-12 * rec.driver.amplitude, 'the limit is computed from the stored rotation');
  const v1 = structuredClone(rec); v1.version = 1; assert.throws(() => validatePoweredRecord(v1, recipe), /version 2/);
  const law = structuredClone(rec); law.driver.law = 'sample-held-sin'; assert.throws(() => validatePoweredRecord(law, recipe), /driver.law/);
});

test('after the encounter: a settled line of facts, and the same touch on another grove with that grove\'s own declared source', async () => {
  const { poweredSettledLine, transposePoweredRecord } = await import('../src/score/grove-powered.js');
  const sr = 8000, mk = seed => createPoweredRecipe(createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 1], strengths: { c1: 1 } }));
  const a = mk(3), b = mk(7), rec = composeEncounterRecord(a, { contacts: [{ body: 0, zone: 0, strength: 0, start: 1600, end: 6400 }, { body: 0, zone: 1, strength: 0, start: 6480, end: 12000 }] });
  const line = poweredSettledLine(rec, a); assert.match(line, /source ran for 2\.0 s/); assert.match(line, /upper zone from 0\.2 s to 0\.8 s/); assert.match(line, /bridge tip from 0\.8 s to 1\.5 s/); assert.ok(!/feel|calm|should/i.test(line));
  const early = { ...rec, driver: { ...rec.driver, forcedFrames: 4000 }, contacts: [], ended: { frame: 4000, fadeFrames: rec.ended.fadeFrames } }; assert.match(poweredSettledLine(early, a), /stopped by Quiet/); assert.match(poweredSettledLine(early, a), /no hand rested/i);
  const t = transposePoweredRecord(rec, a, b); assert.equal(t.record.grove.seed, 7); assert.deepEqual(t.record.contacts, rec.contacts); assert.notEqual(t.record.driver.amplitude, rec.driver.amplitude); assert.match(t.note, /ordinary encounter source/);
  // An early-Quiet record keeps the target's ORDINARY source level (planned 2 s budget), never a louder one from its shortened forced frames.
  const earlyRec = { ...rec, driver: { ...rec.driver, forcedFrames: 4000 }, contacts: [], ended: { frame: 4000, fadeFrames: rec.ended.fadeFrames } }, te = transposePoweredRecord(earlyRec, a, b), tb = composeEncounterRecord(b);
  assert.ok(Math.abs(te.record.driver.amplitude - tb.driver.amplitude) < 1e-12 * tb.driver.amplitude, 'the target amplitude equals its ordinary encounter amplitude'); assert.equal(te.record.driver.forcedFrames, 4000, 'truncated at the same Quiet');
  const withStrike = { ...rec, events: [{ frame: 0, order: 9, body: 1, position: 1, velocity: 0.2 }] }; assert.throws(() => transposePoweredRecord(withStrike, a, b), /records with strikes are not transposed/);
  const { poweredNextInvitation } = await import('../src/score/grove-powered.js');
  assert.match(poweredNextInvitation(rec, a), /tried both places/); assert.match(poweredNextInvitation(earlyRec, a), /rest a hand on the first body/);
  assert.match(poweredNextInvitation({ ...rec, contacts: [rec.contacts[0]] }, a), /bridge tip instead/); assert.match(poweredNextInvitation({ ...rec, contacts: [{ ...rec.contacts[1], order: 0 }] }, a), /upper zone instead/);
  assert.match(poweredNextInvitation({ ...earlyRec, driver: { ...earlyRec.driver, forcedFrames: 0 }, ended: { frame: 0, fadeFrames: 200 } }, a), /let the source run/);
  assert.equal(t.record.driver.frequencyHz, b.grove.bodies[0].hz); const pcm = renderPoweredRecord(t.record, b); assert.equal(pcm.channels[0].length, rec.ended.frame + rec.ended.fadeFrames);
  const other = createPoweredRecipe(createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 0.6], strengths: { c1: 1 } })); assert.throws(() => transposePoweredRecord(rec, a, other), /same positions, zones/);
});
