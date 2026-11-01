import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG, createGroveVoice, voiceSystem } from '../src/score/grove-voice.js';
import { statePickup } from '../src/coupling.js';
import { createGroveRestRecipe, enumerateContactStates } from '../src/score/grove-rest.js';
import { createRestEngine, renderRestPassage, contactStateKey } from '../src/rest/engine.js';
import { createVoiceInstrument, renderVoiceBank } from '../src/grove/voice-performance.js';

test('the engine with no rest reproduces every unit of the bank sample for sample before the tail fade', () => {
  const grove = composeGrove({ seed: 3 }), sr = 8000, recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const round = JSON.parse(JSON.stringify(recipe)); assert.deepEqual(round, recipe, 'plain serializable numbers');
  const bank = renderVoiceBank(createVoiceInstrument(grove, DEFAULT_VOICE_CONFIG, sr)), untilFrame = Math.floor((recipe.ring - recipe.fade) * sr);
  let worst = 0, peak = 0;
  for (let p = 0; p < 3; p++) for (let b = 0; b < 3; b++) {
    const unit = bank[p * 3 + b], out = renderRestPassage(round, { strikes: [{ frame: 0, position: p, body: b, velocity: 1 }], frames: untilFrame });
    for (let ch = 0; ch < 2; ch++) for (let i = 0; i < untilFrame; i++) { worst = Math.max(worst, Math.abs(out[ch][i] - unit.channels[ch][i])); peak = Math.max(peak, Math.abs(unit.channels[ch][i])); }
    assert.equal(out[0][0], 0, 'sample 0 of a strike is zero in both');
  }
  assert.ok(worst / peak < 1e-6, `worst discrepancy ${worst / peak} of the unit peak (float32 bank vs float64 engine)`);
});

test('contact states are finite and complete; a rest damps the rested shell, carries across the bridge, and lifts cleanly', () => {
  assert.equal(enumerateContactStates(3, 3, 2).length, 343);
  assert.throws(() => enumerateContactStates(4, 3, 2), /exceed/);
  const sr = 8000, recipe = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  assert.equal(recipe.contactStates.length, 343); assert.equal(recipe.contactStates[0].key, '-|-|-');
  const frames = Math.floor(1.5 * sr), strike = [{ frame: 0, position: 2, body: 0, velocity: 0.6 }];
  const free = renderRestPassage(recipe, { strikes: strike, frames });
  const rested = renderRestPassage(recipe, { strikes: strike, contacts: [{ body: 0, zone: 2, strength: 1, start: Math.floor(0.3 * sr), end: Math.floor(0.9 * sr) }], frames });
  assert.ok(rested[0].slice(0, Math.floor(0.3 * sr)).every((v, i) => v === free[0][i]), 'identical before the hand arrives');
  // Per-body displacement at the pickup from the engine state: the rested shell dies; the others' ring changes but goes on.
  const { system } = voiceSystem(createGroveVoice(composeGrove({ seed: 7 })).grove, DEFAULT_VOICE_CONFIG);
  const perBody = withRest => { const e = createRestEngine(recipe); e.strike(2, 0, 0.6); const acc = [0, 0, 0]; for (let i = 0; i < Math.floor(0.9 * sr); i++) { if (withRest && i === Math.floor(0.3 * sr)) e.setContacts(contactStateKey([{ zone: 2, strength: 1 }, null, null])); if (i >= Math.floor(0.6 * sr)) { const x = e.state; for (let b = 0; b < 3; b++) acc[b] += statePickup(system, x, b, 1) ** 2; } e.step(); } return acc.map(Math.sqrt); };
  const f = perBody(false), r = perBody(true), ratio = r.map((v, b) => v / f[b]);
  assert.ok(ratio[0] < 0.02, `the rested shell is damped to ${ratio[0]} of free`);
  assert.ok(ratio[1] > 0.1 && ratio[1] < 3 && ratio[2] > 0.1 && ratio[2] < 3, `the others still ring, changed by the hand (${ratio[1]}, ${ratio[2]}); measured, not assumed quieter`);
  // After the lift the model is the free one again: the engine's state evolves under the free Φ, compared against an engine restarted from that state.
  const engine = createRestEngine(recipe); engine.strike(2, 0, 0.6);
  for (let i = 0; i < frames; i++) { if (i === Math.floor(0.3 * sr)) engine.setContacts(contactStateKey([{ zone: 2, strength: 1 }, null, null])); if (i === Math.floor(0.9 * sr)) engine.setContacts('-|-|-'); engine.step(); }
  assert.equal(engine.key, '-|-|-');
  assert.throws(() => engine.setContacts('9|9|9'), /not in the recipe/);
  let last = Infinity; const e2 = createRestEngine(recipe); e2.strike(1, 1, 1); e2.setContacts(contactStateKey([null, { zone: 1, strength: 0 }, { zone: 0, strength: 1 }]));
  for (let i = 0; i < 4000; i++) { e2.step(); const e = e2.energy(); assert.ok(e <= last * (1 + 1e-12)); last = e; }
});

