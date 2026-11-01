// Expressive bodies (proposal 011 rev. 2, 011b): a MIDI 2.0 expression event model and ONE analytic evaluator for
// sound, picture, seeking and export. Written against M2-104-UM v1.1.2 §§7.4.1–7.4.15, 7.4.7.1, Appendices A–D.
// Raw native integers stay in the events and in each voice's `raw` record; unit conversion happens only through
// src/midi2/values.js at the instrument boundary. Nothing here claims MIDI 2.0 transport support; this is a symbolic
// score (fixture-authored or, later, decoded from a MIDI Clip file) evaluated at a time t.
//
// Receiver policies that the specification leaves open are named `policy:` and documented in proposal 011.

import { BEND_CENTER, UINT16_MAX, UINT32_MAX, velocity16ToUnit, controller32ToUnit, pitch725ToHcu, pitch79ToHcu, channelBendSensitivityToHcu, sustain32IsOn, hcuToHz } from './values.js';

export const EXPRESSION_VERSION = 1;
export const EVENT_TYPES = Object.freeze(['noteOn', 'noteOff', 'polyPressure', 'perNoteController', 'perNoteManagement', 'perNotePitchBend', 'pitchBend', 'controlChange', 'registeredController', 'other']);
export const DEFAULT_BOUNDS = Object.freeze({ maxVoices: 64, maxEvents: 4096 });
export const DEFAULT_SENSITIVITY_Q7_25 = 2 * 2 ** 25;          // policy: ±2 HCU before any RC #00/07 arrives (MIDI 1.0's customary default range)
export const DEFAULT_CHANNEL_SENSITIVITY_RC00 = 2 * 2 ** 25;   // RC #00/00 raw: top 7 bits HCU = 2, cents 0 (§7.4.7.1)
export const PER_NOTE_PITCH = 3, PER_NOTE_TIMBRE = 71, PER_NOTE_BRIGHTNESS = 74;   // Appendix A
export const ATTRIBUTE_NONE = 0, ATTRIBUTE_PITCH_7_9 = 3;                           // §7.4.14
const SUSTAIN = 64, SUPPORTED_RC = new Set(['0/0', '0/7']);

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };
const EVENT_FIELDS = {
  noteOn: ['noteNumber', 'velocity16', 'attributeType8', 'attributeData16'], noteOff: ['noteNumber', 'velocity16', 'attributeType8', 'attributeData16'],
  polyPressure: ['noteNumber', 'data32'], perNoteController: ['noteNumber', 'index8', 'data32'], perNoteManagement: ['noteNumber', 'flags'],
  perNotePitchBend: ['noteNumber', 'data32'], pitchBend: ['data32'], controlChange: ['index8', 'data32'], registeredController: ['bank8', 'index8', 'data32'], other: ['kind'],
};

