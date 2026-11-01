// Offline audio for a stage passage (decision 002, slice C export).
// Renders exactly the graph the live stage plays: one master gain (0.24) into the native compressor, the garden
// and tine through InstrumentAudio bound to the offline context, the choir through createBellowsGraph +
// applyBellowsSchedule with the planned slots, steals, and per-event noise seeds. Same timeline as the picture
// (performance.events / performance.duration), so a FrameClock render of frames and this audio line up.
//
//   buildPerformanceGraph(context, performance, { lookahead = 0.24 })  -> { master, limiter, garden, scheduled }
//   renderPerformanceAudio(performance, sampleRate = 48000, { OfflineContext }) -> Float32Array (mono)
//
// Garden voice stealing is mirrored, not ignored: InstrumentAudio decides steals from "now", so the engine's
// clock is driven to each event's schedule moment (noteOn - lookahead), the same moment the live scheduler would
// call strike(). The stage snapshot assumes no steals (documented limitation); if a passage does steal, live and
// offline steal identically and the picture is what diverges.

import { InstrumentAudio } from '../audio.js';
import { createBellowsGraph, applyBellowsSchedule } from '../bellows-audio.js';
import { voiceDynamics } from '../dynamics.js';

export const MASTER_GAIN = 0.24;
export const SCHEDULE_LOOKAHEAD = 0.24;

export const bellowsSeed = (patch, voice) => (patch.seed + voice.id * 997) >>> 0;

// Options (diagnostics and offline hygiene):
//   families   which families to schedule (default all three); use to isolate a nondeterminism to one engine
//   compressor false bypasses the native DynamicsCompressor (master -> destination); test-only
//   keepNodes  true (default for offline) removes the engines' onended disconnect handlers. Live engines disconnect
//              ended nodes to free resources; in offline rendering those callbacks land on the main thread at
//              scheduler-dependent moments, and a node graph whose inputs vanish mid-render can be processed
//              differently from one fed zeros, which breaks bit-for-bit repeatability. Offline has no resource
//              pressure, so nothing is disconnected until the render is done.
export const FAMILIES = ['garden', 'tine', 'bellows'];

//   sourceLifetime 'as-live' (default until the engine zeroes mode gains at their intended end) stops every source
//              where the live engine does. 'outlive-render' re-schedules every source's stop to renderEnd + 1 s so
//              NO source finishes during the render. Evidence (harness v4, Safari, 2026-11-01): every render in
//              which a source finished drifted run-to-run beginning within one sample of the first finish, and
//              every render in which none finished was bit-identical; when a source finishes, the engine changes
//              the mix's input set at a scheduler-dependent quantum. 'outlive-render' is only a correct rendering
//              mode once each mode gain is set to exactly 0 at its intended end (otherwise the oscillator keeps
//              sounding at the envelope's final ramp value); the garden engine must do that in strike().
//   renderEnd  seconds; required for 'outlive-render' (renderPerformanceAudio passes performance.duration).
export const OUTLIVE_MARGIN = 1;

