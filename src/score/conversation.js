// "A conversation in three movements": the explicit phrase score (proposal 008 rev. 2).
// Pure data and pure functions. The score is authored in BEATS; `compileScoreEvents` turns it into the
// explicit-event compiler's input (seconds, lead included) plus the child overrides {loomScore, fmTime}.
// One compiler: all modes, voices, chamber allocation, stealing and planning happen downstream in
// createPerformanceFromEvents / attachComposition. Nothing here fakes intensity or compresses time; density
// removes non-anchor events, tempo scales time uniformly, character changes voices on the same beats.
// Dampers are not schedulable yet (no audio/state lifecycle), so the release settles by fewer excitations.

export const SCORE_VERSION = 1;
export const CHARACTERS = Object.freeze(['calm', 'bright', 'restless']);
export const FAMILIES = Object.freeze(['garden', 'tine', 'bellows', 'loom', 'fm']);
export const GARDEN_SLOTS = 8, LOOM_BODIES = 2, MAX_EVENTS = 256, COMPILER_MAX_SECONDS = 120;
const TOP_KEYS = ['version', 'seed', 'tempo', 'beatsPerBar', 'lead', 'controls', 'sections', 'hold', 'events'];
const EVENT_KEYS = { garden: ['slot', 'velocity', 'position'], tine: ['velocity', 'position'], bellows: ['noteMidi', 'velocity', 'durationBeats'], loom: ['body', 'velocity'], fm: [] };

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const within = (v, lo, hi, name) => { finite(v, name); if (v < lo || v > hi) throw new Error(`${name} must be within ${lo}..${hi}.`); return v; };
const onlyKeys = (obj, keys, what) => { for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); };

export const midiHz = midi => 440 * 2 ** ((midi - 69) / 12);
export const beatSeconds = (score, beat) => score.lead + beat * 60 / score.tempo;

