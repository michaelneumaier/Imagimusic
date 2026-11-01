import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH, validatePatch } from '../src/model.js';
import { BellowsAudio, bellowsState, bellowsScore, planBellowsVoices, createBellowsGraph, applyBellowsSchedule } from '../src/bellows-audio.js';
import { voiceDynamics } from '../src/dynamics.js';
class Parameter {
  events = [];
  setValueAtTime(value,t) { this.events.push({value,t,kind:'set'}); }
  linearRampToValueAtTime(value,t) { this.events.push({value,t,kind:'ramp'}); }
  cancelScheduledValues(t) { this.events = this.events.filter(e=>e.t<t); }
}
class Node {
  gain = new Parameter(); frequency = new Parameter(); Q = new Parameter();
  connect(node) { return node; } disconnect() { this.disconnected = true; }
  start(t) { this.startTime=t; } stop(t) { this.stopTime=t; }
}
class Context {
  currentTime = 1; sampleRate = 48000;
  createGain() { return new Node(); } createBiquadFilter() { return new Node(); }
  createOscillator() { return new Node(); } createBufferSource() { const node = new Node(); delete node.frequency; node.playbackRate = new Parameter(); return node; }
  createBuffer(channels,length) { const data = new Float32Array(length); return { getChannelData:()=>data }; }
}
test('bellows patch migrates prior versions and rejects invalid control values', () => {
  const older = {...DEFAULT_PATCH,version:3}; delete older.bellows;
  assert.deepEqual(validatePatch(older).bellows, DEFAULT_PATCH.bellows);
  assert.throws(()=>validatePatch({...DEFAULT_PATCH,bellows:{...DEFAULT_PATCH.bellows,cutoffHz:Infinity}}));
});
test('gated note release and automation agree with the control model', () => {
  const context = new Context(), engine = new BellowsAudio(context,new Node());
  const voice = engine.noteOn(220,DEFAULT_PATCH,.7,1);
  context.currentTime=1.1; engine.noteOff(voice);
  const atRelease = voice.graph.gain.gain.events.find(e=>e.t===1.1);
  assert.equal(atRelease.value,voiceDynamics(1.1,voice,voice.patch,context.sampleRate).amp.level);
  assert.equal(voice.end,1.1+DEFAULT_PATCH.bellows.adsr.r);
  const end=voice.end; context.currentTime=1.2; engine.noteOff(voice); assert.equal(voice.end,end);
  voice.graph.source.onended(); assert.ok(voice.graph.filter.disconnected && voice.graph.gain.disconnected);
});
test('six chamber voice stealing fades from a frozen current amplitude and global stop catches retiring voices', () => {
  const context=new Context(), engine=new BellowsAudio(context,new Node());
  const first=engine.noteOn(220,DEFAULT_PATCH,.7,1);
  for(let i=1;i<6;i++)engine.noteOn(220+i*20,DEFAULT_PATCH,.7,1);
  context.currentTime=1.1;
  engine.noteOn(440,DEFAULT_PATCH,.7,1.2);
  assert.equal(engine.voices.length,6); assert.equal(new Set(engine.voices.map(v=>v.slot)).size,6);
  assert.equal(first.stolenAt,1.2);
  assert.deepEqual(bellowsState(first,1.1), voiceDynamics(1.1,first,first.patch,48000));
  const half=bellowsState(first,1.22).amp.level;
  assert.ok(Math.abs(half-first.stolenAmp*.5)<1e-10);
  engine.stop();
  assert.ok(engine.sounding.every(v=>v.end <= context.currentTime+.040000001));
});
test('offline six-voice allocation matches live planned score under long releases', () => {
  const patch=structuredClone(DEFAULT_PATCH);patch.bellows.adsr.r=8;
  const score=bellowsScore(patch), plan=planBellowsVoices(score,8);
  const context=new Context(), engine=new BellowsAudio(context,new Node());const actual=[];
  for(const event of score){context.currentTime=event.noteOn;engine.tick();actual.push(engine.noteOn(event.noteHz,patch,event.velocity,event.noteOn,event.noteOff));}
  for(let i=0;i<actual.length;i++){
    assert.equal(actual[i].slot,plan[i].slot);assert.equal(actual[i].end,plan[i].end);assert.equal(actual[i].stolenAt,plan[i].stolenAt);
  }
});
test('air source uses deterministic noise and reed maps to a square oscillator', () => {
  const context=new Context(), output=new Node(), voice={noteOn:1,noteOff:2,noteHz:220,velocity:.5};
  const patch=structuredClone(DEFAULT_PATCH);patch.bellows.source='air';
  const a=createBellowsGraph(context,output,voice,patch,123), b=createBellowsGraph(context,output,voice,patch,123);
  assert.deepEqual(a.source.buffer.getChannelData(0),b.source.buffer.getChannelData(0));
  assert.ok(a.source.buffer.getChannelData(0).some(v=>v!==0));
  patch.bellows.lfo.target='pitch';
  applyBellowsSchedule(a,voice,patch,48000,1,1.2);
  assert.ok(a.source.playbackRate.events.some(e=>Math.abs(e.value-1)>.01));
  assert.equal(a.source.playbackRate.events[0].value,1);
  patch.bellows.source='reed';assert.equal(createBellowsGraph(context,output,voice,patch).source.type,'square');
});
test('late control tick continues the prior automation window without skipping its boundary', () => {
  const context=new Context(), engine=new BellowsAudio(context,new Node());
  const voice=engine.noteOn(220,DEFAULT_PATCH,.7,1);
  const boundary=voice.scheduledUntil, count=voice.graph.gain.gain.events.length;
  context.currentTime=boundary+.4; engine.tick();
  const events=voice.graph.gain.gain.events;
  assert.equal(events[count].t,boundary);
  for(let i=1;i<events.length;i++) assert.ok(events[i].t>=events[i-1].t);
  assert.ok(voice.scheduledUntil>context.currentTime);
});
