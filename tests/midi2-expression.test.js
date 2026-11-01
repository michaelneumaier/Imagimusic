import test from 'node:test';
import assert from 'node:assert/strict';
import { composeExpressiveChord, evaluateExpression, validateExpressionScore, canonicalExpressionScore, DEFAULT_SENSITIVITY_Q7_25, PER_NOTE_BRIGHTNESS, PER_NOTE_PITCH } from '../src/midi2/expression.js';
import { BEND_CENTER, UINT32_MAX, controller32ToUnit } from '../src/midi2/values.js';

const voice = (r, noteNumber, which = 0) => r.voices.filter(v => v.address.noteNumber === noteNumber)[which];
const strip = v => { const { raw, ...rest } = v; return rest; };
/** A tiny score builder for focused lifecycle tests. */
function build(list, { maxVoices = 8, smoothingSeconds = 0.005 } = {}) {
  const events = list.map((e, i) => ({ order: i, group: 0, channel: 0, ...e }));
  return validateExpressionScore({ version: 1, protocol: 'midi2', source: { kind: 'fixture', name: 'unit' }, events, bounds: { maxVoices, maxEvents: 256 }, mapping: { version: 1, instrument: 'bellows', smoothingSeconds, neutral: { brightness32: 0x80000000, timbre32: 0x80000000 } } });
}
const on = (time, noteNumber, extra = {}) => ({ time, type: 'noteOn', noteNumber, velocity16: 0x8000, attributeType8: 0, attributeData16: 0, ...extra });
const off = (time, noteNumber, extra = {}) => ({ time, type: 'noteOff', noteNumber, velocity16: 0, attributeType8: 0, attributeData16: 0, ...extra });
const pnc = (time, noteNumber, index8, data32) => ({ time, type: 'perNoteController', noteNumber, index8, data32 });
const mgmt = (time, noteNumber, detach, reset) => ({ time, type: 'perNoteManagement', noteNumber, flags: { detach, reset } });

test('independence: one voice\'s bend, pressure or brightness never changes the others', () => {
  const full = composeExpressiveChord();
  const without = structuredClone(full); without.events = without.events.filter(e => !(e.type === 'perNotePitchBend' && e.noteNumber === 60)).map((e, i) => ({ ...e, order: i })); validateExpressionScore(without);
  for (const t of [0.6, 1.0, 1.5, 2.0, 2.5, 2.9]) {
    const a = evaluateExpression(full, t), b = evaluateExpression(without, t);
    assert.deepEqual(strip(voice(a, 64)), strip(voice(b, 64))); assert.deepEqual(strip(voice(a, 67)), strip(voice(b, 67)));
    if (t > 0.8 && t < 2.4) assert.notEqual(voice(a, 60).pitchHcu, voice(b, 60).pitchHcu, 'A itself bends while its bend events are away from center (it returns to center at 2.5 s)');
  }
});

test('precision: a control pair that collapses to one 7-bit value stays distinct', () => {
  const r = evaluateExpression(composeExpressiveChord(), 2.9);
  assert.equal(voice(r, 60).raw.brightness32, 0x40000000); assert.equal(voice(r, 67).raw.brightness32, 0x40000001);
  assert.notEqual(voice(r, 60).brightness01, voice(r, 67).brightness01);
  assert.equal(Math.floor(0x40000000 / 2 ** 25), Math.floor(0x40000001 / 2 ** 25), 'the 7-bit downconversion would collapse them');
});

