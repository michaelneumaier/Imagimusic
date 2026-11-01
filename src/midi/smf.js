// Standard MIDI File (SMF 1.0) reader: a MIDI 1.0 input adapter for proposal 010 (M4a).
// Written against the MMA "Standard MIDI Files 1.0" (RP-001, rev. Feb 1996) text; page numbers below are the
// PDF's physical pages (printed numbering is two lower). Every rule the parser enforces cites its page.
// Output is a plain, canonical NoteList: ticks are the source of truth, seconds are derived through the tempo
// map and re-derived by validateNoteList so a saved record cannot carry tampered seconds. This is NOT the
// future universal performance representation (MIDI 2.0 expression lives in its own layer); it is what a
// 1.0 file can honestly say. Nothing is transmitted; SysEx payloads are skipped by length and counted.
//
// Policies that the spec leaves to the reader are named `policy:` and surfaced as warnings in the output.

export const NOTELIST_VERSION = 1;
export const DEFAULT_LIMITS = Object.freeze({ maxBytes: 256 * 1024, maxNotes: 4096, maxEvents: 65536, maxTextChars: 120, maxDenominatorExponent: 7 });
const DEFAULT_US_PER_QUARTER = 500000;           // 120 BPM when no Set Tempo precedes (p7: "the tempo 120 beats per minute")
const META = { SEQUENCE_NUMBER: 0x00, TEXT: 0x01, COPYRIGHT: 0x02, TRACK_NAME: 0x03, INSTRUMENT: 0x04, LYRIC: 0x05, MARKER: 0x06, CUE: 0x07, CHANNEL_PREFIX: 0x20, END_OF_TRACK: 0x2F, SET_TEMPO: 0x51, SMPTE_OFFSET: 0x54, TIME_SIGNATURE: 0x58, KEY_SIGNATURE: 0x59, SEQUENCER_SPECIFIC: 0x7F };
const REQUIRED_META_LENGTH = { [META.END_OF_TRACK]: 0, [META.SET_TEMPO]: 3, [META.TIME_SIGNATURE]: 4, [META.CHANNEL_PREFIX]: 1, [META.SEQUENCE_NUMBER]: 2, [META.SMPTE_OFFSET]: 5, [META.KEY_SIGNATURE]: 2 };

