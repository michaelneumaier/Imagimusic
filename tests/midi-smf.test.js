import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSMF, validateNoteList, canonicalNoteList, secondsAtTick } from '../src/midi/smf.js';

// ---- byte builders (hand-built fixtures; nothing here depends on a MIDI library) ----
const vlq = n => { const out = [n & 0x7f]; while ((n >>= 7) > 0) out.unshift((n & 0x7f) | 0x80); return out; };
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = n => [(n >> 8) & 255, n & 255];
const str = s => [...s].map(c => c.charCodeAt(0));
const chunk = (type, data) => [...str(type), ...u32(data.length), ...data];
const header = (format, ntrks, division, extra = []) => chunk('MThd', [...u16(format), ...u16(ntrks), ...u16(division), ...extra]);
const ev = (delta, ...bytes) => [...vlq(delta), ...bytes];
const meta = (delta, type, data) => ev(delta, 0xFF, type, ...vlq(data.length), ...data);
const eot = delta => meta(delta, 0x2F, []);
const track = (...events) => chunk('MTrk', events.flat());
const file = (...parts) => Uint8Array.from(parts.flat());
const tempo = (delta, us) => meta(delta, 0x51, [(us >> 16) & 255, (us >> 8) & 255, us & 255]);

// The specification's own format 0 example (p14): 96 ppq, 4/4, 500000 µs, three program changes, four notes.
const SPEC_EXAMPLE = file(header(0, 1, 96), track(
  meta(0, 0x58, [4, 2, 24, 8]), tempo(0, 500000),
  ev(0, 0xC0, 5), ev(0, 0xC1, 46), ev(0, 0xC2, 70),
  ev(0, 0x92, 48, 96), ev(0, 0x92, 60, 96), ev(96, 0x91, 67, 64), ev(96, 0x90, 76, 32),
  ev(192, 0x82, 48, 64), ev(0, 0x82, 60, 64), ev(0, 0x81, 67, 64), ev(0, 0x80, 76, 64), eot(0)));

test('parses the specification example: ticks, seconds through the tempo map, time signature fields, counted program changes', () => {
  const list = parseSMF(SPEC_EXAMPLE, { name: 'spec-example.mid' });
  assert.equal(list.format, 0); assert.equal(list.ppq, 96); assert.equal(list.trackCount, 1); assert.equal(list.endTick, 384);
  assert.deepEqual(list.timeSignatures.map(s => [s.numerator, s.denominator, s.clocksPerClick, s.thirtySecondsPerQuarter]), [[4, 4, 24, 8]]);
  assert.deepEqual(list.tempoMap.map(t => [t.tick, t.usPerQuarter]), [[0, 500000]]);
  assert.deepEqual(list.notes.map(n => [n.channel, n.pitch, n.velocity, n.onTick, n.offTick]), [[2, 48, 96, 0, 384], [2, 60, 96, 0, 384], [1, 67, 64, 96, 384], [0, 76, 32, 192, 384]]);
  assert.deepEqual(list.notes.map(n => [n.onSeconds, n.offSeconds]), [[0, 2], [0, 2], [0.5, 2], [1, 2]]);
  assert.equal(list.durationSeconds, 2); assert.equal(list.ignored.programChange, 3);
  assert.deepEqual(list.tracks[0].channels, [0, 1, 2]); assert.deepEqual(list.warnings, []);
  assert.ok(list.notes.every(n => Number.isInteger(n.offEventOrder) && n.offEventOrder > n.noteId));
  validateNoteList(list); assert.equal(canonicalNoteList(list), canonicalNoteList(parseSMF(SPEC_EXAMPLE, { name: 'spec-example.mid' })));
});