export function buildPerformanceGraph(context, performance, { lookahead = SCHEDULE_LOOKAHEAD, families = FAMILIES, compressor = true, keepNodes = true, sourceLifetime = 'as-live', renderEnd } = {}) {
  if (!['as-live', 'outlive-render'].includes(sourceLifetime)) throw new Error(`sourceLifetime must be 'as-live' or 'outlive-render'.`);
  if (sourceLifetime === 'outlive-render' && !(Number.isFinite(renderEnd) && renderEnd > 0)) throw new Error('outlive-render needs a positive renderEnd.');
  const outlive = sourceLifetime === 'outlive-render', stopAt = outlive ? renderEnd + OUTLIVE_MARGIN : null;
  if (!context || typeof context.createGain !== 'function') throw new Error('buildPerformanceGraph needs an AudioContext-like context.');
  if (!performance || !Array.isArray(performance.events) || !performance.patch) throw new Error('performance must have events and patch (see createPerformance).');
  for (const f of families) if (!FAMILIES.includes(f)) throw new Error(`unknown family '${f}'.`);
  const master = context.createGain(); master.gain.value = MASTER_GAIN;
  const limiter = compressor ? context.createDynamicsCompressor() : null;
  if (limiter) master.connect(limiter).connect(context.destination); else master.connect(context.destination);

  // Bind an InstrumentAudio to this context and drive its clock to each event's schedule moment.
  const garden = new InstrumentAudio();
  garden.context = context; garden.master = master; garden.limiter = limiter;
  let cursor = 0;
  Object.defineProperty(garden, 'time', { get: () => cursor, configurable: true });

  const patch = performance.patch, sampleRate = context.sampleRate;
  const events = [...performance.events].filter(e => families.includes(e.family)).sort((a, b) => a.voice.noteOn - b.voice.noteOn);
  const scheduled = [];
  for (const { family, voice } of events) {
    cursor = Math.max(0, voice.noteOn - lookahead);
    if (family === 'bellows') {
      const seed = bellowsSeed(patch, voice);
      const graph = createBellowsGraph(context, master, voice, patch, seed);
      applyBellowsSchedule(graph, voice, patch, sampleRate, voice.noteOn, voice.end);
      if (voice.stolenAt !== undefined) {
        const gain = graph.gain.gain, at = voice.stolenAt;
        gain.cancelScheduledValues(at);
        gain.setValueAtTime(voiceDynamics(at, voice, patch, sampleRate).amp.level, at);
        gain.linearRampToValueAtTime(0, voice.end);
      }
      // The choir's gain already ramps to exactly 0 at the release end, so outliving the render adds no residual.
      graph.source.start(voice.noteOn); graph.source.stop(outlive ? stopAt : voice.end + 0.01);
      if (keepNodes) graph.source.onended = null;
      scheduled.push({ family, id: voice.id, slot: voice.slot, noteOn: voice.noteOn, end: voice.end, seed, stolenAt: voice.stolenAt, graph });
    } else {
      const live = garden.strike(voice.slot, patch, voice.velocity, voice.noteOn, voice.position);
      if (live && keepNodes) for (const node of live.nodes) node.onended = null;
      scheduled.push({ family, id: voice.id, slot: voice.slot, noteOn: voice.noteOn, end: live ? live.end : null, voice: live, skipped: !live });
    }
  }
  // Apply the outlive stop AFTER all events are scheduled: a later steal (garden.retire) re-schedules the stolen
  // voice's stop to its fade end, which would otherwise finish that source during the render. The voice gain has
  // already ramped to exactly 0 at the fade end, so extending the stop keeps it silent and finish-free.
  if (outlive) for (const s of scheduled) {
    if (s.family === 'bellows') s.graph.source.stop(stopAt);
    else if (s.voice) for (const node of s.voice.nodes) node.stop(stopAt);
  }
  return { master, limiter, garden, scheduled, options: { lookahead, families: [...families], compressor, keepNodes, sourceLifetime, stopAt } };
}

// Default lifecycle for renders is 'outlive-render' (decision 004, 2026-11-01): verified bit-identical repeated
// renders of the full passage and the air choir on Safari 26.6.2 at 48 kHz, seed 731 (harness v6). 'as-live' stays
// available as an explicit diagnostic control. buildPerformanceGraph keeps 'as-live' as its own default because it
// has no render end to outlive unless told.
export const DEFAULT_RENDER_LIFETIME = 'outlive-render';

