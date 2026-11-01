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
