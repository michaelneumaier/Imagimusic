import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePath, resolveField, validateBinding, validateBindings, applyBindings, explainBinding } from '../src/bindings.js';
import { collectState } from '../src/state.js';
import { DEFAULT_BELLOWS, validateBellows } from '../src/dynamics.js';

const frame = collectState(1.5, {
  garden: { voices: [{ id: 7, slot: 2, noteHz: 196, velocity: 0.8, noteOn: 1, end: 5, position: 0.4, modes: [{ frequency: 196, amplitude: 0.19, decay: 1.2 }] }] },
  bellows: { voices: [{ id: 3, slot: 1, noteHz: 220, velocity: 0.7, noteOn: 1, noteOff: 2, bellows: validateBellows(DEFAULT_BELLOWS) }] },
});
const patch = { bellows: DEFAULT_BELLOWS, strikePosition: 0.4 };
const iris = { id: 'choir.slot1.iris', target: 'choir/slot1/iris', param: 'aperture', field: 'voices[slot=1].modules.filter.aperture01',
  inputs: ['bellows.cutoffHz', 'bellows.envAmount', 'bellows.lfo.depthOct', 'voice.noteHz'], label: 'interpreted', note: 'iris opening = cutoff on a log scale' };
const mallet = { id: 'garden.slot2.mallet', target: 'garden/slot2/mallet', param: 'reach', field: 'voices[resonator=garden/2].exciter.reach', inputs: ['strikePosition'], map: v => v * 10, label: 'interpreted-physical' };

test('paths parse into keys and selectors, and resolve by index or key=value', () => {
  assert.deepEqual(parsePath('voices[slot=1].modules.filter.aperture01')[0], { key: 'voices', selectors: [{ key: 'slot', value: '1' }] });
  assert.deepEqual(parsePath('a[0][k=v].b')[0].selectors, [{ index: 0 }, { key: 'k', value: 'v' }]);
  assert.equal(resolveField(frame, 'voices[0].family'), 'garden');
  assert.equal(resolveField(frame, 'voices[id=3].family'), 'bellows');
  assert.equal(resolveField(frame, 'voices[resonator=garden/2].exciter.pos01'), 0.4);
  assert.equal(resolveField(frame, 'out.measuredRms'), null);
  assert.equal(resolveField(frame, 'voices[slot=9].level'), undefined);
  assert.equal(resolveField(frame, 'nope.deeper'), undefined);
  assert.equal(resolveField(frame, 'voices.level'), undefined);
  assert.throws(() => parsePath('')); assert.throws(() => parsePath('voices[slot].x')); assert.throws(() => parsePath('1bad'));
});

test('validateBinding fills defaults and rejects malformed bindings and duplicate ids', () => {
  const v = validateBinding(iris);
  assert.equal(v.label, 'interpreted'); assert.equal(v.map(0.3), 0.3);
  assert.equal(validateBinding({ id: 'x', target: 't', param: 'p', field: 'out.modeledIntensity', inputs: [] }).label, 'interpreted');
  for (const bad of [{ ...iris, id: '' }, { ...iris, field: 'voices[slot].x' }, { ...iris, inputs: 'bellows' }, { ...iris, inputs: [''] }, { ...iris, map: 3 }, { ...iris, label: 'magic' }, null])
    assert.throws(() => validateBinding(bad));
  assert.throws(() => validateBindings([iris, { ...mallet, id: iris.id }]), /duplicate/);
  assert.equal(validateBindings([iris, mallet]).length, 2);
});

test('applyBindings is the only mover: it sets every resolvable binding and reports missing ones without touching the scene', () => {
  const set = [];
  const results = applyBindings(frame, validateBindings([iris, mallet, { id: 'ghost', target: 'g', param: 'p', field: 'voices[slot=9].level', inputs: [] }]), (target, param, value) => set.push({ target, param, value }));
  assert.equal(set.length, 2);
  assert.equal(set[0].target, 'choir/slot1/iris'); assert.ok(set[0].value > 0 && set[0].value <= 1);
  assert.equal(set[1].param, 'reach'); assert.equal(set[1].value, resolveField(frame, mallet.field) * 10);
  assert.deepEqual(results[2], { id: 'ghost', target: 'g', param: 'p', value: null, missing: true });
  assert.throws(() => applyBindings(frame, validateBindings([{ ...mallet, map: () => NaN }]), () => {}), /non-finite/);
  assert.throws(() => applyBindings(frame, [], 'nope'));
});

test('explainBinding answers "why did this move?" with the field value and the inputs behind it', () => {
  const why = explainBinding(validateBinding(iris), frame, patch);
  assert.equal(why.value, resolveField(frame, iris.field)); assert.equal(why.raw, why.value);
  assert.equal(why.label, 'interpreted'); assert.match(why.note, /log scale/);
  assert.deepEqual(why.inputs.map(i => i.path), iris.inputs);
  assert.equal(why.inputs[0].value, DEFAULT_BELLOWS.cutoffHz); assert.equal(why.inputs[2].value, DEFAULT_BELLOWS.lfo.depthOct);
  assert.equal(why.inputs[3].value, 220);
  const dead = explainBinding(validateBinding({ ...iris, field: 'voices[slot=9].level' }), frame, patch);
  assert.equal(dead.value, null); assert.equal(dead.raw, null);
});

test('explainBinding resolves voice inputs for projected stage fields from the target family/slot, listing several voices when they overlap', () => {
  const projected = { ...frame, stage: { garden: [null, null, { energies: [0.2, 0.1, 0, 0, 0] }] } };
  const b = validateBinding({ id: 'garden/slot2/mode0', target: 'garden/slot2', param: 'mode0', field: 'stage.garden[2].energies[0]', inputs: ['strikePosition', 'voice.velocity', 'voice.noteHz'] });
  const why = explainBinding(b, projected, patch);
  assert.equal(why.value, 0.2); assert.deepEqual(why.voices, ['7']);
  assert.equal(why.inputs.find(i => i.path === 'voice.velocity').value, 0.8);
  assert.equal(why.inputs.find(i => i.path === 'voice.noteHz').value, 196);
  const two = { ...projected, voices: [...frame.voices, { ...frame.voices[0], id: '8', noteHz: 220 }] };
  assert.deepEqual(explainBinding(b, two, patch).inputs.find(i => i.path === 'voice.noteHz').value, [196, 220]);
  assert.deepEqual(explainBinding(b, two, patch).voices, ['7', '8']);
  const idle = explainBinding(b, { ...projected, voices: [] }, patch);
  assert.equal(idle.inputs.find(i => i.path === 'voice.velocity').value, undefined); assert.deepEqual(idle.voices, []);
});

test('bindings are stateless: the same frame always yields the same values regardless of history', () => {
  const b = validateBindings([iris, mallet]);
  const run = () => { const out = []; applyBindings(frame, b, (t, p, v) => out.push(v)); return out; };
  const first = run(); for (let i = 0; i < 5; i++) applyBindings(collectState(0.2 + i, { garden: { voices: [] } }), b, () => {});
  assert.deepEqual(run(), first);
});
