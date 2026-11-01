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

export function buildPerformanceGraph(context, performance, { lookahead = SCHEDULE_LOOKAHEAD, families = FAMILIES, compressor = true, keepNodes = true } = {}) {
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
      graph.source.start(voice.noteOn); graph.source.stop(voice.end + 0.01);
      if (keepNodes) graph.source.onended = null;
      scheduled.push({ family, id: voice.id, slot: voice.slot, noteOn: voice.noteOn, end: voice.end, seed, stolenAt: voice.stolenAt, graph });
    } else {
      const live = garden.strike(voice.slot, patch, voice.velocity, voice.noteOn, voice.position);
      if (live && keepNodes) for (const node of live.nodes) node.onended = null;
      scheduled.push({ family, id: voice.id, slot: voice.slot, noteOn: voice.noteOn, end: live ? live.end : null, voice: live, skipped: !live });
    }
  }
  return { master, limiter, garden, scheduled, options: { lookahead, families: [...families], compressor, keepNodes } };
}

export async function renderPerformanceAudio(performance, sampleRate = 48000, { OfflineContext = globalThis.OfflineAudioContext, lookahead, families, compressor, keepNodes } = {}) {
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
  buildPerformanceGraph(context, performance, options);
  const buffer = await context.startRendering();
  return buffer.getChannelData(0);
}

/** Compare two renders: max and RMS difference, where the largest difference sits, and whether they are identical. */
export function compareRenders(a, b, sampleRate = 48000) {
  const n = Math.min(a.length, b.length);
  let max = 0, at = -1, sum = 0;
  for (let i = 0; i < n; i++) { const d = Math.abs(a[i] - b[i]); sum += d * d; if (d > max) { max = d; at = i; } }
  return { identical: max === 0 && a.length === b.length, maxDiff: max, rmsDiff: Math.sqrt(sum / Math.max(1, n)), atSample: at, atSeconds: at < 0 ? null : at / sampleRate, lengths: [a.length, b.length] };
}