test('cost: stepping the 18-dimensional voice state is measured, not assumed', () => {
  const recipe = createGroveRestRecipe(composeGrove({ seed: 11 }), DEFAULT_VOICE_CONFIG, { sampleRate: 48000 }), engine = createRestEngine(recipe);
  engine.strike(1, 0, 1); const out = new Float64Array(2), t0 = performance.now(), steps = 48000;
  for (let i = 0; i < steps; i++) { engine.read(out); engine.step(); }
  const ms = performance.now() - t0; console.log(`rest engine: ${steps} steps of dim ${recipe.dim} in ${ms.toFixed(1)} ms (${(ms / 1000 * 100).toFixed(2)} % of one second of audio at 48 kHz, Node)`);
  assert.ok(ms < 2000, 'one second of audio must step in well under one second here');
  for (const seed of GROVE_SEEDS) assert.ok(createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: 48000 }).contactStates.every(s => s.phi.every(Number.isFinite)));
});

test('capture v2: a Rest record validates, renders exactly, equals the bank route with no rests until the first unit fade, and replays any frame in any order', async () => {
  const { validateRestRecord, canonicalRestRecord, renderRestRecord, restRecordLength, restRecordStates, REST_RECORD_KIND } = await import('../src/score/grove-rest.js');
  const { createGroveVoiceSession } = await import('../src/grove/voice-session.js');
  const { mixImpulseRecording } = await import('../src/touch/session.js');
  const grove = composeGrove({ seed: 3 }), sr = 8000, recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const record = { version: 2, kind: REST_RECORD_KIND, grove: recipe.grove, voice: recipe.voice, sampleRate: sr, outputGain: recipe.outputGain, zones: recipe.zones, strengths: recipe.strengths.map(st => ({ name: st.name, c: st.c })),
    events: [{ frame: 0, order: 0, body: 0, position: 1, velocity: 0.4 }, { frame: 2401, order: 1, body: 2, position: 2, velocity: 0.6 }], contacts: [], ended: { frame: 3601, fadeFrames: 200 } };
  validateRestRecord(record, recipe); assert.equal(JSON.parse(canonicalRestRecord(record, recipe)).kind, REST_RECORD_KIND);
  // Round trip: the canonical JSON (keys sorted at every level) validates again and is canonical again, whatever the key order of the input.
  const shuffled = { ended: record.ended, contacts: [], events: record.events.map(e => ({ velocity: e.velocity, position: e.position, body: e.body, order: e.order, frame: e.frame })), strengths: record.strengths, zones: record.zones, outputGain: record.outputGain, sampleRate: sr, voice: Object.fromEntries(Object.entries(record.voice).reverse()), grove: Object.fromEntries(Object.entries(record.grove).reverse()), kind: record.kind, version: 2 };
  const canon = canonicalRestRecord(shuffled, recipe), again = JSON.parse(canon); validateRestRecord(again, recipe);
  assert.equal(canonicalRestRecord(again, recipe), canon); assert.equal(canon, canonicalRestRecord(record, recipe));
  // Same strikes through the bank route (voice session + unit bank mix).
  const session = createGroveVoiceSession({ grove, voice: DEFAULT_VOICE_CONFIG }, sr); session.strike({ frame: 0, body: 0, position: 1, velocity: 0.4 }); session.strike({ frame: 2401, body: 2, position: 2, velocity: 0.6 }); session.finish(3601, 200);
  const bank = renderVoiceBank(createVoiceInstrument(grove, DEFAULT_VOICE_CONFIG, sr)), viaBank = mixImpulseRecording(session.snapshot(), bank), exact = renderRestRecord(record, recipe);
  assert.equal(exact.channels[0].length, viaBank.channels[0].length); assert.equal(restRecordLength(record, recipe), viaBank.channels[0].length);
  const untilFade = Math.floor((recipe.ring - recipe.fade) * sr); let worst = 0, peak = 0;
  for (let ch = 0; ch < 2; ch++) for (let i = 0; i < Math.min(untilFade, exact.channels[0].length); i++) { worst = Math.max(worst, Math.abs(exact.channels[ch][i] - viaBank.channels[ch][i])); peak = Math.max(peak, Math.abs(viaBank.channels[ch][i])); }
  assert.ok(worst / peak < 1e-6, `bank route vs exact record render: ${worst / peak} of peak before the first unit fade`);
  // With a rest: valid, non-overlapping per body; rejections are specific.
  const rested = structuredClone(record); rested.contacts = [{ body: 0, zone: 2, strength: 1, start: 800, end: 2000, order: 2 }, { body: 0, zone: 1, strength: 0, start: 2000, end: 3000, order: 3 }];
  validateRestRecord(rested, recipe); const pcm = renderRestRecord(rested, recipe); assert.ok(pcm.channels.every(c => c.every(Number.isFinite)));
  const rejects = (f, re) => { const r = structuredClone(rested); f(r); assert.throws(() => validateRestRecord(r, recipe), re); };
  rejects(r => { r.contacts[1].start = 1500; }, /overlaps/);
  rejects(r => { r.contacts[1].order = 2; }, /unique across/);
  rejects(r => { r.events[1].frame = 0; r.events[1].order = 0; }, /unique non-negative/);
  rejects(r => { r.events.reverse(); }, /sorted by applied frame/);
  rejects(r => { r.contacts[0].zone = 3; }, /index the recipe zones/);
  rejects(r => { r.outputGain += 0.01; }, /does not belong/);
  rejects(r => { r.grove.bodies[0].mass *= 1.01; }, /grove differs/);
  rejects(r => { r.grove = { ...r.grove, seed: 3 }; r.grove.layout[0].x += 1e-6; }, /grove differs/);
  rejects(r => { r.events[0].requestedFrame = 0; }, /unexpected keys/);
  rejects(r => { r.events[1].frame = 3602; r.events[1].order = 9; }, /after Quiet/);
  rejects(r => { r.contacts[1].end = 3700; }, /after Quiet/);
  // Any frame in any order from checkpoints equals a straight run.
  const states = restRecordStates(rested, recipe, { every: 512 }), straight = createRestEngine(recipe), seen = [];
  const keyAt = i => contactStateKey([0, 1, 2].map(b => { const c = rested.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  for (let i = 0; i < states.frames; i++) { if ([0, 1, 700, 2401, 2402, 3000, 3700].includes(i)) seen.push([i, straight.state]); for (const k of rested.events) if (k.frame === i) straight.strike(k.position, k.body, k.velocity); straight.setContacts(keyAt(i)); straight.step(); }
  for (const [i, s] of seen.reverse()) { const r = states.stateAt(i); assert.ok(r.every((v, k) => v === s[k]), `frame ${i} from a checkpoint equals the straight run exactly`); }
  // Endpoint: a record whose length is an exact multiple of `every`, asked for its final frame; and an empty record.
  const multiple = structuredClone(record); multiple.ended = { frame: 3000, fadeFrames: 1096 }; assert.equal(restRecordLength(multiple, recipe) % 512, 0);
  const st = restRecordStates(multiple, recipe, { every: 512 }); const atEnd = st.stateAt(st.frames); assert.ok(atEnd.length === recipe.dim && atEnd.every(Number.isFinite));
  const tail = createRestEngine(recipe); for (let i = 0; i < st.frames; i++) { for (const k of multiple.events) if (k.frame === i) tail.strike(k.position, k.body, k.velocity); tail.setContacts('-|-|-'); tail.step(); }
  assert.ok(atEnd.every((v, k) => v === tail.state[k]), 'the final frame replays from the last checkpoint exactly');
  const empty = { ...structuredClone(record), events: [], contacts: [], ended: null }; validateRestRecord(empty, recipe);
  assert.equal(restRecordLength(empty, recipe), 0);
  const late = structuredClone(record); late.ended = { frame: 400000, fadeFrames: 1200 }; assert.equal(restRecordLength(late, recipe), 401200, 'Quiet long after every ring: the render ends where the worklet stops'); assert.ok(restRecordStates(empty, recipe).stateAt(0).every(v => v === 0)); assert.equal(renderRestRecord(empty, recipe).channels[0].length, 0);
});

test('admission: the energy pickup bound holds at every sample under rests, strikes during holds and overlaps; the free bank bound does not', async () => {
  const { createVoiceInstrument, voiceOutputBound } = await import('../src/grove/voice-performance.js');
  const sr = 8000, out = new Float64Array(2);
  for (const seed of GROVE_SEEDS) {
    const grove = composeGrove({ seed }), recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr }), e = createRestEngine(recipe);
    assert.ok(recipe.energyFactors.length === 2 && recipe.energyFactors.every(f => f > 0));
    const strikes = [{ frame: 0, position: 1, body: 0, velocity: 0.5 }, { frame: 2000, position: 2, body: 1, velocity: 0.4 }, { frame: 5600, position: 0, body: 2, velocity: 1 }, { frame: 5600, position: 2, body: 0, velocity: 0.7 }];
    const contacts = [{ body: 0, zone: 2, strength: 1, start: 800, end: 4800 }, { body: 1, zone: 1, strength: 0, start: 1600, end: 6400 }, { body: 2, zone: 0, strength: 1, start: 6000, end: 9000 }];
    const keyAt = i => contactStateKey([0, 1, 2].map(b => { const c = contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
    let ceiling = 0, lastEnergy = Infinity;
    for (let i = 0; i < 12000; i++) {
      for (const k of strikes) if (k.frame === i) { const predicted = e.candidateBound(k.position, k.body, k.velocity); e.strike(k.position, k.body, k.velocity); assert.ok(Math.abs(predicted - e.bound()) <= 1e-12 * Math.max(1, predicted), 'candidateBound equals bound after the strike'); ceiling = e.bound(); lastEnergy = Infinity; }
      e.setContacts(keyAt(i)); e.read(out);
      assert.ok(Math.abs(out[0]) <= ceiling + 1e-15 && Math.abs(out[1]) <= ceiling + 1e-15, `seed ${seed} frame ${i}: |out| ${Math.max(Math.abs(out[0]), Math.abs(out[1]))} within the ceiling ${ceiling} set at the last strike`);
      const en = e.energy(); assert.ok(en <= lastEnergy * (1 + 1e-12), 'energy never rises between strikes'); lastEnergy = en;
      e.step();
    }
    assert.ok(e.candidateBound(1, 0, 1) < recipe.admissionCeiling, 'one more full strike on a settled instrument is admissible');
  }
  // Refutation (Astra 070803Z): under a rest the output can exceed the free bank bound, so that bound is not an invariant with contacts.
  const grove = composeGrove({ seed: 11 }), recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr }), inst = createVoiceInstrument(grove, DEFAULT_VOICE_CONFIG, sr), r = createRestEngine(recipe);
  r.strike(2, 0, 1); let worst = 0;
  for (let i = 0; i < 1.5 * sr; i++) { if (i === Math.floor(0.02 * sr)) r.setContacts(contactStateKey([null, { zone: 2, strength: 1 }, null])); r.read(out); worst = Math.max(worst, Math.max(Math.abs(out[0]), Math.abs(out[1])) / voiceOutputBound(inst, [{ frame: 0, body: 0, position: 2, velocity: 1 }], i)); r.step(); }
  assert.ok(worst > 1.1, `free bank bound exceeded under a rest by ${worst.toFixed(3)}×`);
});

test('the picture from a state equals the bank route picture with no rests, and reports the contacts in force', async () => {
  const { visualFromState, parseContactKey } = await import('../src/rest/engine.js');
  const { groveVoiceEnvelope } = await import('../src/score/grove-voice.js');
  const grove = composeGrove({ seed: 7 }), sr = 8000, recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr }), voice = createGroveVoice(grove), e = createRestEngine(recipe);
  const strikes = [{ frame: 0, position: 1, body: 0, velocity: 0.5 }, { frame: 1600, position: 2, body: 2, velocity: 0.8 }];
  let worst = 0, scale = 0;
  for (let i = 0; i <= 2 * sr; i++) {
    for (const k of strikes) if (k.frame === i) e.strike(k.position, k.body, k.velocity);
    if (i % 400 === 0 && i > 0) { const got = visualFromState(recipe, e.state, e.key).envelope, ref = groveVoiceEnvelope(voice, strikes.map(k => ({ ...k, time: k.frame / sr })), i / sr); got.forEach((g, b) => { worst = Math.max(worst, Math.abs(g - ref[b])); scale = Math.max(scale, ref[b]); }); }
    e.step();
  }
  assert.ok(worst / scale < 1e-9, `state picture vs strike-history picture: ${worst / scale} of peak`);
  e.setContacts(contactStateKey([null, { zone: 2, strength: 1 }, null])); const v = visualFromState(recipe, e.state, e.key);
  assert.deepEqual(v.contacts, [null, { zone: 2, strength: 1 }, null]); assert.ok(v.lowBand && v.envelope.length === 3);
  assert.deepEqual(parseContactKey('-|21|00'), [null, { zone: 2, strength: 1 }, { zone: 0, strength: 0 }]);
});

