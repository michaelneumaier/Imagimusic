import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryEnsembleStudy,createMemoryEnsemblePerformance} from '../src/living/memory-ensemble-study.js';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
const script=[{frame:48000,body:2,strength:.025},{frame:52800,body:0,strength:.1},{frame:86400,body:1,strength:-.05}];
function run(factory=createMemoryEnsemblePerformance,guests=[],blockSize=4096,quietFrame=null){
 const p=factory(),samples=new Float32Array(quietFrame===null?p.plan.frames:quietFrame+1200),events=[];let next=0;p.start();
 while(p.state!=='ended'){
  while(guests[next]?.frame===p.frame){const e=guests[next++],result=p.tryGuest(e.body,e.strength);assert.equal(result.admitted,true);events.push(...result.events);}
  if(p.frame===quietFrame)events.push(...p.quiet());
  const end=Math.min(samples.length,p.frame+blockSize,guests[next]?.frame??Infinity,p.frame<quietFrame?quietFrame:Infinity);events.push(...p.process(samples.subarray(p.frame,end)));
 }
 return {p,samples,events};
}
test('no participation leaves the complete established ensemble sound and histories unchanged',()=>{
 const a=run(),b=run(createContinuousEnsemblePerformance);assert.deepEqual(a.samples,b.samples);assert.deepEqual(a.p.records(),b.p.records());assert.deepEqual(a.p.plan.events,b.p.plan.events);assert.equal(a.p.memory.sealed,true);
});
test('three early gestures return on next voices then original voices without rewriting opening/home',()=>{
 const remembered=run(createMemoryEnsemblePerformance,script),joined=run(createContinuousEnsemblePerformance,script),{p,samples}=remembered;
 assert.deepEqual(samples.subarray(0,18.5*48000),joined.samples.subarray(0,18.5*48000));assert.notDeepEqual(samples,joined.samples);
 assert.deepEqual(p.plan.sections[0],joined.p.plan.sections[0]);assert.deepEqual(p.plan.sections[7],joined.p.plan.sections[7]);assert.equal(p.plan.contributions.length,3);
 for(const index of [3,6]){
  const expected=script.map(e=>({frame:index*6*48000+24000+e.frame-script[0].frame,strength:e.strength*(index===3?.65:.85),body:index===3?(e.body+1)%3:e.body}));assert.deepEqual(p.plan.sections[index].events,expected);
 }
 assert.deepEqual(renderContinuousEnsembleRecord({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:p.records()}).channels[0],samples);
 for(const size of [128,1001,16384]){const next=run(createMemoryEnsemblePerformance,script,size);assert.deepEqual(next.samples,samples);assert.deepEqual(next.events,remembered.events);assert.deepEqual(next.p.plan,p.plan);}
});
test('memory seals at six seconds, keeps only three early accepted guests, and honors early Quiet',()=>{
 assert.throws(()=>createMemoryEnsemblePerformance(42,{contributions:[]}),/accepted guest touches/);
 const more=[...script,{frame:200000,body:0,strength:.025},{frame:288000,body:1,strength:.025},{frame:500000,body:2,strength:.025}],full=run(createMemoryEnsemblePerformance,more);
 assert.equal(full.p.memory.contributions.length,3);assert.equal(full.events.filter(e=>e.origin==='guest').length,6);
 const boundary=run(createMemoryEnsemblePerformance,[{frame:288000,body:0,strength:.025}]);assert.equal(boundary.p.memory.contributions.length,0);
 const early=run(createMemoryEnsemblePerformance,script.slice(0,1),1001,96000);assert.equal(early.p.memory.sealed,false);assert.equal(early.p.memory.contributions.length,1);assert.equal(early.p.plan.contributions.length,0);
 const p=createMemoryEnsemblePerformance();p.start();p.tryGuest(0,.025);while(p.frame<288000)p.process(new Float32Array(Math.min(1001,288000-p.frame)));assert.equal(p.memory.sealed,true);assert.equal(p.plan.contributions.length,1);
});
test('spatial memory handles simultaneous local indices, compressed spans and immutable inputs',()=>{
 const contributions=[{frame:0,strength:.05,index:0,origin:'guest',body:2},{frame:0,strength:-.025,index:0,origin:'guest',body:0},{frame:240000,strength:.05,index:1,origin:'guest',body:2}],plan=createMemoryEnsembleStudy(42,{contributions});
 assert.equal(plan.timeScale,.6);assert.deepEqual(plan.sections[3].events.map(e=>[e.body,e.frame]),[[0,888000],[1,888000],[0,1032000]]);
 contributions[0].strength=.1;assert.equal(plan.contributions[0].strength,.05);assert.ok(Object.isFrozen(plan.sections[3].events));
 for(const change of [x=>x.body=3,x=>x.frame=-1,x=>x.index=-1,x=>x.strength=0,x=>x.frame=288000]){const input=structuredClone(plan.contributions);change(input[0]);assert.throws(()=>createMemoryEnsembleStudy(42,{contributions:input}));}
 const sameTime=run(createMemoryEnsemblePerformance,[{frame:0,body:2,strength:.025},{frame:0,body:0,strength:.05}]);assert.deepEqual(sameTime.events.filter(e=>e.origin==='score').map(({frame,strength,body})=>({frame,strength,body})),sameTime.p.plan.events);
});
test('future adaptive answers retain record capacity under sustained tiny-guest pressure',()=>{
 const p=createMemoryEnsemblePerformance(),counts=[0,0,0],block=new Float32Array(128);p.start();
 for(let i=0;i<3;i++){assert.equal(p.tryGuest(0,1e-6).admitted,true);counts[0]++;}
 while(p.state!=='ended'){
  if(p.state==='playing')for(let body=0;body<3;body++)if(p.tryGuest(body,1e-6).admitted)counts[body]++;
  p.process(block);
 }
 assert.deepEqual(counts,[4085,4086,4087]);assert.deepEqual(p.records().map(r=>r.events.filter(e=>e.origin==='score').length),[11,9,6]);assert.ok(p.records().every(r=>r.events.length<=4096));
});
