// Planned score == synthesized engine voices, on the state bus (decision 002 §4, M2.5 gate).
// Two sources of frames exist: the stage draws from the PLANNED snapshots (createPerformance) at live or frame
// time, and the lab draws from ENGINE snapshots (snapshots.js: modalSnapshot / bellowsSnapshot) of the voices the
// audio engines actually synthesized. This module compares the two at identical score-relative timestamps: if they
// hash identically, the voices the engines made for the score are the voices the planned picture shows. It is the
// engine/plan half of the equivalence gate; browser-clock vs offline picture parity (same planned frames sampled
// on the AudioContext clock vs the FrameClock) is Astra's scene parity harness. This module is pure; a live page
// supplies its snapshots.
//
//   compareBusTraces(times, offlineSnapshots, liveSnapshots | (t) => liveSnapshots, { project, digits }) -> report
//   liveSnapshotsFromEngines({ garden, choir, originTime }) -> snapshots on the score timeline
//   orderVoices(frame), canonicalFrame(frame): explicit identity/order normalization (ids and array order are
//   per-side bookkeeping; everything else must match)
//
// Timeline normalization: live engines hold AudioContext times (noteOn = origin + score time). Re-basing by
// subtraction leaves float noise (origin 100 + 0.35 − 100 = 0.3499999999999943), which is below any sample yet can
// flip a 4-digit hash at a rounding boundary. Re-based times are therefore snapped to the nearest nanosecond, a
// stated normalization, not a tolerance on the picture.
export const TIMELINE_SNAP = 1e-9;

import { collectState, traceHash } from '../state.js';
import { modalSnapshot, bellowsSnapshot } from '../snapshots.js';

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };

/** Snapshots from live engines, shifted so that noteOn/end/noteOff/stolenAt/fadeAt are on the score timeline. */
export function liveSnapshotsFromEngines({ garden, choir, originTime = 0, sampleRate = 48000, tineIndex = 8 } = {}) {
  finite(originTime, 'originTime');
  const snap = v => Math.round(v * 1e9) / 1e9;   // (v / 1e-9) * 1e-9 would reintroduce noise: 1e-9 is not representable
  const shift = (s, keys) => { const out = { ...s }; for (const k of keys) if (typeof out[k] === 'number' && Number.isFinite(out[k])) out[k] = snap(out[k] - originTime); return out; };
  const modal = (garden?.voices ?? []).map(v => shift(modalSnapshot(v), ['noteOn', 'end', 'fadeAt']));
  const dampers = [...(garden?.dampers ?? [])];
  const bellows = (choir?.voices ?? []).map(v => shift(bellowsSnapshot(v), ['noteOn', 'noteOff', 'stolenAt']));
  return {
    garden: { voices: modal.filter(v => v.slot !== tineIndex), dampers: dampers.filter(s => s !== tineIndex) },
    tine: { voices: modal.filter(v => v.slot === tineIndex), dampers: dampers.filter(s => s === tineIndex) },
    bellows: { voices: bellows },
    sampleRate,
  };
}

/**
 * Canonical form for equivalence: voice ids are per-side allocation details (the score names voices 'g0…', the
 * live engine numbers them as they are struck), so ids are dropped and voices are ordered by (family, slot,
 * noteOn). Everything else in the frame must match.
 */
const voiceOrder = (a, b) => a.family.localeCompare(b.family) || a.slot - b.slot || a.noteOn - b.noteOn || a.noteHz - b.noteHz;

/** Same frame, voices in canonical order, ids kept: the input order a projection must not depend on, made equal on both sides. */
export function orderVoices(frame) { return { ...frame, voices: [...frame.voices].sort(voiceOrder) }; }

export function canonicalFrame(frame) {
  const voices = frame.voices.map(({ id, ...rest }) => rest).sort(voiceOrder);
  const out = { ...frame, voices };
  if (frame.stage) {
    const stage = { ...frame.stage };
    if (stage.performers?.actors) stage.performers = { ...stage.performers, actors: stage.performers.actors.map(({ eventId, previousEventId, ...a }) => a) };
    if (Array.isArray(stage.bellows)) stage.bellows = stage.bellows.map(({ voiceId, ...c }) => c);   // chamber voice ids are bookkeeping too
    out.stage = stage;
  }
  return out;
}

/**
 * Compare the two frame sequences at the given score times. `liveSnapshots` is either a snapshot object or a
 * function of score time returning the snapshots the live page had at that moment (engines prune ended voices and
 * schedule ahead, so a single end-of-score capture is not what the viewer saw). `project` (optional) is the stage
 * projection applied to both sides.
 */
const TIME_FIELDS = ['noteOn', 'end', 'noteOff', 'stolenAt', 'fadeAt'];
const snapTime = v => Math.round(v * 1e9) / 1e9;

/** The same nanosecond timeline normalization for either side, so comparison never depends on which side was snapped. */
export function normalizeSnapshots(snapshots) {
  const out = { ...snapshots };
  for (const family of ['garden', 'tine', 'bellows']) {
    if (!snapshots[family]) continue;
    out[family] = { ...snapshots[family], voices: (snapshots[family].voices ?? []).map(v => { const c = { ...v }; for (const k of TIME_FIELDS) if (typeof c[k] === 'number' && Number.isFinite(c[k])) c[k] = snapTime(c[k]); return c; }) };
  }
  return out;
}

export function compareBusTraces(times, offlineSnapshots, liveSnapshots, { project = f => f, digits = 4 } = {}) {
  if (!Array.isArray(times)) throw new Error('times must be an array of score seconds.');
  const liveAt = typeof liveSnapshots === 'function' ? liveSnapshots : () => liveSnapshots;
  const offline = normalizeSnapshots(offlineSnapshots);
  const frames = [];
  let firstDifference = -1, equal = 0;
  for (let i = 0; i < times.length; i++) {
    const t = finite(times[i], `times[${i}]`);
    const off = traceHash(canonicalFrame(project(orderVoices(collectState(t, offline)))), digits);
    const live = traceHash(canonicalFrame(project(orderVoices(collectState(t, normalizeSnapshots(liveAt(t)))))), digits);
    const same = off === live; if (same) equal++; else if (firstDifference < 0) firstDifference = i;
    frames.push({ t, offline: off, live, same });
  }
  return { identical: firstDifference < 0, frames: times.length, equal, firstDifference, firstDifferenceSeconds: firstDifference < 0 ? null : times[firstDifference], samples: frames };
}

/** Where two frames differ, for diagnosing a mismatch: paths whose rounded values differ. */
export function diffFrames(a, b, digits = 4, path = '') {
  const out = [];
  const round = v => typeof v === 'number' ? Number(v.toFixed(digits)) : v;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${path || '.'} length ${a.length} vs ${b.length}`];
    a.forEach((v, i) => out.push(...diffFrames(v, b[i], digits, `${path}[${i}]`)));
  } else if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...diffFrames(a[k], b[k], digits, path ? `${path}.${k}` : k));
  } else if (round(a) !== round(b)) out.push(`${path || '.'}: ${JSON.stringify(round(a))} vs ${JSON.stringify(round(b))}`);
  return out;
}
