import test from 'node:test';
import assert from 'node:assert/strict';
import { createInversePhrase, phraseFromReceipts, validateInversePhrase, inversePhraseTransportEvents, inversePhraseSpanExceeded, inverseAnatomySha256, INVERSE_PHRASE_KIND, INVERSE_PHRASE_VERSION } from '../src/score/grove-inverse-phrase.js';
import { composeGrove } from '../src/score/grove.js';
import { INVERSE_IMPULSE_NS } from '../src/inverse/instrument.js';
import { validateInverseGesture, INVERSE_SHARED_GESTURE } from '../src/score/grove-inverse-gesture.js';

const at = '2026-11-02T09:25:00.000Z';
const digest = await inverseAnatomySha256(composeGrove({ seed: 3 }));
const clone = v => JSON.parse(JSON.stringify(v));

test('a phrase is built from transport receipts: offsets from the first receipt, rounded to the capture rate, frozen, source visitor', () => {
  const receipts = [{ body: 1, time: 12.3456789 }, { body: 0, time: 12.9012345 }, { body: 2, time: 13.3456789 }];
  const p = createInversePhrase(receipts, { sampleRate: 48000, at: at, anatomySha256: digest });
  assert.equal(p.kind, INVERSE_PHRASE_KIND); assert.equal(p.version, INVERSE_PHRASE_VERSION); assert.equal(p.source, 'visitor'); assert.equal(p.anatomySha256, digest); assert.equal(digest.length, 64); assert.equal(p.impulseNs, INVERSE_IMPULSE_NS); assert.equal(p.sampleRate, 48000);
  assert.equal(p.events[0].at, 0);
  assert.equal(p.events[1].at, Math.round((12.9012345 - 12.3456789) * 48000) / 48000);
  assert.equal(p.events[2].at, Math.round((13.3456789 - 12.3456789) * 48000) / 48000); assert.equal(p.spanSeconds, p.events[2].at);
  assert.ok(Object.isFrozen(p) && Object.isFrozen(p.events) && Object.isFrozen(p.events[1]));
  assert.deepEqual(validateInversePhrase(clone(p)), clone(p));
  const ev = inversePhraseTransportEvents(p); assert.deepEqual(ev, p.events.map(e => ({ body: e.body, at: e.at }))); assert.ok(Object.isFrozen(ev) && Object.isFrozen(ev[0]));
  // a one-touch phrase is allowed; eight touches within eight seconds are the bounds
  assert.equal(createInversePhrase([{ body: 2, time: 5 }], { sampleRate: 8000, at: at, anatomySha256: digest }).spanSeconds, 0); assert.equal(phraseFromReceipts, createInversePhrase);
  const eight = Array.from({ length: 8 }, (_, i) => ({ body: i % 3, time: 100 + i })); assert.equal(createInversePhrase(eight, { sampleRate: 8000, at: at, anatomySha256: digest }).spanSeconds, 7);
});

