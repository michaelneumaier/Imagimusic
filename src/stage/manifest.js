// Trace manifest for an export (decision 002 §4): the deterministic half of a video, independent of the codec.
// For a passage and a frame rate it lists the state-trace hash of every frame the video should contain, plus the
// identifiers needed to reproduce it. Two exports of the same seed on different machines will produce different
// bitstreams but identical manifests; a mismatch in the manifest means the scene changed, not the encoder.
//
//   createTraceManifest(performance, { fps = 30, project }) -> { v, seed, patch, fps, sampleRate, duration, frames, hashes, audioSamples }
//   compareManifests(a, b) -> { equal, firstDifference: index | -1, frames: [a.frames, b.frames] }

import { collectState, traceHash } from '../state.js';
import { FrameClock } from '../clock.js';

export const MANIFEST_VERSION = 1;

export function createTraceManifest(performance, { fps = 30, project } = {}) {
  if (!performance || !performance.snapshots || !Number.isFinite(performance.duration)) throw new Error('performance must come from createPerformance.');
  if (!Number.isFinite(fps) || fps <= 0) throw new Error('fps must be positive.');
  const clock = new FrameClock({ fps });
  const times = clock.times(performance.duration);
  const hashes = times.map(t => { const frame = collectState(t, performance.snapshots); return traceHash(project ? project(frame) : frame); });
  return {
    v: MANIFEST_VERSION,
    seed: performance.patch.seed,
    patch: traceHash(performance.patch),
    fps, sampleRate: performance.sampleRate ?? 48000, duration: performance.duration,
    frames: times.length,
    audioSamples: Math.ceil(performance.duration * (performance.sampleRate ?? 48000)),
    projected: !!project,
    hashes,
  };
}

export function compareManifests(a, b) {
  const n = Math.min(a.hashes.length, b.hashes.length);
  let firstDifference = -1;
  for (let i = 0; i < n; i++) if (a.hashes[i] !== b.hashes[i]) { firstDifference = i; break; }
  if (firstDifference < 0 && a.hashes.length !== b.hashes.length) firstDifference = n;
  const equal = firstDifference < 0 && a.fps === b.fps && a.seed === b.seed && a.patch === b.patch && a.projected === b.projected;
  return { equal, firstDifference, frames: [a.frames, b.frames] };
}
