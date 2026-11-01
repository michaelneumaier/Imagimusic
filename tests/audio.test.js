import test from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentAudio, MAX_VOICES, STEAL_FADE, voiceLevel } from '../src/audio.js';
import { DEFAULT_PATCH } from '../src/model.js';
class Parameter {
  setValueCurveAtTime(curve, time, duration) { this.curve = curve; this.duration = duration; }
  exponentialRampToValueAtTime(value, time) { this.target = { value, time }; }
  cancelScheduledValues() {}
  setValueAtTime(value, time) { this.value = value; this.set = { value, time }; }
  linearRampToValueAtTime(value, time) { this.target = { value, time }; }
}
class Node {
  constructor() { this.gain = new Parameter(); this.pan = new Parameter(); this.frequency = new Parameter(); }
  connect(node) { return node; }
  disconnect() { this.disconnected = true; }
  start(time) { this.startTime = time; }
  stop(time) { this.stopTime = time; }
}
class Context {
  currentTime = 1; sampleRate = 48000; destination = new Node(); panners = 0; gains = [];
  createGain() { const node = new Node(); this.gains.push(node); return node; }
  createDynamicsCompressor() { return new Node(); }
  createStereoPanner() { this.panners++; return new Node(); }
  createOscillator() { return new Node(); }
  async resume() {}
}
test('voice cap fades retired sound and image together, with one panner per voice', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  const oldest = engine.strike(0, DEFAULT_PATCH);
  for (let i = 0; i < MAX_VOICES; i++) engine.strike(i % 8, DEFAULT_PATCH);
  assert.equal(engine.voices.length, MAX_VOICES);
  assert.equal(engine.context.panners, MAX_VOICES + 1);
  assert.equal(oldest.end, engine.time + STEAL_FADE);
  assert.equal(oldest.gain.gain.target.value, 0);
  assert.ok(oldest.nodes.every(node => node.stopTime === oldest.end));
  assert.equal(voiceLevel(oldest, oldest.end), 0);
  assert.ok(Math.abs(voiceLevel(oldest, engine.time + STEAL_FADE / 2) - .5) < 1e-12);
  engine.stop(); assert.equal(engine.voices.length, 0);
});
test('live attacks retain four-millisecond detail and invalid notes allocate nothing', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  assert.equal(engine.strike(-1, DEFAULT_PATCH), null);
  assert.equal(engine.strike(0, DEFAULT_PATCH, 0), null);
  engine.strike(0, DEFAULT_PATCH);
  const modalGains = engine.context.gains.filter(node => node.gain.curve);
  assert.equal(modalGains.length, 5);
  assert.ok(modalGains.every(node => node.gain.duration === .004 && node.gain.curve[0] === 0 && node.gain.curve.at(-1) > 0));
});

test('holding a damper suppresses retriggering and releasing it permits a fresh strike', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  const voice = engine.strike(0, DEFAULT_PATCH);
  engine.damp(0, true, .18);
  assert.equal(voice.fadeDuration, .18 + 1 - 1);
  assert.equal(engine.strike(0, DEFAULT_PATCH), null);
  assert.ok(engine.strike(1, DEFAULT_PATCH));
  engine.damp(0, false);
  assert.ok(engine.strike(0, DEFAULT_PATCH));
});
test('silenced modes keep their indices for visualization but allocate no oscillators', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  const voice = engine.strike(0, DEFAULT_PATCH, .8, engine.time, .5);
  assert.equal(voice.modes.length, 5);
  assert.equal(voice.nodes.length, 3);
  assert.ok(voice.modes[1].amplitude < 1e-12);
  assert.equal(engine.strike(0, DEFAULT_PATCH, .8, engine.time, 0), null);
});
test('releasing an almost-ended voice keeps audio and visual fade times equal', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  const voice = engine.strike(0, DEFAULT_PATCH);
  engine.context.currentTime = voice.end - .01;
  engine.retire(voice, .18);
  assert.ok(Math.abs(voice.fadeDuration - .01) < 1e-12);
  assert.equal(voiceLevel(voice, voice.end), 0);
  engine.context.currentTime = voice.end + 1;
  engine.stop(); // No negative duration ramp on already-ended voices.
});

test('a damper can cancel a future strike and its ended callbacks release the graph', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  const voice = engine.strike(0, DEFAULT_PATCH, .8, engine.time + 1);
  engine.damp(0, true, .1);
  assert.ok(voice.end < voice.time);
  assert.ok(voice.nodes.every(node => node.stopTime < node.startTime));
  voice.nodes.forEach(node => node.onended());
  assert.ok(voice.gain.disconnected);
  assert.ok(voice.nodes.every(node => node.disconnected));
});


test('modal gains become exactly silent at the original source cutoff', async () => {
  globalThis.AudioContext = Context;
  const engine = new InstrumentAudio(); await engine.enable();
  const voice = engine.strike(0, DEFAULT_PATCH);
  const gains = engine.context.gains.filter(node => node.gain.curve);
  assert.equal(gains.length, voice.nodes.length);
  gains.forEach((node, i) => {
    assert.equal(node.gain.set.value, 0);
    assert.equal(node.gain.set.time, voice.nodes[i].stopTime);
    assert.equal(node.gain.target.time, node.gain.set.time);
    assert.ok(node.gain.target.value > 0);
  });
});