test('running status persists across delta-times; velocity-0 Note On is a Note Off; meta and SysEx cancel running status', () => {
  const ok = file(header(0, 1, 48), track(ev(0, 0x90, 60, 100), ev(24, 62, 100), ev(24, 60, 0), ev(0, 62, 0), eot(0)));
  const list = parseSMF(ok);
  assert.deepEqual(list.notes.map(n => [n.pitch, n.onTick, n.offTick]), [[60, 0, 48], [62, 24, 48]]);
  const afterMeta = file(header(0, 1, 48), track(ev(0, 0x90, 60, 100), meta(0, 0x01, str('x')), ev(24, 60, 0), eot(0)));
  assert.throws(() => parseSMF(afterMeta), /no running status/);
  const afterSysEx = file(header(0, 1, 48), track(ev(0, 0x90, 60, 100), ev(0, 0xF0, 3, 0x43, 0x12, 0xF7), ev(24, 60, 0), eot(0)));
  assert.throws(() => parseSMF(afterSysEx), /no running status/);
  const noStatus = file(header(0, 1, 48), track(ev(0, 60, 100), eot(0)));
  assert.throws(() => parseSMF(noStatus), /no running status/);
});

test('format 1: tempo changes in the first track drive seconds for notes in other tracks; same-tick tempo conflict warns and last wins', () => {
  const f = file(header(1, 2, 100),
    track(tempo(0, 500000), tempo(100, 250000), tempo(0, 1000000), eot(100)),      // two tempos at tick 100: later wins (1 s per quarter)
    track(ev(0, 0x90, 60, 80), ev(100, 0x80, 60, 0), ev(0, 0x90, 64, 80), ev(100, 0x80, 64, 0), eot(0)));
  const list = parseSMF(f);
  assert.deepEqual(list.tempoMap.map(t => [t.tick, t.usPerQuarter]), [[0, 500000], [100, 1000000]]);
  assert.deepEqual(list.warnings.filter(w => w.kind === 'tempoConflict').length, 1);
  assert.deepEqual(list.notes.map(n => [n.onSeconds, n.offSeconds]), [[0, 0.5], [0.5, 1.5]]);
  assert.equal(list.durationSeconds, 1.5);
  assert.equal(secondsAtTick([], 100, 50), 0.25, 'default 120 BPM when no Set Tempo');
  const noTempo = parseSMF(file(header(0, 1, 100), track(ev(0, 0x90, 60, 80), ev(50, 0x80, 60, 0), eot(0))));
  assert.deepEqual(noTempo.notes.map(n => [n.onSeconds, n.offSeconds]), [[0, 0.25]]);
});

test('pairing policies are warned, never silent: retrigger, unmatched off, dangling on, zero gate', () => {
  const f = file(header(0, 1, 10), track(
    ev(0, 0x90, 60, 90), ev(5, 0x90, 60, 70), ev(5, 0x80, 60, 0),     // retrigger at tick 5 closes the first
    ev(0, 0x80, 61, 0),                                               // unmatched off
    ev(0, 0x90, 62, 50), ev(0, 0x80, 62, 0),                          // zero gate
    ev(0, 0x90, 63, 50), eot(10)));                                   // dangling, closed at EOT tick 20
  const list = parseSMF(f);
  const kinds = list.warnings.map(w => w.kind).sort();
  assert.deepEqual(kinds, ['danglingOn', 'retrigger', 'unmatchedOff', 'zeroGate']);
  assert.deepEqual(list.notes.map(n => [n.pitch, n.onTick, n.offTick]), [[60, 0, 5], [60, 5, 10], [62, 10, 10], [63, 10, 20]]);
  assert.ok(list.warnings.every(w => w.detail.length > 0));
  validateNoteList(list);
});