test('a Rest record rebuilds in the verifier path and its picture reports contacts, cues and the Quiet fade at any time', async () => {
  const { rebuildGrovePcm } = await import('../tools/verify-grove-movie.mjs');
  const { renderRestRecord, restRecordVisual, REST_RECORD_KIND } = await import('../src/score/grove-rest.js');
  const grove = composeGrove({ seed: 11 }), sr = 8000, recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const record = { version: 2, kind: REST_RECORD_KIND, grove: recipe.grove, voice: recipe.voice, sampleRate: sr, outputGain: recipe.outputGain, zones: recipe.zones, strengths: recipe.strengths.map(st => ({ name: st.name, c: st.c })),
    events: [{ frame: 0, order: 0, body: 1, position: 2, velocity: 0.7 }, { frame: 3000, order: 2, body: 0, position: 0, velocity: 0.5 }], contacts: [{ body: 1, zone: 2, strength: 1, start: 1200, end: 4000, order: 1 }], ended: { frame: 5000, fadeFrames: 200 } };
  const a = rebuildGrovePcm(record), b = renderRestRecord(record, recipe);
  assert.equal(a.channels[0].length, 5200); assert.ok(a.channels.every((c, ch) => c.every((v, i) => v === b.channels[ch][i])), 'the verifier rebuild is the record renderer');
  const pic = restRecordVisual(record, recipe, { every: 512 });
  const at = t => pic.visual(t);
  assert.deepEqual(at(0.2).contacts, [null, { zone: 2, strength: 1 }, null]); assert.deepEqual(at(0.6).contacts, [null, null, null]);
  assert.ok(at(0.2).envelope[1] < 0.5 * at(0.1).envelope[1], 'the rested shell falls under the hand');
  assert.equal(at(0.01).strikes.length, 1); assert.equal(at(0.01).strikes[0].strikeU, 1, 'tip position reported as strikeU 1');
  assert.equal(at(0.3).strikes.length, 0, 'a cue lasts 0.3 s'); assert.equal(at(0.39).strikes[0].body, 0, 'the second strike cue at 0.375 s');
  assert.ok(at(0.65).envelope.every(v => v === 0), 'Quiet fade reaches zero at ended + fade (frame 5200 = 0.65 s)'); assert.ok(at(0.64).envelope.some(v => v > 0), 'still fading just before');
  const first = at(0.3).envelope, again = at(0.3).envelope; assert.deepEqual(first, again);
});

