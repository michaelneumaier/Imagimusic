import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
function run(blockSize=128,guests=[],quietFrame=null){
 const p=createContinuousEnsemblePerformance(),samples=new Float32Array(quietFrame===null?p.plan.frames:quietFrame+1200),events=[];let next=0;p.start();
 while(p.state!=='ended'){
  while(guests[next]?.frame===p.frame){const {body,strength}=guests[next++],result=p.tryGuest(body,strength);assert.equal(result.admitted,true);events.push(...result.events);}
  if(p.frame===quietFrame)events.push(...p.quiet());
  const end=Math.min(samples.length,p.frame+blockSize,guests[next]?.frame??Infinity,p.frame<quietFrame?quietFrame:Infinity);events.push(...p.process(samples.subarray(p.frame,end)));
 }
 return {p,samples,events};
}
const script=[{frame:0,body:2,strength:.05},{frame:0,body:0,strength:-.025},{frame:312000,body:0,strength:.05},{frame:864000,body:1,strength:.025}];
test('signed guests on any body retain the score and reconstruct the exact combined audio',()=>{
 const first=run(128,script),raw={kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:first.p.records()};
 assert.deepEqual(renderContinuousEnsembleRecord(raw).channels[0],first.samples);
 assert.deepEqual(first.events.filter(e=>e.origin==='score').map(({body,frame,strength})=>({frame,strength,body})),first.p.plan.events);
 assert.deepEqual(first.events.filter(e=>e.origin==='guest').map(({frame,body,strength})=>({frame,body,strength})),script);
 for(const size of [1001,16384]){const next=run(size,script);assert.deepEqual(next.samples,first.samples);assert.deepEqual(next.events,first.events);assert.deepEqual(next.p.records(),first.p.records());}
 const unattended=run();assert.notDeepEqual(first.samples,unattended.samples);
});
test('score due on another body is acknowledged before a guest at the same frame',()=>{
 const p=createContinuousEnsemblePerformance(),target=p.plan.sections[1].events[0];p.start();while(p.frame<target.frame)p.process(new Float32Array(Math.min(4096,target.frame-p.frame)));
 const result=p.tryGuest(0,.05);assert.equal(result.admitted,true);assert.deepEqual(result.events.map(e=>[e.origin,e.body,e.frame]),[['score',1,target.frame],['guest',0,target.frame]]);
 const again=p.tryGuest(2,.025);assert.deepEqual(again.events.map(e=>e.origin),['guest']);
 const next=p.process(new Float32Array(128));assert.equal(next.length,0);
});
test('invalid choices are nonmutating and Quiet keeps guests but stops further input',()=>{
 const p=createContinuousEnsemblePerformance();assert.equal(p.tryGuest(0,.05).admitted,false);p.start();const before=p.snapshot();
 for(const [body,strength] of [[-1,.05],[3,.05],[.5,.05],[0,0],[0,NaN],[1,.2]])assert.throws(()=>p.tryGuest(body,strength));assert.deepEqual(p.snapshot(),before);
 const {p:quiet,samples}=run(1001,script.slice(0,2),0);assert.equal(quiet.tryGuest(1,.05).admitted,false);assert.equal(quiet.state,'ended');
 const replay=renderContinuousEnsembleRecord({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:quiet.records()});assert.deepEqual(replay.channels[0],samples);
});
test('many tiny guests cannot consume slots reserved for any body’s full future score',()=>{
 const p=createContinuousEnsemblePerformance(),counts=[0,0,0],block=new Float32Array(128);p.start();
 while(p.state!=='ended'){
  if(p.state==='playing')for(let body=0;body<3;body++){const result=p.tryGuest(body,1e-6);if(result.admitted)counts[body]++;}
  p.process(block);
 }
 const records=p.records();assert.deepEqual(records.map(r=>r.events.length),[4096,4096,4096]);
 assert.deepEqual(records.map(r=>r.events.filter(e=>e.origin==='score').length),[9,10,6]);assert.deepEqual(counts,[4087,4086,4090]);
});
test('a physically refused guest still delivers another body’s due score and leaves playback intact',()=>{
 const p=createContinuousEnsemblePerformance(),target=p.plan.sections[1].events[0].frame;p.start();while(p.frame<target-1)p.process(new Float32Array(Math.min(4096,target-1-p.frame)));
 let refused=false;for(let i=0;i<4096;i++){if(!p.tryGuest(0,.1).admitted){refused=true;break;}}assert.equal(refused,true);assert.equal(p.state,'playing');
 p.process(new Float32Array(1));const result=p.tryGuest(0,.1);assert.equal(result.admitted,false);assert.deepEqual(result.events.map(e=>[e.origin,e.body,e.frame]),[['score',1,target]]);
 assert.equal(p.tryGuest(2,.025).admitted,true);while(p.state!=='ended')p.process(new Float32Array(4096));
 assert.deepEqual(p.records().map(r=>r.events.filter(e=>e.origin==='score').length),[9,10,6]);
});