test('sustain is kept in order with values; other messages are counted by kind; unknown chunks, unknown meta and long known meta are tolerated', () => {
  const f = file(header(0, 1, 10, [0xAA, 0xBB]),                      // header longer than 6 (p7): honored by skipping
    chunk('XFoo', [1, 2, 3]),                                          // alien chunk (p5)
    track(
      meta(0, 0x51, [0x07, 0xA1, 0x20, 0x99]),                         // Set Tempo with an extra byte: honor the length, ignore the extension (p9)
      meta(0, 0x03, str('Lead')), meta(0, 0x06, str('Verse A')), meta(0, 0x7E, [1, 2]),   // name, marker, unknown meta 0x7E
      meta(0, 0x20, [3]), meta(0, 0x59, [0, 0]), meta(0, 0x7F, [0x41, 1]),
      ev(0, 0xB0, 64, 127), ev(0, 0xB0, 7, 100), ev(0, 0xE0, 0, 64), ev(0, 0xD0, 10), ev(0, 0xA0, 60, 10),
      ev(0, 0xF7, 2, 0xF8, 0xFA),                                      // F7 escape, no terminal F7 required (p9)
      ev(0, 0xF0, 3, 0x43, 0x12, 0x00), ev(5, 0xF7, 2, 0x00, 0xF7),    // multipart sysex: first packet, continuation packet (p9)
      ev(0, 0x90, 60, 100), ev(5, 0xB0, 64, 0), ev(0, 0x80, 60, 0), eot(0)));
  const list = parseSMF(f, { name: 'tolerant.mid' });
  assert.deepEqual(list.tempoMap.map(t => t.usPerQuarter), [500000]);
  assert.equal(list.tracks[0].name, 'Lead'); assert.deepEqual(list.markers.map(m => [m.tick, m.text]), [[0, 'Verse A']]);
  assert.deepEqual(list.sustain.map(s => [s.tick, s.value]), [[0, 127], [10, 0]]);
  assert.ok(list.sustain[1].eventOrder < list.notes[0].offEventOrder, 'same-tick pedal-off precedes the note-off in merge order, recoverable');
  assert.deepEqual([list.ignored.controllers[7], list.ignored.pitchBend, list.ignored.channelAftertouch, list.ignored.polyAftertouch, list.ignored.sysEx, list.ignored.unknownMeta, list.ignored.unknownChunks, list.ignored.channelPrefix], [1, 1, 1, 1, 3, 1, 1, 1]);
  assert.deepEqual(list.ignored.meta, { 89: 1, 127: 1 });
  validateNoteList(list);
});

test('rejects what the format forbids and what this importer bounds, each with a named reason', () => {
  const rejects = (bytes, re) => assert.throws(() => parseSMF(bytes), re);
  rejects(file(header(2, 1, 96), track(eot(0))), /format 2/);
  rejects(file(header(3, 1, 96), track(eot(0))), /Unknown SMF format/);
  rejects(file(header(0, 1, 0xE250), track(eot(0))), /SMPTE/);
  rejects(file(header(0, 1, 0), track(eot(0))), /at least one tick/);
  rejects(file(header(0, 2, 96), track(eot(0)), track(eot(0))), /Format 0 must contain exactly one track/);
  rejects(file(chunk('MThd', [...u16(0), ...u16(1)]), track(eot(0))), /shorter than the six bytes/);
  rejects(file(str('RIFF'), u32(0)), /does not start with an MThd/);
  rejects(file(header(1, 2, 96), track(eot(0))), /Header says 2 tracks but the file holds 1/);
  rejects(file(header(0, 1, 96), track(ev(0, 0x90, 60, 1))), /no End of Track/);
  rejects(file(header(0, 1, 96), track(eot(0), ev(0, 0x90, 60, 1))), /data after the End of Track/);
  rejects(file(header(0, 1, 96), [...str('MTrk'), ...u32(50), 0, 0xFF, 0x2F, 0]), /Truncated data/);
  rejects(file(header(0, 1, 96), track([0x81, 0x80, 0x80, 0x80, 0x00, 0xFF, 0x2F, 0])), /longer than four bytes/);
  rejects(file(header(0, 1, 96), track(ev(0, 0xF8), eot(0))), /not a valid MIDI File event/);
  rejects(file(header(0, 1, 96), track(meta(0, 0x51, [1, 2]), eot(0))), /shorter than the 3 bytes/);
  rejects(file(header(0, 1, 96), track(meta(0, 0x80, []), eot(0))), /not below 128/);
  rejects(file(header(0, 1, 96), track(meta(0, 0x58, [4, 8, 24, 8]), eot(0))), /denominator 2\^8 exceeds/);
  rejects(file(header(0, 1, 96), track(ev(0, 0x90, 0x80, 1), eot(0))), /bit 7 set/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxBytes: 10 } }), /at most 10/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxNotes: 3 } }), /More than 3 notes/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxEvents: 5 } }), /More than 5 events/);
  assert.throws(() => parseSMF([1, 2, 3]), /Uint8Array/);
});

