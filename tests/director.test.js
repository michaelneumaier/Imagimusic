import test from 'node:test';
import assert from 'node:assert/strict';
import {createDirector} from '../src/stage/director.js';
import {createPerformance} from '../src/stage/performance.js';
import {createProjection,stageBindings} from '../src/stage/projection.js';
import {createTraceManifest,compareManifests} from '../src/stage/manifest.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {stagePosition} from '../src/stage/layout.js';

test('camera paths are bounded and seek-independent, with smooth score attention',()=>{
 const passage=createPerformance(DEFAULT_PATCH),direct=createDirector(passage);
 for(const mode of ['establish','follow','detail']){
  const expected=direct(3,mode);direct(29,mode);direct(0,mode);assert.deepEqual(direct(3,mode),expected);
  let previous;
  for(let t=0;t<passage.duration;t+=1/60){const pose=direct(t,mode);assert.ok([...pose.position,...pose.target].every(Number.isFinite));assert.ok(pose.position[1]>2);if(previous)assert.ok(Math.hypot(...pose.position.map((v,i)=>v-previous.position[i]))<.12);previous=pose;}
 }
 const manual={position:[1,2,3],target:[0,1,0]};assert.deepEqual(direct(10,'manual',manual),manual);assert.notEqual(direct(10,'manual',manual).position,manual.position);
 assert.deepEqual(stagePosition('tine'),[-1.6,0,4.1]);
});

test('camera direction participates in export hashes and declared bindings',()=>{
 const passage=createPerformance(DEFAULT_PATCH);passage.duration=1;
 const base=createProjection(DEFAULT_PATCH),direct=createDirector(passage);
 const project=mode=>frame=>{const out=base(frame);out.stage.camera=direct(frame.t,mode);return out;};
 const a=createTraceManifest(passage,{project:project('follow')});
 assert.equal(compareManifests(a,createTraceManifest(passage,{project:project('follow')})).equal,true);
 assert.equal(compareManifests(a,createTraceManifest(passage,{project:project('establish')})).equal,false);
 const binding=stageBindings({camera:true}).find(b=>b.target==='camera');assert.equal(binding.field,'stage.camera');
});

test('legacy follow poses retain their pre-cadence digest at 240 timestamps',async()=>{
 const {createHash}=await import('node:crypto');
 const p=createPerformance(DEFAULT_PATCH),d=createDirector(p);
 const poses=Array.from({length:240},(_,i)=>d(i*p.duration/239,'follow'));
 assert.equal(createHash('sha256').update(JSON.stringify(poses)).digest('hex'),'9882bd8f58fabcea4cef6dc34e7b2d5820e21e880f0df84c1f2b89e65d0cf46b');
});

test('conversation camera stays smooth, seek-independent, and widens the opening and release',async t=>{
 const {composeConversation,beatSeconds}=await import('../src/score/conversation.js');
 const {createScorePerformance}=await import('../src/stage/score-performance.js');
 const {DEFAULT_COMPOSITION}=await import('../src/stage/composition.js');
 const {DEFAULT_TENSIONER}=await import('../src/fm.js');
 const composition={...DEFAULT_COMPOSITION,version:2,loom:{...DEFAULT_COMPOSITION.loom,enabled:true},fm:{enabled:true,settings:DEFAULT_TENSIONER}};
 for(const character of ['calm','bright','restless']){
  const score=composeConversation({character}),p=createScorePerformance(DEFAULT_PATCH,score,composition),direct=createDirector(p);
  let last,maxStep=0,maxRadius=0;
  const spans=[[],[],[]];
  for(let time=0;time<=p.duration;time+=1/240){
   const pose=direct(time,'follow');assert.ok([...pose.position,...pose.target].every(Number.isFinite));
   if(last)maxStep=Math.max(maxStep,Math.hypot(...pose.position.map((v,i)=>v-last.position[i])),Math.hypot(...pose.target.map((v,i)=>v-last.target[i])));
   maxRadius=Math.max(maxRadius,Math.hypot(...pose.position));last=pose;
   const distance=Math.hypot(...pose.position.map((v,i)=>v-pose.target[i]));
   if(time<beatSeconds(score,16))spans[0].push(distance);
   else if(time<beatSeconds(score,48))spans[1].push(distance);
   else if(time>=beatSeconds(score,64)-4&&time<beatSeconds(score,64))spans[2].push(distance);
  }
  assert.ok(maxStep<.05,`max step ${maxStep}`);assert.ok(maxRadius<20,`radius ${maxRadius}`);
  const means=spans.map(values=>values.reduce((a,b)=>a+b)/values.length);
  assert.ok(means[0]>means[1]+1);assert.ok(means[2]>means[1]+2);
  for(const beat of [0,16,32,48,64]){
   const time=beatSeconds(score,beat),expected=direct(time,'follow');direct(p.duration,'follow');direct(0,'follow');assert.deepEqual(direct(time,'follow'),expected);
   const before=direct(time-1e-7,'follow'),after=direct(time+1e-7,'follow');assert.ok(Math.hypot(...after.position.map((v,i)=>v-before.position[i]))<1e-5);
  }
  t.diagnostic(JSON.stringify({character,maxStep,maxRadius,meanDistances:means}));
 }
});