export async function renderPerformanceAudio(performance, sampleRate = 48000, { OfflineContext = globalThis.OfflineAudioContext, lookahead, families, compressor, keepNodes, sourceLifetime = DEFAULT_RENDER_LIFETIME } = {}) {
  if (typeof OfflineContext !== 'function') throw new Error('OfflineAudioContext is not available in this environment; render in a browser (tests/stage-render-browser.html).');
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('sampleRate must be positive.');
  if (!performance || !Number.isFinite(performance.duration) || performance.duration <= 0) throw new Error('performance.duration must be positive.');
  const length = Math.ceil(performance.duration * sampleRate);
  const context = new OfflineContext(1, length, sampleRate);
  const options = {};
  if (lookahead !== undefined) options.lookahead = lookahead;
  if (families !== undefined) options.families = families;
  if (compressor !== undefined) options.compressor = compressor;
  if (keepNodes !== undefined) options.keepNodes = keepNodes;
  options.sourceLifetime = sourceLifetime; options.renderEnd = performance.duration;
  const graph = buildPerformanceGraph(context, performance, options);
  // Hold a strong reference to every scheduled node until rendering resolves. A finished source with no JS
  // reference may be garbage-collected by the engine at a collector-dependent moment, and whether a silent,
  // collected branch still feeds the mix at a given quantum is exactly the kind of history that leaks into
  // the compressor tail. In-flight graphs are pinned here and released only after the buffer exists.
  inflight.add({ context, graph });
  try {
    const buffer = await context.startRendering();
    return buffer.getChannelData(0);
  } finally {
    for (const entry of inflight) if (entry.graph === graph) inflight.delete(entry);
  }
}

const inflight = new Set();
/** Number of renders currently holding their graph alive (diagnostic). */
export function inflightRenders() { return inflight.size; }

/** Size of one float32 rounding step at magnitude x (the unit in the last place). */
export function ulp32(x) {
  const m = Math.abs(x);
  if (m === 0) return 2 ** -149;
  return 2 ** (Math.floor(Math.log2(m)) - 23);
}

/**
 * Compare two renders. Besides max/RMS difference and where the largest difference sits, report:
 *  - maxUlps32: the largest difference measured in float32 rounding units of the LOCAL signal level (the peak
 *    magnitude within ±window samples), so a near-zero sample next to a loud one is not counted as thousands of
 *    units; quietMaxDiff reports the raw largest difference where the local level is below `quiet`.
 *  - pcm16Identical / pcm16Differing / pcm16MaxStep: equality after 16-bit quantization. This is the resolution
 *    of the WAV export (encodeWav). It is NOT the MP4 path: the AAC encoder receives float32 and is lossy, so for
 *    video the comparable statement is only the float32 metrics above plus the trace manifest.
 * `identical` is bit-for-bit float32 equality and is reported separately from every tolerance.
 */
export function compareRenders(a, b, sampleRate = 48000, { window = 128, quiet = 1e-3 } = {}) {
  const n = Math.min(a.length, b.length);
  // Local peak via a sliding window maximum of |a| (two passes keep it O(n)).
  const local = new Float32Array(n);
  const block = Math.max(1, window);
  const blockMax = new Float32Array(Math.ceil(n / block));
  for (let i = 0; i < n; i++) { const m = Math.abs(a[i]); const k = Math.floor(i / block); if (m > blockMax[k]) blockMax[k] = m; }
  for (let i = 0; i < n; i++) { const k = Math.floor(i / block); local[i] = Math.max(blockMax[k], blockMax[k - 1] ?? 0, blockMax[k + 1] ?? 0, Math.abs(a[i]), Math.abs(b[i])); }
  let max = 0, at = -1, sum = 0, maxUlps = 0, quietMax = 0, pcmDiffering = 0, pcmMaxStep = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(a[i] - b[i]); sum += d * d;
    if (d > max) { max = d; at = i; }
    if (d > 0) {
      if (local[i] < quiet) { if (d > quietMax) quietMax = d; }
      else { const u = d / ulp32(local[i]); if (u > maxUlps) maxUlps = u; }
      const pa = Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), pb = Math.round(Math.max(-1, Math.min(1, b[i])) * 32767);
      if (pa !== pb) { pcmDiffering++; pcmMaxStep = Math.max(pcmMaxStep, Math.abs(pa - pb)); }
    }
  }
  return {
    identical: max === 0 && a.length === b.length,
    maxDiff: max, rmsDiff: Math.sqrt(sum / Math.max(1, n)), atSample: at, atSeconds: at < 0 ? null : at / sampleRate,
    maxUlps32: maxUlps, quietMaxDiff: quietMax, ulpWindow: block, quietLevel: quiet,
    pcm16Identical: pcmDiffering === 0 && a.length === b.length, pcm16Differing: pcmDiffering, pcm16MaxStep: pcmMaxStep,
    lengths: [a.length, b.length],
  };
}