test('refusals: nine touches, a span over eight seconds, times going backwards, non-receipts, a bad rate or time, a foreign kind or source, another impulse, extra fields, sparse events', () => {
  const ok = { sampleRate: 48000, at: at, anatomySha256: digest };
  assert.throws(() => createInversePhrase(Array.from({ length: 9 }, (_, i) => ({ body: 0, time: i * 0.5 })), ok), /1\.\.8/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }, { body: 1, time: 8.5 }], ok), /at most 8 s/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 2 }, { body: 1, time: 1.9 }], ok), /earlier than/);
  assert.throws(() => createInversePhrase([{ body: 3, time: 0 }], ok), /body must be 0, 1 or 2/);
  assert.throws(() => createInversePhrase([true], ok), /transport receipt/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 44100.5, at: at, anatomySha256: digest }), /sampleRate/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 4000, at: at, anatomySha256: digest }), /8000\.\.96000/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0, node: {} }], ok), /exactly body and time/);
  assert.throws(() => createInversePhrase([[0, 0]], ok), /exactly body and time/);
  assert.throws(() => createInversePhrase([{ body: 0, time: -0.001 }], ok), /non-negative/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 10 }, { body: 1, time: 18.000001 }], ok), /checked before rounding/);
  assert.equal(createInversePhrase([{ body: 0, time: 10 }, { body: 1, time: 18 }], ok).spanSeconds, 8);
  // Astra's boundary case: exactly eight sample-clock seconds whose floating difference is 8.000000000000002
  const origin48 = 384896 / 48000, end48 = (384896 + 8 * 48000) / 48000; assert.ok(end48 - origin48 > 8, 'the subtraction overshoots');
  const exact = createInversePhrase([{ body: 1, time: origin48 }, { body: 2, time: end48 }], { sampleRate: 48000, at: at, anatomySha256: digest });
  assert.equal(exact.spanSeconds, 8); assert.equal(exact.events[1].at, 8);
  assert.throws(() => createInversePhrase([{ body: 1, time: origin48 }, { body: 2, time: end48 + 1e-6 }], { sampleRate: 48000, at: at, anatomySha256: digest }), /checked before rounding/);
  // Astra's sweep: origin 15872/48000 defeats a plain deadline addition; the shared helper accepts exact eight and refuses one sample late
  for (const frame of [384896, 15872, 0, 1, 47999, 1234567]) {
    const o = frame / 48000, e = (frame + 8 * 48000) / 48000, late = (frame + 8 * 48000 + 1) / 48000;
    assert.equal(inversePhraseSpanExceeded(o, e), false, `frame ${frame}: exactly eight seconds is not late`);
    assert.equal(inversePhraseSpanExceeded(o, late), true, `frame ${frame}: one sample late is late`);
    assert.equal(createInversePhrase([{ body: 0, time: o }, { body: 1, time: e }], { sampleRate: 48000, at: at, anatomySha256: digest }).spanSeconds, 8);
    assert.throws(() => createInversePhrase([{ body: 0, time: o }, { body: 1, time: late }], { sampleRate: 48000, at: at, anatomySha256: digest }), /checked before rounding/);
  }
  assert.equal(inversePhraseSpanExceeded(5, 12.999), false); assert.equal(inversePhraseSpanExceeded(5, 13.000001), true);
  assert.throws(() => inversePhraseSpanExceeded(NaN, 1), /finite/);
  const offGrid = clone(createInversePhrase([{ body: 1, time: 0 }, { body: 2, time: 0.25 }], ok)); offGrid.events[1].at = 0.2500001; offGrid.spanSeconds = 0.2500001;
  assert.throws(() => validateInversePhrase(offGrid), /sample grid/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 48000, at: 'Nov 2 2026', anatomySha256: digest }), /YYYY-MM-DD/);
  const p = clone(createInversePhrase([{ body: 1, time: 0 }, { body: 2, time: 0.25 }], ok));
  assert.throws(() => validateInversePhrase({ ...p, kind: 'imagimusic-inverse-gesture' }), /kind must be/);
  assert.throws(() => validateInversePhrase({ ...p, source: 'authored' }), /source must be/);
  assert.throws(() => validateInversePhrase({ ...p, impulseNs: 0.02 }), /refused rather than rescaled/);
  assert.throws(() => validateInversePhrase({ ...p, title: 'mine' }), /exactly the fields/);
  assert.throws(() => validateInversePhrase({ ...p, anatomySha256: 'abc' }), /64-hex/);
  assert.throws(() => validateInversePhrase({ ...p, anatomySha256: digest.toUpperCase() }), /64-hex/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 48000, at: at }), /anatomySha256/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 48000, at: at, anatomySha256: digest.slice(0, 63) + 'g' }), /64-hex/);
  assert.throws(() => validateInversePhrase({ ...p, spanSeconds: 1 }), /spanSeconds/);
  assert.throws(() => validateInversePhrase({ ...p, events: new Array(2), spanSeconds: 0 }), /sparse events/);
  assert.throws(() => validateInversePhrase({ ...p, events: [{ body: 0, at: 0, velocity: 1 }], spanSeconds: 0 }), /exactly body and at/);
  assert.throws(() => validateInversePhrase({ ...p, events: [{ body: 0, at: 0.1 }], spanSeconds: 0.1 }), /first event/);
});

test('the gesture and the phrase share one validation core, so the bounds cannot drift', () => {
  assert.equal(validateInverseGesture(INVERSE_SHARED_GESTURE), INVERSE_SHARED_GESTURE);
  const g = JSON.parse(JSON.stringify(INVERSE_SHARED_GESTURE)); g.events = new Array(3); g.spanSeconds = 0;
  assert.throws(() => validateInverseGesture(g), /sparse events are refused/);
  const nine = Array.from({ length: 9 }, (_, i) => ({ body: 0, offsetSeconds: i * 0.5 }));
  assert.throws(() => validateInverseGesture({ ...JSON.parse(JSON.stringify(INVERSE_SHARED_GESTURE)), events: nine, spanSeconds: 4 }), /1\.\.8/);
});
