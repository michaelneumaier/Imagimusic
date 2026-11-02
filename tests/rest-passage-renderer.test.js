import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, restInvitationRecord, composeRestInvitation, composeIndividualityPhrase, validateRestAdmission, restRecordLength } from '../src/score/grove-rest.js';
import { createRestPassageRenderer, renderRestPassage } from '../src/rest/engine.js';

const sr = 8000;
test('block renderer: concatenated blocks equal renderRestPassage exactly for any block size; admission bounds equal validateRestAdmission; refusal before output', () => {
  for (const seed of GROVE_SEEDS) {
    const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
    for (const record of [restInvitationRecord(recipe, composeRestInvitation(recipe)), composeIndividualityPhrase(recipe).record]) {
      const frames = restRecordLength(record, recipe), reference = renderRestPassage(recipe, { strikes: record.events, contacts: record.contacts, frames });
      for (const block of [1, 7, 128, 4096, frames]) {
        const r = createRestPassageRenderer(recipe, { strikes: record.events, contacts: record.contacts, frames, admissionCeiling: recipe.admissionCeiling });
        const out = [new Float32Array(frames), new Float32Array(frames)], scratch = [new Float32Array(block), new Float32Array(block)];
        for (let from = 0; from < frames; from += block) { const to = Math.min(frames, from + block), n = r.render(from, to, scratch); assert.equal(n, to - from); for (let ch = 0; ch < 2; ch++) out[ch].set(scratch[ch].subarray(0, n), from); }
        assert.equal(r.position, frames); for (let ch = 0; ch < 2; ch++) assert.deepEqual(out[ch], reference[ch], `seed ${seed} block ${block} channel ${ch}`);
        assert.deepEqual(r.bounds, validateRestAdmission(record, recipe).bounds, 'bounds equal the admission check');
      }
      // Out-of-order blocks are refused; a too-small scratch is refused.
      const r = createRestPassageRenderer(recipe, { strikes: record.events, contacts: record.contacts, frames }); const s = [new Float32Array(16), new Float32Array(16)];
      r.render(0, 16, s); assert.throws(() => r.render(0, 16, s), /in order/); assert.throws(() => r.render(16, 64, s), /at least the block length/);
    }
  }
  // Over-loud: maximum strikes at the bridge tip on consecutive frames reach the ceiling at the twelfth strike (the middle position never does
  // within 128 strikes); both the admission check and the renderer refuse there, the renderer before delivering the block and terminally.
  const recipe = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const loud = Array.from({ length: 40 }, (_, k) => ({ frame: k, order: k, body: 0, position: 2, velocity: 1 })), frames = 40 + sr;
  assert.throws(() => validateRestAdmission({ ...composeIndividualityPhrase(recipe).record, events: loud, contacts: [], ended: { frame: frames - 200, fadeFrames: 200 } }, recipe), /events\[11\].*rejected/);
  const r = createRestPassageRenderer(recipe, { strikes: loud, contacts: [], frames, admissionCeiling: recipe.admissionCeiling }); const s = [new Float32Array(frames), new Float32Array(frames)];
  assert.throws(() => r.render(0, frames, s), /events\[11\].*rejected/); assert.equal(r.position, 0, 'the refused block was not delivered'); assert.equal(r.failed, true);
  assert.throws(() => r.render(0, 16, s), /failed earlier/, 'a failure is terminal; the partly advanced state cannot be reused');
  // Boundary cases on a hand-made record: a contact from frame 0 ending exactly on a block edge, two strikes on one frame, a late strike in the
  // partial last block; blocks of 64 against the full renderer; exhaustion refused.
  const firm = recipe.strengths.findIndex(st => st.name === 'firm'), events = [{ frame: 0, order: 0, body: 0, position: 1, velocity: 0.5 }, { frame: 0, order: 1, body: 1, position: 1, velocity: 0.5 }, { frame: 500, order: 2, body: 2, position: 1, velocity: 0.5 }];
  const contacts = [{ body: 0, zone: 2, strength: firm, start: 0, end: 128, order: 3 }, { body: 1, zone: 1, strength: firm, start: 64, end: 192, order: 4 }], total = 520;
  const full = renderRestPassage(recipe, { strikes: events, contacts, frames: total }), rb = createRestPassageRenderer(recipe, { strikes: events, contacts, frames: total, admissionCeiling: recipe.admissionCeiling }), sb = [new Float32Array(64), new Float32Array(64)];
  for (let from = 0; from < total; from += 64) { const to = Math.min(total, from + 64), n = rb.render(from, to, sb); for (let ch = 0; ch < 2; ch++) for (let k = 0; k < n; k++) assert.equal(sb[ch][k], full[ch][from + k], `frame ${from + k}`); }
  assert.equal(rb.position, total); assert.equal(rb.bounds.length, 3); assert.throws(() => rb.render(total, total + 1, sb), /in order within the passage/, 'nothing beyond the passage');
});
