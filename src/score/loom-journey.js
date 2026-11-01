// The Loom journey: a short listening study for two coupled bodies (proposal 012). Pure data and pure functions.
// Shape: solo (only body 0 is struck; body 1 sounds because the coupling carries energy to it) → response (body 1
// is struck for the first time, later than the ear expects) → intertwining (alternating strikes drawing closer, one
// shared strike) → silence (nothing after the last strike; the coupled ring finishes on its own).
// Everything uses the existing static coupling model (makeLoom / coupledPair): three named settings differ only in
// the physical parameters the model already has (coupling, detune, loss), and `describeLoomSetting` computes what
// each setting actually does (normal-mode split, modal amplitude ratio at the unstruck body, ring length) so the docs state measured facts.
// No time-varying coupling, no decorative energy claims.

import { makeLoom, DEFAULT_LOOM } from '../loom/model.js';

export const LOOM_JOURNEY_VERSION = 1;
export const LOOM_JOURNEY_SETTINGS = Object.freeze({
  // Identical bodies: the unstruck body is driven as strongly as the struck one; slow exchange; the longest ring.
  'close-kin':       Object.freeze({ ...DEFAULT_LOOM, coupling: 0.004, detune: 0,  loss: 0.45 }),
  // Slightly different pitches: the unstruck body is driven much less, and a beat between two close pitches is heard.
  'distant-cousins': Object.freeze({ ...DEFAULT_LOOM, coupling: 0.004, detune: 40, loss: 0.45 }),
  // Stronger coupling and more loss: a faster exchange and a shorter ring, so the weave reads as quick answers.
  'tight-weave':     Object.freeze({ ...DEFAULT_LOOM, coupling: 0.012, detune: 0,  loss: 0.7 }),
});
export const JOURNEY_BOUNDS = Object.freeze({ minSeconds: 15, maxSeconds: 35 });
const ROLES = Object.freeze({ solo: 0.7, answer: 0.55, weaveLead: 0.6, weaveReply: 0.45, shared: 0.7, last: 0.5 });

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };

/** What a setting actually does, computed from the model: nothing here is asserted by hand.
 *  modalAmplitudeRatio = (largest modal displacement amplitude at the UNSTRUCK body) / (largest at the struck body), from the
 *  pickup modes of a body-0 strike. It is a displacement-amplitude ratio of modal components, not an energy fraction and not a
 *  ratio of peaks over time; it says how strongly the unstruck body's motion is excited through the bridge. beatHz is the
 *  normal-mode split, i.e. how often energy moves between the bodies. */
export function describeLoomSetting(settings) {
  const study = makeLoom(settings, 0), [low, high] = study.system.normalFreqsHz;
  const own = Math.max(...study.modes[0].map(m => Math.abs(m.amplitude))), other = Math.max(...study.modes[1].map(m => Math.abs(m.amplitude)));
  return { normalFreqsHz: [low, high], beatHz: high - low, exchangePeriodSeconds: 1 / Math.max(1e-9, high - low), modalAmplitudeRatio: other / own, ringSeconds: study.duration, pitchHz: settings.frequency, detuneCents: settings.detune };
}

/** Compose the journey. Deterministic in (setting, tempo, lead). Beats are absolute from the start; seconds = lead + beat·60/tempo. */
export function composeLoomJourney({ setting = 'close-kin', tempo = 84, lead = 0.35 } = {}) {
  if (!Object.hasOwn(LOOM_JOURNEY_SETTINGS, setting)) throw new Error(`setting must be one of ${Object.keys(LOOM_JOURNEY_SETTINGS).join(', ')}.`);
  const s = (id, beat, body, role) => ({ id, beat, body, velocity: ROLES[role], role });
  const strikes = [
    // Solo [0, 6): body 0 alone, three coherent impulses; body 1 is never struck here.
    s('solo:1', 0, 0, 'solo'), s('solo:2', 2.5, 0, 'solo'), s('solo:3', 4.5, 0, 'solo'),
    // Response [6, 12): the answer arrives at 7.5, a beat and a half after the section begins (later than expected, once).
    s('answer:1', 7.5, 1, 'answer'), s('answer:2', 9, 0, 'solo'), s('answer:3', 10.5, 1, 'answer'),
    // Intertwining [12, 20): alternation drawing closer, then one shared strike, then a last lead.
    s('weave:1', 12, 0, 'weaveLead'), s('weave:2', 13, 1, 'weaveReply'), s('weave:3', 14, 0, 'weaveLead'), s('weave:4', 14.75, 1, 'weaveReply'),
    s('weave:5', 15.5, 0, 'weaveLead'), s('weave:6', 16, 1, 'weaveReply'), s('weave:7', 16.5, 0, 'weaveLead'), s('weave:8', 16.75, 1, 'weaveReply'),
    s('weave:9', 18, 0, 'shared'), s('weave:10', 18, 1, 'shared'), s('weave:11', 19.5, 0, 'last'),
    // Silence [20, …): nothing is struck; the ring decides the length.
  ];
  return validateLoomJourney({
    version: LOOM_JOURNEY_VERSION, setting, settings: { ...LOOM_JOURNEY_SETTINGS[setting] }, tempo, lead,
    sections: [
      { id: 'solo', beats: [0, 6], cadence: 'anticipation' },
      { id: 'response', beats: [6, 12], cadence: 'answer' },
      { id: 'intertwining', beats: [12, 20], cadence: 'answer' },
      { id: 'silence', beats: [20, 20 + Math.ceil(describeLoomSetting(LOOM_JOURNEY_SETTINGS[setting]).ringSeconds * tempo / 60)], cadence: 'settling' },
    ],
    strikes,
  });
}