test('the Rest invitation is admissible on every curated seed, teaches by contrast, and yields a valid record', async () => {
  const { composeRestInvitation, restInvitationRecord, renderRestRecord, REST_INVITATION_BOUNDS } = await import('../src/score/grove-rest.js');
  const { createVoiceInstrument } = await import('../src/grove/voice-performance.js');
  for (const seed of GROVE_SEEDS) {
    const grove = composeGrove({ seed }), sr = 8000, recipe = createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate: sr }), inv = composeRestInvitation(recipe);
    assert.deepEqual(composeRestInvitation(recipe), inv); assert.ok(inv.seconds >= REST_INVITATION_BOUNDS.minSeconds && inv.seconds <= REST_INVITATION_BOUNDS.maxSeconds);
    assert.ok(inv.commands.every((c, i) => i === 0 || c.frame >= inv.commands[i - 1].frame), 'commands in frame order');
    // Every strike is admissible under the energy rule when played exactly as written, through the same engine the worklet uses.
    const e = createRestEngine(recipe); let frame = 0; const active = [null, null, null];
    for (const c of inv.commands) { for (; frame < c.frame; frame++) e.step(); if (c.kind === 'strike') { assert.ok(e.candidateBound(c.position, c.body, c.velocity) <= recipe.admissionCeiling, `seed ${seed}: strike at frame ${c.frame} admissible`); e.strike(c.position, c.body, c.velocity); } else if (c.kind === 'contact') { active[c.body] = c.zone === null ? null : { zone: c.zone, strength: c.strength }; e.setContacts(contactStateKey(active)); } }
    const record = restInvitationRecord(recipe, inv), pcm = renderRestRecord(record, recipe);
    assert.equal(record.contacts.length, 3); assert.equal(record.events.length, 6); assert.ok(record.ended);
    // Contrast: the rested repeat (section rest) is quieter in its second half than the free ring was at the same age.
    const rms = (x, a, b) => Math.sqrt(x.slice(a, b).reduce((s, v) => s + v * v, 0) / (b - a)), beat = b => Math.round(b * 60 / inv.tempo * sr);
    const freeTail = rms(pcm.channels[0], beat(2), beat(4)), restedTail = rms(pcm.channels[0], beat(6), beat(8));
    assert.ok(restedTail < 0.3 * freeTail, `seed ${seed}: under the hand ${restedTail / freeTail} of the free ring`);
    assert.ok(pcm.channels.every(ch => ch.every(v => Number.isFinite(v) && Math.abs(v) <= recipe.admissionCeiling)), 'never above the ceiling');
  }
});

