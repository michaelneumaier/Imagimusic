import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyMoviePlan} from '../src/living/journey-movie-plan.js';
import {createLivingJourneyView} from '../src/living/journey-view.js';
import {traceHash} from '../src/state.js';
const request=(treatment,seed=42)=>({kind:'imagimusic-living-journey-request',version:1,seed,treatment});

test('all three film sources use exact journey duration and independent live instance states',()=>{
 for(const treatment of ['chapters','connected','evolving']){
  const plan=createLivingJourneyMoviePlan(request(treatment)),m=plan.manifest,view=createLivingJourneyView(m.journey);
  assert.equal(m.audioSamples,m.journey.frames);
  assert.ok(m.videoDuration>=m.duration&&m.videoDuration-m.duration<1/30);
  assert.equal(m.frames,plan.times.length);
  assert.ok(plan.times.every((t,i)=>t===i/30&&t<m.duration));
  assert.equal(m.layout.instances.length,{chapters:3,connected:5,evolving:6}[treatment]);
  // Sample all frames in reverse to exercise random access rather than a second forward simulation.
  for(let i=plan.times.length-1;i>=0;i--){
   const t=plan.times[i],{cameraShot,...frame}=plan.sample(t);
   assert.deepEqual(frame,view.at(t));assert.deepEqual(cameraShot,m.layout.camera);
   assert.equal(traceHash(plan.sample(t),12),m.frameHashes[i]);
  }
  const final=plan.sample(m.duration);
  assert.equal(final.touches,final.totalTouches);assert.ok(final.instances.every(i=>i.passId===null&&i.points===null));
 }
});

test('film identity is isolated from caller edits and reveal leaves score and performers intact',()=>{
 const input=request('connected',2950288811),a=createLivingJourneyMoviePlan(input),b=createLivingJourneyMoviePlan(input,{reveal:false});
 input.seed=0;input.treatment='evolving';
 assert.equal(a.manifest.request.seed,2950288811);
 assert.equal(a.manifest.request.treatment,'connected');
 assert.throws(()=>{a.manifest.layout.camera.radius=1;},TypeError);
 assert.throws(()=>{a.manifest.journey.sections[0].source.events[0].strength=1;},TypeError);
 assert.deepEqual(a.manifest.journey,b.manifest.journey);assert.deepEqual(a.times,b.times);
 assert.notDeepEqual(a.manifest.frameHashes,b.manifest.frameHashes);
 for(const t of [1,5,10,b.manifest.duration]){
  const visible=a.sample(t),hidden=b.sample(t);
  assert.ok(hidden.instances.every(i=>i.points===null));
  assert.deepEqual(visible.performers,hidden.performers);
  assert.equal(visible.touches,hidden.touches);
 }
 assert.throws(()=>a.sample(-1));assert.throws(()=>a.sample(a.manifest.duration+1));
 assert.throws(()=>createLivingJourneyMoviePlan(request('unknown')));
 assert.throws(()=>createLivingJourneyMoviePlan(request('connected'),{reveal:'false'}));
});
