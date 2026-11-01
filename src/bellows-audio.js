import { scheduleVoice, voiceDynamics } from './dynamics.js';
import { frequency, makeScore, random } from './model.js';

export const BELLOWS_NOTES = [48, 51, 55, 58, 60, 63, 67];
export const BELLOWS_KEYS = 'zxcvbnm';
const HORIZON = .3;
const STEAL_SECONDS = .04;

/** Both realtime and offline rendering use precisely this source/filter/gain graph. */
export function createBellowsGraph(context, output, voice, patch, seed = 731) {
  let source;
  if (patch.bellows.source === 'air') {
    source = context.createBufferSource();
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = buffer.getChannelData(0), rng = random(seed);
    for (let i = 0; i < samples.length; i++) samples[i] = (rng() * 2 - 1) * .45;
    source.buffer = buffer; source.loop = true;
  } else {
    source = context.createOscillator();
    source.type = patch.bellows.source === 'reed' ? 'square' : 'sawtooth';
  }
  const filter = context.createBiquadFilter(); filter.type = 'lowpass';
  filter.Q.value = .5 * 36 ** patch.bellows.resonance;
  const gain = context.createGain(), trim = context.createGain();
  gain.gain.value = 0; trim.gain.value = .18;
  source.connect(filter).connect(gain).connect(trim).connect(output);
  // Air has no fundamental: the same pitch control changes noise playback rate.
  const pitchParam = source.frequency ?? {
    setValueAtTime(value, t) { source.playbackRate.setValueAtTime(value / voice.noteHz, t); },
    linearRampToValueAtTime(value, t) { source.playbackRate.linearRampToValueAtTime(value / voice.noteHz, t); },
    cancelScheduledValues(t) { source.playbackRate.cancelScheduledValues(t); },
  };
  const params = { gain: gain.gain, cutoffHz: filter.frequency, frequencyHz: pitchParam };
  let disconnected = false;
  const graph = { source, filter, gain, trim, params,
    dispose() { if (disconnected) return; disconnected = true; for (const node of [source, filter, gain, trim]) node.disconnect(); },
  };
  source.onended = () => graph.dispose();
  return graph;
}

export function applyBellowsSchedule(graph, voice, patch, sampleRate, fromTime, toTime, replace = false) {
  if (toTime <= fromTime) return;
  if (replace) for (const param of Object.values(graph.params)) param?.cancelScheduledValues(fromTime);
  const segments = scheduleVoice(voice, patch, sampleRate, { fromTime, toTime, controlRate: 200 });
  const initialized = new Set();
  for (const segment of segments) {
    const param = graph.params[segment.param]; if (!param) continue;
    if (!initialized.has(segment.param)) {
      param.setValueAtTime(segment.value, segment.t); initialized.add(segment.param);
    } else param.linearRampToValueAtTime(segment.value, segment.t);
  }
}

export function bellowsState(voice, time, sampleRate = 48000) {
  const state = voiceDynamics(time, voice, voice.patch, sampleRate);
  if (voice.stolenAt !== undefined && time >= voice.stolenAt) {
    const fade = Math.max(0, Math.min(1, 1 - (time - voice.stolenAt) / STEAL_SECONDS));
    state.amp.level = voice.stolenAmp * fade; state.env.level = voice.stolenEnv * fade; state.bellows.fill01 = 1 - state.env.level;
  }
  return state;
}