test('validateNoteList rejects tampered seconds, unknown keys and disorder; canonical form is stable', () => {
  const list = parseSMF(SPEC_EXAMPLE);
  const mutate = f => { const c = structuredClone(list); f(c); return c; };
  assert.throws(() => validateNoteList(mutate(c => { c.notes[0].offSeconds = 1.9; })), /do not follow from ticks/);
  assert.throws(() => validateNoteList(mutate(c => { c.notes[0].onTick = 5; })), /do not follow from ticks|sorted/);
  assert.throws(() => validateNoteList(mutate(c => { c.extra = 1; })), /unsupported field/);
  assert.throws(() => validateNoteList(mutate(c => { delete c.notes[0].offEventOrder; })), /missing field/);
  assert.throws(() => validateNoteList(mutate(c => { c.tempoMap[0].usPerQuarter = 0; })), /tempo entry/);
  assert.throws(() => validateNoteList(mutate(c => { c.durationSeconds = 3; })), /durationSeconds/);
  assert.throws(() => validateNoteList(mutate(c => { [c.notes[0], c.notes[3]] = [c.notes[3], c.notes[0]]; })), /sorted/);
  assert.throws(() => validateNoteList(mutate(c => { c.notes[0].velocity = 0; })), /velocity/);
  assert.equal(canonicalNoteList(list), canonicalNoteList(JSON.parse(canonicalNoteList(list))));
  assert.deepEqual(Object.keys(JSON.parse(canonicalNoteList(list))), Object.keys(JSON.parse(canonicalNoteList(list))).slice().sort());
});

// ---- after Astra's review of 5c0b4ef (collab/reviews/20261101T0440Z-astra-reviews-smf-parser.md) ----
test('every decoded event counts toward the event bound, retained or ignored; limits must be bounded integers', () => {
  const many = [0, 0xC0, 1]; for (let i = 1; i < 65537; i++) many.push(0, 1); many.push(...eot(0));
  assert.throws(() => parseSMF(file(header(0, 1, 96), chunk('MTrk', many))), /More than 65536 events/);
  const some = [0, 0xC0, 1]; for (let i = 1; i < 10; i++) some.push(0, 1); some.push(...eot(0));
  const list = parseSMF(file(header(0, 1, 96), chunk('MTrk', some)));
  assert.equal(list.eventCount, 11); assert.equal(list.ignored.programChange, 10);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxEvents: NaN } }), /Limit maxEvents/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxEvents: Infinity } }), /Limit maxEvents/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxNotes: 0 } }), /Limit maxNotes/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { maxDenominatorExponent: 8 } }), /maxDenominatorExponent/);
  assert.throws(() => parseSMF(SPEC_EXAMPLE, { limits: { bogus: 1 } }), /Unknown limit/);
  assert.throws(() => validateNoteList(parseSMF(SPEC_EXAMPLE), { limits: { maxEvents: 3 } }), /eventCount/);
});

test('parser and validator agree on the cumulative tick bound; ignored events still own a stable position in the shared order', () => {
  const ticks = []; for (let i = 0; i < 65; i++) ticks.push(0xFF, 0xFF, 0xFF, 0x7F, 0xC0, 1); ticks.push(...eot(0));
  const long = parseSMF(file(header(0, 1, 96), chunk('MTrk', ticks)));
  assert.equal(long.endTick, 65 * 0x0FFFFFFF); validateNoteList(long);
  const f = file(header(0, 1, 10), track(ev(0, 0xC0, 1), ev(0, 0x90, 60, 90), ev(5, 0xC0, 2), ev(5, 0x80, 60, 0), eot(0)));
  const list = parseSMF(f);
  assert.deepEqual([list.notes[0].noteId, list.notes[0].offEventOrder, list.eventCount], [1, 3, 5], 'program changes occupy positions 0 and 2');
});

