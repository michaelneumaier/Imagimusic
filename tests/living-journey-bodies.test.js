import test from 'node:test';
import assert from 'node:assert/strict';
import {allocateLivingJourneyBodies} from '../src/living/journey-bodies.js';
import {createLivingJourneyScore} from '../src/living/journey-score.js';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';

test('every pass receives an independent overlapping-time instance, with the minimum number per length',()=>{
 for(const make of [createLivingJourneyStudy,createLivingConnectedJourneyStudy,createLivingEvolvingJourneyStudy])for(const seed of [0,42,2950288811,0xffffffff]){
  const score=createLivingJourneyScore(make(seed)),before=structuredClone(score),a=allocateLivingJourneyBodies(score);
  assert.deepEqual(score,before);assert.deepEqual(a,allocateLivingJourneyBodies(score));
  assert.equal(a.assignments.length,score.passes.length);assert.equal(new Set(a.assignments.map(x=>x.passId)).size,score.passes.length);
  for(const instance of a.instances){
   const passes=instance.passIds.map(id=>score.passes.find(p=>p.id===id));
   assert.ok(passes.every(p=>p.bodyMm===instance.bodyMm));
   for(let i=1;i<passes.length;i++)assert.ok(passes[i].startFrame>=passes[i-1].endFrame);
   for(const pass of passes)assert.equal(a.assignments.find(x=>x.passId===pass.id).instance,instance.id);
  }
  for(const length of [80,95,65]){
   const passes=score.passes.filter(p=>p.bodyMm===length);
   const peak=Math.max(...passes.map(p=>passes.filter(q=>q.startFrame<=p.startFrame&&q.endFrame>p.startFrame).length));
   assert.equal(a.instances.filter(i=>i.bodyMm===length).length,peak);
  }
 }
});

test('an exact ending can be reused but simultaneous starts cannot share one body',()=>{
 const passes=[{id:0,bodyMm:80,startFrame:10,endFrame:20},{id:1,bodyMm:80,startFrame:10,endFrame:30},{id:2,bodyMm:80,startFrame:20,endFrame:30}];
 const a=allocateLivingJourneyBodies({passes:passes.toReversed()});
 assert.equal(a.instances.length,2);
 assert.deepEqual(a.instances[0].passIds,[0,2]);assert.deepEqual(a.instances[1].passIds,[1]);
 assert.ok(Object.isFrozen(a.instances[0].passIds));
});
