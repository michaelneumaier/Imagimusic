import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSMF } from '../src/midi/smf.js';
import { validateMappingPlan, compileImportedScore, canonicalImportedScore, MAX_SCHEDULED_ONSETS } from '../src/midi/mapping.js';
import { NOTES, DEFAULT_PATCH, TINE_INDEX, modesForVoice } from '../src/model.js';
import { createAuthoredPerformance } from '../src/stage/authored-performance.js';
import { DEFAULT_COMPOSITION } from '../src/stage/composition.js';
import { DEFAULT_TENSIONER } from '../src/fm.js';

// ---- fixtures: ppq 100 at the default 120 BPM, so 1 second = 200 ticks ----
const vlq = n => { const out = [n & 0x7f]; while ((n >>= 7) > 0) out.unshift((n & 0x7f) | 0x80); return out; };
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = n => [(n >> 8) & 255, n & 255];
const chunk = (type, data) => [...[...type].map(c => c.charCodeAt(0)), ...u32(data.length), ...data];
const T = s => Math.round(s * 200);
/** events: [{t, bytes}] absolute seconds per track; builds a format 1 file with one MTrk per track. */
const fileFrom = (...trackEvents) => {
  const tracks = trackEvents.map(list => { let last = 0; const out = []; for (const e of [...list].sort((a, b) => a.t - b.t || a.i - b.i)) { out.push(...vlq(T(e.t) - last), ...e.bytes); last = T(e.t); } out.push(...vlq(T(10) - last), 0xFF, 0x2F, 0); return chunk('MTrk', out); });
  return Uint8Array.from([...chunk('MThd', [...u16(1), ...u16(tracks.length), ...u16(100)]), ...tracks.flat()]);
};
let seq = 0; const ev = (t, ...bytes) => ({ t, i: seq++, bytes });
const on = (t, pitch, vel = 100, ch = 0) => ev(t, 0x90 | ch, pitch, vel), off = (t, pitch, ch = 0) => ev(t, 0x80 | ch, pitch, 0);
const pedal = (t, down, ch = 0) => ev(t, 0xB0 | ch, 64, down ? 127 : 0);
const notes = bytes => parseSMF(bytes, { name: 'fixture.mid' });
const SHA = 'a'.repeat(64);
const imported = (list, plan) => ({ version: 1, source: { name: 'fixture.mid', bytes: 100, sha256: SHA }, notes: list, plan });
const plan = (assignments, extra = {}) => ({ version: 1, window: { startSeconds: 0, endSeconds: 10 }, lead: 0.35, tailSeconds: 4, velocityCurve: 'linear', assignments, ...extra });
const bellowsAll = (sustainPedal = true) => plan([{ track: 0, channel: 'all', family: 'bellows', sustainPedal }]);
const rowOf = (report, pitch) => report.rows.find(r => r.pitch === pitch);
const composition = { ...structuredClone(DEFAULT_COMPOSITION), version: 2, loom: { ...DEFAULT_COMPOSITION.loom, enabled: true }, fm: { enabled: true, settings: { ...DEFAULT_TENSIONER } } };