/** Validate a Score; returns the same object. Strict keys; no reachability rule (that is evidence, not schema). */
export function validateScore(score) {
  if (!score || typeof score !== 'object' || Array.isArray(score)) throw new Error('Score must be an object.');
  onlyKeys(score, TOP_KEYS, 'score');
  if (score.version !== SCORE_VERSION) throw new Error(`Score version must be ${SCORE_VERSION}.`);
  if (!Number.isInteger(score.seed) || score.seed < 0 || score.seed > 4294967295) throw new Error('seed must be an integer in 0..4294967295.');
  if (!Number.isInteger(score.tempo)) throw new Error('tempo must be an integer.'); within(score.tempo, 40, 160, 'tempo');
  if (!Number.isInteger(score.beatsPerBar)) throw new Error('beatsPerBar must be an integer.'); within(score.beatsPerBar, 2, 8, 'beatsPerBar');
  within(score.lead, 0, 5, 'lead'); within(score.hold, 0, 30, 'hold');
  if (!score.controls || typeof score.controls !== 'object') throw new Error('controls must be an object.');
  onlyKeys(score.controls, ['density', 'character'], 'controls');
  within(score.controls.density, 0, 1, 'controls.density');
  if (!CHARACTERS.includes(score.controls.character)) throw new Error(`controls.character must be one of ${CHARACTERS.join(', ')}.`);
  if (!Array.isArray(score.sections) || !score.sections.length) throw new Error('sections must be a non-empty array.');
  let cursor = 0; const ids = new Set();
  for (const s of score.sections) {
    onlyKeys(s, ['id', 'beats', 'cadence', 'turnBeat'], 'section');
    if (typeof s.id !== 'string' || !s.id || ['pre-roll', 'tail'].includes(s.id) || ids.has(s.id)) throw new Error('section ids must be unique, non-empty and not "pre-roll"/"tail".');
    ids.add(s.id);
    if (!Array.isArray(s.beats) || s.beats.length !== 2) throw new Error(`section ${s.id}: beats must be [start, end).`);
    const [a, b] = s.beats; finite(a, 'section start'); finite(b, 'section end');
    if (a !== cursor) throw new Error(`section ${s.id}: must start at beat ${cursor} (contiguous, half-open).`);
    if (b <= a) throw new Error(`section ${s.id}: must be non-empty.`);
    if (typeof s.cadence !== 'string' || !s.cadence) throw new Error(`section ${s.id}: cadence must be a non-empty string.`);
    if (s.turnBeat !== undefined && (finite(s.turnBeat, 'turnBeat') < a || s.turnBeat >= b)) throw new Error(`section ${s.id}: turnBeat must lie inside the section.`);
    cursor = b;
  }
  if (!Array.isArray(score.events)) throw new Error('events must be an array.');
  const eventIds = new Set(); let fmCount = 0, loomCount = 0, loomAnchors = 0, lastBeat = -Infinity;
  score.events.forEach((e, i) => {
    if (!e || typeof e !== 'object') throw new Error(`event ${i}: must be an object.`);
    if (!FAMILIES.includes(e.family)) throw new Error(`event ${i}: unknown family "${e.family}".`);
    onlyKeys(e, ['id', 'family', 'beat', 'anchor', 'weight', ...EVENT_KEYS[e.family]], `event ${i}`);
    if (typeof e.id !== 'string' || !/^[a-z]+:[a-z-]+:\d+$/.test(e.id) || eventIds.has(e.id)) throw new Error(`event ${i}: id must be unique and of the form family:section:n.`);
    const [fam, sec] = e.id.split(':');
    if (fam !== e.family) throw new Error(`event ${e.id}: id family must match.`);
    const section = score.sections.find(s => s.id === sec);
    if (!section) throw new Error(`event ${e.id}: unknown section "${sec}".`);
    eventIds.add(e.id);
    finite(e.beat, `event ${e.id}.beat`);
    if (e.beat < section.beats[0] || e.beat >= section.beats[1]) throw new Error(`event ${e.id}: beat ${e.beat} lies outside its section.`);
    if (e.beat < lastBeat) throw new Error(`event ${e.id}: events must be sorted by beat.`); lastBeat = e.beat;
    const hasAnchor = e.anchor !== undefined, hasWeight = e.weight !== undefined;
    if (hasAnchor === hasWeight) throw new Error(`event ${e.id}: exactly one of anchor / weight.`);
    if (hasAnchor && e.anchor !== true) throw new Error(`event ${e.id}: anchor must be true when present.`);
    if (hasWeight && !(finite(e.weight, `event ${e.id}.weight`) > 0 && e.weight <= 1)) throw new Error(`event ${e.id}: weight must be in (0, 1].`);
    if (e.family !== 'fm') { if (!(finite(e.velocity, `event ${e.id}.velocity`) > 0 && e.velocity <= 1)) throw new Error(`event ${e.id}: velocity must be in (0, 1].`); }
    if (e.family === 'garden' && (!Number.isInteger(e.slot) || e.slot < 0 || e.slot >= GARDEN_SLOTS)) throw new Error(`event ${e.id}: slot must be an integer in 0..${GARDEN_SLOTS - 1}.`);
    if ((e.family === 'garden' || e.family === 'tine') && e.position !== undefined) within(e.position, 0, 1, `event ${e.id}.position`);
    if (e.family === 'bellows') { if (!Number.isInteger(e.noteMidi)) throw new Error(`event ${e.id}: noteMidi must be an integer.`); within(e.noteMidi, 36, 96, `event ${e.id}.noteMidi`); if (!(finite(e.durationBeats, `event ${e.id}.durationBeats`) > 0)) throw new Error(`event ${e.id}: durationBeats must be positive.`); }
    if (e.family === 'loom') { if (!Number.isInteger(e.body) || e.body < 0 || e.body >= LOOM_BODIES) throw new Error(`event ${e.id}: body must be 0 or 1.`); loomCount++; if (hasAnchor) loomAnchors++; }
    if (e.family === 'fm') { fmCount++; if (!hasAnchor) throw new Error(`event ${e.id}: the fm event must be an anchor so the entrance survives every density.`); }
  });
  if (fmCount !== 1) throw new Error('Score must contain exactly one fm event.');
  if (loomCount && !loomAnchors) throw new Error('A score with Loom events needs at least one Loom anchor.');
  if (score.events.length > MAX_EVENTS) throw new Error(`At most ${MAX_EVENTS} candidate events (got ${score.events.length}).`);
  for (const e of score.events) {
    const end = beatSeconds(score, e.beat + (e.family === 'bellows' ? e.durationBeats : 0));
    if (end > COMPILER_MAX_SECONDS) throw new Error(`event ${e.id}: ends at ${end.toFixed(2)} s, beyond the compiler's ${COMPILER_MAX_SECONDS} s.`);
  }
  return score;
}

/** Events that survive density thinning: anchors always; density 0 keeps anchors only; otherwise weighted events
 *  iff weight >= 1 - density. Input order (sorted by beat) is preserved, so simultaneous events keep a stable order. */
export function scheduledEvents(score) {
  const density = score.controls.density;
  return score.events.filter(e => e.anchor === true || (density > 0 && e.weight >= 1 - density));
}

/** Seconds of the last scheduled onset (diagnostic; not part of the recipe). */
export function lastOnsetSeconds(score) {
  return scheduledEvents(validateScore(score)).reduce((m, e) => Math.max(m, beatSeconds(score, e.beat)), 0);
}