test('lifecycle: D+S freezes B and starts B′ at defaults; D-only lets B′ inherit; S-only resets an attached B', () => {
  const ds = evaluateExpression(composeExpressiveChord({ scene: 'detachReset' }), 3.2);
  const [B, Bp] = [voice(ds, 64, 0), voice(ds, 64, 1)];
  assert.equal(ds.voices.length, 4, 'four voices exist at the overlap');
  assert.ok(B.detached && !Bp.detached);
  assert.ok(B.pressure01 > 0.7, `B keeps its pressure (${B.pressure01})`); assert.ok(Bp.pressure01 < 1e-9, `B′ starts at the default pressure (${Bp.pressure01}, the reset ramp has settled)`);
  const dOnly = evaluateExpression(composeExpressiveChord({ scene: 'detachOnly' }), 3.2);
  assert.ok(voice(dOnly, 64, 1).pressure01 > 0.7, 'D-only: the next Note On inherits the current shared state');
  const sOnly = evaluateExpression(composeExpressiveChord({ scene: 'resetOnly' }), 3.2);
  assert.ok(!voice(sOnly, 64).detached && voice(sOnly, 64).pressure01 < 0.01, 'S-only: the attached voice follows the reset toward 0');
  const none = evaluateExpression(build([on(0, 60), pnc(0.1, 60, PER_NOTE_BRIGHTNESS, 0), mgmt(0.2, 60, false, false)]), 0.5);
  assert.ok(none.reported.unsupported.some(u => u.type === 'perNoteManagementNoFlags') && none.voices[0].brightness01 < 0.01, 'D = S = 0 does nothing and is reported');
});

test('smoothing policy: detach freezes an in-flight ramp at its current evaluated value; reset ramps attached voices', () => {
  const tau = 0.05;
  const s = build([on(0, 60), pnc(1.0, 60, PER_NOTE_BRIGHTNESS, UINT32_MAX), mgmt(1.0 + tau, 60, true, false), on(1.0 + tau, 60)], { smoothingSeconds: tau });
  const r = evaluateExpression(s, 5);
  const expected = 0.5 + (1 - 0.5) * (1 - Math.exp(-1));   // one time constant into the ramp from 0.5 toward 1
  assert.ok(Math.abs(voice(r, 60, 0).brightness01 - expected) < 1e-9, `frozen mid-ramp at ${expected}`);
  assert.equal(voice(r, 60, 0).raw.brightness32, UINT32_MAX, 'raw keeps the last message');
  assert.ok(voice(r, 60, 1).brightness01 > 0.999, 'the inheriting voice continues toward the target');
  const reset = build([on(0, 60), pnc(0, 60, PER_NOTE_BRIGHTNESS, UINT32_MAX), mgmt(1.0, 60, false, true)], { smoothingSeconds: tau });
  const justAfter = evaluateExpression(reset, 1.0 + tau).voices[0].brightness01;
  assert.ok(Math.abs(justAfter - (0.5 + 0.5 * Math.exp(-1))) < 1e-9, 'reset approaches the neutral value with the same τ');
});

test('addresses, latching, sustain, velocity 0, channel bend on a detached voice', () => {
  const two = build([on(0, 60), { ...on(0, 60), channel: 1 }, pnc(0.1, 60, PER_NOTE_BRIGHTNESS, UINT32_MAX)]);
  const r2 = evaluateExpression(two, 1);
  assert.ok(r2.voices[0].brightness01 > 0.99 && Math.abs(r2.voices[1].brightness01 - 0.5) < 1e-9, 'channels with the same note number never share state');
  const latch = build([on(0, 60), { time: 0.5, type: 'registeredController', bank8: 0, index8: 7, data32: 12 * 2 ** 25 }, on(1, 62), { time: 1.5, type: 'perNotePitchBend', noteNumber: 60, data32: UINT32_MAX }, { time: 1.5, type: 'perNotePitchBend', noteNumber: 62, data32: UINT32_MAX }]);
  const rl = evaluateExpression(latch, 3);
  assert.equal(voice(rl, 60).sensitivityHcu, 2); assert.equal(voice(rl, 62).sensitivityHcu, 12);
  assert.ok(Math.abs(voice(rl, 60).pitchHcu - 62) < 1e-6 && Math.abs(voice(rl, 62).pitchHcu - 74) < 1e-6, 'sensitivity latched at each Note On');
  const sus = build([{ time: 0, type: 'controlChange', index8: 64, data32: 0x80000000 }, on(0, 60), off(1, 60), { time: 2, type: 'controlChange', index8: 64, data32: 0x7FFFFFFF }, { time: 3, type: 'controlChange', index8: 64, data32: UINT32_MAX }]);
  assert.equal(evaluateExpression(sus, 1.5).voices[0].gate, 'held'); assert.equal(evaluateExpression(sus, 2.5).voices[0].effectiveNoteOff, 2); assert.equal(evaluateExpression(sus, 3.5).voices[0].gate, 'released', 'a later pedal never resurrects');
  const zero = evaluateExpression(build([on(0, 60, { velocity16: 0 })]), 1);
  assert.equal(zero.voices.length, 1); assert.equal(zero.voices[0].velocity01, 0, 'MIDI 2.0 Note On with velocity 0 is a Note On');
  const r = evaluateExpression(composeExpressiveChord(), 3.9);
  assert.ok(voice(r, 64, 0).detached && voice(r, 64, 0).pitchHcu > 64.9, `channel bend of +1 HCU moves the detached B (${voice(r, 64, 0).pitchHcu})`);
});

