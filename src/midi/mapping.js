// MIDI import mapping (proposal 010 rev. 3, M4b): a validated NoteList plus a MappingPlan become the authored
// recipe { events, loomScore, fmTime, holdUntil } that createAuthoredPerformance already accepts, together with a
// MappingReport that accounts for EVERY input note in exactly one row and lists every policy decision as a
// warning. No family receives a pitch it cannot play; "nearest slot" is never a default; nothing is dropped or
// clipped silently. The report is derived from the ACTUAL compiled result (chamber stealing from the compiler,
// unplanned strikes from the real planner, the real tine fundamental for the given patch and sample rate).

import { validateNoteList, DEFAULT_LIMITS } from './smf.js';
import { NOTES, TINE_INDEX, frequency, modesForVoice, validatePatch } from '../model.js';
import { createPerformanceFromEvents } from '../stage/performance.js';
import { planPerformers } from '../perform/planner.js';

export const PLAN_VERSION = 1, IMPORTED_SCORE_VERSION = 1;
export const COMPILER_MAX_SECONDS = 120, MAX_SCHEDULED_ONSETS = 256, DEFAULT_TAIL_SECONDS = 4;
export const FAMILIES = Object.freeze(['garden', 'tine', 'bellows', 'loom', 'fm', 'none']);
export const VELOCITY_CURVES = Object.freeze({ linear: v => v, quiet: v => 0.7 * v, lift: v => v ** 0.7 });   // named by effect
export const REPORT_CLASSES = Object.freeze(['exact', 'mapped', 'timingOnly', 'dropped', 'unassigned', 'excluded']);

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const finiteIn = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };
const ASSIGNMENT_KEYS = { garden: ['gardenUnplayable'], tine: [], bellows: ['sustainPedal'], loom: ['loomBody'], fm: [], none: [] };

/** The assignment that governs a note: a specific (track, channel) entry wins over the track's 'all' entry. */
function assignmentFor(plan, note) {
  return plan.assignments.find(a => a.track === note.track && a.channel === note.channel) ?? plan.assignments.find(a => a.track === note.track && a.channel === 'all') ?? null;
}
const inWindow = (plan, note) => note.onSeconds >= plan.window.startSeconds && note.onSeconds < plan.window.endSeconds;