/** The authored-performance recipe, exactly { events, loomScore, fmTime, holdUntil }: the explicit-event compiler's
 *  input (seconds, lead included) plus child overrides and the designed final hold. Pure data. */
export function compileScoreEvents(score) {
  validateScore(score);
  const events = [], loomScore = []; let fmTime = null, lastOnset = 0;
  for (const e of scheduledEvents(score)) {
    const time = beatSeconds(score, e.beat); lastOnset = Math.max(lastOnset, time);
    if (e.family === 'garden') { const out = { id: e.id, family: 'garden', time, velocity: e.velocity, slot: e.slot }; if (e.position !== undefined) out.position = e.position; events.push(out); }
    else if (e.family === 'tine') { const out = { id: e.id, family: 'tine', time, velocity: e.velocity }; if (e.position !== undefined) out.position = e.position; events.push(out); }
    else if (e.family === 'bellows') events.push({ id: e.id, family: 'bellows', time, velocity: e.velocity, noteHz: midiHz(e.noteMidi), noteOff: time + e.durationBeats * 60 / score.tempo });
    else if (e.family === 'loom') loomScore.push({ time, body: e.body, velocity: e.velocity });
    else fmTime = time;
  }
  return { events, loomScore, fmTime, holdUntil: lastOnset + score.hold };
}

/** Where in the form a time (seconds) falls. Pre-roll before the lead; tail after the last section's end. */
export function sectionAt(score, t) {
  finite(t, 't');
  if (t < score.lead) return { id: 'pre-roll', cadence: null, bar: 0, beatInBar: 0, progress01: 0 };
  // Snap to a 1e-9 beat grid so a time built from a beat (lead + beat·60/tempo) lands on its own boundary.
  const beat = Math.round((t - score.lead) * score.tempo / 60 * 1e9) / 1e9;
  const last = score.sections.at(-1);
  if (beat >= last.beats[1]) return { id: 'tail', cadence: null, bar: Math.floor(last.beats[1] / score.beatsPerBar) + 1, beatInBar: 0, progress01: 1 };
  const s = score.sections.find(s => beat >= s.beats[0] && beat < s.beats[1]);
  return { id: s.id, cadence: s.cadence, bar: Math.floor(beat / score.beatsPerBar) + 1, beatInBar: beat % score.beatsPerBar, progress01: (beat - s.beats[0]) / (s.beats[1] - s.beats[0]) };
}

/** Actual onset counts per bar (all families count as onsets; a bellows gate counts once at its onset). */
export function eventsPerBar(score, { scheduled = true } = {}) {
  const end = score.sections.at(-1).beats[1], bars = Math.ceil(end / score.beatsPerBar), counts = new Array(bars).fill(0);
  for (const e of scheduled ? scheduledEvents(score) : score.events) counts[Math.floor(e.beat / score.beatsPerBar)]++;
  return counts;
}

/** Deterministic canonical form (sorted keys) for links and manifests. */
export function canonicalScore(score) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateScore(score)));
}

// ---- the first phrase ------------------------------------------------------------------------------------
// Character variants: same beats, different voices. m = motif slots, u = upper variant, v = inverted upstairs,
// p = bellows pitches (MIDI), gate = bellows gate in beats, pos = strike position, vel = base velocity,
// off = tine off-beat offset.
const VARIANTS = {
  calm:     { m: [2, 4, 5], u: [5, 7, 6], v: [7, 5, 4], p: [55, 60, 63], low: 48, gate: 1.5, pos: 0.5,  vel: 0.6,  off: 0.5 },
  bright:   { m: [4, 6, 7], u: [6, 7, 6], v: [7, 6, 4], p: [60, 67, 70], low: 55, gate: 0.75, pos: 0.85, vel: 0.75, off: 0.5 },
  restless: { m: [2, 6, 3], u: [6, 2, 7], v: [7, 3, 5], p: [55, 63, 58], low: 51, gate: 1,   pos: 0.35, vel: 0.65, off: 0.75 },
};

/** Compose the conversation. Deterministic in (seed, tempo, density, character); seed picks the Loom's first body
 *  and a small, fixed velocity shading so two seeds are siblings, not strangers. */
