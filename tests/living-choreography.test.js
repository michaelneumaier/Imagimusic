import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingGreeting} from '../src/living/greeting.js';
import {createLivingChoreography} from '../src/living/choreography.js';

test('known score contacts land exactly, stay bounded, and recover continuously',()=>{
 for(const treatment of ['round','spaced']){
  const c=createLivingChoreography(createLivingGreeting(),treatment);
  assert.equal(c.actors.length,3);
  for(const p of c.plans)for(const actor of p.actors)for(const a of actor.assignments){
   const at=t=>c.at(t).find(x=>x.id===actor.id);
   assert.equal(at(a.noteOn).down,1);assert.equal(at(a.noteOn).eventId,a.eventId);
   assert.ok(at(a.noteOn-1e-7).down>1-1e-9);assert.ok(at(a.noteOn+1e-7).down>1-1e-9);
   assert.equal(at(a.leaveAt).down,0);
  }
  for(let t=0;t<c.score.frames/c.score.sampleRate;t+=.013)for(const a of c.at(t))assert.ok(a.down>=0&&a.down<=1);
  assert.ok(c.at(c.score.frames/c.score.sampleRate).every(a=>a.down===0));
 }
});

test('dense and simultaneous touches get distinct available actors without lost contacts',()=>{
 for(const frames of [[0,0,0,0,0,0,0,0],[24000,25200,26400,27600,28800,30000,31200,32400]]){
  const source={...createLivingGreeting(),events:frames.map(frame=>({frame,strength:.025}))},before=structuredClone(source),c=createLivingChoreography(source);
  assert.deepEqual(source,before);
  assert.equal(c.plans.reduce((n,p)=>n+p.actors.reduce((m,a)=>m+a.assignments.length,0),0),40);
  for(const p of c.plans){assert.equal(p.unplanned.length,0);for(const a of p.actors)for(const e of a.assignments)assert.equal(c.at(e.noteOn).find(x=>x.id===a.id).down,1);}
  for(const body of [0,1,2]){const lanes=c.actors.filter(a=>a.body===body).map(a=>a.lane);assert.equal(new Set(lanes).size,lanes.length);}
 }
});

test('contact study refuses unsupported input rather than drawing a false direction',()=>{
 const s=createLivingGreeting();
 for(const strength of [0,-.025])assert.throws(()=>createLivingChoreography({...s,events:[{frame:24000,strength}]}),/positive impulses/);
 assert.throws(()=>createLivingChoreography(s,'other'),/Unknown/);
 const c=createLivingChoreography(s);for(const t of [-1,NaN,Infinity,100])assert.throws(()=>c.at(t),/outside/);
});


test('rendered striker head reaches the blade top at85percent span without penetrating it',async()=>{
 const {livingStrikerPose,STRIKER_GEOMETRY:g}=await import('../src/living/striker-geometry.js');
 for(const length of [65,80,95])for(const lane of [-.35,0,.35]){
  const contact=livingStrikerPose(length,1,lane);
  assert.ok(Math.abs(contact.head[0]-.85*length/10)<1e-12);
  assert.ok(Math.abs(contact.head[1]-g.headRadius-3.55)<1e-12);
  assert.ok(Math.abs(contact.head[2])+g.headRadius<=.5);
  for(let i=0;i<=100;i++)assert.ok(livingStrikerPose(length,i/100,lane).head[1]-g.headRadius>=3.55-1e-12);
 }
});

test('dense rigs have disjoint moving lane envelopes while every head still reaches the blade',async()=>{
 const {livingStrikerPose}=await import('../src/living/striker-geometry.js');
 const {createLivingStudyFixtures}=await import('../src/living/study-fixtures.js');
 for(const fixture of createLivingStudyFixtures()){
  const c=createLivingChoreography(fixture.source);
  for(const body of [0,1,2]){
   const actors=c.actors.filter(a=>a.body===body);
   for(let i=1;i<actors.length;i++)assert.ok(actors[i].lane-actors[i-1].lane>actors[i].headRadius+actors[i-1].headRadius);
   for(const actor of actors){
    // Heads, joint balls and counterweights fit this radius in z; shaft radii are .025 drawing units.
    assert.ok(actor.headRadius>=.025);
    const p=livingStrikerPose(c.score.bodies[body].design.lengthMm,1,actor.lane,actor.headRadius);
    assert.ok(Math.abs(p.head[1]-actor.headRadius-3.55)<1e-12);
    assert.ok(Math.abs(p.head[2])+actor.headRadius<.5);
   }
  }
 }
});
