// Encode an ExpressionScore as a MIDI Clip File (M2-116-U v1.0 §5 to §7) of UMP packets (M2-104-UM v1.1.2 Table 30, §7.2.3, §7.5.3).
// Independent of the decoder: every packet is built from the specification's field layouts here, so a byte-exact round trip through
// src/midi2/ump.js and clip.js is evidence about both sides, and the literal-byte tests are evidence about this side alone.
// Scope: the evaluator's channel-voice subset only; `other` events are refused; times must sit on the tick grid (1 ms at the defaults).
import { validateExpressionScore } from './expression.js';

export const CLIP_HEADER = Object.freeze([0x53, 0x4D, 0x46, 0x32, 0x43, 0x4C, 0x49, 0x50]);   // "SMF2CLIP", M2-116-U Table 5
export const CLIP_ENCODE_DEFAULTS = Object.freeze({ ticksPerQuarter: 500, tempoBpm: 120 });  // 1 ms per tick at 120 BPM (DCTPQ §7.2.3.1, 1..65535)
const MAX_DELTA = 0xFFFFF;                                                                      // 20-bit Delta Clockstamp field (Figure 34)
export const CLIP_ENCODE_BUDGET = Object.freeze({ maxTicks: 0xFFFFF * 64, maxWords: 65536 });   // at most 64 NOOP restarts per gap and 256 KiB of packets, the reader's bound
const MAX_TICKS = CLIP_ENCODE_BUDGET.maxTicks;
const u32 = (...parts) => parts.reduce((w, [value, shift]) => (w | ((value >>> 0) << shift)) >>> 0, 0);

/** Utility (MT 0x0), stream (MT 0xF) and Flex Data (MT 0xD) packets, as words. */
export const packets = Object.freeze({
  noop: () => [0],                                                                              // Figure 27: mt 0, status 0
  deltaClockstamp: ticks => { if (!Number.isInteger(ticks) || ticks < 0 || ticks > MAX_DELTA) throw new Error('Delta Clockstamp must be 0..1048575 ticks.'); return [u32([0, 28], [4, 20], [ticks, 0])]; },   // Figure 34: status 0100, 20-bit ticks
  ticksPerQuarter: tpq => { if (!Number.isInteger(tpq) || tpq < 1 || tpq > 0xFFFF) throw new Error('DCTPQ must be 1..65535.'); return [u32([0, 28], [3, 20], [tpq, 0])]; },                // Figure 33: status 0011, 16-bit ticks per quarter
  startOfClip: () => [u32([0xF, 28], [0, 26], [0x20, 16]), 0, 0, 0],                             // Figure 24: mt F, form 0, status 0x20
  endOfClip: () => [u32([0xF, 28], [0, 26], [0x21, 16]), 0, 0, 0],                               // Figure 25: status 0x21
  setTempo: (tenNanosecondsPerQuarter, group = 0) => { if (!Number.isInteger(tenNanosecondsPerQuarter) || tenNanosecondsPerQuarter < 1 || tenNanosecondsPerQuarter > 0xFFFFFFFF) throw new Error('Tempo must be 1..2^32-1 units of 10 ns.'); return [u32([0xD, 28], [group & 15, 24], [0, 22], [1, 20], [0, 16], [0, 8], [0, 0]), tenNanosecondsPerQuarter >>> 0, 0, 0]; },   // Figure 70: form 0, address 1 (Group), bank 0x00, status 0x00
});

/** One ExpressionScore event as a MIDI 2.0 channel-voice packet (Table 30). */
export function channelVoicePacket(e) {
  const head = (status, byte3 = 0, byte4 = 0) => u32([4, 28], [e.group & 15, 24], [status, 20], [e.channel & 15, 16], [byte3 & 255, 8], [byte4 & 255, 0]);
  switch (e.type) {
    case 'noteOn': return [head(9, e.noteNumber, e.attributeType8), u32([e.velocity16, 16], [e.attributeData16, 0])];
    case 'noteOff': return [head(8, e.noteNumber, e.attributeType8), u32([e.velocity16, 16], [e.attributeData16, 0])];
    case 'polyPressure': return [head(0xA, e.noteNumber), e.data32 >>> 0];
    case 'perNoteController': return [head(0, e.noteNumber, e.index8), e.data32 >>> 0];
    case 'perNoteManagement': return [head(0xF, e.noteNumber, (e.flags.detach ? 2 : 0) | (e.flags.reset ? 1 : 0)), 0];   // Figure 51: D bit 1, S bit 0
    case 'perNotePitchBend': return [head(6, e.noteNumber), e.data32 >>> 0];
    case 'pitchBend': return [head(0xE), e.data32 >>> 0];
    case 'controlChange': if (e.index8 > 127) throw new Error(`Control Change index ${e.index8} does not fit the 7-bit wire field (Figure 52).`); return [head(0xB, e.index8), e.data32 >>> 0];
    case 'registeredController': if (e.bank8 > 127 || e.index8 > 127) throw new Error(`Registered Controller bank ${e.bank8} / index ${e.index8} does not fit the 7-bit wire fields (Table 30).`); return [head(2, e.bank8, e.index8), e.data32 >>> 0];
    default: throw new Error(`Cannot encode an event of type ${e.type}: not a MIDI 2.0 channel-voice message.`);
  }
}