test('the sequential picture frames equal restRecordVisual sampled at i/fps, with the exact terminal frame', async () => {
  const { restRecordVisual, restRecordPictureFrames, restInvitationRecord, composeRestInvitation } = await import('../src/score/grove-rest.js');
  const sr = 8000, recipe = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const record = restInvitationRecord(recipe, composeRestInvitation(recipe, { tempo: 120 }));
  const fps = 30, seq = restRecordPictureFrames(record, recipe, { fps }), ref = restRecordVisual(record, recipe, { every: 512 });
  assert.equal(seq.frames.length, Math.ceil(seq.duration * fps) + 1);
  for (const i of [0, 1, 7, 50, 120, seq.frames.length - 2]) { const a = seq.frames[i], b = ref.visual(i / fps); assert.deepEqual(a.contacts, b.contacts); assert.deepEqual(a.strikes, b.strikes); a.envelope.forEach((v, k) => assert.ok(Math.abs(v - b.envelope[k]) <= 1e-12 * Math.max(1, Math.abs(v)), `frame ${i} body ${k}`)); }
  const last = seq.frames.at(-1); assert.equal(last.time, seq.duration); assert.ok(last.envelope.every(v => v === 0), 'terminal frame is silent after the Quiet fade');
});

test('the movie source of a Rest record gives the exact sample count, canonical capture, any-order frames and the record render', async () => {
  const { restMovieSource, restInvitationRecord, composeRestInvitation, renderRestRecord, restRecordVisual } = await import('../src/score/grove-rest.js');
  const sr = 8000, recipe = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), record = restInvitationRecord(recipe, composeRestInvitation(recipe, { tempo: 120 }));
  const src = restMovieSource(record, recipe, { every: 512 }), pcm = src.pcm(), ref = renderRestRecord(record, recipe), pic = restRecordVisual(record, recipe, { every: 512 });
  assert.equal(src.audioSamples, record.ended.frame + record.ended.fadeFrames); assert.equal(pcm.channels[0].length, src.audioSamples);
  assert.ok(pcm.channels.every((c, ch) => c.every((v, i) => v === ref.channels[ch][i])));
  for (const t of [1.5, 0.2, src.duration, 0.7]) assert.deepEqual(src.sample(t), pic.visual(t));
  assert.equal(src.capture.kind, 'imagimusic-grove-rest'); assert.equal(src.voiceLabel, 'Rest · exploration');
});

