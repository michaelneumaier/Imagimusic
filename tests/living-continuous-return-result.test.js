import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {validateContinuousReturnFinished} from '../src/living/continuous-return-result.js';
function fixture({sampleRate=48000,quietFrame=null,guests=[]}={}){
 const p=createContinuousReturnPerformance(42,{sampleRate}),origin=4096,block=new Float32Array(128);p.start();
 const advance=end=>{while(p.frame<end)p.process(block.subarray(0,Math.min(128,end-p.frame)));};
 for(const guest of guests){advance(guest.frame);assert.equal(p.tryGuest(guest.strength).admitted,true);}
 if(quietFrame!==null){advance(quietFrame);p.quiet();}
 advance((quietFrame??p.plan.frames-Math.round(.025*sampleRate))+Math.round(.025*sampleRate));
 const snapshot=p.snapshot(),touches=snapshot.events.map(e=>({...e,audioFrame:origin+e.frame}));
 return {sampleRate,origin,quietFrame,touches,data:{type:'finished',seed:42,originAudioFrame:origin,record:p.record(),snapshot}};
}
const verify=f=>validateContinuousReturnFinished(42,f.sampleRate,f.data,f.touches,f.origin,f.quietFrame);
test('natural and joined early endings rebuild with exact independent physical state',()=>{
 for(const f of [fixture(),fixture({sampleRate:44100,quietFrame:12*44100,guests:[{frame:0,strength:.025},{frame:6*44100,strength:-.05}]})]){
  const result=verify(f);assert.deepEqual(result.record,f.data.record);assert.deepEqual(result.snapshot,f.data.snapshot);
  f.data.snapshot.body.modes[0].velocityMPerS=999;assert.notEqual(result.snapshot.body.modes[0].velocityMPerS,999);
 }
});
test('empty immediate Quiet is a valid completed capture',()=>{
 const f=fixture({quietFrame:0});assert.equal(verify(f).record.events.length,0);
});
test('changed identity, omissions, forged source labels, timestamps and state are refused',()=>{
 const original=fixture({quietFrame:48000,guests:[{frame:0,strength:.025}]});
 const edits=[
  f=>f.data.seed=43,f=>f.data.originAudioFrame++,f=>f.origin=Number.MAX_SAFE_INTEGER,
  f=>f.data.record.design.widthMm=11,f=>f.data.record.sampleRate=44100,
  f=>f.quietFrame=null,f=>f.quietFrame++,f=>f.data.record.fadeStart++,
  f=>f.touches.pop(),f=>f.touches[0].origin='score',f=>f.touches[0].audioFrame++,
  f=>f.touches[0].index++,f=>f.touches[0].extra=true,f=>f.touches[0].strength=.05,
  f=>f.data.record.events.pop(),f=>f.data.snapshot.body.modes[0].velocityMPerS+=1e-8,
  f=>f.data.snapshot.body.queue.push({frame:48001,strength:.1}),f=>f.data.snapshot.state='cancelled',
 ];
 for(const edit of edits){const changed=structuredClone(original);edit(changed);assert.throws(()=>verify(changed));}
});
