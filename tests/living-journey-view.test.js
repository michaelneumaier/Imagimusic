import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyView} from '../src/living/journey-view.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingResponse} from '../src/living/response.js';
import {createTineDampedRelease} from '../src/tine/damped-release.js';

test('each instance uses its actual source and release clock, with a separate ending fade',()=>{
 for(const make of [createLivingJourneyStudy,createLivingConnectedJourneyStudy,createLivingEvolvingJourneyStudy])for(const seed of [42,2950288811]){
  const journey=make(seed),view=createLivingJourneyView(journey),rate=journey.sampleRate;
  for(const pass of view.score.passes){
   const instance=view.allocation.assignments.find(a=>a.passId===pass.id).instance;
   const arrangement=journey.sections[pass.section].arrangement,body=arrangement.bodies.findIndex(b=>b.design.lengthMm===pass.bodyMm),record=arrangement.bodies[body];
   const original=createLivingResponse(record.design,rate);record.events.forEach(e=>original.accept(e));
   const release=arrangement.releases?.[body],damped=release?createTineDampedRelease(record,release):null;
   const moments=[record.events[0].frame-1,record.events[0].frame-.25,record.events[0].frame,record.events[0].frame+.25,record.events.at(-1).frame+100,record.fadeStart+600];
   if(release)moments.push(release.startFrame-1,release.startFrame+1);
   for(const local of moments){
    const seconds=(pass.startFrame+local)/rate,frame=view.at(seconds).instances[instance],actualLocal=seconds-pass.startFrame/rate;
    assert.equal(frame.passId,pass.id);
    // Compare at the exact local clock returned by the view, avoiding a
    // separate floating-point subtraction order for high-frequency modes.
    assert.ok(Math.abs(frame.localSeconds-actualLocal)<1e-12);
    if(local<record.events[0].frame){assert.equal(frame.points,null);assert.equal(frame.touched,false);}
    else assert.deepEqual(frame.points,(release&&frame.localSeconds*rate>=release.startFrame?damped:original).at(frame.localSeconds).points);
    assert.ok(frame.endingOpacity>=0&&frame.endingOpacity<=1);
    if(local===record.fadeStart+600)assert.ok(Math.abs(frame.endingOpacity-.5)<1e-10);
   }
  }
  const end=view.at(journey.frames/rate);
  assert.ok(end.instances.every(i=>i.points===null&&i.passId===null));assert.equal(end.touches,end.totalTouches);
 }
});

test('both independent responses survive a same-length overlap and sampling has no history',()=>{
 const journey=createLivingEvolvingJourneyStudy(42),view=createLivingJourneyView(journey),passes=view.score.passes;
 let overlaps=0;
 for(let i=0;i<passes.length;i++)for(const b of passes.slice(i+1)){
  const a=passes[i];if(a.bodyMm!==b.bodyMm)continue;
  const start=Math.max(a.touches[0].frame,b.touches[0].frame),end=Math.min(a.endFrame,b.endFrame);
  if(end<=start)continue;overlaps++;
  const seconds=(start+end)/2/journey.sampleRate,frame=view.at(seconds);
  const both=frame.instances.filter(x=>[a.id,b.id].includes(x.passId));
  assert.equal(both.length,2);assert.notEqual(both[0].id,both[1].id);
  assert.ok(both.every(x=>x.touched&&x.points.some(p=>p.boundM>0)));
  view.at(0);view.at(journey.frames/journey.sampleRate);assert.deepEqual(view.at(seconds),frame);
 }
 assert.equal(overlaps,5);
 for(const seconds of [-1,NaN,Infinity,journey.frames/journey.sampleRate+1])assert.throws(()=>view.at(seconds),/outside/);
});
