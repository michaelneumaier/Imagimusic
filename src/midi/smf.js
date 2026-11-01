// Standard MIDI File (SMF 1.0) reader: a MIDI 1.0 input adapter for proposal 010 (M4a).
// Written against the MMA "Standard MIDI Files 1.0" (RP-001, rev. Feb 1996) text; page numbers below are the
// PDF's physical pages (printed numbering is two lower). Every rule the parser enforces cites its page.
// Output is a plain, canonical NoteList: ticks are the source of truth, seconds are derived through the tempo
// map and re-derived by validateNoteList so a saved record cannot carry tampered seconds. This is NOT the
// future universal performance representation (MIDI 2.0 expression lives in its own layer); it is what a
// 1.0 file can honestly say. Nothing is transmitted; SysEx payloads are skipped by length and counted.
//
// Every decoded event (retained or ignored) counts toward the event bound and receives a stable merge order
// (eventOrder), so references in the output (noteId, offEventOrder, sustain/marker/tempo eventOrder) are
// positions in one shared ordering of the whole file. Policies the spec leaves to the reader are named
// `policy:` and surfaced as warnings in the output.

export const NOTELIST_VERSION = 1;
export const DEFAULT_LIMITS = Object.freeze({ maxBytes: 256 * 1024, maxNotes: 4096, maxEvents: 65536, maxTextChars: 120, maxDenominatorExponent: 7 });
export const MAX_DELTA = 0x0FFFFFFF;                                            // p4: largest variable-length quantity
export const WARNING_KINDS = Object.freeze(['retrigger', 'unmatchedOff', 'danglingOn', 'zeroGate', 'tempoConflict']);
const DEFAULT_US_PER_QUARTER = 500000;                                          // 120 BPM when no Set Tempo precedes (p7)
const META = { SEQUENCE_NUMBER: 0x00, TRACK_NAME: 0x03, MARKER: 0x06, CHANNEL_PREFIX: 0x20, END_OF_TRACK: 0x2F, SET_TEMPO: 0x51, SMPTE_OFFSET: 0x54, TIME_SIGNATURE: 0x58, KEY_SIGNATURE: 0x59, SEQUENCER_SPECIFIC: 0x7F };
const REQUIRED_META_LENGTH = { [META.END_OF_TRACK]: 0, [META.SET_TEMPO]: 3, [META.TIME_SIGNATURE]: 4, [META.CHANNEL_PREFIX]: 1, [META.SEQUENCE_NUMBER]: 2, [META.SMPTE_OFFSET]: 5, [META.KEY_SIGNATURE]: 2 };
const IGNORED_KEYS = ['controllers', 'programChange', 'pitchBend', 'channelAftertouch', 'polyAftertouch', 'sysEx', 'meta', 'unknownMeta', 'unknownChunks', 'channelPrefix'];

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

function resolveLimits(limits) {
  const L = { ...DEFAULT_LIMITS, ...(limits ?? {}) };
  for (const k of Object.keys(L)) if (!(k in DEFAULT_LIMITS)) throw new Error(`Unknown limit "${k}".`);
  for (const k of ['maxBytes', 'maxNotes', 'maxEvents', 'maxTextChars']) if (!isInt(L[k], 1, 2 ** 31)) throw new Error(`Limit ${k} must be an integer in 1..2^31.`);
  if (!isInt(L.maxDenominatorExponent, 0, 7)) throw new Error('Limit maxDenominatorExponent must be an integer in 0..7.');
  return L;
}
/** Largest cumulative tick any file within the event bound can reach: every event at the largest delta. Exact in doubles (< 2^53). */
export const maxTickFor = L => L.maxEvents * MAX_DELTA;