test("sustain follows Astra's five examples: pedal state read at the note-off, releases after it, never resurrecting or truncating", () => {
  const gate = (events, sustainPedal = true) => { const { report } = compileImportedScore(imported(notes(fileFrom(events)), bellowsAll(sustainPedal)), DEFAULT_PATCH); return { end: +(report.rows[0].to.gateSeconds + 0.35).toFixed(6), warnings: report.warnings.map(w => w.kind) }; };
  assert.equal(gate([on(0, 60), off(2, 60), pedal(1, true), pedal(3, false)]).end, 3.35);
  assert.equal(gate([on(0, 60), off(2, 60), pedal(0, true), pedal(1, false), pedal(1.5, true), pedal(3, false)]).end, 3.35);
  assert.equal(gate([on(0, 60), off(2, 60), pedal(0, true), pedal(1, false)]).end, 2.35);
  assert.equal(gate([on(0, 60), off(1, 60), pedal(1.5, true), pedal(3, false)]).end, 1.35, 'a pedal pressed after the note ended does not resurrect it');
  const held = compileImportedScore(imported(notes(fileFrom([on(0, 60), off(2, 60), pedal(1, true)])), plan([{ track: 0, channel: 'all', family: 'bellows', sustainPedal: true }], { window: { startSeconds: 0, endSeconds: 4 } })), DEFAULT_PATCH);
  assert.equal(+(held.report.rows[0].to.gateSeconds + 0.35).toFixed(6), 4.35); assert.ok(held.report.warnings.some(w => w.kind === 'pedalNeverReleased'));
  assert.equal(gate([on(0, 60), off(2, 60), pedal(1, true), pedal(3, false)], false).end, 2.35, 'pedal ignored when the assignment disables it');
  // same tick: pedal-off then note-off in stream order means the pedal was up at the note-off
  assert.equal(gate([on(0, 60), pedal(0, true), pedal(2, false), off(2, 60)]).end, 2.35);
  const g2 = gate([on(0, 60), pedal(0, true), off(2, 60), pedal(2, false)]); assert.equal(g2.end, 2.35, 'pedal released at the same instant as the note-off, after it in order: gate ends at that release (2 s)');
});

test('garden: exact slot pitches, an explicit choice for the rest, never a silent snap; tine and loom are timing-only; fm keeps one entrance', () => {
  const list = notes(fileFrom([on(0, NOTES[2]), off(1, NOTES[2]), on(2, 61), off(3, 61)], [on(0, 40), off(1, 40), on(1, 41), off(2, 41)], [on(0, 60), off(1, 60), on(2, 62), off(3, 62), on(4, 63), off(5, 63)], [on(0, 70), off(1, 70), on(1, 72), off(2, 72)]));
  assert.throws(() => validateMappingPlan(plan([{ track: 0, channel: 'all', family: 'garden' }]), list), /gardenUnplayable/);
  const build = choice => compileImportedScore(imported(list, plan([
    { track: 0, channel: 'all', family: 'garden', gardenUnplayable: choice }, { track: 1, channel: 'all', family: 'tine' },
    { track: 2, channel: 'all', family: 'loom', loomBody: { rule: 'pitches', body0: 60, body1: 62 } }, { track: 3, channel: 'all', family: 'fm' }])), DEFAULT_PATCH);
  const nearest = build('nearest').report, drop = build('drop').report;
  assert.deepEqual([rowOf(nearest, NOTES[2]).class, rowOf(nearest, 61).class, rowOf(nearest, 61).to.slot, rowOf(nearest, 61).cents], ['exact', 'mapped', NOTES.indexOf(60), -100], '61 maps to the nearest slot pitch 60 (slot 4), 100 cents down, flagged');
  assert.deepEqual([rowOf(drop, 61).class, rowOf(drop, 61).reason], ['dropped', 'offSlotTable']);
  const tineHz = modesForVoice(TINE_INDEX, DEFAULT_PATCH, 48000)[0].frequency;
  assert.deepEqual([rowOf(nearest, 40).class, rowOf(nearest, 40).to.hz, typeof rowOf(nearest, 40).cents], ['timingOnly', tineHz, 'number']);
  assert.deepEqual([rowOf(nearest, 60).to.body, rowOf(nearest, 62).to.body, rowOf(nearest, 63).class, rowOf(nearest, 63).reason], [0, 1, 'dropped', 'notALoomPitch']);
  assert.deepEqual([rowOf(nearest, 70).class, rowOf(nearest, 72).class, rowOf(nearest, 72).reason, build('nearest').recipe.fmTime], ['timingOnly', 'dropped', 'fmSingleEntrance', 0.35]);
  assert.deepEqual(nearest.children, { loom: true, fm: true });
  assert.ok(nearest.warnings.filter(w => w.kind === 'gateIgnored').length === 2);
  const parity = compileImportedScore(imported(list, plan([{ track: 2, channel: 'all', family: 'loom', loomBody: { rule: 'parity' } }])), DEFAULT_PATCH).report;
  assert.deepEqual([rowOf(parity, 60).to.body, rowOf(parity, 63).to.body, rowOf(parity, 40).class, rowOf(parity, 40).reason], [0, 1, 'unassigned', 'noAssignment']);
  const none = compileImportedScore(imported(list, plan([{ track: 0, channel: 'all', family: 'none' }])), DEFAULT_PATCH).report;
  assert.deepEqual([rowOf(none, 61).class, rowOf(none, 61).reason], ['dropped', 'assignedNone']);
});

