import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {createLivingJourneyChoreography} from '../src/living/journey-choreography.js';
import {livingStrikerPose} from '../src/living/striker-geometry.js';

test('every actual journey touch has one exact contact and a recovery before the next approach',()=>{
 for(const make of [createLivingJourneyStudy,createLivingConnectedJourneyStudy,createLivingEvolvingJourneyStudy])for(const seed of [0,42,2950288811,0xffffffff]){
  const journey=make(seed),c=createLivingJourneyChoreography(journey);
  const expected=new Map(c.score.passes.flatMap(p=>p.touches.map((e,i)=>[`${p.id}:${i}`,{frame:e.frame,strength:e.strength,body:p.bodyMm}]))),seen=new Set();
  for(const plan of c.plans){
   assert.equal(plan.unplanned.length,0);
   for(const actor of plan.actors){
    let previousEnd=-Infinity;
    for(const assignment of actor.assignments){
     const original=expected.get(assignment.eventId);assert.ok(original);assert.ok(!seen.has(assignment.eventId));seen.add(assignment.eventId);
     assert.equal(assignment.noteOn,original.frame/journey.sampleRate);assert.equal(assignment.velocity,original.strength);
     assert.ok(assignment.arriveBy>=previousEnd);previousEnd=assignment.leaveAt;
     const at=t=>c.at(t).find(a=>a.id===actor.id),contact=at(assignment.noteOn);
     assert.equal(contact.bodyMm,original.body);assert.equal(contact.eventId,assignment.eventId);assert.equal(contact.down,1);
     assert.ok(at(assignment.noteOn-1e-7).down>1-1e-9);assert.ok(at(assignment.noteOn+1e-7).down>1-1e-9);
     assert.equal(at(assignment.leaveAt).down,0);
     const pose=livingStrikerPose(contact.bodyMm,contact.down,contact.lane,contact.headRadius);
     assert.ok(Math.abs(pose.head[1]-contact.headRadius-3.55)<1e-12);
    }
   }
  }
  assert.equal(seen.size,expected.size);
  for(const body of [0,1,2]){
   const actors=c.actors.filter(a=>a.body===body);
   for(let i=1;i<actors.length;i++)assert.ok(actors[i].lane-actors[i-1].lane>actors[i].headRadius+actors[i-1].headRadius);
  }
  assert.ok(c.at(journey.frames/journey.sampleRate).every(a=>a.down===0));
  const moments=[.35,journey.frames/journey.sampleRate/2,journey.frames/journey.sampleRate];
  const poses=moments.map(t=>c.at(t));assert.deepEqual(moments.toReversed().map(t=>c.at(t)).reverse(),poses);
 }
});

test('journey choreography refuses out-of-range time and falsely directed impulses',()=>{
 const journey=createLivingConnectedJourneyStudy(42),c=createLivingJourneyChoreography(journey);
 for(const t of [-1,NaN,Infinity,journey.frames/journey.sampleRate+1])assert.throws(()=>c.at(t),/outside/);
 const changed=structuredClone(journey);changed.sections[0].arrangement.bodies[0].events[0].strength=-.05;
 assert.throws(()=>createLivingJourneyChoreography(changed),/positive/);
});