/** Seconds to ticks on the clip grid; refuses times off the grid rather than rounding (presentation order and timing must stay exact). */
export function secondsToTicks(seconds, { ticksPerQuarter, tempoBpm }) {
  if (!(Number.isFinite(seconds) && seconds >= 0 && Number.isInteger(ticksPerQuarter) && ticksPerQuarter >= 1 && ticksPerQuarter <= 0xFFFF && Number.isFinite(tempoBpm) && tempoBpm > 0)) throw new Error('secondsToTicks needs a finite non-negative time, a DCTPQ of 1..65535 and a positive tempo.');
  const ticks = seconds * tempoBpm * ticksPerQuarter / 60, rounded = Math.round(ticks);
  if (!Number.isSafeInteger(rounded) || rounded > MAX_TICKS) throw new Error(`Time ${seconds} s exceeds the encoder's tick budget.`);
  if (Math.abs(ticks - rounded) > 1e-6) throw new Error(`Time ${seconds} s is not on the ${ticksPerQuarter}-tick grid at ${tempoBpm} BPM.`);
  return rounded;
}

/** The whole file: header; configuration header (DCS 0, DCTPQ, DCS 0, Set Tempo); sequence (DCS 0, Start of Clip, DCS 0, Set Tempo, the events with
 * deltas, DCS 0, End of Clip). A delta over the 20-bit field is split with NOOPs (§7.2.3.2). Simultaneous events share one clockstamp. */
export function encodeExpressionClip(input, options = {}) {
  const score = validateExpressionScore(input), { ticksPerQuarter, tempoBpm } = { ...CLIP_ENCODE_DEFAULTS, ...options };
  for (const key of Object.keys(options)) if (!['ticksPerQuarter', 'tempoBpm'].includes(key)) throw new Error(`Unknown encode option: ${key}`);
  if (!(Number.isInteger(ticksPerQuarter) && ticksPerQuarter >= 1 && ticksPerQuarter <= 0xFFFF)) throw new Error('ticksPerQuarter must be 1..65535.');
  if (!(Number.isFinite(tempoBpm) && tempoBpm > 0)) throw new Error('tempoBpm must be a positive number.');
  const tenNs = Math.round(6e9 / tempoBpm); if (!(tenNs >= 1 && tenNs <= 0xFFFFFFFF) || Math.abs(6e9 / tempoBpm - tenNs) > 1e-6) throw new Error('Tempo must be an integer number of 10 ns units per quarter, within 32 bits.');
  // Budget before any loop or allocation: every event needs at most 2 words plus one clockstamp, and a gap at most 64 restarts of 2 words.
  const lastTicks = score.events.length ? secondsToTicks(score.events.at(-1).time, { ticksPerQuarter, tempoBpm }) : 0;
  const worstWords = 8 + 2 + 8 + 2 + score.events.length * 3 + Math.ceil(lastTicks / MAX_DELTA) * 2 + 5;
  if (worstWords > CLIP_ENCODE_BUDGET.maxWords) throw new Error(`The clip would exceed ${CLIP_ENCODE_BUDGET.maxWords} words (${CLIP_ENCODE_BUDGET.maxWords * 4} bytes).`);
  const words = [...packets.deltaClockstamp(0), ...packets.ticksPerQuarter(ticksPerQuarter), ...packets.deltaClockstamp(0), ...packets.setTempo(tenNs)];
  words.push(...packets.deltaClockstamp(0), ...packets.startOfClip(), ...packets.deltaClockstamp(0), ...packets.setTempo(tenNs));
  let tick = 0, pending = true;                                                                  // pending: the next event needs a clockstamp even at delta 0
  for (const e of score.events) {
    const at = secondsToTicks(e.time, { ticksPerQuarter, tempoBpm }); let delta = at - tick;
    if (delta < 0) throw new Error('Events must be non-decreasing in time.');
    if (delta > 0 || pending) { while (delta > MAX_DELTA) { words.push(...packets.deltaClockstamp(MAX_DELTA), ...packets.noop()); delta -= MAX_DELTA; } words.push(...packets.deltaClockstamp(delta)); pending = false; }
    words.push(...channelVoicePacket(e)); tick = at;
  }
  words.push(...packets.deltaClockstamp(0), ...packets.endOfClip());
  const bytes = new Uint8Array(8 + words.length * 4); bytes.set(CLIP_HEADER, 0);
  const view = new DataView(bytes.buffer); words.forEach((w, i) => view.setUint32(8 + i * 4, w >>> 0, false));
  return { bytes, ticksPerQuarter, tempoBpm, tenNanosecondsPerQuarter: tenNs, lastTick: tick, events: score.events.length };
}