test('window policies: before, active-at-start, after, clipped gate, preserved short gate, one-sample zero gate, no representable gate', () => {
  const list = notes(fileFrom([on(0.5, 60), off(1.5, 60), on(1, 61), off(2, 61), on(3, 62), off(6, 62), on(4.990, 63), off(4.995, 63), on(4.995, 64), off(4.995, 64), on(5, 65), off(5.5, 65), on(2.5, 66), off(2.5, 66)]));
  const { recipe, report } = compileImportedScore(imported(list, plan([{ track: 0, channel: 'all', family: 'bellows', sustainPedal: false }], { window: { startSeconds: 1, endSeconds: 5 }, lead: 0.35 })), DEFAULT_PATCH, 48000);
  assert.deepEqual([rowOf(report, 60).class, rowOf(report, 60).reason], ['excluded', 'activeAtStart']);
  assert.deepEqual([rowOf(report, 65).class, rowOf(report, 65).reason], ['excluded', 'afterWindow']);
  assert.deepEqual([rowOf(report, 61).class, +rowOf(report, 61).to.gateSeconds.toFixed(6)], ['exact', 1]);
  assert.ok(Math.abs(rowOf(report, 62).to.gateSeconds - 2) < 1e-9 && report.warnings.some(w => w.kind === 'gateClipped' && w.noteId === rowOf(report, 62).noteId));
  assert.ok(Math.abs(rowOf(report, 63).to.gateSeconds - 0.005) < 1e-9, 'a 5 ms gate stays 5 ms');
  assert.ok(Math.abs(rowOf(report, 64).to.gateSeconds - 1 / 48000) < 1e-12 && report.warnings.some(w => w.kind === 'zeroGateOneSample'));
  assert.ok(Math.abs(rowOf(report, 66).to.gateSeconds - 1 / 48000) < 1e-12);
  const onset = recipe.events.find(e => e.id === `midi:${rowOf(report, 61).noteId}`); assert.ok(Math.abs(onset.time - 0.35) < 1e-9, 'compiled onset = lead + (on − start)');
  assert.equal(recipe.holdUntil, 0.35 + 4 + 4);
  const atEnd = notes(fileFrom([on(5, 60), off(5, 60)]));
  const r2 = compileImportedScore(imported(atEnd, plan([{ track: 0, channel: 'all', family: 'bellows', sustainPedal: false }], { window: { startSeconds: 1, endSeconds: 5 } })), DEFAULT_PATCH).report;
  assert.deepEqual([r2.rows[0].class, r2.rows[0].reason], ['excluded', 'afterWindow']);
  const lastSample = notes(fileFrom([on(4.995, 60), off(4.995, 60)]));   // onset one microsecond before the window end: no sample fits
  const r3 = compileImportedScore(imported(lastSample, plan([{ track: 0, channel: 'all', family: 'bellows', sustainPedal: false }], { window: { startSeconds: 1, endSeconds: 4.995001 } })), DEFAULT_PATCH, 48000).report;
  assert.deepEqual([r3.rows[0].class, r3.rows[0].reason], ['dropped', 'noRepresentableGate']);
  assert.equal(report.counts.total, list.notes.length); assert.equal(Object.values(report.counts).reduce((a, b) => a + b, 0) - report.counts.total, report.counts.total);
});