class Reader {
  constructor(bytes) { this.b = bytes; this.pos = 0; this.limit = bytes.length; this.scope = 'file'; }
  need(n, what) { if (this.pos + n > this.limit) throw new Error(`Truncated data: ${what} runs past the end of the ${this.scope}.`); }
  u8(what = 'byte') { this.need(1, what); return this.b[this.pos++]; }
  u16(what) { this.need(2, what); const v = (this.b[this.pos] << 8) | this.b[this.pos + 1]; this.pos += 2; return v; }
  u32(what) { this.need(4, what); const v = ((this.b[this.pos] << 24) >>> 0) + (this.b[this.pos + 1] << 16) + (this.b[this.pos + 2] << 8) + this.b[this.pos + 3]; this.pos += 4; return v; }
  ascii4() { this.need(4, 'chunk type'); let s = ''; for (let i = 0; i < 4; i++) s += String.fromCharCode(this.b[this.pos++]); return s; }
  // p4: 7 bits per byte, MSB first, continuation bit 7; largest allowed 0x0FFFFFFF, i.e. at most four bytes.
  vlq(what = 'variable-length quantity') {
    let value = 0;
    for (let i = 0; i < 4; i++) { const c = this.u8(what); value = (value << 7) | (c & 0x7f); if (!(c & 0x80)) return value >>> 0; }
    throw new Error(`${what} longer than four bytes (largest allowed is 0x0FFFFFFF).`);
  }
  skip(n, what) { this.need(n, what); this.pos += n; }
}

const latin1 = (bytes, max) => { let s = ''; for (let i = 0; i < bytes.length && s.length < max; i++) { const c = bytes[i]; s += c < 0x20 || c === 0x7f ? ' ' : String.fromCharCode(c); } return s; };

/** Seconds at an absolute tick through a tempo map (sorted by tick, at most one entry per tick). */
export function secondsAtTick(tempoMap, ppq, tick) {
  let seconds = 0, lastTick = 0, us = DEFAULT_US_PER_QUARTER;
  for (const entry of tempoMap) {
    if (entry.tick >= tick) break;
    seconds += (entry.tick - lastTick) * us / ppq / 1e6; lastTick = entry.tick; us = entry.usPerQuarter;
  }
  return seconds + (tick - lastTick) * us / ppq / 1e6;
}

