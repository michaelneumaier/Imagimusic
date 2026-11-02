import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeExpressionClip, channelVoicePacket, packets, secondsToTicks, CLIP_HEADER } from '../src/midi2/clip-encode.js';
import { composeExpressiveStudy, composeExpressiveChord, canonicalExpressionScore, EXPRESSION_VERSION } from '../src/midi2/expression.js';
import { readUMPPackets } from '../src/midi2/ump.js';
import { parseMIDIClip } from '../src/midi2/clip.js';

const hex = words => words.map(w => w.toString(16).padStart(8, '0')).join(' ');

test('literal packet bytes from the specification layouts, written by hand, not derived from any decoder', () => {
  // Table 30: Note On, mt 4, group 0, status 1001, channel 0, note 60 (0x3C), attribute type 0; word 2: velocity 0x7000 << 16 | attribute data 0.
  assert.equal(hex(channelVoicePacket({ type: 'noteOn', group: 0, channel: 0, noteNumber: 60, velocity16: 0x7000, attributeType8: 0, attributeData16: 0 })), '40903c00 70000000');
  // Note Off on group 2, channel 5, note 64, velocity 0x1234, attribute type 3 (Pitch 7.9), data 0x8000.
  assert.equal(hex(channelVoicePacket({ type: 'noteOff', group: 2, channel: 5, noteNumber: 64, velocity16: 0x1234, attributeType8: 3, attributeData16: 0x8000 })), '42854003 12348000');
  assert.equal(hex(channelVoicePacket({ type: 'polyPressure', group: 0, channel: 0, noteNumber: 57, data32: 0xC0000000 })), '40a03900 c0000000');
  assert.equal(hex(channelVoicePacket({ type: 'perNoteController', group: 0, channel: 0, noteNumber: 67, index8: 74, data32: 0xF0000000 })), '4000434a f0000000');   // index 74 = 0x4A, full 8-bit field
  assert.equal(hex(channelVoicePacket({ type: 'perNoteManagement', group: 0, channel: 0, noteNumber: 64, flags: { detach: true, reset: true } })), '40f04003 00000000');   // D bit 1, S bit 0
  assert.equal(hex(channelVoicePacket({ type: 'perNotePitchBend', group: 0, channel: 0, noteNumber: 57, data32: 0x80000000 })), '40603900 80000000');
  assert.equal(hex(channelVoicePacket({ type: 'pitchBend', group: 0, channel: 1, data32: 0x80000000 })), '40e10000 80000000');
  assert.equal(hex(channelVoicePacket({ type: 'controlChange', group: 0, channel: 0, index8: 64, data32: 0x80000000 })), '40b04000 80000000');
  assert.equal(hex(channelVoicePacket({ type: 'registeredController', group: 0, channel: 0, bank8: 0, index8: 7, data32: 0x04000000 })), '40200007 04000000');
  assert.equal(hex(packets.deltaClockstamp(0)), '00400000'); assert.equal(hex(packets.deltaClockstamp(0xFFFFF)), '004fffff');   // Figure 34: status 4, 20-bit ticks
  assert.equal(hex(packets.ticksPerQuarter(500)), '003001f4');                                                               // Figure 33: status 3, 16-bit DCTPQ
  assert.equal(hex(packets.startOfClip()), 'f0200000 00000000 00000000 00000000'); assert.equal(hex(packets.endOfClip()), 'f0210000 00000000 00000000 00000000');
  assert.equal(hex(packets.setTempo(50000000)), 'd0100000 02faf080 00000000 00000000');                                        // Figure 70: form 0, address 1, 120 BPM = 50,000,000 × 10 ns
  assert.equal(hex(packets.noop()), '00000000');
  assert.throws(() => channelVoicePacket({ type: 'other', group: 0, channel: 0, kind: 'sysex' }), /Cannot encode/);
  assert.throws(() => packets.deltaClockstamp(0x100000), /0\.\.1048575/);
});

