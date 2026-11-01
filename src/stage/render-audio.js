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

export function buildPerformanceGraph(context, performance, { lookahead = SCHEDULE_LOOKAHEAD } = {}) {
  if (!context || typeof context.createGain !== 'function') throw new Error('buildPerformanceGraph needs an AudioContext-like context.');
  if (!performance || !Array.isArray(performance.events) || !performance.patch) throw new Error('performance must have events and patch (see createPerformance).');
  const master = context.createGain(); master.gain.value = MASTER_GAIN;
  const limiter = context.createDynamicsCompressor();
  master.connect(limiter).connect(context.destination);

  // Bind an InstrumentAudio to this context and drive its clock to each event's schedule moment.
  const garden = new InstrumentAudio();
  garden.context = context; garden.master = master; garden.limiter = limiter;
  let cursor = 0;
  Object.defineProperty(garden, 'time', { get: () => cursor, configurable: true });

  const patch = performance.patch, sampleRate = context.sampleRate;
  const events = [...performance.events].sort((a, b) => a.voice.noteOn - b.voice.noteOn);
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
      scheduled.push({ family, id: voice.id, slot: voice.slot, noteOn: voice.noteOn, end: voice.end, seed, stolenAt: voice.stolenAt, graph });
    } else {
      const live = garden.strike(voice.slot, patch, voice.velocity, voice.noteOn, voice.position);
      scheduled.push({ family, id: voice.id, slot: voice.slot, noteOn: voice.noteOn, end: live ? live.end : null, voice: live, skipped: !live });
    }
  }
  return { master, limiter, garden, scheduled };
}

export async function renderPerformanceAudio(performance, sampleRate = 48000, { OfflineContext = globalThis.OfflineAudioContext, lookahead } = {}) {
  if (typeof OfflineContext !== 'function') throw new Error('OfflineAudioContext is not available in this environment; render in a browser (tests/stage-render-browser.html).');
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('sampleRate must be positive.');
  if (!performance || !Number.isFinite(performance.duration) || performance.duration <= 0) throw new Error('performance.duration must be positive.');
  const length = Math.ceil(performance.duration * sampleRate);
  const context = new OfflineContext(1, length, sampleRate);
  buildPerformanceGraph(context, performance, lookahead === undefined ? {} : { lookahead });
  const buffer = await context.startRendering();
  return buffer.getChannelData(0);
}