class Reader {
  constructor(bytes) { this.b = bytes; this.pos = 0; }
  need(n, what) { if (this.pos + n > this.b.length) throw new Error(`Truncated file: ${what} runs past the end of the data.`); }
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
export function parseSMF(bytes, { name = '', limits = DEFAULT_LIMITS } = {}) {
  if (!(bytes instanceof Uint8Array)) throw new Error('parseSMF expects a Uint8Array.');
  const L = { ...DEFAULT_LIMITS, ...limits };
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
  const warnings = [], tracks = [], raw = [];                                 // raw: every event with absolute tick, per track
  let eventCount = 0, trackIndex = 0;
  const warn = (kind, detail, extra = {}) => warnings.push({ kind, detail, ...extra });

  while (r.pos < bytes.length) {
    const type = r.ascii4(), length = r.u32('chunk length');
    r.need(length, `chunk ${type}`);                                         // p5: length excludes the 8-byte header; past EOF is truncated
    const end = r.pos + length;
    if (type !== 'MTrk') { ignored.unknownChunks++; r.pos = end; continue; } // p5: "expect alien chunks and treat them as if they weren't there"
    if (trackIndex >= ntrks) throw new Error(`More MTrk chunks than the header's track count (${ntrks}).`);
    const track = { index: trackIndex, name: '', channels: new Set() };
    let tick = 0, status = null, ended = false, order = 0;
    const push = (ev) => { if (++eventCount > L.maxEvents) throw new Error(`More than ${L.maxEvents} events; this importer stops here.`); raw.push({ ...ev, tick, track: trackIndex, order: order++ }); };
    while (r.pos < end) {
      if (ended) throw new Error(`Track ${trackIndex}: data after the End of Track event (End of Track must be the last event, p10).`);
      tick += r.vlq('delta-time');                                            // p8: delta-times are always present
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
        else if (kind === 0xB0) { if (d1 === 64) push({ kind: 'sustain', channel, value: d2 }); else ignored.controllers[d1] = (ignored.controllers[d1] ?? 0) + 1; }
        else if (kind === 0xC0) ignored.programChange++;
        else if (kind === 0xD0) ignored.channelAftertouch++;
        else if (kind === 0xA0) ignored.polyAftertouch++;
        else if (kind === 0xE0) ignored.pitchBend++;
      } else if (first === 0xF0 || first === 0xF7) {
        status = null;                                                        // p9: sysex events cancel running status
        const len = r.vlq('sysex length'); r.skip(len, 'sysex data'); ignored.sysEx++;   // F0 complete/first packet, F7 continuation or escape (p8–9); skipped, never transmitted
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
          if (data[1] > L.maxDenominatorExponent) throw new Error(`Time signature denominator 2^${data[1]} exceeds this importer's bound of 2^${L.maxDenominatorExponent} (a product bound, not a format rule).`);
          push({ kind: 'timeSignature', numerator: data[0], denominator: 2 ** data[1], clocksPerClick: data[2], thirtySecondsPerQuarter: data[3] });
        }
        else if (metaType === META.MARKER) push({ kind: 'marker', text: latin1(data, L.maxTextChars) });
        else if (metaType === META.TRACK_NAME) { if (!track.name) track.name = latin1(data, L.maxTextChars); }
        else if (metaType === META.CHANNEL_PREFIX) ignored.channelPrefix++;
        else if (required !== undefined || (metaType >= 0x01 && metaType <= 0x0F) || metaType === META.SEQUENCER_SPECIFIC) ignored.meta[metaType] = (ignored.meta[metaType] ?? 0) + 1;
        else ignored.unknownMeta++;                                           // p9: ignore meta-events you do not recognize
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
  const close = (note, offEv, warningKind) => { note.offTick = offEv.tick; note.offEventOrder = offEv.eventOrder; if (warningKind) warn(warningKind, warningKind === 'retrigger' ? `note ${note.noteId} (pitch ${note.pitch}) closed at tick ${offEv.tick} by a new Note On of the same pitch; the original gate is lost` : `note ${note.noteId} (pitch ${note.pitch}) still held at End of Track; closed at tick ${offEv.tick}`, { noteId: note.noteId }); };
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
      close(open, ev, null); held.delete(k);
      if (open.offTick === open.onTick) warn('zeroGate', `note ${open.noteId} (pitch ${open.pitch}) has a zero-length gate at tick ${open.onTick}`, { noteId: open.noteId });
    } else if (ev.kind === 'sustain') sustain.push({ eventOrder: ev.eventOrder, tick: ev.tick, seconds: seconds(ev.tick), track: ev.track, channel: ev.channel, value: ev.value });
    else if (ev.kind === 'marker') markers.push({ tick: ev.tick, seconds: seconds(ev.tick), text: ev.text, eventOrder: ev.eventOrder });
    else if (ev.kind === 'eot') {
      for (const [k, open] of [...held]) if (open.track === ev.track) { close(open, ev, 'danglingOn'); held.delete(k); }
    }
  }
  const endTick = raw.length ? Math.max(...raw.filter(e => e.kind === 'eot').map(e => e.tick)) : 0;
  for (const n of notes) { n.onSeconds = seconds(n.onTick); n.offSeconds = seconds(n.offTick); }
  notes.sort((a, b) => a.onTick - b.onTick || a.noteId - b.noteId);
  return {
    version: NOTELIST_VERSION, name: String(name).slice(0, L.maxTextChars), format, ppq, trackCount: ntrks, endTick, durationSeconds: seconds(endTick),
    tempoMap, timeSignatures, tracks, notes, sustain, markers, warnings, ignored,
  };
}

const TOP = ['version', 'name', 'format', 'ppq', 'trackCount', 'endTick', 'durationSeconds', 'tempoMap', 'timeSignatures', 'tracks', 'notes', 'sustain', 'markers', 'warnings', 'ignored'];
const NOTE = ['noteId', 'track', 'channel', 'pitch', 'velocity', 'onTick', 'offTick', 'offEventOrder', 'onSeconds', 'offSeconds'];
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); const have = Object.keys(obj); for (const k of have) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };

