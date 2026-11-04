import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousEnsembleStudy,createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {createContinuousReturnStudy} from '../src/living/continuous-return-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
function render(seed=42,blockSize=1024,quietFrame=null){
 const p=createContinuousEnsemblePerformance(seed),events=[],mono=new Float32Array(quietFrame===null?p.plan.frames:quietFrame+1200);p.start();
 while(p.state!=='ended'){
  if(p.frame===quietFrame)events.push(...p.quiet());
  const end=Math.min(mono.length,p.frame+blockSize,p.frame<quietFrame?quietFrame:Infinity);
  events.push(...p.process(mono.subarray(p.frame,end)));
 }
 return {p,events,mono};
}
test('orchestration retains every source note and gives the opening and home to the original body',()=>{
 for(const seed of [0,42,2950288811,0xffffffff]){
  const p=createContinuousEnsembleStudy(seed),source=createContinuousReturnStudy(seed);
  assert.deepEqual(p.events.map(({frame,strength})=>({frame,strength})),source.events);
  assert.deepEqual(p.bodies.map(b=>b.lengthMm),[80,95,65]);assert.equal(p.mixGain,1/3);
  for(const i of [0,7])assert.ok(p.sections[i].events.every(e=>e.body===0));
  assert.ok(p.events.every(e=>Number.isInteger(e.body)&&e.body>=0&&e.body<3));
  assert.ok(Object.isFrozen(p.events[0]));
 }
});
test('all three continuous histories reconstruct every mixed sample without resets or normalization',()=>{
 for(const seed of [42,2950288811,0xffffffff]){
  const {p,mono,events}=render(seed),records=p.records(),channels=records.map(record=>renderContinuousTineRecord(record).channels[0]);
  const reconstructed=Float32Array.from(mono,(_,i)=>(channels[0][i]+channels[1][i]+channels[2][i])*p.plan.mixGain);
  assert.deepEqual(mono,reconstructed);assert.equal(events.length,25);
  assert.deepEqual(events.map(({frame,strength,body})=>({frame,strength,body})),p.plan.events);
  assert.ok(p.snapshot().every(s=>s.body.frame===p.frame&&s.state==='ended'));
  assert.ok(records.every(record=>record.fadeStart===p.plan.frames-1200));
  for(const x of mono)assert.ok(Number.isFinite(x)&&Math.abs(x)<=.8);
 }
});
test('sample blocks preserve exact audio/history; Quiet ends all bodies at the same sample',()=>{
 const first=render(42,128);for(const size of [1001,16384]){
  const next=render(42,size);assert.deepEqual(next.mono,first.mono);assert.deepEqual(next.p.records(),first.p.records());
 }
 for(const frame of [0,24000,900001]){
  const {p,mono}=render(42,1001,frame),records=p.records(),channels=records.map(r=>renderContinuousTineRecord(r).channels[0]);
  assert.ok(records.every(r=>r.fadeStart===frame));assert.equal(p.frame,frame+1200);
  assert.deepEqual(mono,Float32Array.from(mono,(_,i)=>(channels[0][i]+channels[1][i]+channels[2][i])/3));
 }
});
test('idle and cancelled ensembles stay silent; invalid buffers do not advance their clocks',()=>{
 const p=createContinuousEnsemblePerformance(),out=new Float32Array(128).fill(1);p.process(out);assert.ok(out.every(x=>x===0));assert.equal(p.frame,0);
 p.start();assert.throws(()=>p.process(new Float64Array(128)),/Float32/);assert.equal(p.frame,0);
 p.process(out);p.cancel();out.fill(1);p.process(out);assert.ok(out.every(x=>x===0));assert.equal(p.state,'cancelled');assert.throws(()=>p.records());assert.throws(()=>p.start());
});