/** Parse SMF bytes into a NoteList. Throws a named Error for anything the spec forbids or this adapter bounds. */
export function parseSMF(bytes, { name = '', limits } = {}) {
  if (!(bytes instanceof Uint8Array)) throw new Error('parseSMF expects a Uint8Array.');
  const L = resolveLimits(limits);
  if (bytes.length > L.maxBytes) throw new Error(`File is ${bytes.length} bytes; this importer accepts at most ${L.maxBytes}.`);
  const r = new Reader(bytes);
  // Header chunk (p6): 'MThd', length (p7: honor it even if longer than 6), format, ntrks, division.
  if (r.ascii4() !== 'MThd') throw new Error('Not a Standard MIDI File: it does not start with an MThd chunk.');
  const headerLength = r.u32('header length');
  if (headerLength < 6) throw new Error(`Header chunk length ${headerLength} is shorter than the six bytes the format requires.`);
  r.need(headerLength, 'header data');
  const headerEnd = r.pos + headerLength;
  const format = r.u16('format'), ntrks = r.u16('track count'), division = r.u16('division');
  r.pos = headerEnd;                                                         // extension bytes beyond 6 are honored by skipping (p7)
  if (format === 2) throw new Error('SMF format 2 (independent patterns) is not supported by this importer.');
  if (format !== 0 && format !== 1) throw new Error(`Unknown SMF format ${format}; only 0 and 1 are supported.`);
  if (division & 0x8000) throw new Error('SMPTE time-code division (bit 15 set) is not supported; metrical ticks-per-quarter-note files only.');
  const ppq = division & 0x7fff;
  if (ppq < 1) throw new Error('Division must be at least one tick per quarter-note.');
  if (format === 0 && ntrks !== 1) throw new Error(`Format 0 must contain exactly one track (header says ${ntrks}).`);
  if (ntrks < 1) throw new Error('A MIDI file needs at least one track.');

  const ignored = { controllers: {}, programChange: 0, pitchBend: 0, channelAftertouch: 0, polyAftertouch: 0, sysEx: 0, meta: {}, unknownMeta: 0, unknownChunks: 0, channelPrefix: 0 };
  const warnings = [], tracks = [], raw = [];                                 // raw: EVERY decoded event with absolute tick, per track
  let eventCount = 0, trackIndex = 0;
  const warn = (kind, detail, ref) => warnings.push({ kind, detail, ...ref });

  while (r.pos < bytes.length) {
    r.limit = bytes.length; r.scope = 'file';
    const type = r.ascii4(), length = r.u32('chunk length');
    r.need(length, `chunk ${type}`);                                         // p5: length excludes the 8-byte header; past EOF is truncated
    const end = r.pos + length;
    if (type !== 'MTrk') { ignored.unknownChunks++; r.pos = end; continue; } // p5: "expect alien chunks and treat them as if they weren't there"
    if (trackIndex >= ntrks) throw new Error(`More MTrk chunks than the header's track count (${ntrks}).`);
    r.limit = end; r.scope = `track ${trackIndex} chunk`;                     // payload reads may not cross into the next chunk
    const track = { index: trackIndex, name: '', channels: new Set() };
    let tick = 0, status = null, ended = false, order = 0;
    const push = (ev) => { if (++eventCount > L.maxEvents) throw new Error(`More than ${L.maxEvents} events; this importer stops here.`); raw.push({ ...ev, tick, track: trackIndex, order: order++ }); };
    while (r.pos < end) {
      if (ended) throw new Error(`Track ${trackIndex}: data after the End of Track event (End of Track must be the last event, p10).`);
      tick += r.vlq('delta-time');                                            // p8: delta-times are always present; cumulative ticks stay exact (≤ maxEvents·0x0FFFFFFF < 2^53)
      let first = r.u8('event status');
      if (first < 0x80) {                                                     // p8: running status; the first event of a track must specify status
        if (status === null) throw new Error(`Track ${trackIndex}: data byte 0x${first.toString(16)} with no running status in effect.`);
        r.pos--; first = status;
      }
      if (first >= 0x80 && first <= 0xEF) {
        status = first;                                                       // running status persists across delta-times (p8)
        const kind = first & 0xF0, channel = first & 0x0F, d1 = r.u8('data byte');
        const d2 = (kind === 0xC0 || kind === 0xD0) ? null : r.u8('data byte');
        if ((d1 & 0x80) || (d2 !== null && (d2 & 0x80))) throw new Error(`Track ${trackIndex}: data byte with bit 7 set in a channel message.`);
        track.channels.add(channel);
        if (kind === 0x90 && d2 > 0) push({ kind: 'on', channel, pitch: d1, velocity: d2 });
        else if (kind === 0x90 || kind === 0x80) push({ kind: 'off', channel, pitch: d1, velocity: d2 });   // p15 example: Note On velocity 0 is Note Off
        else if (kind === 0xB0 && d1 === 64) push({ kind: 'sustain', channel, value: d2 });
        else { push({ kind: 'ignored' }); if (kind === 0xB0) ignored.controllers[d1] = (ignored.controllers[d1] ?? 0) + 1; else if (kind === 0xC0) ignored.programChange++; else if (kind === 0xD0) ignored.channelAftertouch++; else if (kind === 0xA0) ignored.polyAftertouch++; else ignored.pitchBend++; }
      } else if (first === 0xF0 || first === 0xF7) {
        status = null;                                                        // p9: sysex events cancel running status
        const len = r.vlq('sysex length'); r.skip(len, 'sysex data'); ignored.sysEx++; push({ kind: 'ignored' });   // F0 complete/first packet, F7 continuation or escape (p8–9)
      } else if (first === 0xFF) {
        status = null;                                                        // p9: meta-events cancel running status
        const metaType = r.u8('meta type');
        if (metaType >= 0x80) throw new Error(`Track ${trackIndex}: meta-event type 0x${metaType.toString(16)} is not below 128.`);
        const len = r.vlq('meta length'); r.need(len, 'meta data');
        const data = bytes.subarray(r.pos, r.pos + len); r.pos += len;
        const required = REQUIRED_META_LENGTH[metaType];
        if (required !== undefined && len < required) throw new Error(`Track ${trackIndex}: meta-event 0x${metaType.toString(16)} has length ${len}, shorter than the ${required} bytes it defines.`);
        // p9: honor the length of a known meta-event even when longer than expected; interpret the known prefix, ignore the rest.
        if (metaType === META.END_OF_TRACK) { ended = true; push({ kind: 'eot' }); }
        else if (metaType === META.SET_TEMPO) push({ kind: 'tempo', usPerQuarter: (data[0] << 16) | (data[1] << 8) | data[2] });
        else if (metaType === META.TIME_SIGNATURE) {
          if (data[0] < 1) throw new Error(`Track ${trackIndex}: time signature numerator 0 is malformed.`);
          if (data[1] > L.maxDenominatorExponent) throw new Error(`Time signature denominator 2^${data[1]} exceeds this importer's bound of 2^${L.maxDenominatorExponent} (a product bound, not a format rule).`);
          push({ kind: 'timeSignature', numerator: data[0], denominator: 2 ** data[1], clocksPerClick: data[2], thirtySecondsPerQuarter: data[3] });
        }
        else if (metaType === META.MARKER) push({ kind: 'marker', text: latin1(data, L.maxTextChars) });
        else {
          push({ kind: 'ignored' });
          if (metaType === META.TRACK_NAME) { if (!track.name) track.name = latin1(data, L.maxTextChars); }
          else if (metaType === META.CHANNEL_PREFIX) ignored.channelPrefix++;
          else if (required !== undefined || (metaType >= 0x01 && metaType <= 0x0F) || metaType === META.SEQUENCER_SPECIFIC) ignored.meta[metaType] = (ignored.meta[metaType] ?? 0) + 1;
          else ignored.unknownMeta++;                                         // p9: ignore meta-events you do not recognize
        }
      } else throw new Error(`Track ${trackIndex}: status byte 0x${first.toString(16)} is not a valid MIDI File event (system common/real-time bytes must use the F7 escape).`);
    }
    if (r.pos !== end) throw new Error(`Track ${trackIndex}: events overran the chunk length.`);
    if (!ended) throw new Error(`Track ${trackIndex}: no End of Track event (it is not optional, p11).`);
    tracks.push({ index: trackIndex, name: track.name, channels: [...track.channels].sort((a, b) => a - b) });
    trackIndex++;
  }
  if (trackIndex !== ntrks) throw new Error(`Header says ${ntrks} tracks but the file holds ${trackIndex}.`);

  // Merge: tick, then track index, then in-track order (policy: simultaneous events across tracks are ordered by track).
  raw.sort((a, b) => a.tick - b.tick || a.track - b.track || a.order - b.order);
  raw.forEach((ev, i) => { ev.eventOrder = i; });

  // Tempo map and time signatures from any track (p7 says format 1 keeps them in the first track; policy: accept others).
  const tempoMap = [], timeSignatures = [];
  for (const ev of raw) {
    if (ev.kind === 'tempo') {
      if (ev.usPerQuarter < 1) throw new Error(`Set Tempo of ${ev.usPerQuarter} µs per quarter-note at tick ${ev.tick} is not positive.`);
      const last = tempoMap.at(-1);
      if (last && last.tick === ev.tick) { warn('tempoConflict', `two Set Tempo events at tick ${ev.tick}: ${last.usPerQuarter} then ${ev.usPerQuarter} µs; the later one in merge order wins`, { eventOrder: ev.eventOrder }); tempoMap.pop(); }
      tempoMap.push({ tick: ev.tick, usPerQuarter: ev.usPerQuarter, eventOrder: ev.eventOrder });
    } else if (ev.kind === 'timeSignature') timeSignatures.push({ tick: ev.tick, numerator: ev.numerator, denominator: ev.denominator, clocksPerClick: ev.clocksPerClick, thirtySecondsPerQuarter: ev.thirtySecondsPerQuarter, eventOrder: ev.eventOrder });
  }
  const seconds = tick => secondsAtTick(tempoMap, ppq, tick);

  // Note pairing per (track, channel, pitch) in merge order. Policy: track-local, not a merged single-port receiver.
  const held = new Map(), notes = [], sustain = [], markers = [];
  const key = ev => `${ev.track}:${ev.channel}:${ev.pitch}`;
  const close = (note, offEv, how) => {
    note.offTick = offEv.tick; note.offEventOrder = offEv.eventOrder;
    if (how === 'retrigger') warn('retrigger', `note ${note.noteId} (pitch ${note.pitch}) closed at tick ${offEv.tick} by a new Note On of the same pitch; the original gate is lost`, { noteId: note.noteId });
    if (how === 'eot') warn('danglingOn', `note ${note.noteId} (pitch ${note.pitch}) still held at End of Track; closed at tick ${offEv.tick}`, { noteId: note.noteId });
    if (note.offTick === note.onTick) warn('zeroGate', `note ${note.noteId} (pitch ${note.pitch}) has a zero-length gate at tick ${note.onTick}`, { noteId: note.noteId });   // any closure kind
  };
  for (const ev of raw) {
    if (ev.kind === 'on') {
      const k = key(ev), open = held.get(k);
      if (open) close(open, ev, 'retrigger');
      const note = { noteId: ev.eventOrder, track: ev.track, channel: ev.channel, pitch: ev.pitch, velocity: ev.velocity, onTick: ev.tick, offTick: null, offEventOrder: null };
      if (notes.push(note) > L.maxNotes) throw new Error(`More than ${L.maxNotes} notes; this importer stops here.`);
      held.set(k, note);
    } else if (ev.kind === 'off') {
      const k = key(ev), open = held.get(k);
      if (!open) { warn('unmatchedOff', `Note Off for pitch ${ev.pitch} on track ${ev.track} channel ${ev.channel} at tick ${ev.tick} with nothing held; ignored`, { eventOrder: ev.eventOrder }); continue; }
      close(open, ev, 'off'); held.delete(k);
    } else if (ev.kind === 'sustain') sustain.push({ eventOrder: ev.eventOrder, tick: ev.tick, seconds: seconds(ev.tick), track: ev.track, channel: ev.channel, value: ev.value });
    else if (ev.kind === 'marker') markers.push({ tick: ev.tick, seconds: seconds(ev.tick), text: ev.text, eventOrder: ev.eventOrder });
    else if (ev.kind === 'eot') {
      for (const [k, open] of [...held]) if (open.track === ev.track) { close(open, ev, 'eot'); held.delete(k); }
    }
  }
  const endTick = Math.max(0, ...raw.filter(e => e.kind === 'eot').map(e => e.tick));
  for (const n of notes) { n.onSeconds = seconds(n.onTick); n.offSeconds = seconds(n.offTick); }
  notes.sort((a, b) => a.onTick - b.onTick || a.noteId - b.noteId);
  return {
    version: NOTELIST_VERSION, name: String(name).slice(0, L.maxTextChars), format, ppq, trackCount: ntrks, eventCount, endTick, durationSeconds: seconds(endTick),
    tempoMap, timeSignatures, tracks, notes, sustain, markers, warnings, ignored,
  };
}

