import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH } from '../src/model.js';
import { MAX_VOICES } from '../src/audio.js';
import { createPerformance } from '../src/stage/performance.js';
import { buildPerformanceGraph, renderPerformanceAudio, bellowsSeed, compareRenders, ulp32, inflightRenders, MASTER_GAIN, FAMILIES } from '../src/stage/render-audio.js';

test('diagnostic options isolate families, bypass the compressor, and keep nodes connected offline', () => {
  const performance = createPerformance(DEFAULT_PATCH);
  const full = buildPerformanceGraph(new Context(), performance);
  assert.deepEqual(full.options, { lookahead: 0.24, families: FAMILIES, compressor: true, keepNodes: true });
  assert.ok(full.scheduled.filter(s => s.family === 'bellows').every(s => s.graph.source.onended === null));
  assert.ok(full.scheduled.filter(s => s.family !== 'bellows').every(s => s.voice.nodes.every(n => n.onended === null)));
  const live = buildPerformanceGraph(new Context(), performance, { keepNodes: false });
  assert.ok(live.scheduled.filter(s => s.family === 'bellows').every(s => typeof s.graph.source.onended === 'function'));
  assert.ok(live.scheduled.filter(s => s.family !== 'bellows').every(s => s.voice.nodes.every(n => typeof n.onended === 'function')));
  const gardenOnly = buildPerformanceGraph(new Context(), performance, { families: ['garden'] });
  assert.ok(gardenOnly.scheduled.length > 0 && gardenOnly.scheduled.every(s => s.family === 'garden'));
  const ctx = new Context(), bypass = buildPerformanceGraph(ctx, performance, { compressor: false });
  assert.equal(bypass.limiter, null); assert.ok(bypass.master.connections.includes(ctx.destination));
  assert.ok(!ctx.nodes.some(n => n.kind === 'compressor'));
  assert.throws(() => buildPerformanceGraph(new Context(), performance, { families: ['piano'] }), /unknown family/);
});

test('compareRenders reports identity, max/rms difference, rounding units, and 16-bit PCM equality', () => {
  const a = new Float32Array([0, 0.5, -0.25, 0.1]), b = new Float32Array([0, 0.5, -0.25, 0.1]);
  assert.deepEqual(compareRenders(a, b, 4), { identical: true, maxDiff: 0, rmsDiff: 0, atSample: -1, atSeconds: null, maxUlps32: 0, pcm16Identical: true, pcm16Differing: 0, pcm16MaxStep: 0, lengths: [4, 4] });
  const c = new Float32Array([0, 0.5, -0.2, 0.1]), r = compareRenders(a, c, 4);
  assert.equal(r.identical, false); assert.ok(Math.abs(r.maxDiff - 0.05) < 1e-7); assert.equal(r.atSample, 2); assert.equal(r.atSeconds, 0.5);
  assert.equal(r.pcm16Identical, false); assert.equal(r.pcm16Differing, 1); assert.ok(r.pcm16MaxStep > 1000);
  assert.equal(compareRenders(a, new Float32Array(3), 4).identical, false);
  // One float32 rounding step at 0.2 is invisible to 16-bit PCM and reads as exactly one unit.
  const d = new Float32Array([0.2]), e = new Float32Array([0.2]); e[0] = Math.fround(0.2 + ulp32(0.2));
  const one = compareRenders(d, e, 1);
  assert.equal(one.identical, false); assert.ok(Math.abs(one.maxUlps32 - 1) < 1e-6); assert.equal(one.pcm16Identical, true);
  assert.equal(ulp32(0.19), 2 ** -26); assert.equal(ulp32(0.5), 2 ** -24); assert.equal(ulp32(0), 2 ** -149);
});

test('reference experiments: a lone strike has one input per node, two simultaneous strikes share a summing node', () => {
  const base = createPerformance(DEFAULT_PATCH), first = base.snapshots.garden.voices[0];
  const lone = { ...base, events: [{ family: 'garden', voice: first }], duration: 5, snapshots: { garden: { voices: [first], dampers: [] } } };
  const ctx1 = new Context(); buildPerformanceGraph(ctx1, lone);
  assert.equal(ctx1.nodes.filter(n => n.kind === 'panner').length, 1);
  const second = { ...first, id: 'g1b', slot: 1 };
  const pair = { ...lone, events: [{ family: 'garden', voice: first }, { family: 'garden', voice: second }], snapshots: { garden: { voices: [first, second], dampers: [] } } };
  const ctx2 = new Context(); const { master } = buildPerformanceGraph(ctx2, pair);
  assert.equal(ctx2.nodes.filter(n => n.kind === 'panner').length, 2);
  assert.equal(ctx2.nodes.filter(n => n.kind === 'panner' && n.connections.includes(master)).length, 2);
});