/** Strict plan validation against the NoteList it will map. */
export function validateMappingPlan(plan, noteList) {
  keysExactly(plan, ['version', 'window', 'lead', 'tailSeconds', 'velocityCurve', 'assignments'], 'MappingPlan');
  if (plan.version !== PLAN_VERSION) throw new Error(`MappingPlan version must be ${PLAN_VERSION}.`);
  keysExactly(plan.window, ['startSeconds', 'endSeconds'], 'window');
  const { startSeconds: start, endSeconds: end } = plan.window;
  if (!finiteIn(start, 0, noteList.durationSeconds) || !finiteIn(end, 0, noteList.durationSeconds) || end <= start) throw new Error('window must satisfy 0 ≤ startSeconds < endSeconds ≤ the file duration.');
  if (!finiteIn(plan.lead, 0, 5)) throw new Error('lead must be within 0..5 seconds.');
  if (!finiteIn(plan.tailSeconds, 0, 30)) throw new Error('tailSeconds must be within 0..30 seconds.');
  if (plan.lead + (end - start) > COMPILER_MAX_SECONDS) throw new Error(`lead + window duration is ${(plan.lead + end - start).toFixed(3)} s; the compiler's endpoint cap is ${COMPILER_MAX_SECONDS} s. Narrow the window.`);
  if (!(plan.velocityCurve in VELOCITY_CURVES)) throw new Error(`velocityCurve must be one of ${Object.keys(VELOCITY_CURVES).join(', ')}.`);
  if (!Array.isArray(plan.assignments) || plan.assignments.length > noteList.trackCount * 17) throw new Error('assignments must be a bounded array.');
  const seen = new Set(), allTracks = new Set();
  plan.assignments.forEach((a, i) => {
    if (!a || typeof a !== 'object' || !FAMILIES.includes(a.family)) throw new Error(`assignment ${i}: family must be one of ${FAMILIES.join(', ')}.`);
    keysExactly(a, ['track', 'channel', 'family', ...ASSIGNMENT_KEYS[a.family]], `assignment ${i}`);
    if (!isInt(a.track, 0, noteList.trackCount - 1)) throw new Error(`assignment ${i}: track out of range.`);
    if (a.channel !== 'all' && !isInt(a.channel, 0, 15)) throw new Error(`assignment ${i}: channel must be 0..15 or 'all'.`);
    const key = `${a.track}:${a.channel}`;
    if (seen.has(key)) throw new Error(`assignment ${i}: (track ${a.track}, channel ${a.channel}) is assigned twice.`);
    seen.add(key); if (a.channel === 'all') allTracks.add(a.track);
    if (a.family === 'garden' && !['drop', 'nearest'].includes(a.gardenUnplayable)) throw new Error(`assignment ${i}: gardenUnplayable must be 'drop' or 'nearest' (an explicit choice; nearest is never a default).`);
    if (a.family === 'bellows' && typeof a.sustainPedal !== 'boolean') throw new Error(`assignment ${i}: sustainPedal must be a boolean.`);
    if (a.family === 'loom') {
      const b = a.loomBody; if (!b || typeof b !== 'object') throw new Error(`assignment ${i}: loomBody rule required.`);
      if (b.rule === 'parity') keysExactly(b, ['rule'], `assignment ${i} loomBody`);
      else if (b.rule === 'pitches') { keysExactly(b, ['rule', 'body0', 'body1'], `assignment ${i} loomBody`); if (!isInt(b.body0, 0, 127) || !isInt(b.body1, 0, 127) || b.body0 === b.body1) throw new Error(`assignment ${i}: loomBody pitches must be two distinct notes.`); }
      else throw new Error(`assignment ${i}: loomBody.rule must be 'parity' or 'pitches'.`);
    }
  });
  for (const a of plan.assignments) if (a.channel !== 'all' && allTracks.has(a.track)) throw new Error(`track ${a.track} has an 'all' assignment and a per-channel assignment; choose one.`);
  return plan;
}

function validateImported(imported) {
  keysExactly(imported, ['version', 'source', 'notes', 'plan'], 'ImportedScore');
  if (imported.version !== IMPORTED_SCORE_VERSION) throw new Error(`ImportedScore version must be ${IMPORTED_SCORE_VERSION}.`);
  keysExactly(imported.source, ['name', 'bytes', 'sha256'], 'source');
  if (typeof imported.source.name !== 'string' || imported.source.name.length > DEFAULT_LIMITS.maxTextChars) throw new Error('source.name must be a bounded string.');
  if (!isInt(imported.source.bytes, 0, DEFAULT_LIMITS.maxBytes)) throw new Error('source.bytes out of range.');
  if (!/^[0-9a-f]{64}$/.test(imported.source.sha256)) throw new Error('source.sha256 must be 64 lowercase hex characters (recorded at import; not re-verified on reload).');
  validateNoteList(imported.notes); validateMappingPlan(imported.plan, imported.notes);
  return imported;
}

/** Deterministic canonical form (sorted keys, array order kept). Validates first. */
export function canonicalImportedScore(imported) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateImported(imported)));
}

