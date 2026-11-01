import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroveVoice, validateVoiceConfig, canonicalVoiceConfig, groveVoiceEnvelope, grovePans, voiceBufferIndex, DEFAULT_VOICE_CONFIG, VOICE_BOUNDS, PICKUP_LEVEL, GAIN_CEILING } from '../src/score/grove-voice.js';
import { composeGrove, groveSystem, GROVE_SEEDS } from '../src/score/grove.js';
import { networkPickupScale, networkPickupModes } from '../src/coupling.js';
import { createGroveInstrument, grovePerformanceFrame } from '../src/grove/performance.js';

const ORIGINAL = { version: 1, family: 'clamped-free', partials: 1, attachU: 1, pickupU: 1, positions: [1] };

test('partials 1 at the tip is exactly today\'s Grove: normal modes, pickup modes, stereo modes, scale and gain against createGroveInstrument', () => {
  for (const seed of GROVE_SEEDS) {
    const g = composeGrove({ seed }), voice = createGroveVoice(g, ORIGINAL), sys = groveSystem(g), inst = createGroveInstrument(g, 48000), scale = networkPickupScale(sys);
    for (let r = 0; r < 3; r++) assert.ok(Math.abs(voice.normalFreqsHz[r] - sys.normalFreqsHz[r]) < 1e-9 * sys.normalFreqsHz[r]);
    assert.ok(Math.abs(voice.pickupScale - scale) < 1e-9 * scale, `one scale (${voice.pickupScale} vs ${scale})`);
    for (let b = 0; b < 3; b++) for (let i = 0; i < 3; i++) { const mine = voice.pickupModes[0][b][i], theirs = networkPickupModes(sys, [0, 1, 2].map(k => (k === b ? 1 : 0)), i, { scale }); for (let r = 0; r < 3; r++) assert.ok(Math.abs(Math.abs(mine[r].amplitude) - Math.abs(theirs[r].amplitude)) < 1e-9 * (Math.abs(theirs[r].amplitude) + 1e-300)); }
    for (let b = 0; b < 3; b++) for (let ch = 0; ch < 2; ch++) for (let r = 0; r < 3; r++) assert.ok(Math.abs(Math.abs(voice.stereoModes[0][b][ch][r].amplitude) - Math.abs(inst.stereoModes[b][ch][r].amplitude)) < 1e-9 * (Math.abs(inst.stereoModes[b][ch][r].amplitude) + 1e-300));
    assert.ok(Math.abs(voice.outputGain - inst.outputGain) < 1e-12 && Math.abs(voice.worstUnitStereoBound - Math.max(...inst.stereoModes.flat().map(ch => ch.reduce((s, m) => s + Math.abs(m.amplitude), 0)))) < 1e-9);
    assert.deepEqual(voice.lowBandIndex, [0, 1, 2]);
    assert.deepEqual(voice.pans, grovePans(g)); assert.deepEqual(voice.pans, inst.pans);
    // the picture's quantity: the voice envelope equals the Grove's drawn envelope for the same strikes
    const events = [{ frame: 0, body: 0, velocity: 0.7 }, { frame: 24000, body: 2, velocity: 0.5 }];
    for (let t = 0; t < 3; t += 0.37) { const theirs = grovePerformanceFrame(inst, events, t).envelope, mine = groveVoiceEnvelope(voice, events.map(e => ({ time: e.frame / 48000, body: e.body, position: 0, velocity: e.velocity })), t); for (let i = 0; i < 3; i++) assert.ok(Math.abs(mine[i] - theirs[i]) < 1e-9 * (theirs[i] + 1e-12), `envelope at ${t}`); }
  }
});

test('the richer voice: one scale and one gain over every position × body × pickup; low band is the three fundamentals; frozen and sample-rate free; deterministic', () => {
  const g = composeGrove({ seed: 3 }), voice = createGroveVoice(g), again = createGroveVoice(g);
  assert.deepEqual(voice, again); assert.equal(voice.normalFreqsHz.length, 9); assert.deepEqual(voice.lowBandIndex, [0, 1, 2]);
  let peak = 0; for (const row of voice.pickupModes) for (const perBody of row) for (const modes of perBody) for (const m of modes) peak = Math.max(peak, Math.abs(m.amplitude));
  assert.ok(Math.abs(peak - PICKUP_LEVEL) < 1e-12, 'the pickup level is the largest modal amplitude over all positions, bodies and pickups');
  assert.ok(voice.outputGain === GAIN_CEILING / Math.max(1, voice.worstUnitStereoBound));
  assert.deepEqual(voice.positions, [0.3, 0.6, 1]); assert.equal(voiceBufferIndex(voice, 2, 1), 7); assert.throws(() => voiceBufferIndex(voice, 3, 0), /index the voice/); assert.equal(voice.pickupModes.length, 3); assert.equal(voice.stereoModes[0].length, 3); assert.equal(voice.stereoModes[0][0].length, 2);
  assert.throws(() => { voice.pickupScale = 1; }, TypeError); assert.throws(() => { voice.pickupModes[0][0][0][0].amplitude = 1; }, TypeError); assert.throws(() => { voice.config.positions.push(0.5); }, TypeError);
  assert.ok(!JSON.stringify(voice).includes('sampleRate'));
  assert.ok(/classical-damping approximation/.test(voice.damping) && Number.isFinite(voice.dampingResidual));
  // positions differ in which partials they excite: the near-tip strike carries more of the highest band than the inner one
  const share = p => { const modes = voice.pickupModes[p][0][0]; const high = modes.slice(6).reduce((s, m) => s + m.amplitude * m.amplitude, 0), all = modes.reduce((s, m) => s + m.amplitude * m.amplitude, 0); return high / all; };
  assert.ok(share(2) !== share(0), 'strike position changes the partial balance');
  const env = groveVoiceEnvelope(voice, [{ time: 0, body: 0, position: 1, velocity: 1 }], 0.3); assert.equal(env.length, 3); assert.ok(env.every(v => v >= 0));
  assert.throws(() => groveVoiceEnvelope(voice, [{ time: 0, body: 0, position: 3, velocity: 1 }], 0.1), /position must be an index/);
});

