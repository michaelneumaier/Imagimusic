import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingAttentionView} from '../src/living/attention-view.js';
import {createLivingArrangement} from '../src/living/arrangement.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';

test('attention changes only camera composition and samples deterministically in either direction',()=>{
 for(const {source} of [...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()])for(const version of [1,2]){
  const plan=createLivingArrangement(source,version),director=createLivingAttentionView(plan),base=createLivingArrangementView(plan),duration=plan.frames/plan.sampleRate,frames=[];
  for(let t=0;t<=duration;t+=.07){
   const result=director.at(t),{cameraShot,...unchanged}=result;assert.deepEqual(unchanged,base.at(t));
   assert.ok([...cameraShot.target,...cameraShot.direction,cameraShot.radius].every(Number.isFinite));assert.ok(cameraShot.radius>=6.6-1e-12&&cameraShot.radius<=16+1e-12);assert.ok(Math.abs(Math.hypot(...cameraShot.direction)-1)<1e-12);frames.push([t,result]);
  }
  for(const [t,result] of frames.reverse())assert.deepEqual(director.at(t),result);
  for(const t of [-1,NaN,Infinity,duration+1])assert.throws(()=>director.at(t),/outside/);
 }
});
test('spacious answer anticipates and holds a complete phrase then returns to the original composition',()=>{
 const source=createLivingGeneratedStudyFixtures()[0].source,plan=createLivingArrangement(source,2),director=createLivingAttentionView(plan),first=plan.voices[1],onset=(first.startFrame+source.events[0].frame)/plan.sampleRate;
 const prior=director.at(onset-.4).cameraShot,contact=director.at(onset).cameraShot;
 assert.ok(prior.target[0]<3);assert.equal(contact.target[0],-11+95/20);assert.equal(contact.radius,9);
 assert.equal(director.at(onset+.1).cameraShot.target[0],contact.target[0]);
 for(const t of [0,plan.frames/plan.sampleRate])assert.deepEqual(director.at(t).cameraShot.target,[3.5,2,0]);
 // Every transition and every score contact remains position-continuous.
 for(const voice of plan.voices.filter(v=>v.part==='answer')){
  const first=(voice.startFrame+source.events[0].frame)/plan.sampleRate,last=(voice.startFrame+source.events.at(-1).frame)/plan.sampleRate;
  for(const t of [first-.8,first,last+.3,last+1.1]){
   const a=director.at(t-1e-6).cameraShot,b=director.at(t+1e-6).cameraShot;
   assert.ok(Math.hypot(...a.target.map((v,i)=>v-b.target[i]))<.001);assert.ok(Math.abs(a.radius-b.radius)<.001);
  }
 }
});

test('radius velocity is continuous when equally weighted answers exchange attention',()=>{
 for(const {source} of createLivingGeneratedStudyFixtures()){
  const plan=createLivingArrangement(source,2),view=createLivingAttentionView(plan);
  for(const i of [1,2]){
   const last=(plan.voices[i].startFrame+source.events.at(-1).frame)/plan.sampleRate;
   const next=(plan.voices[i+1].startFrame+source.events[0].frame)/plan.sampleRate;
   const t=(last+.3+next)/2;
   const jump=h=>{const a=view.at(t-h).cameraShot.radius,b=view.at(t).cameraShot.radius,c=view.at(t+h).cameraShot.radius;return Math.abs((c-b)/h-(b-a)/h);};
   // A genuine corner has a nonzero limiting velocity jump as h shrinks.
   assert.ok(jump(1e-5)<.001);assert.ok(jump(1e-5)<jump(1e-3)/50);
  }
 }
});