/** Strict validation of a NoteList: keys, ranges, ordering, and seconds re-derived from ticks (tampering rejected). */
export function validateNoteList(list, { limits = DEFAULT_LIMITS } = {}) {
  const L = { ...DEFAULT_LIMITS, ...limits };
  keysExactly(list, TOP, 'NoteList');
  if (list.version !== NOTELIST_VERSION) throw new Error(`NoteList version must be ${NOTELIST_VERSION}.`);
  if (typeof list.name !== 'string' || list.name.length > L.maxTextChars) throw new Error('NoteList name must be a bounded string.');
  if (list.format !== 0 && list.format !== 1) throw new Error('NoteList format must be 0 or 1.');
  if (!isInt(list.ppq, 1, 0x7fff)) throw new Error('ppq must be an integer in 1..32767.');
  if (!isInt(list.trackCount, 1, 0xffff) || !Array.isArray(list.tracks) || list.tracks.length !== list.trackCount) throw new Error('tracks must match trackCount.');
  if (!isInt(list.endTick, 0, 0x0FFFFFFF * 64)) throw new Error('endTick out of range.');
  for (const [i, t] of list.tempoMap.entries()) { keysExactly(t, ['tick', 'usPerQuarter', 'eventOrder'], 'tempo entry'); if (!isInt(t.tick, 0, list.endTick) || !isInt(t.usPerQuarter, 1, 0xffffff) || !isInt(t.eventOrder, 0, L.maxEvents)) throw new Error('tempo entry out of range.'); if (i && t.tick <= list.tempoMap[i - 1].tick) throw new Error('tempoMap must be strictly increasing in tick.'); }
  for (const s of list.timeSignatures) { keysExactly(s, ['tick', 'numerator', 'denominator', 'clocksPerClick', 'thirtySecondsPerQuarter', 'eventOrder'], 'time signature'); if (!isInt(s.tick, 0, list.endTick) || !isInt(s.numerator, 0, 255) || !isInt(s.denominator, 1, 2 ** L.maxDenominatorExponent) || (s.denominator & (s.denominator - 1)) || !isInt(s.clocksPerClick, 0, 255) || !isInt(s.thirtySecondsPerQuarter, 0, 255)) throw new Error('time signature out of range.'); }
  for (const t of list.tracks) { keysExactly(t, ['index', 'name', 'channels'], 'track'); if (!isInt(t.index, 0, list.trackCount - 1) || typeof t.name !== 'string' || t.name.length > L.maxTextChars || !Array.isArray(t.channels) || t.channels.some(c => !isInt(c, 0, 15))) throw new Error('track out of range.'); }
  if (!Array.isArray(list.notes) || list.notes.length > L.maxNotes) throw new Error(`notes must be an array of at most ${L.maxNotes}.`);
  const ids = new Set(); const sec = tick => secondsAtTick(list.tempoMap, list.ppq, tick);
  list.notes.forEach((n, i) => {
    keysExactly(n, NOTE, `note ${i}`);
    if (!isInt(n.noteId, 0, L.maxEvents) || ids.has(n.noteId)) throw new Error(`note ${i}: noteId must be a unique event order.`); ids.add(n.noteId);
    if (!isInt(n.track, 0, list.trackCount - 1) || !isInt(n.channel, 0, 15) || !isInt(n.pitch, 0, 127) || !isInt(n.velocity, 1, 127)) throw new Error(`note ${i}: address or velocity out of range.`);
    if (!isInt(n.onTick, 0, list.endTick) || !isInt(n.offTick, n.onTick, list.endTick) || !isInt(n.offEventOrder, 0, L.maxEvents)) throw new Error(`note ${i}: ticks out of range or off before on.`);
    if (n.onSeconds !== sec(n.onTick) || n.offSeconds !== sec(n.offTick)) throw new Error(`note ${i}: seconds do not follow from ticks and the tempo map (tampered or stale).`);
    if (i && (n.onTick < list.notes[i - 1].onTick || (n.onTick === list.notes[i - 1].onTick && n.noteId < list.notes[i - 1].noteId))) throw new Error('notes must be sorted by onTick, then noteId.');
  });
  for (const s of list.sustain) { keysExactly(s, ['eventOrder', 'tick', 'seconds', 'track', 'channel', 'value'], 'sustain'); if (!isInt(s.tick, 0, list.endTick) || !isInt(s.value, 0, 127) || !isInt(s.channel, 0, 15) || !isInt(s.track, 0, list.trackCount - 1) || s.seconds !== sec(s.tick)) throw new Error('sustain entry out of range or stale seconds.'); }
  for (const m of list.markers) { keysExactly(m, ['tick', 'seconds', 'text', 'eventOrder'], 'marker'); if (!isInt(m.tick, 0, list.endTick) || typeof m.text !== 'string' || m.text.length > L.maxTextChars || m.seconds !== sec(m.tick)) throw new Error('marker out of range or stale seconds.'); }
  if (list.durationSeconds !== sec(list.endTick)) throw new Error('durationSeconds does not follow from endTick.');
  if (!Array.isArray(list.warnings) || !list.ignored || typeof list.ignored !== 'object') throw new Error('warnings and ignored are required.');
  return list;
}

/** Deterministic canonical form: sorted keys, array order kept (noteId/eventOrder order is meaningful). */
export function canonicalNoteList(list) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateNoteList(list)));
}