test('pitch precedence: attribute pitch for one note, per-note pitch persists, bends are offsets, 69 → 440 Hz', () => {
  const s = build([pnc(0, 60, PER_NOTE_PITCH, Math.round(69.5 * 2 ** 25)), on(0.1, 60), on(0.2, 60, { attributeType8: 3, attributeData16: Math.round(70.25 * 2 ** 9) }), on(0.3, 60), on(0.4, 69), off(0.5, 60), off(0.5, 60), off(0.5, 60)]);
  const r = evaluateExpression(s, 1);
  assert.ok(Math.abs(voice(r, 60, 0).pitchHcu - 69.5) < 1e-6, 'per-note pitch state applies');
  assert.ok(Math.abs(voice(r, 60, 1).pitchHcu - 70.25) < 1e-6, 'attribute pitch overrides for that note only');
  assert.ok(Math.abs(voice(r, 60, 2).pitchHcu - 69.5) < 1e-6, 'the next note returns to the persistent per-note pitch');
  assert.equal(voice(r, 69).hz, 440);
  const bent = build([on(0, 69), { time: 0, type: 'pitchBend', data32: UINT32_MAX }]);
  assert.ok(Math.abs(evaluateExpression(bent, 1).voices[0].pitchHcu - 71) < 1e-6, 'default channel sensitivity ±2 HCU');
});

test('determinism, reporting and validation', () => {
  const s = composeExpressiveChord();
  const times = [3.1, 0.7, 4.2, 2.0, 1.1, 3.9];
  const shuffled = times.map(t => JSON.stringify(evaluateExpression(s, t))), ordered = [...times].sort((a, b) => a - b).map(t => JSON.stringify(evaluateExpression(s, t)));
  assert.deepEqual(shuffled, times.map(t => ordered[[...times].sort((a, b) => a - b).indexOf(t)]));
  assert.equal(canonicalExpressionScore(s), canonicalExpressionScore(JSON.parse(canonicalExpressionScore(s))));
  const rep = evaluateExpression(build([on(0, 60), { time: 0, type: 'controlChange', index8: 1, data32: 1 }, { time: 0, type: 'controlChange', index8: 6, data32: 1 }, { time: 0, type: 'controlChange', index8: 121, data32: 0 }, pnc(0, 60, 1, 5), { time: 0, type: 'other', kind: 'flexData' }, { time: 0, type: 'registeredController', bank8: 0, index8: 0, data32: 127 * 2 ** 18 }]), 1);
  assert.deepEqual(rep.reported.unsupported.map(u => u.type).sort(), ['controlChange1', 'controlChange6', 'flexData', 'registeredController0/0']);
  assert.deepEqual(rep.reported.partial.map(p => p.type).sort(), ['controlChange121', 'perNoteController1']);
  const rejects = (f, re) => { const c = structuredClone(s); f(c); assert.throws(() => validateExpressionScore(c), re); };
  rejects(c => { c.events[1].time = 10; }, /non-decreasing/);
  rejects(c => { c.events[0].order = 5; }, /order must equal/);
  rejects(c => { c.events[2].data32 = 2 ** 32; }, /data32|unsupported field/);
  rejects(c => { c.events[1].velocity16 = 70000; }, /velocity16/);
  rejects(c => { c.events.push({ ...c.events[1], order: c.events.length, time: 9, type: 'bogus' }); }, /unknown type/);
  rejects(c => { c.bounds.maxVoices = 2; }, /more than 2 voices/);
  rejects(c => { c.mapping.smoothingSeconds = 0; }, /smoothingSeconds/);
  rejects(c => { c.events[1].extra = 1; }, /unsupported field/);
  assert.throws(() => composeExpressiveChord({ scene: 'x' }), /unknown fixture scene/);
  assert.equal(DEFAULT_SENSITIVITY_Q7_25, 2 * 2 ** 25); assert.equal(controller32ToUnit(BEND_CENTER) > 0.5 - 1e-9, true);
});