export const beatSeconds = (journey, beat) => journey.lead + beat * 60 / journey.tempo;

/** Strict validation; also checks the musical shape the study promises and the duration bound. Returns the journey. */
export function validateLoomJourney(j) {
  keysExactly(j, ['version', 'setting', 'settings', 'tempo', 'lead', 'sections', 'strikes'], 'LoomJourney');
  if (j.version !== LOOM_JOURNEY_VERSION) throw new Error(`LoomJourney version must be ${LOOM_JOURNEY_VERSION}.`);
  if (!Object.hasOwn(LOOM_JOURNEY_SETTINGS, j.setting)) throw new Error('unknown setting.');
  keysExactly(j.settings, Object.keys(DEFAULT_LOOM), 'settings'); makeLoom(j.settings, 0);   // the model's own bounds
  if (!Number.isInteger(j.tempo) || j.tempo < 40 || j.tempo > 160) throw new Error('tempo must be an integer in 40..160.');
  if (!(finite(j.lead, 'lead') >= 0 && j.lead <= 5)) throw new Error('lead must be within 0..5 s.');
  if (!Array.isArray(j.sections) || j.sections.length !== 4 || j.sections.map(s => s.id).join() !== 'solo,response,intertwining,silence') throw new Error('sections must be solo, response, intertwining, silence.');
  let cursor = 0;
  for (const s of j.sections) { keysExactly(s, ['id', 'beats', 'cadence'], `section ${s.id}`); if (!Array.isArray(s.beats) || s.beats.length !== 2 || s.beats[0] !== cursor || !(finite(s.beats[1], 'section end') > cursor)) throw new Error(`section ${s.id}: beats must be exactly [start, end), contiguous and half-open.`); if (typeof s.cadence !== 'string') throw new Error('cadence must be a string.'); cursor = s.beats[1]; }
  if (!Array.isArray(j.strikes) || j.strikes.length < 1 || j.strikes.length > 256) throw new Error('strikes must hold 1..256 entries.');
  const ids = new Set(); let last = -Infinity;
  const section = beat => j.sections.find(s => beat >= s.beats[0] && beat < s.beats[1]);
  for (const k of j.strikes) {
    keysExactly(k, ['id', 'beat', 'body', 'velocity', 'role'], `strike ${k.id}`);
    if (typeof k.id !== 'string' || ids.has(k.id)) throw new Error('strike ids must be unique strings.'); ids.add(k.id);
    if (!(finite(k.beat, 'beat') >= 0) || k.beat < last) throw new Error('strikes must be sorted by beat.'); last = k.beat;
    if (k.body !== 0 && k.body !== 1) throw new Error('body must be 0 or 1.');
    if (!(finite(k.velocity, 'velocity') > 0 && k.velocity <= 1)) throw new Error('velocity must be in (0, 1].');
    if (!Object.hasOwn(ROLES, k.role)) throw new Error('unknown strike role.');
    const sec = section(k.beat); if (!sec) throw new Error(`strike ${k.id} lies outside the sections.`);
    if (sec.id === 'solo' && k.body !== 0) throw new Error('the solo strikes body 0 only; body 1 must sound unstruck.');
    if (sec.id === 'silence') throw new Error('nothing is struck in the silence.');
  }
  const firstAnswer = j.strikes.find(k => k.body === 1), response = j.sections[1];
  if (!firstAnswer || firstAnswer.beat < response.beats[0] + 1) throw new Error('the first body-1 strike must arrive at least one beat into the response.');
  const d = journeyDuration(j);
  if (d < JOURNEY_BOUNDS.minSeconds || d > JOURNEY_BOUNDS.maxSeconds) throw new Error(`journey lasts ${d.toFixed(1)} s; bound is ${JOURNEY_BOUNDS.minSeconds}..${JOURNEY_BOUNDS.maxSeconds} s.`);
  return j;
}

