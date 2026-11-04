import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryReturnPerformance} from '../src/living/memory-return-study.js';
import {validateMemoryReturnFinished} from '../src/living/memory-return-result.js';
import {validateContinuousReturnFinished} from '../src/living/continuous-return-result.js';
function fixture({rate=48000,guests=[],quietFrame=null,blockSize=137}={}){
 const p=createMemoryReturnPerformance(42,{sampleRate:rate}),block=new Float32Array(blockSize),origin=1024;p.start();
 const advance=frame=>{while(p.frame<frame)p.process(block.subarray(0,Math.min(block.length,frame-p.frame)));};
 for(const event of guests){advance(event.frame);assert.equal(p.tryGuest(event.strength).admitted,true);}
 if(quietFrame!==null){advance(quietFrame);p.quiet();}
 advance((quietFrame??p.plan.frames-Math.round(.025*rate))+Math.round(.025*rate));
 const snapshot=p.snapshot(),touches=snapshot.events.map(e=>({...e,audioFrame:origin+e.frame}));
 return {rate,origin,quietFrame,touches,data:{type:'finished',kind:'imagimusic-memory-return-completion',version:1,seed:42,originAudioFrame:origin,record:p.record(),snapshot,plan:p.plan,memory:p.memory}};
}
const check=f=>validateMemoryReturnFinished(42,f.rate,f.data,f.touches,f.origin,f.quietFrame);
test('responsive completion rebuilds both remembered answers and physical state at two rates',()=>{
 for(const rate of [44100,48000]){
  const f=fixture({rate,guests:[{frame:rate,strength:.025},{frame:rate+Math.round(.1*rate),strength:.1},{frame:5*rate,strength:-.05},{frame:6*rate,strength:.05}]});
  const result=check(f);assert.deepEqual(result.record,f.data.record);assert.deepEqual(result.plan,f.data.plan);assert.equal(result.memory.sealed,true);assert.equal(result.plan.contributions.length,3);
  assert.equal(result.plan.timeScale,.75);assert.equal(result.record.events.filter(e=>e.origin==='guest').length,4);
  assert.throws(()=>validateContinuousReturnFinished(42,f.rate,f.data,f.touches,f.origin));
 }
});
test('no-input completion still requires responsive identity, despite identical fixed-score audio',()=>{
 const f=fixture(),result=check(f);assert.equal(result.plan.contributions.length,0);assert.equal(result.record.events.length,25);
 assert.throws(()=>validateContinuousReturnFinished(42,f.rate,f.data,f.touches,f.origin));
 const missing=structuredClone(f);delete missing.data.kind;assert.throws(()=>check(missing));
});
test('early Quiet retains unsealed contribution without claiming a later answer was delivered',()=>{
 const f=fixture({guests:[{frame:0,strength:.05}],quietFrame:48000}),result=check(f);
 assert.equal(result.memory.sealed,false);assert.equal(result.memory.contributions.length,1);assert.equal(result.plan.contributions.length,0);
 const changed=structuredClone(f);changed.data.memory.sealed=true;assert.throws(()=>check(changed));
});
test('changed memory, section transformation, source labels, ending and body state are refused',()=>{
 const original=fixture({guests:[{frame:0,strength:.05},{frame:48000,strength:.1}],quietFrame:20*48000});
 const edits=[
  f=>f.data.version=2,f=>f.data.kind='imagimusic-continuous-return-completion',
  f=>f.data.memory.contributions[0].frame++,f=>f.data.plan.contributions.pop(),
  f=>f.data.plan.sections[3].events[0].strength=.1,f=>f.data.plan.sections[6].events[0].frame++,
  f=>f.data.plan.timeScale=.5,f=>f.touches[0].origin='score',f=>f.touches[0].audioFrame++,
  f=>f.data.snapshot.body.modes[0].velocityMPerS+=1,f=>f.quietFrame=null,
 ];
 for(const edit of edits){const f=structuredClone(original);edit(f);assert.throws(()=>check(f));}
 const result=check(original);original.data.snapshot.body.modes[0].velocityMPerS=999;assert.notEqual(result.snapshot.body.modes[0].velocityMPerS,999);
});