export class BellowsAudio {
  constructor(context, output) { this.context = context; this.output = output; this.voices = []; this.sounding = []; this.nextId = 1; }
  get time() { return this.context.currentTime; }
  noteOn(noteHz, patch, velocity = .75, when = this.time + .015, noteOff = null, noiseSeed) {
    this.voices = this.voices.filter(v => v.end > when && v.stolenAt === undefined);
    if (this.voices.length >= 6) this.steal(this.voices.shift(), when);
    const occupied = new Set(this.voices.map(v => v.slot));
    const slot = [0, 1, 2, 3, 4, 5].find(value => !occupied.has(value));
    const voice = { id: this.nextId++, slot, noteHz, velocity, noteOn: when, noteOff, patch: structuredClone(patch), scheduledUntil: when,
      end: noteOff === null ? Infinity : noteOff + patch.bellows.adsr.r };
    voice.graph = createBellowsGraph(this.context, this.output, voice, voice.patch, noiseSeed ?? (patch.seed + voice.id * 997) >>> 0);
    applyBellowsSchedule(voice.graph, voice, voice.patch, this.context.sampleRate, when, Math.min(when + HORIZON, voice.end));
    voice.scheduledUntil = Math.min(when + HORIZON, voice.end);
    voice.graph.source.start(when);
    if (Number.isFinite(voice.end)) voice.graph.source.stop(voice.end + .01);
    this.voices.push(voice); this.sounding.push(voice); return voice;
  }
  noteOff(voice, when = this.time) {
    if (!voice || voice.end <= this.time || voice.stolenAt !== undefined) return;
    if (voice.noteOff !== null && voice.noteOff <= when) return;
    voice.noteOff = Math.max(voice.noteOn, when);
    voice.end = voice.noteOff + voice.patch.bellows.adsr.r;
    const from = Math.max(this.time, voice.noteOn);
    const until = Math.min(from + HORIZON, voice.end);
    applyBellowsSchedule(voice.graph, voice, voice.patch, this.context.sampleRate, from, until, true);
    voice.scheduledUntil = until; voice.graph.source.stop(voice.end + .01);
  }
  steal(voice, when = this.time) {
    const now = when;
    if (voice.scheduledUntil < now) applyBellowsSchedule(voice.graph, voice, voice.patch, this.context.sampleRate, voice.scheduledUntil, now);
    const state = bellowsState(voice, now, this.context.sampleRate);
    const level = state.amp.level;
    voice.stolenAmp = level; voice.stolenEnv = state.env.level;
    voice.stolenAt = now; voice.end = now + STEAL_SECONDS;
    voice.graph.gain.gain.cancelScheduledValues(now);
    voice.graph.gain.gain.setValueAtTime(level, now);
    voice.graph.gain.gain.linearRampToValueAtTime(0, voice.end);
    voice.graph.source.stop(voice.end);
  }
  tick() {
    for (const voice of this.voices) {
      if (voice.end <= this.time || voice.stolenAt !== undefined) continue;
      const until = Math.min(voice.noteOn + Math.ceil((this.time + HORIZON - voice.noteOn) * 200) / 200, voice.end);
      if (until <= voice.scheduledUntil) continue;
      const from = voice.scheduledUntil;
      applyBellowsSchedule(voice.graph, voice, voice.patch, this.context.sampleRate, from, until);
      voice.scheduledUntil = until;
    }
    this.voices = this.voices.filter(v => v.end > this.time);
    this.sounding = this.sounding.filter(v => v.end > this.time);
  }
  stop() { this.sounding.filter(v => v.end > this.time).forEach(v => this.steal(v)); }
}

export function bellowsScore(patch, beats = 16) {
  const beat = 60 / patch.tempo;
  return makeScore(patch, beats).filter((_, i) => i % 2 === 0).map((event, index) => ({
    id: index + 1, noteHz: frequency(BELLOWS_NOTES[event.index % BELLOWS_NOTES.length]), velocity: event.velocity,
    noteOn: event.time, noteOff: event.time + beat * .7,
  }));
}

export function planBellowsVoices(score, releaseSeconds) {
  const active = [], planned = [];
  for (const event of score) {
    for (let i = active.length - 1; i >= 0; i--) if (active[i].end <= event.noteOn) active.splice(i, 1);
    if (active.length >= 6) { const old = active.shift(); old.stolenAt = event.noteOn; old.end = event.noteOn + STEAL_SECONDS; }
    const used = new Set(active.map(voice => voice.slot));
    const voice = { ...event, end: event.noteOff + releaseSeconds, slot: [0, 1, 2, 3, 4, 5].find(slot => !used.has(slot)) };
    planned.push(voice); active.push(voice);
  }
  return planned;
}

export async function renderBellows(patch, sampleRate = 48000) {
  const score = planBellowsVoices(bellowsScore(patch), patch.bellows.adsr.r);
  const duration = score.at(-1).noteOff + patch.bellows.adsr.r + .05;
  const context = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);
  const master = context.createGain(); master.gain.value = .24;
  const limiter = context.createDynamicsCompressor(); master.connect(limiter).connect(context.destination);
  for (const voice of score) {
    const graph = createBellowsGraph(context, master, voice, patch, (patch.seed + voice.id * 997) >>> 0);
    const end = voice.end;
    applyBellowsSchedule(graph, voice, patch, sampleRate, voice.noteOn, end);
    if (voice.stolenAt !== undefined) {
      const gain = graph.gain.gain, at = voice.stolenAt;
      gain.cancelScheduledValues(at); gain.setValueAtTime(voiceDynamics(at, voice, patch, sampleRate).amp.level, at);
      gain.linearRampToValueAtTime(0, end);
    }
    graph.source.start(voice.noteOn); graph.source.stop(end + .01);
  }
  const buffer = await context.startRendering();
  return buffer.getChannelData(0);
}
