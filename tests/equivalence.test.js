import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH } from '../src/model.js';
import { InstrumentAudio } from '../src/audio.js';
import { BellowsAudio } from '../src/bellows-audio.js';
import { createPerformance } from '../src/stage/performance.js';
import { createProjection } from '../src/stage/projection.js';
import { FrameClock } from '../src/clock.js';
import { collectState } from '../src/state.js';
import { liveSnapshotsFromEngines, compareBusTraces, canonicalFrame, diffFrames } from '../src/stage/equivalence.js';

// Minimal Web Audio mocks (same shape as tests/audio.test.js and tests/bellows-audio.test.js).
class Parameter { setValueCurveAtTime() {} exponentialRampToValueAtTime() {} cancelScheduledValues() {} setValueAtTime() {} linearRampToValueAtTime() {} }
class Node { constructor() { this.gain = new Parameter(); this.pan = new Parameter(); this.frequency = new Parameter(); this.Q = new Parameter(); this.playbackRate = new Parameter(); } connect(n) { return n; } disconnect() {} start() {} stop() {} }
class Context { constructor() { this.currentTime = 0; this.sampleRate = 48000; this.destination = new Node(); } createGain() { return new Node(); } createDynamicsCompressor() { return new Node(); } createStereoPanner() { return new Node(); } createOscillator() { return new Node(); } createBiquadFilter() { return new Node(); } createBufferSource() { return new Node(); } createBuffer(c, n) { const d = new Float32Array(n); return { getChannelData: () => d }; } async resume() {} }

/**
 * Drive the engines through the passage the way stage/main.js does: events are scheduled when they come within
 * `lookahead` of the clock, the page keeps its own voice lists pruned by end > now, and a snapshot is taken at each
 * requested score time. Returns liveAt(t): the snapshots the page would have had at score time t.
 */
function livePlayback(passage, { origin = 100, lookahead = 0.24 } = {}) {
  const context = new Context(), garden = new InstrumentAudio(); garden.context = context; garden.master = new Node();
  const choir = new BellowsAudio(context, garden.master);
  const events = [...passage.events].sort((a, b) => a.voice.noteOn - b.voice.noteOn);
  let cursor = 0; const pageVoices = [], pageBreaths = [];
  const advanceTo = t => {
    context.currentTime = origin + t; choir.tick();
    while (cursor < events.length && events[cursor].voice.noteOn < t + lookahead) {
      const { family, voice } = events[cursor++];
      if (family === 'bellows') { const v = choir.noteOn(voice.noteHz, passage.patch, voice.velocity, origin + voice.noteOn, origin + voice.noteOff, (passage.patch.seed + voice.id * 997) >>> 0); if (v) pageBreaths.push(v); }
      else { const v = garden.strike(voice.slot, passage.patch, voice.velocity, origin + voice.noteOn, voice.position); if (v) pageVoices.push(v); }
    }
  };
  let last = -Infinity;
  return t => {
    if (t < last) throw new Error('live playback only moves forward');
    advanceTo(t); last = t;
    const now = origin + t;
    return liveSnapshotsFromEngines({ garden: { voices: pageVoices.filter(v => v.end > now), dampers: [...garden.dampers] }, choir: { voices: pageBreaths.filter(v => v.end > now) }, originTime: origin });
  };
}

test('frames built from live engine snapshots hash identically to the offline passage at every score timestamp', () => {
  const passage = createPerformance(DEFAULT_PATCH);
  const times = new FrameClock({ fps: 30 }).times(passage.duration);
  const raw = compareBusTraces(times, passage.snapshots, livePlayback(passage));
  if (!raw.identical) { const t = raw.firstDifferenceSeconds; assert.fail(`first difference at ${t}s: ${diffFrames(canonicalFrame(collectState(t, passage.snapshots)), canonicalFrame(collectState(t, livePlayback(passage)(t)))).slice(0, 8).join('; ')}`); }
  assert.equal(raw.equal, times.length); assert.ok(times.length > 900);
  const projected = compareBusTraces(times, passage.snapshots, livePlayback(passage), { project: createProjection(passage.patch, { performance: passage }) });
  assert.ok(projected.identical, `projected frames differ first at ${projected.firstDifferenceSeconds}s`);
});

test('a live divergence is reported with its first frame and the differing paths', () => {
  const passage = createPerformance(DEFAULT_PATCH);
  const live = livePlayback(passage);
  const victim = [...passage.snapshots.garden.voices].sort((a, b) => a.noteOn - b.noteOn)[3];
  const drifted = t => { const s = live(t); const v = s.garden.voices.find(x => x.slot === victim.slot && Math.abs(x.noteOn - victim.noteOn) < 1e-9); if (v) v.velocity *= 0.5; return s; };   // played softer than the score
  const times = new FrameClock({ fps: 30 }).times(passage.duration);
  const r = compareBusTraces(times, passage.snapshots, drifted);
  assert.equal(r.identical, false); assert.ok(r.firstDifference >= 0);
  assert.ok(Math.abs(r.firstDifferenceSeconds - (victim.noteOn - 0.18)) <= 1 / 30 + 1e-9, `first difference ${r.firstDifferenceSeconds} vs approach start ${victim.noteOn - 0.18}`);
  const paths = diffFrames(canonicalFrame(collectState(victim.noteOn + 0.1, passage.snapshots)), canonicalFrame(collectState(victim.noteOn + 0.1, livePlayback(passage)(victim.noteOn + 0.1))));
  assert.deepEqual(paths, [], 'undrifted live frame equals offline');
  assert.throws(() => compareBusTraces('x', {}, {}), /times/); assert.throws(() => compareBusTraces([NaN], {}, {}), /times\[0\]/);
});

test('liveSnapshotsFromEngines re-bases every timeline field by the origin and splits the tine from the garden', () => {
  const passage = createPerformance(DEFAULT_PATCH);
  const live = livePlayback(passage, { origin: 55 })(0.5);   // first strike and first breath are both sounding
  const firstScore = [...passage.snapshots.garden.voices].sort((a, b) => a.noteOn - b.noteOn)[0];
  const first = live.garden.voices.find(v => v.slot === firstScore.slot && Math.abs(v.noteOn - firstScore.noteOn) < 1e-9);
  assert.ok(first, 'first score voice present live'); assert.ok(Math.abs(first.end - firstScore.end) < 1e-9);
  assert.ok(live.tine.voices.every(v => v.slot === 8) && live.garden.voices.every(v => v.slot < 8));
  const breathScore = [...passage.snapshots.bellows.voices].sort((a, b) => a.noteOn - b.noteOn)[0];
  const breath = live.bellows.voices.find(v => Math.abs(v.noteOn - breathScore.noteOn) < 1e-9);
  assert.ok(breath && Math.abs(breath.noteOff - breathScore.noteOff) < 1e-9); assert.deepEqual(breath.bellows, breathScore.bellows);
  assert.throws(() => liveSnapshotsFromEngines({ originTime: NaN }), /originTime/);
});