/** Map and compile. Returns { recipe, report }; throws only for invalid inputs or a passage over the onset bound. */
export function compileImportedScore(imported, patch, sampleRate = 48000) {
  validateImported(imported);
  const saved = validatePatch(patch);
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('Sample rate must be positive.');
  const { notes: list, plan } = imported, { startSeconds: start, endSeconds: end } = plan.window, lead = plan.lead;
  const windowEnd = lead + (end - start), curve = VELOCITY_CURVES[plan.velocityCurve];
  const rows = [], warnings = [], events = [], loomScore = []; let fmTime = null;
  const warn = (kind, detail, ref = {}) => warnings.push({ kind, detail, ...ref });
  const row = (note, family, cls, extra) => rows.push({ noteId: note.noteId, track: note.track, channel: note.channel, pitch: note.pitch, family, class: cls, from: { pitch: note.pitch, hz: frequency(note.pitch) }, to: null, cents: null, reason: null, ...extra });
  const gateIgnored = { garden: 0, tine: 0 };
  // Pedal state helpers (track-local, by channel): the last CC64 strictly before an event order, and the next release after it.
  const pedalsFor = note => list.sustain.filter(s => s.track === note.track && s.channel === note.channel);
  const pedalDownBefore = (note, eventOrder) => { let state = false; for (const s of pedalsFor(note)) { if (s.eventOrder >= eventOrder) break; state = s.value >= 64; } return state; };
  const nextReleaseAfter = (note, eventOrder) => pedalsFor(note).find(s => s.eventOrder > eventOrder && s.value <= 63) ?? null;
  let tineHzCache = null; const tineHz = () => tineHzCache ??= modesForVoice(TINE_INDEX, saved, sampleRate)[0].frequency;   // the real fundamental for this patch and rate
  let pedalAtStartWarned = false;

  for (const note of list.notes) {
    const a = assignmentFor(plan, note);
    if (!a) { row(note, null, 'unassigned', { reason: 'noAssignment' }); continue; }
    if (a.family === 'none') { row(note, 'none', 'dropped', { reason: 'assignedNone' }); continue; }
    if (!inWindow(plan, note)) {
      const reason = note.onSeconds >= end ? 'afterWindow' : note.offSeconds > start ? 'activeAtStart' : 'beforeWindow';
      row(note, a.family, 'excluded', { reason }); continue;
    }
    const time = lead + (note.onSeconds - start), velocity = Math.min(1, Math.max(1 / 127, curve(note.velocity / 127)));
    if (a.family === 'garden') {
      gateIgnored.garden++;
      let slot = NOTES.indexOf(note.pitch);
      if (slot >= 0) row(note, 'garden', 'exact', { to: { slot, hz: frequency(NOTES[slot]) }, cents: 0 });
      else if (a.gardenUnplayable === 'drop') { row(note, 'garden', 'dropped', { reason: 'offSlotTable' }); continue; }
      else { slot = NOTES.reduce((best, p, i) => Math.abs(p - note.pitch) < Math.abs(NOTES[best] - note.pitch) ? i : best, 0); row(note, 'garden', 'mapped', { to: { slot, hz: frequency(NOTES[slot]) }, cents: (NOTES[slot] - note.pitch) * 100, reason: 'nearestSlot' }); }
      events.push({ id: `midi:${note.noteId}`, family: 'garden', time, velocity, slot });
    } else if (a.family === 'tine') {
      gateIgnored.tine++;
      row(note, 'tine', 'timingOnly', { to: { hz: tineHz(), note: 'tine fundamental' }, cents: Math.round(1200 * Math.log2(tineHz() / frequency(note.pitch))) });
      events.push({ id: `midi:${note.noteId}`, family: 'tine', time, velocity });
    } else if (a.family === 'bellows') {
      let gateEnd = note.offSeconds, reason = null;
      if (a.sustainPedal) {
        if (!pedalAtStartWarned && pedalDownBefore(note, Infinity) !== undefined && pedalsFor(note).some(s => s.seconds <= start) && pedalsFor(note).filter(s => s.seconds <= start).at(-1).value >= 64) { warn('pedalHeldAtStart', `sustain pedal is down at the window start on track ${note.track} channel ${note.channel}`, { eventOrder: pedalsFor(note).filter(s => s.seconds <= start).at(-1).eventOrder }); pedalAtStartWarned = true; }
        if (pedalDownBefore(note, note.offEventOrder)) {
          const release = nextReleaseAfter(note, note.offEventOrder);
          if (release) gateEnd = Math.max(gateEnd, release.seconds);
          else { gateEnd = Math.max(gateEnd, end); warn('pedalNeverReleased', `note ${note.noteId}: pedal down at its note-off and never released; gate held to the window end`, { noteId: note.noteId }); }
        }
      }
      if (gateEnd > end) { gateEnd = end; warn('gateClipped', `note ${note.noteId}: gate crossed the window end and was clipped to ${end} s`, { noteId: note.noteId }); }
      let noteOff = lead + (gateEnd - start);
      if (noteOff <= time) {
        if (time + 1 / sampleRate <= windowEnd) { noteOff = time + 1 / sampleRate; warn('zeroGateOneSample', `note ${note.noteId}: zero-length gate compiled as one sample at ${sampleRate} Hz`, { noteId: note.noteId }); }
        else { row(note, 'bellows', 'dropped', { reason: 'noRepresentableGate' }); continue; }
      }
      row(note, 'bellows', 'exact', { to: { hz: frequency(note.pitch), gateSeconds: noteOff - time }, cents: 0 });
      events.push({ id: `midi:${note.noteId}`, family: 'bellows', time, velocity, noteHz: frequency(note.pitch), noteOff });
    } else if (a.family === 'loom') {
      const b = a.loomBody; let body;
      if (b.rule === 'parity') body = note.pitch % 2;
      else if (note.pitch === b.body0) body = 0; else if (note.pitch === b.body1) body = 1;
      else { row(note, 'loom', 'dropped', { reason: 'notALoomPitch' }); continue; }
      row(note, 'loom', 'timingOnly', { to: { body } });
      loomScore.push({ time, body, velocity });
    } else if (a.family === 'fm') {
      if (fmTime === null) { fmTime = time; row(note, 'fm', 'timingOnly', { to: { note: 'fm entrance' } }); }
      else row(note, 'fm', 'dropped', { reason: 'fmSingleEntrance' });
    }
  }
  if (gateIgnored.garden) warn('gateIgnored', `${gateIgnored.garden} garden note-offs ignored: resonators ring and dampers are not schedulable`, { eventOrder: 0 });
  if (gateIgnored.tine) warn('gateIgnored', `${gateIgnored.tine} tine note-offs ignored: the tine rings`, { eventOrder: 0 });
  const ignoredKinds = Object.entries(list.ignored).filter(([k, v]) => (typeof v === 'number' ? v > 0 : Object.keys(v).length > 0)).map(([k, v]) => typeof v === 'number' ? `${k} ${v}` : `${k} {${Object.entries(v).map(([n, c]) => `${n}:${c}`).join(', ')}}`);
  if (ignoredKinds.length) warn('controllersIgnored', `messages in the file that this import does not interpret: ${ignoredKinds.join('; ')}`, { eventOrder: 0 });
  warn('trackLocalPedal', 'note pairing and pedal state are track-local (keyed by track, channel, pitch), not a merged single-port receiver', { eventOrder: 0 });
  for (const w of list.warnings) warnings.push({ ...w, detail: `parser: ${w.detail}` });

  const onsets = events.length + loomScore.length + (fmTime === null ? 0 : 1);
  if (onsets > MAX_SCHEDULED_ONSETS) throw new Error(`${onsets} scheduled onsets across all families; the bound is ${MAX_SCHEDULED_ONSETS}. Narrow the window or drop a track.`);
  const recipe = { events, loomScore, fmTime, holdUntil: windowEnd + plan.tailSeconds };

  // The actual compiled result: chamber stealing and the planner's reach, for this patch and sample rate.
  const base = createPerformanceFromEvents(saved, events, sampleRate);
  for (const e of base.events) if (e.family === 'bellows' && e.voice.stolenAt !== undefined) warn('stolen', `note ${e.voice.scoreId.slice(5)}: chamber stolen at ${e.voice.stolenAt.toFixed(3)} s by a seventh simultaneous bellows note`, { noteId: Number(e.voice.scoreId.slice(5)) });
  const planned = family => planPerformers(events.filter(e => e.family === family).map(e => ({ id: e.id, slot: family === 'garden' ? e.slot : 0, noteOn: e.time, velocity: e.velocity })), { family, slots: family === 'garden' ? NOTES.length : 1 });
  const planner = { garden: { unplanned: planned('garden').unplanned.length }, tine: { unplanned: planned('tine').unplanned.length } };
  const counts = Object.fromEntries(REPORT_CLASSES.map(c => [c, rows.filter(r => r.class === c).length])); counts.total = rows.length;
  if (counts.total !== list.notes.length) throw new Error('internal: every input note must have exactly one report row.');
  return { recipe, report: { counts, rows, warnings, planner, children: { loom: loomScore.length > 0, fm: fmTime !== null }, onsets, compiledEvents: base.events.length } };
}