/** Strict validation of an ExpressionScore. Returns it. */
export function validateExpressionScore(score) {
  keysExactly(score, ['version', 'protocol', 'source', 'events', 'bounds', 'mapping'], 'ExpressionScore');
  if (score.version !== EXPRESSION_VERSION) throw new Error(`ExpressionScore version must be ${EXPRESSION_VERSION}.`);
  if (score.protocol !== 'midi2') throw new Error('protocol must be "midi2".');
  keysExactly(score.source, ['kind', 'name'], 'source');
  if (!['fixture', 'clip'].includes(score.source.kind) || typeof score.source.name !== 'string' || score.source.name.length > 120) throw new Error('source must be a fixture or clip with a bounded name.');
  keysExactly(score.bounds, ['maxVoices', 'maxEvents'], 'bounds');
  if (!isInt(score.bounds.maxVoices, 1, 1024) || !isInt(score.bounds.maxEvents, 1, 65536)) throw new Error('bounds out of range.');
  keysExactly(score.mapping, ['version', 'instrument', 'smoothingSeconds', 'neutral'], 'mapping');
  if (score.mapping.version !== 1 || score.mapping.instrument !== 'bellows') throw new Error('mapping must be version 1 for the bellows instrument.');
  if (!(typeof score.mapping.smoothingSeconds === 'number' && score.mapping.smoothingSeconds > 0 && score.mapping.smoothingSeconds <= 0.1)) throw new Error('smoothingSeconds must be within (0, 0.1].');
  keysExactly(score.mapping.neutral, ['brightness32', 'timbre32'], 'neutral');
  if (!isInt(score.mapping.neutral.brightness32, 0, UINT32_MAX) || !isInt(score.mapping.neutral.timbre32, 0, UINT32_MAX)) throw new Error('neutral values must be unsigned 32-bit integers.');
  if (!Array.isArray(score.events) || score.events.length > score.bounds.maxEvents) throw new Error(`events must be an array of at most ${score.bounds.maxEvents}.`);
  let voices = 0;
  score.events.forEach((e, i) => {
    if (!e || typeof e !== 'object' || !EVENT_TYPES.includes(e.type)) throw new Error(`event ${i}: unknown type.`);
    keysExactly(e, ['order', 'time', 'group', 'channel', 'type', ...EVENT_FIELDS[e.type]], `event ${i}`);
    if (e.order !== i) throw new Error(`event ${i}: order must equal its position.`);
    if (!(typeof e.time === 'number' && Number.isFinite(e.time) && e.time >= 0) || (i && e.time < score.events[i - 1].time)) throw new Error(`event ${i}: time must be finite, non-negative and non-decreasing.`);
    if (!isInt(e.group, 0, 15) || !isInt(e.channel, 0, 15)) throw new Error(`event ${i}: group and channel must be 0..15.`);
    if ('noteNumber' in e && !isInt(e.noteNumber, 0, 127)) throw new Error(`event ${i}: noteNumber must be 0..127.`);
    if ('velocity16' in e && !isInt(e.velocity16, 0, UINT16_MAX)) throw new Error(`event ${i}: velocity16 must be 0..65535.`);
    if ('attributeType8' in e && (!isInt(e.attributeType8, 0, 255) || !isInt(e.attributeData16, 0, UINT16_MAX))) throw new Error(`event ${i}: attribute type 0..255 and data 0..65535.`);
    if ('index8' in e && !isInt(e.index8, 0, 255)) throw new Error(`event ${i}: index8 must be 0..255.`);
    if ('bank8' in e && !isInt(e.bank8, 0, 255)) throw new Error(`event ${i}: bank8 must be 0..255.`);
    if ('data32' in e && !isInt(e.data32, 0, UINT32_MAX)) throw new Error(`event ${i}: data32 must be an unsigned 32-bit integer.`);
    if ('flags' in e) { keysExactly(e.flags, ['detach', 'reset'], `event ${i} flags`); if (typeof e.flags.detach !== 'boolean' || typeof e.flags.reset !== 'boolean') throw new Error(`event ${i}: flags must be booleans.`); }
    if ('kind' in e && (typeof e.kind !== 'string' || e.kind.length > 40)) throw new Error(`event ${i}: kind must be a short string.`);
    if (e.type === 'noteOn' && ++voices > score.bounds.maxVoices) throw new Error(`more than ${score.bounds.maxVoices} voices (Note Ons) in the score.`);
  });
  return score;
}

/** Deterministic canonical form (sorted keys, array order kept). Validates first. */
export function canonicalExpressionScore(score) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateExpressionScore(score)));
}

// ---- analytic first-order smoothing: a value that approaches its target from the last event, evaluable at any t ----
const smooth = (initial, t0) => ({ v0: initial, target: initial, t0 });
const smoothAt = (s, t, tau) => s.target + (s.v0 - s.target) * Math.exp(-Math.max(0, t - s.t0) / tau);
const retarget = (s, t, tau, target) => { s.v0 = smoothAt(s, t, tau); s.target = target; s.t0 = t; };
const half = (value) => (value - BEND_CENTER) / (value < BEND_CENTER ? BEND_CENTER : UINT32_MAX - BEND_CENTER);   // −1..+1, exact center