export function composeConversation({ seed = 731, tempo = 84, density = 0.7, character = 'calm' } = {}) {
  if (!CHARACTERS.includes(character)) throw new Error(`character must be one of ${CHARACTERS.join(', ')}.`);
  const c = VARIANTS[character], firstBody = seed % 2, shade = ((seed * 7919) % 11) / 100 - 0.05; // −0.05..+0.05
  const vel = x => Math.min(1, Math.max(0.05, +(x + shade).toFixed(3)));
  const n = {}; const next = (fam, sec) => `${fam}:${sec}:${n[fam + sec] = (n[fam + sec] ?? 0) + 1}`;
  const g = (sec, beat, slot, v, wa) => ({ id: next('garden', sec), family: 'garden', beat, slot, velocity: vel(v), position: c.pos, ...wa });
  const t = (sec, beat, v, w) => ({ id: next('tine', sec), family: 'tine', beat, velocity: vel(v), position: c.pos, weight: w });
  const b = (sec, beat, midi, v, gate, w) => ({ id: next('bellows', sec), family: 'bellows', beat, noteMidi: midi, velocity: vel(v), durationBeats: gate, weight: w });
  const l = (sec, beat, i, v, wa) => ({ id: next('loom', sec), family: 'loom', beat, body: (firstBody + i) % 2, velocity: vel(v), ...wa });
  const A = { anchor: true }, W = w => ({ weight: w });
  const events = [
    // Opening [0,16): the motif in empty air, an upper echo, one tine answer.
    g('opening', 0, c.m[0], c.vel, A), g('opening', 2, c.m[1], c.vel, A), g('opening', 5, c.m[2], c.vel, A), g('opening', 7, c.m[0], c.vel - 0.1, W(0.35)),
    g('opening', 8, c.u[0], c.vel - 0.05, W(0.5)), g('opening', 10, c.u[1], c.vel - 0.05, W(0.5)), t('opening', 11 + c.off, c.vel - 0.1, 0.6), g('opening', 13, c.u[2], c.vel - 0.05, W(0.5)),
    // Exchange [16,48): motif returns, answered by tine, bellows and the Loom; the FM turn at beat 32; inverted motif upstairs.
    g('exchange', 16, c.m[0], c.vel, A), t('exchange', 16 + c.off, c.vel - 0.15, 0.6), g('exchange', 18, c.m[1], c.vel, A), t('exchange', 18 + c.off, c.vel - 0.15, 0.6),
    g('exchange', 21, c.m[2], c.vel, A), t('exchange', 21 + c.off, c.vel - 0.15, 0.6), g('exchange', 23, c.m[0], c.vel - 0.1, W(0.35)), t('exchange', 23 + c.off, c.vel - 0.15, 0.6),
    b('exchange', 24, c.p[0], 0.55, c.gate, 0.55), l('exchange', 25, 0, 0.6, A), b('exchange', 26, c.p[1], 0.55, c.gate, 0.55), l('exchange', 27, 1, 0.5, W(0.75)),
    b('exchange', 28.5, c.p[2], 0.55, c.gate, 0.55), l('exchange', 29, 2, 0.6, W(0.75)), l('exchange', 31, 3, 0.5, W(0.75)),
    { id: 'fm:exchange:1', family: 'fm', beat: 32, anchor: true }, g('exchange', 32, c.v[0], c.vel, W(0.8)), l('exchange', 33, 4, 0.6, W(0.75)),
    g('exchange', 34, c.v[1], c.vel, W(0.8)), l('exchange', 35, 5, 0.5, W(0.75)), b('exchange', 36, c.low, 0.5, 4, 0.55), g('exchange', 37, c.v[2], c.vel, W(0.8)),
    l('exchange', 37, 6, 0.6, W(0.75)), l('exchange', 39, 7, 0.5, W(0.75)), b('exchange', 40, c.p[1], 0.5, 2, 0.55), l('exchange', 41, 8, 0.6, W(0.75)),
    l('exchange', 43, 9, 0.5, W(0.75)), g('exchange', 44, c.u[2], c.vel - 0.05, W(0.5)), l('exchange', 45, 10, 0.6, W(0.75)), g('exchange', 46, c.m[1], c.vel - 0.1, W(0.35)),
    // Release [48,64): fewer excitations, then the final strike and natural decay.
    g('release', 48, c.m[2], c.vel - 0.1, W(0.35)), l('release', 49, 11, 0.45, A), b('release', 50, c.p[0], 0.45, 1, 0.55),
    g('release', 52, c.m[1], c.vel - 0.05, A), g('release', 54, c.m[0], c.vel - 0.1, W(0.5)), (({ weight, ...rest }) => ({ ...rest, anchor: true }))(t('release', 57 + c.off, c.vel - 0.2, 0.6)),
    g('release', 60, c.m[0], c.vel - 0.15, A),
  ];
  return validateScore({
    version: SCORE_VERSION, seed, tempo, beatsPerBar: 4, lead: 0.35, controls: { density, character },
    sections: [
      { id: 'opening', beats: [0, 16], cadence: 'anticipation' },
      { id: 'exchange', beats: [16, 48], cadence: 'answer', turnBeat: 32 },
      { id: 'release', beats: [48, 64], cadence: 'settling' },
    ],
    hold: 8, events,
  });
}