test('admission replay and reproducible strengths: an over-loud public record is rejected; custom coefficients round-trip through the record alone', async () => {
  const { validateRestAdmission, recipeForRecord, restInvitationRecord, composeRestInvitation, validateRestRecord, renderRestRecord } = await import('../src/score/grove-rest.js');
  const { rebuildGrovePcm } = await import('../tools/verify-grove-movie.mjs');
  const sr = 8000, recipe = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), record = restInvitationRecord(recipe, composeRestInvitation(recipe, { tempo: 120 }));
  const { bounds } = validateRestAdmission(record, recipe); assert.equal(bounds.length, record.events.length); assert.ok(bounds.every(b => b <= recipe.admissionCeiling));
  const loud = structuredClone(record); loud.events = Array.from({ length: 40 }, (_, i) => ({ frame: 0, order: i, body: i % 3, position: 2, velocity: 1 })); loud.contacts = []; loud.ended = { frame: 4000, fadeFrames: 200 };
  validateRestRecord(loud, recipe); assert.throws(() => validateRestAdmission(loud, recipe), /would have been rejected/);
  assert.throws(() => rebuildGrovePcm(loud), /would have been rejected/);
  const names = structuredClone(record); names.strengths = ['light', 'firm']; validateRestRecord(names, recipe); assert.deepEqual(recipeForRecord(names).strengths, recipe.strengths, 'bare default names mean the default coefficients');
  // Custom coefficients under the default names are recorded and rebuilt from the record alone.
  const custom = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, strengths: { light: 5, firm: 90 } }), cr = restInvitationRecord(custom, composeRestInvitation(custom, { tempo: 120 }));
  assert.throws(() => validateRestRecord(cr, recipe), /strengths differ/);
  const customNames = structuredClone(cr); customNames.strengths = ['light', 'firm']; assert.throws(() => validateRestRecord(customNames, custom), /default strengths with the default coefficients/);
  const rebuilt = recipeForRecord(JSON.parse(JSON.stringify(cr))); assert.deepEqual(rebuilt.strengths, custom.strengths);
  const a = renderRestRecord(cr, rebuilt), b = renderRestRecord(cr, custom); assert.ok(a.channels.every((c, ch) => c.every((v, i) => v === b.channels[ch][i])));
});