test('the musical study: stillness, change, an opposite answer, and a return to the plain tone an octave below', async () => {
  const { composeExpressiveStudy } = await import('../src/midi2/expression.js');
  const s = composeExpressiveStudy();
  assert.ok(s.events.length <= 64 && s.events.filter(e => e.type === 'noteOn').length === 3);
  assert.deepEqual(composeExpressiveStudy(), s);
  const at = t => evaluateExpression(s, t);
  const v = (r, n) => r.voices.find(x => x.address.noteNumber === n);
  // stillness: one voice, neutral
  const r2 = at(2); assert.equal(r2.voices.length, 1); assert.ok(Math.abs(v(r2, 57).brightness01 - 0.5) < 1e-9 && v(r2, 57).pressure01 === 0 && v(r2, 57).pitchHcu === 57);
  // change: breath first, then light
  assert.ok(v(at(7.2), 57).pressure01 > 0.74 && Math.abs(v(at(7.0), 57).brightness01 - 0.5) < 0.11);
  assert.ok(v(at(9.5), 57).brightness01 > 0.89);
  // answer: E4 bright then closing; A3 bends up 30 cents and back; E4's own values unaffected by A3's bend
  const r9 = at(9.3), r14 = at(14.5); assert.ok(v(r9, 64).brightness01 > 0.9 && v(r14, 64).brightness01 < 0.55);
  assert.ok(Math.abs(v(at(12.6), 57).pitchHcu - 57.3) < 0.02 && Math.abs(v(at(15.3), 57).pitchHcu - 57) < 0.02);
  assert.equal(v(at(12.6), 64).pitchHcu, 64);
  // return: sustain holds the two releases until 18; A2 enters soft and stays neutral; everything else returns to neutral by 20
  assert.deepEqual([v(at(17), 57).gate, v(at(17), 64).gate, v(at(17), 45).gate], ['held', 'held', 'held']);
  assert.deepEqual([v(at(18.5), 57).gate, v(at(18.5), 64).gate, v(at(18.5), 57).effectiveNoteOff], ['released', 'released', 18]);
  const r21 = at(21); assert.ok(v(r21, 57).pressure01 < 0.01 && Math.abs(v(r21, 57).brightness01 - 0.5) < 0.01 && Math.abs(v(r21, 45).brightness01 - 0.5) < 1e-9 && v(r21, 45).pressure01 === 0 && v(r21, 45).pitchHcu === 45);
  assert.equal(v(at(23), 45).gate, 'released'); assert.equal(v(at(23), 45).effectiveNoteOff, 22);
  assert.equal(at(30).reported.unsupported.length, 0);
});