/** The Loom compiler's input: [{ time, body, velocity }] in seconds, lead included. */
export function loomScoreFrom(journey) { return journey.strikes.map(k => ({ time: beatSeconds(journey, k.beat), body: k.body, velocity: k.velocity })); }

/** Last strike time plus the model's ring for this setting: when the picture and the sound are both still. */
export function journeyDuration(journey) {
  const ring = describeLoomSetting(journey.settings).ringSeconds, lastBeat = Math.max(...journey.strikes.map(k => k.beat));
  return beatSeconds(journey, lastBeat) + ring;
}

/** Section at a time in seconds, with bar-free progress; pre-roll before the lead, tail after the last section. */
export function journeySectionAt(journey, t) {
  finite(t, 't');
  if (t < journey.lead) return { id: 'pre-roll', cadence: null, progress01: 0 };
  const beat = Math.round((t - journey.lead) * journey.tempo / 60 * 1e9) / 1e9, last = journey.sections.at(-1);
  if (beat >= last.beats[1]) return { id: 'tail', cadence: null, progress01: 1 };
  const s = journey.sections.find(s => beat >= s.beats[0] && beat < s.beats[1]);
  return { id: s.id, cadence: s.cadence, progress01: (beat - s.beats[0]) / (s.beats[1] - s.beats[0]) };
}

/** Deterministic canonical form (sorted keys, array order kept). Validates first. */
export function canonicalLoomJourney(journey) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateLoomJourney(journey)));
}

// ---- integration API for the listening doorway (Astra's shape, 2026-11-01) ----
const TITLES = Object.freeze({
  'close-kin':       { title: 'Close kin',       description: 'Two identical bodies on one bridge. Strike one and the other is set moving through the bridge; the motion passes back and forth between them a little under once a second while both fade.' },
  'distant-cousins': { title: 'Distant cousins', description: 'The same bridge, but the second body is tuned forty cents away. The unstruck body moves far less, and what does cross the bridge is heard as a beat between two close pitches.' },
  'tight-weave':     { title: 'Tight weave',     description: 'A stiffer bridge and a quicker fade. The motion passes between the bodies more than twice a second and the ring is shorter, so the answers come fast and the room empties sooner.' },
});
const CHAPTERS = Object.freeze([
  // Wording rule: never call a body silent when the coupling excites it; the unstruck body sounds through the bridge.
  { id: 'solo',         title: 'One gesture',       description: 'Only the first body is struck. The second is never touched, yet it sounds: the bridge sets it moving. Listen for the second body answering unstruck.' },
  { id: 'response',     title: 'An answer, late',   description: 'The second body is struck for the first time, a beat and a half after you might expect it. The two now trade single gestures.' },
  { id: 'intertwining', title: 'Interweaving',      description: 'Strikes alternate and draw closer, until both bodies are struck at once. Each strike adds to the same ringing system; nothing is reset.' },
  { id: 'silence',      title: 'Let it finish',     description: 'Nothing more is struck. The coupled ring decays on its own, the motion still passing between the bodies as it fades.' },
]);

/** A fresh, canonical definition for the doorway: id, title, description, settings, score (seconds), chapters (seconds), plus the journey and the measured facts. */
export function getLoomJourney(id, options = {}) {
  if (!Object.hasOwn(LOOM_JOURNEY_SETTINGS, id)) throw new Error(`unknown Loom journey "${id}"; known: ${Object.keys(LOOM_JOURNEY_SETTINGS).join(', ')}.`);
  for (const k of Object.keys(options)) if (!['tempo', 'lead'].includes(k)) throw new Error(`getLoomJourney options allow tempo and lead only (got "${k}"); the setting is the id.`);
  const journey = composeLoomJourney({ ...options, setting: id }), measured = describeLoomSetting(journey.settings);
  const chapters = journey.sections.map(s => { const c = CHAPTERS.find(c => c.id === s.id); return { id: s.id, time: beatSeconds(journey, s.beats[0]), title: c.title, description: c.description }; });
  return { id, ...TITLES[id], settings: { ...journey.settings }, score: loomScoreFrom(journey), chapters, durationSeconds: journeyDuration(journey), measured, journey };
}
export const LOOM_JOURNEY_IDS = Object.freeze(Object.keys(LOOM_JOURNEY_SETTINGS));
const deepFreeze = v => { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); } return v; };
export const LOOM_JOURNEYS = deepFreeze(LOOM_JOURNEY_IDS.map(id => getLoomJourney(id)));
