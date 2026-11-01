import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH } from '../src/model.js';
import { createPerformance } from '../src/stage/performance.js';
import { createProjection, stageBindings } from '../src/stage/projection.js';
import { collectState, traceHash } from '../src/state.js';
import { applyBindings } from '../src/bindings.js';
import { FrameClock } from '../src/clock.js';
test('stage timeline is plain serializable data and samples identically after arbitrary seeks',()=>{
  const score=createPerformance(DEFAULT_PATCH),restored=JSON.parse(JSON.stringify(score.snapshots)),project=createProjection(score.patch);
  const clock=new FrameClock(),times=clock.times(3),forward=times.map(t=>traceHash(project(collectState(t,score.snapshots))));
  const reverse=times.toReversed().map(t=>traceHash(project(collectState(t,restored)))).reverse();
  assert.deepEqual(reverse,forward);assert.ok(new Set(forward).size>100);
  const bindings=stageBindings();
  for(const t of [0,.17,.35,.5,2,score.duration]){
    const results=applyBindings(project(collectState(t,restored)),bindings,()=>{});
    assert.ok(results.every(r=>!r.missing));
    assert.ok(!JSON.stringify(results).includes('null'));
  }
});
test('stage modal projection sums overlapping strikes and resets when silent',()=>{
  const score=createPerformance(DEFAULT_PATCH),first=score.snapshots.garden.voices[0];
  const single={garden:{voices:[first]}},double={garden:{voices:[first,{...first,id:'overlap'}]}};
  const project=createProjection(score.patch),t=first.noteOn+.03;
  const a=project(collectState(t,single)).stage.garden[0],b=project(collectState(t,double)).stage.garden[0];
  for(let i=0;i<5;i++)assert.ok(Math.abs(b.energies[i]-2*a.energies[i])<1e-12);
  const idle=project(collectState(score.duration,double)).stage.garden[0];assert.ok(idle.energies.every(e=>e===0));assert.equal(idle.visible,false);
});

test('laboratory transfer validates patches and preserves geometry and Bellows controls',async()=>{
  const {storeStagePatch,readStagePatch}=await import('../src/stage/exchange.js');
  const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null};
  assert.throws(()=>readStagePatch(storage),/No laboratory/);
  const patch=structuredClone(DEFAULT_PATCH);patch.seed=1234;patch.geometry.lengthM=.08;patch.bellows.source='air';
  storeStagePatch(storage,patch);assert.deepEqual(readStagePatch(storage),patch);
  const before=data.values().next().value;assert.throws(()=>storeStagePatch(storage,{...patch,tempo:Infinity}));assert.equal(data.values().next().value,before);
});

test('scheduled live voices match the visual score at both audio sample rates, including steals',async()=>{
  const {InstrumentAudio}=await import('../src/audio.js');
  const {BellowsAudio}=await import('../src/bellows-audio.js');
  class Param {setValueCurveAtTime(){} exponentialRampToValueAtTime(){} cancelScheduledValues(){} setValueAtTime(){} linearRampToValueAtTime(){}}
  class Node {gain=new Param();pan=new Param();frequency=new Param();Q=new Param();connect(n){return n;}disconnect(){}start(){}stop(){}}
  class Context {currentTime=0;createGain(){return new Node();}createStereoPanner(){return new Node();}createOscillator(){return new Node();}createBiquadFilter(){return new Node();}}
  const patch=structuredClone(DEFAULT_PATCH);patch.bellows.adsr.r=8;patch.tempo=140;
  for(const sampleRate of [44100,48000]){
    const score=createPerformance(patch,sampleRate),context=new Context();context.sampleRate=sampleRate;
    const audio=new InstrumentAudio();audio.context=context;audio.master=new Node();
    const choir=new BellowsAudio(context,audio.master),pairs=[],origin=7;
    for(const event of score.events){
      const v=event.voice;context.currentTime=origin+v.noteOn-.2;choir.tick();
      if(event.family==='bellows'){
        const actual=choir.noteOn(v.noteHz,patch,v.velocity,origin+v.noteOn,origin+v.noteOff,(patch.seed+v.id*997)>>>0);pairs.push([v,actual]);
      }else{
        const actual=audio.strike(v.slot,patch,v.velocity,origin+v.noteOn,v.position);
        assert.deepEqual(actual.modes.map(({frequency,amplitude,decay})=>({frequency,amplitude,decay})),v.modes);
        assert.ok(Math.abs(actual.end-origin-v.end)<1e-10);
      }
    }
    for(const [planned,actual] of pairs){assert.equal(actual.slot,planned.slot);assert.ok(Math.abs(actual.end-origin-planned.end)<1e-10);if(planned.stolenAt===undefined)assert.equal(actual.stolenAt,undefined);else assert.ok(Math.abs(actual.stolenAt-origin-planned.stolenAt)<1e-10);}
  }
});
