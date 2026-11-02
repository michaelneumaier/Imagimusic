import test from 'node:test';
import assert from 'node:assert/strict';
import { createInversePhrase, phraseFromReceipts, validateInversePhrase, inversePhraseTransportEvents, INVERSE_PHRASE_KIND } from '../src/score/grove-inverse-phrase.js';
import { INVERSE_IMPULSE_NS } from '../src/inverse/instrument.js';
import { validateInverseGesture, INVERSE_SHARED_GESTURE } from '../src/score/grove-inverse-gesture.js';

const at = '2026-11-02T09:25:00.000Z';
const clone = v => JSON.parse(JSON.stringify(v));

test('a phrase is built from transport receipts: offsets from the first receipt, rounded to the capture rate, frozen, source visitor', () => {
  const receipts = [{ body: 1, time: 12.3456789 }, { body: 0, time: 12.9012345 }, { body: 2, time: 13.3456789 }];
  const p = createInversePhrase(receipts, { sampleRate: 48000, at: at });
  assert.equal(p.kind, INVERSE_PHRASE_KIND); assert.equal(p.source, 'visitor'); assert.equal(p.impulseNs, INVERSE_IMPULSE_NS); assert.equal(p.sampleRate, 48000);
  assert.equal(p.events[0].at, 0);
  assert.equal(p.events[1].at, Math.round((12.9012345 - 12.3456789) * 48000) / 48000);
  assert.equal(p.events[2].at, Math.round((13.3456789 - 12.3456789) * 48000) / 48000); assert.equal(p.spanSeconds, p.events[2].at);
  assert.ok(Object.isFrozen(p) && Object.isFrozen(p.events) && Object.isFrozen(p.events[1]));
  assert.deepEqual(validateInversePhrase(clone(p)), clone(p));
  const ev = inversePhraseTransportEvents(p); assert.deepEqual(ev, p.events.map(e => ({ body: e.body, at: e.at }))); assert.ok(Object.isFrozen(ev) && Object.isFrozen(ev[0]));
  // a one-touch phrase is allowed; eight touches within eight seconds are the bounds
  assert.equal(createInversePhrase([{ body: 2, time: 5 }], { sampleRate: 8000, at: at }).spanSeconds, 0); assert.equal(phraseFromReceipts, createInversePhrase);
  const eight = Array.from({ length: 8 }, (_, i) => ({ body: i % 3, time: 100 + i })); assert.equal(createInversePhrase(eight, { sampleRate: 8000, at: at }).spanSeconds, 7);
});

test('refusals: nine touches, a span over eight seconds, times going backwards, non-receipts, a bad rate or time, a foreign kind or source, another impulse, extra fields, sparse events', () => {
  const ok = { sampleRate: 48000, at: at };
  assert.throws(() => createInversePhrase(Array.from({ length: 9 }, (_, i) => ({ body: 0, time: i * 0.5 })), ok), /1\.\.8/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }, { body: 1, time: 8.5 }], ok), /at most 8 s/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 2 }, { body: 1, time: 1.9 }], ok), /earlier than/);
  assert.throws(() => createInversePhrase([{ body: 3, time: 0 }], ok), /body must be 0, 1 or 2/);
  assert.throws(() => createInversePhrase([true], ok), /transport receipt/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 44100.5, at: at }), /sampleRate/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 4000, at: at }), /8000\.\.96000/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0, node: {} }], ok), /exactly body and time/);
  assert.throws(() => createInversePhrase([[0, 0]], ok), /exactly body and time/);
  assert.throws(() => createInversePhrase([{ body: 0, time: -0.001 }], ok), /non-negative/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 10 }, { body: 1, time: 18.000001 }], ok), /checked before rounding/);
  assert.equal(createInversePhrase([{ body: 0, time: 10 }, { body: 1, time: 18 }], ok).spanSeconds, 8);
  const offGrid = clone(createInversePhrase([{ body: 1, time: 0 }, { body: 2, time: 0.25 }], ok)); offGrid.events[1].at = 0.2500001; offGrid.spanSeconds = 0.2500001;
  assert.throws(() => validateInversePhrase(offGrid), /sample grid/);
  assert.throws(() => createInversePhrase([{ body: 0, time: 0 }], { sampleRate: 48000, at: 'Nov 2 2026' }), /YYYY-MM-DD/);
  const p = clone(createInversePhrase([{ body: 1, time: 0 }, { body: 2, time: 0.25 }], ok));
  assert.throws(() => validateInversePhrase({ ...p, kind: 'imagimusic-inverse-gesture' }), /kind must be/);
  assert.throws(() => validateInversePhrase({ ...p, source: 'authored' }), /source must be/);
  assert.throws(() => validateInversePhrase({ ...p, impulseNs: 0.02 }), /refused rather than rescaled/);
  assert.throws(() => validateInversePhrase({ ...p, title: 'mine' }), /exactly the fields/);
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