test('voice configuration validation and canonical form', () => {
  validateVoiceConfig(DEFAULT_VOICE_CONFIG); assert.equal(canonicalVoiceConfig(DEFAULT_VOICE_CONFIG), canonicalVoiceConfig(JSON.parse(canonicalVoiceConfig(DEFAULT_VOICE_CONFIG))));
  const bad = (f, re) => { const c = structuredClone(DEFAULT_VOICE_CONFIG); f(c); assert.throws(() => validateVoiceConfig(c), re); };
  bad(c => { c.partials = 5; }, /partials/); bad(c => { c.partials = 0; }, /partials/); bad(c => { c.family = 'string'; }, /family/);
  bad(c => { c.positions = [0.25]; }, /positions\[0\]/); bad(c => { c.positions = [0.6, 0.3]; }, /strictly increasing/); bad(c => { c.positions = []; }, /positions must hold/);
  bad(c => { c.attachU = 2; }, /attachU/); bad(c => { c.extra = 1; }, /unsupported field/); bad(c => { c.version = 2; }, /version/);
  assert.throws(() => createGroveVoice(composeGrove({ seed: 7 }), { ...DEFAULT_VOICE_CONFIG, positions: [0.5, 0.5] }), /strictly increasing/);
  assert.throws(() => createGroveVoice(composeGrove({ seed: 7 }), { ...DEFAULT_VOICE_CONFIG, attachU: 0 }), /node of the fundamental shape/);
  assert.throws(() => { VOICE_BOUNDS.positionRange[0] = 0; }, TypeError, 'bounds are deep-frozen');
  assert.throws(() => { VOICE_BOUNDS.partials.push(9); }, TypeError);
});

test('the position-aware greeting keeps its promise on every curated seed and compiles to runtime strikes', async () => {
  const { composeGroveVoiceGreeting, validateGroveVoiceGreeting, voiceGreetingStrikes, voiceGreetingDuration, VOICE_GREETING_BOUNDS } = await import('../src/score/grove-voice.js');
  const { groveNeighbors } = await import('../src/score/grove.js');
  for (const seed of GROVE_SEEDS) {
    const g = composeGrove({ seed }), greeting = composeGroveVoiceGreeting(g), { neighbor, third } = groveNeighbors(g);
    assert.deepEqual(composeGroveVoiceGreeting(g), greeting);
    const places = greeting.strikes.filter(k => k.beat < 9);
    assert.ok(places.every(k => k.body === 0) && places.map(k => k.position).join() === '0,0,1,1,2,2', 'one body, each place twice, ascending');
    assert.ok(greeting.strikes.find(k => k.body === third).beat > greeting.strikes.find(k => k.body === neighbor).beat);
    const strikes = voiceGreetingStrikes(greeting);
    assert.ok(strikes.every(s => s.time >= 0.35 && [0, 1, 2].includes(s.position) && s.velocity > 0 && s.velocity <= 1));
    const d = voiceGreetingDuration(greeting, g); assert.ok(d >= VOICE_GREETING_BOUNDS.minSeconds && d <= VOICE_GREETING_BOUNDS.maxSeconds, `${seed}: ${d}`);
    assert.ok(d - strikes.at(-1).time >= 5, 'at least five seconds of untouched ring');
    const rejects = (f, re) => { const c = structuredClone(greeting); f(c); assert.throws(() => validateGroveVoiceGreeting(c, g), re); };
    rejects(c => { c.strikes[0].body = 1; }, /touches body 0 only/);
    rejects(c => { c.strikes[2].position = 0; c.strikes[3].position = 0; }, /visit every strike position/);
    rejects(c => { [c.strikes[0].position, c.strikes[4].position] = [2, 0]; }, /ascending order/);
    rejects(c => { c.strikes.push({ id: 'late', beat: 22, body: 0, position: 0, velocity: 0.5, role: 'place' }); }, /nothing is touched in the silence/);
    rejects(c => { c.strikes.find(k => k.id === 'shared:3').body = 0; }, /all three bodies/);
    rejects(c => { c.strikes[0].position = 5; }, /index the voice positions/);
    rejects(c => { c.tempo = 40; }, /greeting lasts/);
  }
  assert.throws(() => composeGroveVoiceGreeting(composeGrove({ seed: 3 }), { ...DEFAULT_VOICE_CONFIG, positions: [0.6] }), /at least three strike positions/);
});