/** Evaluate the score at time t. Pure; analytic in t; released voices stay until the instrument retires them. */
export function evaluateExpression(score, t) {
  validateExpressionScore(score);
  if (!(typeof t === 'number' && Number.isFinite(t))) throw new Error('t must be a finite number.');
  const tau = score.mapping.smoothingSeconds, neutral = score.mapping.neutral;
  const channels = new Map(), perNote = new Map(), voices = [];
  const reported = { unsupported: new Map(), partial: new Map() };
  const count = (map, key, extra) => { const cur = map.get(key) ?? { count: 0, ...extra }; cur.count++; map.set(key, cur); };
  const chan = e => { const k = `${e.group}:${e.channel}`; if (!channels.has(k)) channels.set(k, { bend: smooth(0, 0), bendRaw: BEND_CENTER, sensitivityHcu: channelBendSensitivityToHcu(DEFAULT_CHANNEL_SENSITIVITY_RC00), perNoteSensitivityRaw: DEFAULT_SENSITIVITY_Q7_25, sustainOn: false, pendingOff: [] }); return channels.get(k); };
  const note = e => { const k = `${e.group}:${e.channel}:${e.noteNumber}`; if (!perNote.has(k)) perNote.set(k, { pitch725: null, pressure: smooth(0, 0), brightness: smooth(controller32ToUnit(neutral.brightness32), 0), timbre: smooth(controller32ToUnit(neutral.timbre32), 0), bendUnit: smooth(0, 0), raw: { pressure32: 0, brightness32: neutral.brightness32, timbre32: neutral.timbre32, perNotePitchBend32: BEND_CENTER, pitch725: null }, attached: new Set() }); return perNote.get(k); };
  const resetNote = (n, time) => { n.pitch725 = null; retarget(n.pressure, time, tau, 0); retarget(n.brightness, time, tau, controller32ToUnit(neutral.brightness32)); retarget(n.timbre, time, tau, controller32ToUnit(neutral.timbre32)); retarget(n.bendUnit, time, tau, 0); n.raw = { pressure32: 0, brightness32: neutral.brightness32, timbre32: neutral.timbre32, perNotePitchBend32: BEND_CENTER, pitch725: null }; };

  for (const e of score.events) {
    if (e.time > t) break;
    const time = e.time;
    if (e.type === 'noteOn') {
      const c = chan(e), n = note(e);
      const v = { voiceId: voices.length, address: { group: e.group, channel: e.channel, noteNumber: e.noteNumber }, noteOn: time, velocity16: e.velocity16, attributeType8: e.attributeType8, attributeData16: e.attributeData16,
        effectiveNoteOff: null, offRequested: null, detached: false, frozen: null, sensitivityRaw: c.perNoteSensitivityRaw, state: n, channelState: c };
      if (e.attributeType8 === 1 || e.attributeType8 === 2) count(reported.partial, `attributeType${e.attributeType8}`, { missing: 'attribute data not interpreted (manufacturer/profile specific)' });
      else if (e.attributeType8 > ATTRIBUTE_PITCH_7_9) count(reported.unsupported, `attributeType${e.attributeType8}`, { reason: 'reserved attribute type (§7.4.14)' });
      n.attached.add(v); voices.push(v);
    } else if (e.type === 'noteOff') {
      const c = chan(e), n = note(e);
      const v = [...n.attached].concat(voices.filter(x => x.state === n && !n.attached.has(x))).filter(x => x.offRequested === null && x.address.group === e.group && x.address.channel === e.channel).sort((a, b) => a.voiceId - b.voiceId)[0];   // oldest open voice on the address
      if (v) { v.offRequested = time; if (c.sustainOn) c.pendingOff.push(v); else v.effectiveNoteOff = time; }
    } else if (e.type === 'polyPressure') { const n = note(e); retarget(n.pressure, time, tau, controller32ToUnit(e.data32)); n.raw.pressure32 = e.data32; }
    else if (e.type === 'perNoteController') {
      const n = note(e);
      if (e.index8 === PER_NOTE_PITCH) { n.pitch725 = e.data32; n.raw.pitch725 = e.data32; }                  // stepped by choice (§7.4.15.2)
      else if (e.index8 === PER_NOTE_BRIGHTNESS) { retarget(n.brightness, time, tau, controller32ToUnit(e.data32)); n.raw.brightness32 = e.data32; }
      else if (e.index8 === PER_NOTE_TIMBRE) { retarget(n.timbre, time, tau, controller32ToUnit(e.data32)); n.raw.timbre32 = e.data32; }
      else count(reported.partial, `perNoteController${e.index8}`, { missing: 'recognized per-note controller with no instrument mapping (Appendix A)' });
    } else if (e.type === 'perNoteManagement') {
      const n = note(e);
      if (!e.flags.detach && !e.flags.reset) { count(reported.unsupported, 'perNoteManagementNoFlags', { reason: 'D = S = 0 has no defined function (§7.4.5)' }); continue; }
      if (e.flags.detach) {   // policy: freeze the EVALUATED per-note values (in-flight ramp included); raw keeps the last message
        for (const v of n.attached) { v.detached = true; v.frozen = { pressure: smoothAt(n.pressure, time, tau), brightness: smoothAt(n.brightness, time, tau), timbre: smoothAt(n.timbre, time, tau), bendUnit: smoothAt(n.bendUnit, time, tau), pitch725: n.pitch725, raw: { ...n.raw } }; }
        n.attached.clear();
      }
      if (e.flags.reset) resetNote(n, time);   // S: the address's state resets; voices still attached follow it (§7.4.5)
    } else if (e.type === 'perNotePitchBend') { const n = note(e); retarget(n.bendUnit, time, tau, half(e.data32)); n.raw.perNotePitchBend32 = e.data32; }   // unit −1..1; each voice applies its own latched sensitivity
    else if (e.type === 'pitchBend') { const c = chan(e); retarget(c.bend, time, tau, half(e.data32) * c.sensitivityHcu); c.bendRaw = e.data32; }
    else if (e.type === 'controlChange') {
      const c = chan(e);
      if (e.index8 === SUSTAIN) {
        const on = sustain32IsOn(e.data32);
        if (c.sustainOn && !on) { for (const v of c.pendingOff) v.effectiveNoteOff = time; c.pendingOff = []; }
        c.sustainOn = on;
      } else if (e.index8 === 121) count(reported.partial, 'controlChange121', { missing: 'Reset All Controllers not implemented; per-note state is left alone as Appendix B.2 requires' });
      else if ([0, 6, 32, 38, 98, 99, 100, 101].includes(e.index8)) count(reported.unsupported, `controlChange${e.index8}`, { reason: 'ignored in the MIDI 2.0 Protocol (§7.4.6 recommendations)' });
      else count(reported.unsupported, `controlChange${e.index8}`, { reason: 'controller not mapped' });
    } else if (e.type === 'registeredController') {
      const c = chan(e), key = `${e.bank8}/${e.index8}`;
      if (key === '0/7') c.perNoteSensitivityRaw = e.data32;                                   // latched by subsequent Note Ons (§7.4.13.1)
      else if (key === '0/0') { try { c.sensitivityHcu = channelBendSensitivityToHcu(e.data32); } catch { count(reported.unsupported, 'registeredController0/0', { reason: 'cents field outside 0..99' }); } }
      else count(reported.unsupported, `registeredController${key}`, { reason: 'registered controller not supported' });
    } else count(reported.unsupported, e.kind, { reason: 'message outside the supported subset' });
  }

  const out = voices.map(v => {
    const n = v.state, c = v.channelState, f = v.frozen;
    const pressure = f ? f.pressure : smoothAt(n.pressure, t, tau), brightness = f ? f.brightness : smoothAt(n.brightness, t, tau), timbre = f ? f.timbre : smoothAt(n.timbre, t, tau);
    const perNoteBendHcu = (f ? f.bendUnit : smoothAt(n.bendUnit, t, tau)) * pitch725ToHcu(v.sensitivityRaw), pitch725 = f ? f.pitch725 : n.pitch725;   // same scaling as values.perNoteBendToHcu
    const base = v.attributeType8 === ATTRIBUTE_PITCH_7_9 ? pitch79ToHcu(v.attributeData16) : pitch725 !== null ? pitch725ToHcu(pitch725) : v.address.noteNumber;
    const pitchHcu = base + perNoteBendHcu + smoothAt(c.bend, t, tau);                            // channel bend acts on detached voices too
    const gate = v.effectiveNoteOff !== null && t >= v.effectiveNoteOff ? 'released' : 'held';
    return { voiceId: v.voiceId, address: v.address, noteOn: v.noteOn, velocity01: velocity16ToUnit(v.velocity16), effectiveNoteOff: v.effectiveNoteOff, gate, detached: v.detached,
      sensitivityHcu: pitch725ToHcu(v.sensitivityRaw), pitchHcu, hz: hcuToHz(Math.min(127.999, Math.max(0, pitchHcu))), pressure01: pressure, brightness01: brightness, timbre01: timbre,
      raw: { velocity16: v.velocity16, attributeType8: v.attributeType8, attributeData16: v.attributeData16, sensitivityQ7_25: v.sensitivityRaw, channelPitchBend32: c.bendRaw, ...(f ? f.raw : n.raw) } };
  });
  return { t, voices: out, reported: { unsupported: [...reported.unsupported].map(([type, r]) => ({ type, ...r })), partial: [...reported.partial].map(([type, r]) => ({ type, ...r })) } };
}