test('the guided exploration follows its own prompts: strike, strike again + rest here, lift, fresh strike + rest on the neighbour', async () => {
  const { createRestExploration, REST_EXPLORATION_STEPS, restExplorationPrompt } = await import('../src/score/grove-rest.js');
  const recipe = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: 8000 }), x = createRestExploration(recipe, { body: 1 }), n = x.state.neighbor, order = { i: 0 };
  const ack = (frame, event, accepted = true) => x.acknowledge({ accepted, appliedFrame: frame, order: order.i++, event });
  assert.equal(x.state.step, 'ring'); assert.match(x.state.prompt, /body 2 once/, 'prompts name the chosen body');
  assert.equal(ack(10, { kind: 'strike', body: 0 }).step, 'ring', 'another body does not count');
  assert.equal(ack(20, { kind: 'strike', body: 1 }, false).step, 'ring', 'a rejected strike does not count');
  assert.equal(ack(30, { kind: 'strike', body: 1 }).step, 'here');
  assert.equal(ack(40, { kind: 'contact', body: 1, zone: 2, strength: 1 }).step, 'here', 'the first-strike shortcut: a hand right after the first strike does not advance; the prompt asked for a second strike');
  assert.equal(ack(50, { kind: 'contact', body: 1, zone: null }).step, 'here');
  assert.equal(ack(60, { kind: 'strike', body: 1 }).step, 'here');
  assert.equal(ack(70, { kind: 'contact', body: n, zone: 2, strength: 1 }).step, 'here', 'the neighbour is not this step');
  assert.equal(ack(80, { kind: 'contact', body: 1, zone: 1, strength: 0 }).step, 'lift', 'a hand on the struck body after the second strike');
  assert.equal(ack(90, { kind: 'strike', body: 1 }).step, 'lift', 'a strike does not stand in for the lift');
  assert.equal(ack(100, { kind: 'contact', body: 1, zone: null }).step, 'neighbor');
  assert.equal(ack(110, { kind: 'contact', body: n, zone: 2, strength: 1 }).step, 'neighbor', 'needs a fresh strike first');
  assert.equal(ack(120, { kind: 'strike', body: 1 }).step, 'neighbor');
  assert.equal(ack(130, { kind: 'contact', body: n, zone: 2, strength: 1 }).step, 'done'); assert.ok(x.state.done);
  assert.equal(x.reset().step, 'ring'); assert.deepEqual([...REST_EXPLORATION_STEPS], ['ring', 'here', 'lift', 'neighbor', 'done']);
  for (const s of REST_EXPLORATION_STEPS) assert.ok(!/feel|should|calm|silence/i.test(restExplorationPrompt(s, 0, 1)), 'no claims about the listener or about hearing silence');
  assert.throws(() => createRestExploration(recipe, { body: 3 }), /index the grove/);
});

test('exploration: a hand acknowledged at the strike frame counts only when its actual order is later; the neighbour is a bridged body on every seed', async () => {
  const { createRestExploration } = await import('../src/score/grove-rest.js');
  for (const seed of GROVE_SEEDS) {
    const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: 8000 }), x = createRestExploration(recipe), g = recipe.grove;
    assert.ok(g.bridges.some(e => (e.a === 0 && e.b === x.state.neighbor) || (e.b === 0 && e.a === x.state.neighbor)), `seed ${seed}: neighbour ${x.state.neighbor} is bridged to body 0`);
    x.acknowledge({ accepted: true, appliedFrame: 50, order: 1, event: { kind: 'strike', body: 0 } });
    x.acknowledge({ accepted: true, appliedFrame: 100, order: 5, event: { kind: 'strike', body: 0 } });
    assert.equal(x.acknowledge({ accepted: true, appliedFrame: 100, order: 4, event: { kind: 'contact', body: 0, zone: 2, strength: 1 } }).step, 'here', 'same frame, earlier order: the hand came first');
    assert.equal(x.acknowledge({ accepted: true, appliedFrame: 100, order: 6, event: { kind: 'contact', body: 0, zone: 2, strength: 1 } }).step, 'lift', 'same frame, later order: the hand came after the strike');
    x.acknowledge({ accepted: true, appliedFrame: 200, order: 7, event: { kind: 'quiet', fadeFrames: 200 } }); assert.equal(x.state.step, 'lift', 'Quiet does not advance; the page resets on a new passage');
    assert.equal(x.reset().step, 'ring');
  }
});

