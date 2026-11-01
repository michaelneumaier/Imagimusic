import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultBindings, stageInputsFor, STAGE_INPUTS } from '../src/bindings-catalog.js';
import { stageBindings } from '../src/stage/projection.js';

test('every stage binding has declared per-parameter inputs and a note, so the inspector can answer truthfully', () => {
  for (const b of stageBindings()) {
    const [family, slotName] = b.target.split('/');
    const entry = stageInputsFor(family, b.param);
    assert.ok(entry, `no STAGE_INPUTS entry for ${family}/${b.param} (target ${b.target}, slot ${slotName})`);
    assert.ok(Array.isArray(entry.inputs) && typeof entry.note === 'string' && entry.note.length > 10);
  }
  assert.deepEqual(stageInputsFor('garden', 'mode3'), STAGE_INPUTS.garden.modeN);
  assert.equal(stageInputsFor('nope', 'x'), null); assert.equal(stageInputsFor('bellows', 'nope'), null);
  assert.ok(STAGE_INPUTS.bellows.aperture.inputs.includes('voice.noteHz') && STAGE_INPUTS.bellows.resonance.inputs.includes('bellows.resonance'));
});
import { applyBindings, explainBinding } from '../src/bindings.js';
import { collectState } from '../src/state.js';
import { DEFAULT_BELLOWS, validateBellows } from '../src/dynamics.js';

const snaps = {
  garden: { voices: [{ id: 1, slot: 2, noteHz: 196, velocity: 0.8, noteOn: 1, end: 5, position: 0.4, modes: [{ frequency: 196, amplitude: 0.19, decay: 1.2 }, { frequency: 455, amplitude: 0.1, decay: 0.8 }] }], dampers: [2] },
  tine: { voices: [{ id: 2, slot: 8, noteHz: 193, velocity: 0.8, noteOn: 1.2, end: 9, position: 0.9, modes: [{ frequency: 193, amplitude: 0.19, decay: 4 }] }] },
  bellows: { voices: [{ id: 3, slot: 1, noteHz: 220, velocity: 0.7, noteOn: 1, noteOff: 2, bellows: validateBellows(DEFAULT_BELLOWS) }] },
};

test('the catalogue validates, has unique ids, and every binding carries a label and a caption note', () => {
  const b = defaultBindings();
  assert.ok(b.length > 80);
  assert.equal(new Set(b.map(x => x.id)).size, b.length);
  assert.ok(b.every(x => ['physical', 'interpreted', 'interpreted-physical'].includes(x.label) && typeof x.note === 'string' && x.note.length > 10));
  assert.ok(b.filter(x => x.target.startsWith('tine/')).every(x => x.label === 'physical'));
});

test('applied to a live frame, the catalogue drives exactly the handles of sounding voices and reports the rest missing', () => {
  const frame = collectState(1.5, snaps), set = [];
  const results = applyBindings(frame, defaultBindings(), (target, param, value) => set.push({ target, param, value }));
  const applied = results.filter(r => !r.missing), missing = results.filter(r => r.missing);
  assert.ok(applied.length > 0 && missing.length > 0);
  const targets = new Set(set.map(s => s.target));
  assert.ok(targets.has('garden/slot2/shell0') && targets.has('garden/slot2/damper') && targets.has('tine/slot8/deflection') && targets.has('bellows/slot1/iris') && targets.has('stage/light'));
  assert.ok(!targets.has('garden/slot3/shell0') && !targets.has('bellows/slot0/iris'));
  assert.equal(set.find(s => s.target === 'garden/slot2/damper').value, 1);
  const iris = set.find(s => s.target === 'bellows/slot1/iris' && s.param === 'aperture');
  assert.ok(iris.value > 0 && iris.value <= 1);
  assert.ok(set.every(s => typeof s.value === 'number' && Number.isFinite(s.value)));
});

test('explain works for every catalogue binding against a frame and a patch', () => {
  const frame = collectState(1.5, snaps), patch = { bellows: DEFAULT_BELLOWS, strikePosition: 0.4, release: 0.18, geometry: { lengthM: 0.065 } };
  for (const b of defaultBindings()) {
    const why = explainBinding(b, frame, patch);
    assert.equal(why.id, b.id); assert.ok(Array.isArray(why.inputs));
  }
  const why = explainBinding(defaultBindings().find(b => b.id === 'bellows/slot1/iris/aperture'), frame, patch);
  assert.equal(why.inputs.find(i => i.path === 'bellows.cutoffHz').value, DEFAULT_BELLOWS.cutoffHz);
  assert.equal(why.inputs.find(i => i.path === 'voice.noteHz').value, 220);
});