class Parameter {
  events = [];
  setValueCurveAtTime(curve, t, d) { this.events.push({ kind: 'curve', t, d }); }
  exponentialRampToValueAtTime(value, t) { this.events.push({ kind: 'exp', value, t }); }
  linearRampToValueAtTime(value, t) { this.events.push({ kind: 'ramp', value, t }); }
  setValueAtTime(value, t) { this.events.push({ kind: 'set', value, t }); }
  cancelScheduledValues(t) { this.events = this.events.filter(e => e.t < t); }
}
class Node {
  constructor(kind) { this.kind = kind; this.gain = new Parameter(); this.pan = new Parameter(); this.frequency = new Parameter(); this.Q = new Parameter(); this.playbackRate = new Parameter(); this.connections = []; }
  connect(node) { this.connections.push(node); return node; }
  disconnect() { this.disconnected = true; }
  start(t) { this.startTime = t; } stop(t) { this.stopTime = t; }
}
class Context {
  constructor(sampleRate = 48000) { this.sampleRate = sampleRate; this.currentTime = 0; this.destination = new Node('destination'); this.nodes = []; }
  make(kind) { const n = new Node(kind); this.nodes.push(n); return n; }
  createGain() { return this.make('gain'); } createDynamicsCompressor() { return this.make('compressor'); }
  createStereoPanner() { return this.make('panner'); } createOscillator() { return this.make('osc'); }
  createBiquadFilter() { return this.make('filter'); } createBufferSource() { return this.make('buffer'); }
  createBuffer(ch, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
}
class FakeOffline extends Context {
  constructor(channels, length, sampleRate) { super(sampleRate); this.length = length; FakeOffline.last = this; }
  async startRendering() { const data = new Float32Array(this.length); return { getChannelData: () => data }; }
}

test('the offline graph schedules every performance event on the shared master → compressor → destination path', () => {
  const performance = createPerformance(DEFAULT_PATCH), context = new Context();
  const { master, limiter, garden, scheduled } = buildPerformanceGraph(context, performance);
  assert.equal(master.gain.value, MASTER_GAIN);
  assert.ok(master.connections.includes(limiter) && limiter.connections.includes(context.destination));
  assert.equal(scheduled.length, performance.events.length);
  assert.ok(scheduled.every(s => !s.skipped));
  const byFamily = f => scheduled.filter(s => s.family === f).length;
  assert.equal(byFamily('garden'), performance.snapshots.garden.voices.length);
  assert.equal(byFamily('tine'), performance.snapshots.tine.voices.length);
  assert.equal(byFamily('bellows'), performance.snapshots.bellows.voices.length);
  assert.equal(garden.context, context);
  assert.ok(context.nodes.filter(n => n.kind === 'osc').every(n => n.connections.length === 1));
});

test('garden and tine voices are struck with the snapshot arguments: modes, onset and end match the picture exactly', () => {
  const performance = createPerformance(DEFAULT_PATCH);
  const { scheduled } = buildPerformanceGraph(new Context(), performance);
  for (const family of ['garden', 'tine']) {
    for (const snap of performance.snapshots[family].voices) {
      const s = scheduled.find(x => x.family === family && x.id === snap.id);
      assert.ok(s, `${family} ${snap.id} scheduled`);
      assert.deepEqual(s.voice.modes.map(({ frequency, amplitude, decay }) => ({ frequency, amplitude, decay })), snap.modes);
      assert.equal(s.voice.time, snap.noteOn); assert.equal(s.voice.end, snap.end);
      assert.equal(s.voice.position, snap.position);
      assert.ok(s.voice.nodes.every(n => n.startTime === snap.noteOn));
    }
  }
});

test('choir voices use the planned slot, end, steal, and the same seed formula as the live stage', () => {
  const performance = createPerformance(DEFAULT_PATCH);
  const { scheduled } = buildPerformanceGraph(new Context(), performance);
  for (const snap of performance.snapshots.bellows.voices) {
    const s = scheduled.find(x => x.family === 'bellows' && x.id === snap.id);
    assert.equal(s.seed, (DEFAULT_PATCH.seed + snap.id * 997) >>> 0); assert.equal(s.seed, bellowsSeed(DEFAULT_PATCH, snap));
    assert.equal(s.slot, snap.slot); assert.equal(s.end, snap.end);
    assert.equal(s.graph.source.startTime, snap.noteOn); assert.ok(Math.abs(s.graph.source.stopTime - (snap.end + 0.01)) < 1e-12);
    const gainEvents = s.graph.gain.gain.events;
    assert.ok(gainEvents.length > 10 && gainEvents[0].t === snap.noteOn);
  }
  // A stolen voice gets its gain frozen at stolenAt then ramped to zero at its end.
  const patch = structuredClone(DEFAULT_PATCH); patch.bellows.adsr.r = 8;
  const long = createPerformance(patch), stolen = long.snapshots.bellows.voices.filter(v => v.stolenAt !== undefined);
  assert.ok(stolen.length > 0, 'long releases should force steals');
  const built = buildPerformanceGraph(new Context(), long);
  for (const snap of stolen) {
    const s = built.scheduled.find(x => x.family === 'bellows' && x.id === snap.id), ev = s.graph.gain.gain.events;
    const last = ev[ev.length - 1], set = ev[ev.length - 2];
    assert.equal(last.kind, 'ramp'); assert.equal(last.value, 0); assert.equal(last.t, snap.end);
    assert.equal(set.kind, 'set'); assert.equal(set.t, snap.stolenAt);
    assert.ok(ev.every(e => e.t <= snap.stolenAt || e === last));
  }
});

test('garden voice stealing is mirrored at the schedule moment, not ignored', () => {
  const patch = structuredClone(DEFAULT_PATCH);
  const base = createPerformance(patch);
  const first = base.snapshots.garden.voices[0];
  const many = Array.from({ length: MAX_VOICES + 3 }, (_, i) => ({ ...first, id: `g${i}`, noteOn: 1 + i * 0.01, end: first.end + i * 0.01 }));
  const performance = { ...base, events: many.map(voice => ({ family: 'garden', voice })), duration: 40, snapshots: { garden: { voices: many, dampers: [] } } };
  const { garden, scheduled } = buildPerformanceGraph(new Context(), performance);
  const retired = scheduled.filter(s => s.voice.fadeAt !== undefined);
  assert.equal(retired.length, 3);
  assert.ok(retired.every(s => s.voice.fadeAt >= 0 && s.voice.fadeAt < s.voice.time + 1));
  assert.ok(garden.voices.length <= MAX_VOICES);
  // Without stealing pressure nothing is retired.
  assert.ok(buildPerformanceGraph(new Context(), base).scheduled.every(s => s.family === 'bellows' || s.voice.fadeAt === undefined));
});

test('the graph stays referenced for the whole render and is released afterwards', async () => {
  let seenDuringRender = -1;
  class Observing extends FakeOffline { async startRendering() { seenDuringRender = inflightRenders(); await new Promise(r => setTimeout(r, 5)); return super.startRendering(); } }
  assert.equal(inflightRenders(), 0);
  const samples = await renderPerformanceAudio(createPerformance(DEFAULT_PATCH), 8000, { OfflineContext: Observing });
  assert.equal(seenDuringRender, 1); assert.equal(inflightRenders(), 0); assert.ok(samples.length > 0);
  class Failing extends FakeOffline { async startRendering() { throw new Error('encoder exploded'); } }
  await assert.rejects(() => renderPerformanceAudio(createPerformance(DEFAULT_PATCH), 8000, { OfflineContext: Failing }), /exploded/);
  assert.equal(inflightRenders(), 0);
});

test('renderPerformanceAudio sizes the offline context from the passage and fails clearly without one', async () => {
  const performance = createPerformance(DEFAULT_PATCH);
  const samples = await renderPerformanceAudio(performance, 8000, { OfflineContext: FakeOffline });
  assert.ok(samples instanceof Float32Array);
  assert.equal(samples.length, Math.ceil(performance.duration * 8000));
  assert.equal(FakeOffline.last.sampleRate, 8000);
  await assert.rejects(() => renderPerformanceAudio(performance, 48000, { OfflineContext: undefined }), /OfflineAudioContext is not available/);
  await assert.rejects(() => renderPerformanceAudio(performance, 0, { OfflineContext: FakeOffline }), /sampleRate/);
  await assert.rejects(() => renderPerformanceAudio({ ...performance, duration: NaN }, 48000, { OfflineContext: FakeOffline }), /duration/);
  assert.throws(() => buildPerformanceGraph(null, performance), /context/);
  assert.throws(() => buildPerformanceGraph(new Context(), {}), /events/);
});