test('plan validation: disjoint assignments, bounded window and lead, named curves; onset bound across families', () => {
  const list = notes(fileFrom([on(0, 60), off(1, 60)]));
  const rejects = (p, re) => assert.throws(() => validateMappingPlan(p, list), re);
  rejects(plan([{ track: 0, channel: 'all', family: 'tine' }, { track: 0, channel: 3, family: 'tine' }]), /'all' assignment and a per-channel/);
  rejects(plan([{ track: 0, channel: 2, family: 'tine' }, { track: 0, channel: 2, family: 'fm' }]), /assigned twice/);
  rejects(plan([{ track: 1, channel: 'all', family: 'tine' }]), /track out of range/);
  rejects(plan([{ track: 0, channel: 'all', family: 'drums' }]), /family must be/);
  rejects(plan([{ track: 0, channel: 'all', family: 'tine', extra: 1 }]), /unsupported field/);
  rejects(plan([{ track: 0, channel: 'all', family: 'bellows' }]), /sustainPedal/);
  rejects(plan([{ track: 0, channel: 'all', family: 'loom', loomBody: { rule: 'pitches', body0: 60, body1: 60 } }]), /two distinct/);
  rejects(plan([], { window: { startSeconds: 2, endSeconds: 1 } }), /window must satisfy/);
  rejects(plan([], { window: { startSeconds: 0, endSeconds: 11 } }), /window must satisfy/);
  rejects(plan([], { lead: 6 }), /lead must be/);
  rejects(plan([], { tailSeconds: 31 }), /tailSeconds/);
  rejects(plan([], { velocityCurve: 'soft' }), /velocityCurve/);
  const longFile = notes(Uint8Array.from([...chunk('MThd', [0, 1, 0, 1, 0, 100]), ...chunk('MTrk', [0, 0x90, 60, 1, ...vlq(T(130)), 0x80, 60, 0, 0, 0xFF, 0x2F, 0])]));
  assert.throws(() => validateMappingPlan(plan([], { window: { startSeconds: 0, endSeconds: 130 }, lead: 0.35 }), longFile), /endpoint cap/);
  const many = []; for (let i = 0; i < 300; i++) { many.push(on(i * 0.02, 60 + (i % 12)), off(i * 0.02 + 0.01, 60 + (i % 12))); }
  assert.throws(() => compileImportedScore(imported(notes(fileFrom(many)), bellowsAll(false)), DEFAULT_PATCH), new RegExp(`bound is ${MAX_SCHEDULED_ONSETS}`));
});

test('the report describes the actual compiled result: chamber stealing, planner reach, and the recipe assembles with both children', () => {
  const overlap = []; for (let i = 0; i < 8; i++) { overlap.push(on(0.1 * i, 50 + i), off(3, 50 + i)); }
  overlap.push(on(0, 40, 100, 1), off(0.5, 40, 1), on(0.05, 41, 100, 1), off(0.5, 41, 1));   // two garden strikes 50 ms apart on different slots → planner decides
  const list = notes(fileFrom(overlap, [on(1, 60), off(2, 60), on(1.5, 62), off(2.5, 62)], [on(2, 70), off(3, 70)]));
  const { recipe, report } = compileImportedScore(imported(list, plan([
    { track: 0, channel: 0, family: 'bellows', sustainPedal: false }, { track: 0, channel: 1, family: 'garden', gardenUnplayable: 'nearest' },
    { track: 1, channel: 'all', family: 'loom', loomBody: { rule: 'parity' } }, { track: 2, channel: 'all', family: 'fm' }])), DEFAULT_PATCH);
  assert.equal(report.warnings.filter(w => w.kind === 'stolen').length, 2, 'the seventh and eighth simultaneous bellows notes steal');
  assert.ok(typeof report.planner.garden.unplanned === 'number' && report.planner.tine.unplanned === 0);
  assert.deepEqual(Object.keys(recipe).sort(), ['events', 'fmTime', 'holdUntil', 'loomScore']);
  const passage = createAuthoredPerformance(DEFAULT_PATCH, recipe, composition, 48000);
  assert.ok(passage.loom && passage.fm && passage.duration >= recipe.holdUntil);
  assert.ok(report.warnings.some(w => w.kind === 'trackLocalPedal'));
  const canon = canonicalImportedScore(imported(list, bellowsAll()));
  assert.equal(canon, canonicalImportedScore(JSON.parse(canon)));
  assert.throws(() => canonicalImportedScore({ ...imported(list, bellowsAll()), source: { name: 'x', bytes: 1, sha256: 'nothex' } }), /sha256/);
  assert.throws(() => canonicalImportedScore({ ...imported(list, bellowsAll()), extra: 1 }), /unsupported field/);
});
