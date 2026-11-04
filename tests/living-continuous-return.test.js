import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousReturnStudy,createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
test('seeded grammar develops a recognisable motif and returns to its exact rhythm and accents',()=>{
 const variants=new Set();
 for(const seed of [0,42,0xffffffff,...Array.from({length:100},(_,i)=>i*7919)]){
  const plan=createContinuousReturnStudy(seed),opening=plan.sections[0],home=plan.sections.at(-1);
  assert.deepEqual(plan,createContinuousReturnStudy(seed));
  assert.deepEqual(home.events.map(e=>({...e,frame:e.frame-home.startFrame})),opening.events);
  assert.equal(plan.events.length,25);assert.equal(plan.frames,48*48000);
  assert.ok(plan.events.every((e,i)=>e.strength>0&&e.strength<=.1&&e.frame<plan.frames-1200&&(!i||e.frame>plan.events[i-1].frame)));
  assert.ok(Object.isFrozen(home.events[0]));variants.add(JSON.stringify(opening.events));
 }
 assert.ok(variants.size>10);for(const bad of [-1,NaN,1.5,4294967296])assert.throws(()=>createContinuousReturnStudy(bad));
});
function perform(seed,blockSize,guest=false,sampleRate=48000){
 const performance=createContinuousReturnPerformance(seed,{sampleRate}),out=new Float32Array(performance.plan.frames);performance.start();
 const guestFrame=24*sampleRate;
 while(performance.state!=='ended'){
  if(guest&&performance.frame===guestFrame)assert.equal(performance.tryGuest(.05).admitted,true);
  const end=Math.min(out.length,performance.frame+blockSize,performance.frame<guestFrame?guestFrame:Infinity);
  performance.process(out.subarray(performance.frame,end));
 }
 return {performance,out,record:performance.record()};
}
test('unattended performance plays every committed note and is invariant to audio block size',()=>{
 const a=perform(42,128),b=perform(42,1001);
 assert.deepEqual(a.out,b.out);assert.deepEqual(a.record,b.record);
 assert.deepEqual(a.record.events.map(({frame,strength})=>({frame,strength})),a.performance.plan.events);
 assert.deepEqual(a.out,renderContinuousTineRecord(a.record).channels[0]);
});
test('one optional touch changes the body while preserving all scheduled notes and exact capture',()=>{
 const a=perform(0xffffffff,4096,false,44100),b=perform(0xffffffff,137,true,44100),frame=24*44100;
 assert.deepEqual(a.out.subarray(0,frame),b.out.subarray(0,frame));assert.notDeepEqual(a.out.subarray(frame,frame+100),b.out.subarray(frame,frame+100));
 assert.deepEqual(b.record.events.filter(e=>e.origin==='score'),a.record.events);assert.equal(b.record.events.length,26);
 assert.deepEqual(b.out,renderContinuousTineRecord(b.record).channels[0]);
});
test('Quiet and cancellation prevent the automatic composer from replenishing',()=>{
 const p=createContinuousReturnPerformance();p.start();p.process(new Float32Array(16384));p.quiet();p.process(new Float32Array(1200));assert.equal(p.state,'ended');assert.equal(p.record().events.length,0);
 const stopped=createContinuousReturnPerformance();stopped.start();stopped.cancel();stopped.process(new Float32Array(128));assert.equal(stopped.frame,0);assert.equal(stopped.snapshot().body.queue.length,0);
 const fresh=createContinuousReturnPerformance();fresh.start();const before=fresh.snapshot();assert.throws(()=>fresh.process([]));assert.throws(()=>fresh.tryGuest(NaN));assert.deepEqual(fresh.snapshot(),before);
});
test('repeated guest pressure is refused as needed while this complete score continues',()=>{
 const p=createContinuousReturnPerformance(42),block=new Float32Array(128);let accepted=0,refused=0;p.start();
 while(p.state!=='ended'){if(p.tryGuest(.1).admitted)accepted++;else refused++;p.process(block);assert.ok(block.every(Number.isFinite));}
 assert.ok(accepted>0&&refused>0);
 assert.deepEqual(p.record().events.filter(e=>e.origin==='score').map(({frame,strength})=>({frame,strength})),p.plan.events);
 assert.equal(p.record().events.length,accepted+25);
});