const TOP = ['version', 'name', 'format', 'ppq', 'trackCount', 'eventCount', 'endTick', 'durationSeconds', 'tempoMap', 'timeSignatures', 'tracks', 'notes', 'sustain', 'markers', 'warnings', 'ignored'];
const NOTE = ['noteId', 'track', 'channel', 'pitch', 'velocity', 'onTick', 'offTick', 'offEventOrder', 'onSeconds', 'offSeconds'];
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };
const boundedArray = (v, max, what) => { if (!Array.isArray(v)) throw new Error(`${what} must be an array.`); if (v.length > max) throw new Error(`${what} has ${v.length} entries; at most ${max} allowed.`); return v; };
const increasing = (arr, field, what) => { for (let i = 1; i < arr.length; i++) if (!(arr[i][field] > arr[i - 1][field])) throw new Error(`${what} must be strictly increasing in ${field}.`); };

/** Strict validation of a NoteList: keys, types, ranges, ordering, cross-references, and seconds re-derived from ticks. */
export function validateNoteList(list, { limits } = {}) {
  const L = resolveLimits(limits), maxTick = maxTickFor(L);
  keysExactly(list, TOP, 'NoteList');
  if (list.version !== NOTELIST_VERSION) throw new Error(`NoteList version must be ${NOTELIST_VERSION}.`);
  if (typeof list.name !== 'string' || list.name.length > L.maxTextChars) throw new Error('NoteList name must be a bounded string.');
  if (list.format !== 0 && list.format !== 1) throw new Error('NoteList format must be 0 or 1.');
  if (!isInt(list.ppq, 1, 0x7fff)) throw new Error('ppq must be an integer in 1..32767.');
  if (!isInt(list.trackCount, 1, 0xffff)) throw new Error('trackCount out of range.');
  if (list.format === 0 && list.trackCount !== 1) throw new Error('Format 0 has exactly one track.');
  if (!isInt(list.eventCount, 0, L.maxEvents)) throw new Error(`eventCount must be an integer in 0..${L.maxEvents}.`);
  if (!isInt(list.endTick, 0, maxTick)) throw new Error(`endTick must be an integer in 0..${maxTick}.`);
  const order = v => isInt(v, 0, list.eventCount - 1);
  // tracks
  boundedArray(list.tracks, list.trackCount, 'tracks');
  if (list.tracks.length !== list.trackCount) throw new Error('tracks must match trackCount.');
  list.tracks.forEach((t, i) => {
    keysExactly(t, ['index', 'name', 'channels'], `track ${i}`);
    if (t.index !== i || typeof t.name !== 'string' || t.name.length > L.maxTextChars) throw new Error(`track ${i}: index must equal position and name must be bounded.`);
    boundedArray(t.channels, 16, `track ${i} channels`);
    t.channels.forEach((c, j) => { if (!isInt(c, 0, 15) || (j && c <= t.channels[j - 1])) throw new Error(`track ${i}: channels must be sorted unique integers in 0..15.`); });
  });
  // tempo map and time signatures
  boundedArray(list.tempoMap, L.maxEvents, 'tempoMap');
  for (const t of list.tempoMap) { keysExactly(t, ['tick', 'usPerQuarter', 'eventOrder'], 'tempo entry'); if (!isInt(t.tick, 0, list.endTick) || !isInt(t.usPerQuarter, 1, 0xffffff) || !order(t.eventOrder)) throw new Error('tempo entry out of range.'); }
  increasing(list.tempoMap, 'tick', 'tempoMap'); increasing(list.tempoMap, 'eventOrder', 'tempoMap');
  boundedArray(list.timeSignatures, L.maxEvents, 'timeSignatures');
  for (const s of list.timeSignatures) { keysExactly(s, ['tick', 'numerator', 'denominator', 'clocksPerClick', 'thirtySecondsPerQuarter', 'eventOrder'], 'time signature'); if (!isInt(s.tick, 0, list.endTick) || !isInt(s.numerator, 1, 255) || !isInt(s.denominator, 1, 2 ** L.maxDenominatorExponent) || (s.denominator & (s.denominator - 1)) || !isInt(s.clocksPerClick, 0, 255) || !isInt(s.thirtySecondsPerQuarter, 0, 255) || !order(s.eventOrder)) throw new Error('time signature out of range.'); }
  increasing(list.timeSignatures, 'eventOrder', 'timeSignatures');
  // notes
  boundedArray(list.notes, L.maxNotes, 'notes');
  const ids = new Set(); const sec = tick => secondsAtTick(list.tempoMap, list.ppq, tick);
  list.notes.forEach((n, i) => {
    keysExactly(n, NOTE, `note ${i}`);
    if (!order(n.noteId) || ids.has(n.noteId)) throw new Error(`note ${i}: noteId must be a unique event order.`); ids.add(n.noteId);
    if (!isInt(n.track, 0, list.trackCount - 1) || !isInt(n.channel, 0, 15) || !list.tracks[n.track].channels.includes(n.channel)) throw new Error(`note ${i}: channel is not declared on its track.`);
    if (!isInt(n.pitch, 0, 127) || !isInt(n.velocity, 1, 127)) throw new Error(`note ${i}: pitch or velocity out of range.`);
    if (!isInt(n.onTick, 0, list.endTick) || !isInt(n.offTick, n.onTick, list.endTick)) throw new Error(`note ${i}: ticks out of range or off before on.`);
    if (!order(n.offEventOrder) || n.offEventOrder <= n.noteId) throw new Error(`note ${i}: offEventOrder must be a later event than the note-on.`);   // shared across notes is legitimate (retrigger, EOT)
    if (n.onSeconds !== sec(n.onTick) || n.offSeconds !== sec(n.offTick)) throw new Error(`note ${i}: seconds do not follow from ticks and the tempo map (tampered or stale).`);
    if (i && (n.onTick < list.notes[i - 1].onTick || (n.onTick === list.notes[i - 1].onTick && n.noteId <= list.notes[i - 1].noteId))) throw new Error('notes must be sorted by onTick, then noteId.');
  });
  // sustain, markers
  boundedArray(list.sustain, L.maxEvents, 'sustain');
  for (const s of list.sustain) { keysExactly(s, ['eventOrder', 'tick', 'seconds', 'track', 'channel', 'value'], 'sustain'); if (!order(s.eventOrder) || !isInt(s.tick, 0, list.endTick) || !isInt(s.value, 0, 127) || !isInt(s.track, 0, list.trackCount - 1) || !isInt(s.channel, 0, 15) || !list.tracks[s.track].channels.includes(s.channel) || s.seconds !== sec(s.tick)) throw new Error('sustain entry out of range, undeclared channel, or stale seconds.'); }
  increasing(list.sustain, 'eventOrder', 'sustain');
  boundedArray(list.markers, L.maxEvents, 'markers');
  for (const m of list.markers) { keysExactly(m, ['tick', 'seconds', 'text', 'eventOrder'], 'marker'); if (!order(m.eventOrder) || !isInt(m.tick, 0, list.endTick) || typeof m.text !== 'string' || m.text.length > L.maxTextChars || m.seconds !== sec(m.tick)) throw new Error('marker out of range or stale seconds.'); }
  increasing(list.markers, 'eventOrder', 'markers');
  if (list.durationSeconds !== sec(list.endTick)) throw new Error('durationSeconds does not follow from endTick.');
  // warnings: bounded, known kinds, a string detail, and exactly one reference that resolves
  boundedArray(list.warnings, L.maxEvents, 'warnings');
  for (const w of list.warnings) {
    if (!w || typeof w !== 'object' || Array.isArray(w)) throw new Error('warning must be an object.');
    const keys = Object.keys(w).sort().join(',');
    if (keys !== 'detail,kind,noteId' && keys !== 'detail,eventOrder,kind') throw new Error('warning must have kind, detail and exactly one of noteId / eventOrder.');
    if (!WARNING_KINDS.includes(w.kind) || typeof w.detail !== 'string' || w.detail.length > 400) throw new Error(`warning: unknown kind or unbounded detail.`);
    if ('noteId' in w ? !ids.has(w.noteId) : !order(w.eventOrder)) throw new Error('warning reference does not resolve.');
  }
  // ignored: strict keys, non-negative integers, controller/meta keys in 0..127
  keysExactly(list.ignored, IGNORED_KEYS, 'ignored');
  for (const k of IGNORED_KEYS) {
    if (k === 'controllers' || k === 'meta') {
      const map = list.ignored[k]; if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error(`ignored.${k} must be an object.`);
      for (const [num, count] of Object.entries(map)) if (!isInt(Number(num), 0, 127) || String(Number(num)) !== num || !isInt(count, 0, L.maxEvents)) throw new Error(`ignored.${k}: keys must be 0..127 with non-negative integer counts.`);
    } else if (!isInt(list.ignored[k], 0, L.maxEvents)) throw new Error(`ignored.${k} must be a non-negative integer.`);
  }
  return list;
}

/** Deterministic canonical form: sorted keys, array order kept (noteId/eventOrder order is meaningful). Validates first. */
export function canonicalNoteList(list, options) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateNoteList(list, options)));
}