test('a one-note clip is exactly the bytes the specification prescribes: header, configuration, sequence with markers, nothing after', () => {
  const score = { version: EXPRESSION_VERSION, protocol: 'midi2', source: { kind: 'fixture', name: 'one note' }, bounds: { maxVoices: 1, maxEvents: 2 }, mapping: { version: 1, instrument: 'bellows', smoothingSeconds: 0.005, neutral: { brightness32: 0x80000000, timbre32: 0x80000000 } },
    events: [{ order: 0, time: 0, group: 0, channel: 0, type: 'noteOn', noteNumber: 60, velocity16: 0x7000, attributeType8: 0, attributeData16: 0 }, { order: 1, time: 1, group: 0, channel: 0, type: 'noteOff', noteNumber: 60, velocity16: 0, attributeType8: 0, attributeData16: 0 }] };
  const { bytes } = encodeExpressionClip(score);
  const expected = Buffer.concat([Buffer.from('SMF2CLIP', 'ascii'), Buffer.from(('00400000 003001f4 00400000 d0100000 02faf080 00000000 00000000' +                       // DCS 0, DCTPQ 500, DCS 0, tempo 120
    ' 00400000 f0200000 00000000 00000000 00000000 00400000 d0100000 02faf080 00000000 00000000' +                                                               // DCS 0, Start of Clip, DCS 0, tempo 120
    ' 00400000 40903c00 70000000 004003e8 40803c00 00000000 00400000 f0210000 00000000 00000000 00000000').replace(/ /g, ''), 'hex')]);    // DCS 0 note on; DCS 1000 ticks (1 s at 500 per quarter, 120 BPM) note off; DCS 0 End of Clip
  assert.deepEqual(Buffer.from(bytes), expected);
  assert.deepEqual([...bytes.slice(0, 8)], CLIP_HEADER);
});

test('the fixtures round-trip through the independent packet reader and Clip parser: same events, same ticks, origin at the sequence start', () => {
  for (const score of [composeExpressiveStudy(), composeExpressiveChord()]) {
    const before = canonicalExpressionScore(score);
    const { bytes, ticksPerQuarter, tempoBpm } = encodeExpressionClip(score), parsed = parseMIDIClip(bytes), packetsRead = readUMPPackets(bytes, { offset: 8 });
    assert.equal(parsed.ticksPerQuarter, ticksPerQuarter); assert.equal(parsed.report.assumedTempo, false); assert.equal(parsed.origin.tick, 0);
    const events = parsed.sequence.filter(p => p.message.kind === 'midi2');
    assert.equal(events.length, score.events.length);
    events.forEach((p, i) => {
      const e = score.events[i], { group, channel, ...rest } = p.message.event, expectedTick = secondsToTicks(e.time, { ticksPerQuarter, tempoBpm });
      assert.equal(p.tick - parsed.origin.tick, expectedTick, `event ${i} tick`); assert.equal(group, e.group); assert.equal(channel, e.channel);
      const { order, time, group: g, channel: c, ...fields } = e; assert.deepEqual(rest, fields, `event ${i} fields`);
    });
    assert.equal(packetsRead.at(-1).message.kind, 'endOfClip'); assert.equal(packetsRead.filter(p => p.message.kind === 'unsupported').length, 0);
    assert.equal(canonicalExpressionScore(score), before, 'the source is untouched');
  }
});

test('refusals: off-grid times, non-integer tempos, and the delta split with NOOPs over the 20-bit field', () => {
  const base = composeExpressiveChord();
  const offGrid = JSON.parse(canonicalExpressionScore(base)); offGrid.events[1].time = 0.0005; offGrid.events.sort((a, b) => a.time - b.time).forEach((e, i) => { e.order = i; });
  assert.throws(() => encodeExpressionClip(offGrid), /not on the 500-tick grid/);
  assert.throws(() => encodeExpressionClip(base, { tempoBpm: 7 }), /integer number of 10 ns/);
  assert.throws(() => encodeExpressionClip(base, { tempoBpm: 0 }), /positive/); assert.throws(() => encodeExpressionClip(base, { ticksPerQuarter: 0 }), /1\.\.65535/); assert.throws(() => encodeExpressionClip(base, { nope: 1 }), /Unknown encode option/);
  const huge = JSON.parse(canonicalExpressionScore(base)); huge.events.at(-1).time = 1e300;                   // finite, passes score validation, must not loop or allocate
  assert.throws(() => encodeExpressionClip(huge), /tick budget|exceed/);
  const wide = JSON.parse(canonicalExpressionScore(base)); wide.events.unshift({ order: 0, time: 0, group: 0, channel: 0, type: 'controlChange', index8: 200, data32: 0 }); wide.events.forEach((e, i) => { e.order = i; });
  assert.throws(() => encodeExpressionClip(wide), /7-bit wire field/);
  assert.throws(() => channelVoicePacket({ type: 'registeredController', group: 0, channel: 0, bank8: 128, index8: 0, data32: 0 }), /7-bit wire fields/);
  const late = JSON.parse(canonicalExpressionScore(base)); late.events.forEach(e => { e.time += 1200; });     // 1200 s = 1,200,000 ticks > 1,048,575
  const { bytes } = encodeExpressionClip(late), parsed = parseMIDIClip(bytes);
  assert.ok(parsed.sequence.some(p => p.message.kind === 'noop'), 'a NOOP restarts the delta count'); assert.equal(parsed.sequence.filter(p => p.message.kind === 'midi2')[0].tick, 1200000);
});