// ---- fixture: the expressive chord (proposal 011 rev. 2) ----
const U = x => Math.round(x * UINT32_MAX);
/** scene: 'detachReset' (D+S then a new 64 starts at defaults), 'detachOnly' (new 64 inherits), 'resetOnly' (attached 64 follows the reset). */
export function composeExpressiveChord({ scene = 'detachReset', smoothingSeconds = 0.005 } = {}) {
  if (!['detachReset', 'detachOnly', 'resetOnly'].includes(scene)) throw new Error('unknown fixture scene.');
  const neutral = { brightness32: U(0.5), timbre32: U(0.5) };
  const ev = [], add = (time, type, fields) => ev.push({ order: ev.length, time, group: 0, channel: 0, type, ...fields });
  const on = (time, noteNumber, velocity16 = 0x9000) => add(time, 'noteOn', { noteNumber, velocity16, attributeType8: ATTRIBUTE_NONE, attributeData16: 0 });
  add(0, 'registeredController', { bank8: 0, index8: 7, data32: DEFAULT_SENSITIVITY_Q7_25 });              // ±2 HCU per-note range
  on(0.5, 60); on(0.5, 64); on(0.5, 67);
  for (let i = 1; i <= 8; i++) add(0.5 + i * 0.25, 'perNotePitchBend', { noteNumber: 60, data32: Math.round(BEND_CENTER + (UINT32_MAX - BEND_CENTER) * Math.sin(i / 8 * Math.PI)) });   // A: up to +2 HCU and back
  for (let i = 1; i <= 4; i++) add(0.5 + i * 0.5, 'polyPressure', { noteNumber: 64, data32: Math.round(0xC0000000 * i / 4) });                                               // B: pressure rises
  for (let i = 1; i <= 4; i++) add(0.5 + i * 0.5, 'perNoteController', { noteNumber: 67, index8: PER_NOTE_BRIGHTNESS, data32: Math.round(neutral.brightness32 + (0xF0000000 - neutral.brightness32) * i / 4) });   // C: brightens
  add(2.6, 'perNoteController', { noteNumber: 60, index8: PER_NOTE_BRIGHTNESS, data32: 0x40000000 });     // the control pair: adjacent 32-bit values
  add(2.6, 'perNoteController', { noteNumber: 67, index8: PER_NOTE_BRIGHTNESS, data32: 0x40000001 });     // (both would collapse to 7-bit 32)
  if (scene === 'detachReset') add(3.0, 'perNoteManagement', { noteNumber: 64, flags: { detach: true, reset: true } });
  if (scene === 'detachOnly') add(3.0, 'perNoteManagement', { noteNumber: 64, flags: { detach: true, reset: false } });
  if (scene === 'resetOnly') add(3.0, 'perNoteManagement', { noteNumber: 64, flags: { detach: false, reset: true } });
  if (scene !== 'resetOnly') on(3.0, 64, 0x7000);                                                           // B′: a fourth voice while B is still sounding
  add(3.5, 'pitchBend', { data32: Math.round(BEND_CENTER + (UINT32_MAX - BEND_CENTER) * 0.5) });            // channel bend reaches detached B too
  add(4.0, 'noteOff', { noteNumber: 60, velocity16: 0, attributeType8: 0, attributeData16: 0 });
  add(4.0, 'noteOff', { noteNumber: 67, velocity16: 0, attributeType8: 0, attributeData16: 0 });
  add(4.0, 'noteOff', { noteNumber: 64, velocity16: 0, attributeType8: 0, attributeData16: 0 });
  if (scene !== 'resetOnly') add(4.5, 'noteOff', { noteNumber: 64, velocity16: 0, attributeType8: 0, attributeData16: 0 });
  const events = ev.map((e, i) => ({ ...e, i })).sort((a, b) => a.time - b.time || a.i - b.i).map(({ i, ...e }, order) => ({ ...e, order }));
  return validateExpressionScore({ version: EXPRESSION_VERSION, protocol: 'midi2', source: { kind: 'fixture', name: `expressive-chord:${scene}` }, events, bounds: { maxVoices: 4, maxEvents: 64 }, mapping: { version: 1, instrument: 'bellows', smoothingSeconds, neutral } });
}