test('payload reads are bounded by the track chunk, not the file', () => {
  // A track whose last event needs two data bytes but the chunk ends after one; the bytes of the next chunk must not be consumed.
  const bad = file(header(1, 2, 96), chunk('MTrk', [0, 0x90, 60]), track(eot(0)));
  assert.throws(() => parseSMF(bad), /runs past the end of the track 0 chunk/);
  const badMeta = file(header(1, 2, 96), chunk('MTrk', [0, 0xFF, 0x06, 10, 65]), track(eot(0)));
  assert.throws(() => parseSMF(badMeta), /runs past the end of the track 0 chunk/);
});

test('zero gates are warned for every closure kind; a zero numerator is malformed', () => {
  const sameTick = parseSMF(file(header(0, 1, 10), track(ev(0, 0x90, 60, 90), ev(0, 0x90, 60, 70), ev(0, 0x80, 60, 0), eot(0))));
  assert.deepEqual(sameTick.warnings.map(w => w.kind).sort(), ['retrigger', 'zeroGate', 'zeroGate']);
  const atEot = parseSMF(file(header(0, 1, 10), track(ev(0, 0x90, 60, 90), eot(0))));
  assert.deepEqual(atEot.warnings.map(w => w.kind).sort(), ['danglingOn', 'zeroGate']);
  assert.throws(() => parseSMF(file(header(0, 1, 96), track(meta(0, 0x58, [0, 2, 24, 8]), eot(0)))), /numerator 0/);
});

test('validator rejects the adversarial records from the review', () => {
  const base = parseSMF(file(header(0, 1, 96), track(ev(0, 0xB0, 64, 127), ev(0, 0x90, 60, 100), ev(96, 0x80, 60, 0), eot(0))));
  validateNoteList(base);
  const rejects = (name, f, re) => { const c = structuredClone(base); f(c); assert.throws(() => validateNoteList(c), re, name); };
  rejects('sustain eventOrder NaN', c => { c.sustain[0].eventOrder = NaN; }, /sustain entry|increasing/);
  rejects('off before on', c => { c.notes[0].offEventOrder = 0; }, /later event than the note-on/);
  rejects('negative ignored count', c => { c.ignored.programChange = -1; }, /non-negative integer/);
  rejects('extra ignored key', c => { c.ignored.extra = 'bad'; }, /unsupported field/);
  rejects('controller key out of range', c => { c.ignored.controllers[128] = 1; }, /0\.\.127/);
  rejects('warning malformed', c => { c.warnings.push({ kind: 'invented', noteId: Infinity, detail: {} }); }, /warning/);
  rejects('warning unresolved reference', c => { c.warnings.push({ kind: 'zeroGate', noteId: 99, detail: 'x' }); }, /does not resolve/);
  rejects('duplicate channels', c => { c.tracks[0].channels = [0, 0]; }, /sorted unique/);
  rejects('note channel not on its track', c => { c.tracks[0].channels = [1]; c.sustain[0].channel = 1; }, /not declared on its track/);
  rejects('track index mismatch', c => { c.tracks[0].index = 1; }, /index must equal position/);
  rejects('tempo eventOrder beyond eventCount', c => { c.tempoMap.push({ tick: 0, usPerQuarter: 500000, eventOrder: 50 }); }, /tempo entry|increasing/);
  rejects('marker eventOrder not integer', c => { c.markers.push({ tick: 0, seconds: 0, text: 'm', eventOrder: 1.5 }); }, /marker/);
  rejects('time signature numerator 0', c => { c.timeSignatures.push({ tick: 0, numerator: 0, denominator: 4, clocksPerClick: 24, thirtySecondsPerQuarter: 8, eventOrder: 1 }); }, /time signature/);
  rejects('notes not an array', c => { c.notes = {}; }, /must be an array/);
  rejects('too many warnings', c => { c.warnings = new Array(70000).fill({ kind: 'zeroGate', noteId: c.notes[0].noteId, detail: 'x' }); }, /at most/);
  assert.equal(JSON.parse(canonicalNoteList(base)).eventCount, 4);
});