test('the same gestures on another grove: identical vocabulary required, source re-admitted, drops truthful including the all-dropped case', async () => {
  const { transposeRestRecord, restInvitationRecord, composeRestInvitation, renderRestRecord, canonicalRestRecord, validateRestRecord } = await import('../src/score/grove-rest.js');
  const sr = 8000, a = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), b = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const record = restInvitationRecord(a, composeRestInvitation(a, { tempo: 120 })), { record: moved, dropped, note, complete } = transposeRestRecord(record, a, b);
  assert.equal(dropped.length, 0); assert.ok(complete); assert.match(note, /every gesture/);
  assert.equal(moved.grove.seed, 7); assert.equal(moved.events.length, record.events.length); assert.deepEqual(moved.contacts, record.contacts);
  assert.notEqual(canonicalRestRecord(moved, b), canonicalRestRecord(record, a));
  const x = renderRestRecord(record, a), y = renderRestRecord(moved, b); assert.equal(x.channels[0].length, y.channels[0].length);
  assert.ok(x.channels[0].some((v, i) => v !== y.channels[0][i]), 'different bodies, different sound');
  // Vocabulary must be identical, not merely the same size.
  const otherZones = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, zones: [0.3, 0.5, 1] });
  assert.throws(() => transposeRestRecord(record, a, otherZones), /same strike positions, rest zones/);
  const otherStrength = createGroveRestRecipe(composeGrove({ seed: 7 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr, strengths: { light: 12, firm: 61 } });
  assert.throws(() => transposeRestRecord(record, a, otherStrength), /strength names and coefficients/);
  const otherPositions = createGroveRestRecipe(composeGrove({ seed: 7 }), { ...DEFAULT_VOICE_CONFIG, positions: [0.3, 0.7, 1] }, { sampleRate: sr });
  assert.throws(() => transposeRestRecord(record, a, otherPositions), /same strike positions/);
  // The source itself must be admissible: a structurally valid but inadmissible source is refused by the pure function.
  const loud = structuredClone(record); loud.events = Array.from({ length: 30 }, (_, i) => ({ frame: 0, order: i, body: 0, position: 2, velocity: 1 })); loud.contacts = []; loud.ended = { frame: 4000, fadeFrames: 200 };
  validateRestRecord(loud, a); assert.throws(() => transposeRestRecord(loud, a, b), /would have been rejected/);
  // Drops with a valid source (Astra's measurement): seed 11, body 0 at the tip, eleven simultaneous unit strikes are admissible there; seed 3 takes fewer.
  const s11 = createGroveRestRecipe(composeGrove({ seed: 11 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), eleven = structuredClone(record);
  eleven.grove = s11.grove; eleven.outputGain = s11.outputGain; eleven.events = Array.from({ length: 11 }, (_, i) => ({ frame: 0, order: i, body: 0, position: 2, velocity: 1 })); eleven.contacts = [{ body: 1, zone: 1, strength: 0, start: 100, end: 500, order: 11 }]; eleven.ended = { frame: 4000, fadeFrames: 200 };
  const r = transposeRestRecord(eleven, s11, a);
  assert.ok(r.kept > 0 && r.kept < 11 && r.kept + r.dropped.length === 11, `seed 3 kept ${r.kept} of 11`); assert.equal(r.complete, false); assert.match(r.note, /were too loud for this grove at those moments and were left out/);
  assert.deepEqual(r.record.contacts, eleven.contacts, 'rests carry over unchanged');
  // All strikes dropped: a valid record with only the rests, said plainly.
  const forty = structuredClone(eleven); forty.events = Array.from({ length: 40 }, (_, i) => ({ frame: 0, order: i, body: 0, position: 2, velocity: 1 })); forty.contacts = [{ body: 1, zone: 1, strength: 0, start: 100, end: 500, order: 40 }];
  let admissible = true; try { transposeRestRecord(forty, s11, a); } catch { admissible = false; }
  if (admissible) { const all = transposeRestRecord(forty, s11, a); if (all.kept === 0) { assert.match(all.note, /no strike carried over.*not the same passage/); assert.equal(all.record.events.length, 0); assert.deepEqual(all.record.contacts, forty.contacts); } }
});


test('the individuality phrase is admissible on every grove, transposes whole, and its facts are measured not promised', async () => {
  const { composeIndividualityPhrase, describeIndividuality, transposeRestRecord, renderRestRecord } = await import('../src/score/grove-rest.js');
  const sr = 8000, recipes = Object.fromEntries(GROVE_SEEDS.map(seed => [seed, createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr })]));
  const phrase = composeIndividualityPhrase(recipes[3]);
  assert.ok(phrase.seconds > 10 && phrase.seconds < 12); assert.equal(phrase.record.events.length, 5); assert.equal(phrase.record.contacts.length, 1);
  for (const seed of [7, 11]) { const t = transposeRestRecord(phrase.record, recipes[3], recipes[seed]); assert.ok(t.complete, `seed ${seed}: every gesture carried over`); assert.equal(renderRestRecord(t.record, recipes[seed]).channels[0].length, renderRestRecord(phrase.record, recipes[3]).channels[0].length); }
  const d = Object.fromEntries(GROVE_SEEDS.map(seed => [seed, describeIndividuality(recipes[seed])]));
  for (const seed of GROVE_SEEDS) { const f = d[seed].facts; assert.equal(f.lowModesHz.length, 3); assert.ok(f.beatRatesHz.every(b => b >= 0 && b < 10)); assert.ok(f.lowDecaySeconds > 0.5 && f.lowDecaySeconds < 5); assert.ok(f.neighbourShare.every(s => s >= 0 && s < 2)); assert.equal(d[seed].mayHear.length, 4); assert.ok(d[seed].mayHear.every(line => /may /.test(line)), 'nothing promised'); }
  assert.ok(d[11].facts.lowModesHz[0] > 180 && d[3].facts.lowModesHz[0] < 140, 'seed 11 sits a fifth above seeds 3 and 7 (measured)');
  assert.ok(d[3].facts.lowDecaySeconds > d[7].facts.lowDecaySeconds, 'seed 3 rings longer than seed 7 (measured)');
});
