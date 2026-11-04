import test from 'node:test';
import assert from 'node:assert/strict';
import {requestForTineDesign,createTineDesign} from '../src/tine/address.js';
import {createContinuousTineKernel} from '../src/living/continuous-tine-kernel.js';
import {createContinuousTineScheduler} from '../src/living/continuous-tine-scheduler.js';
const {geometry}=requestForTineDesign(createTineDesign());
test('committed score and tied guests retain deterministic order and exact streaming samples',()=>{
 const scheduler=createContinuousTineScheduler(geometry),reference=createContinuousTineKernel(geometry);
 scheduler.schedule([{frame:64,strength:.025},{frame:128,strength:.1},{frame:128,strength:.05}]);
 const first=new Float32Array(128),a=new Float32Array(128);assert.deepEqual(scheduler.process(first).map(e=>e.frame),[64]);
 reference.process(a.subarray(0,64));reference.strike(.025);reference.process(a.subarray(64));assert.deepEqual(first,a);
 const guest=scheduler.tryGuest(.025);assert.equal(guest.admitted,true);assert.deepEqual(guest.events.map(e=>e.origin),['score','score','guest']);
 for(const strength of [.1,.05,.025])reference.strike(strength);
 const next=new Float32Array(128),b=new Float32Array(128);scheduler.process(next);reference.process(b);assert.deepEqual(next,b);
});
test('guests cannot consume committed score allowance, even when a standalone body would accept more',()=>{
 const scheduler=createContinuousTineScheduler(geometry),reserved=Array.from({length:64},()=>({frame:480,strength:.1}));scheduler.schedule(reserved);
 let accepted=0;while(accepted<10000){if(!scheduler.tryGuest(.1).admitted)break;accepted++;}assert.ok(accepted>0&&accepted<10000);
 const before=scheduler.snapshot();assert.equal(scheduler.tryGuest(.1).admitted,false);assert.deepEqual(scheduler.snapshot(),before);
 const baseline=createContinuousTineKernel(geometry);for(let i=0;i<accepted;i++)baseline.strike(.1);assert.doesNotThrow(()=>baseline.strike(.1));
 const applied=scheduler.process(new Float32Array(1024));assert.equal(applied.length,64);assert.ok(applied.every(e=>e.origin==='score'));assert.equal(scheduler.snapshot().queue.length,0);
});
test('rolling look-ahead plays for sixty seconds without queue or history growth',()=>{
 const scheduler=createContinuousTineScheduler(geometry);let score=0,guests=0;
 for(let cell=0;cell<60;cell++){
  const frame=cell*48000;scheduler.schedule([{frame:frame+8000,strength:.025},{frame:frame+16000,strength:.1},{frame:frame+32000,strength:.05}]);
  const result=scheduler.tryGuest(.025);assert.equal(result.admitted,true);guests++;
  for(let offset=0;offset<48000;offset+=128){const out=new Float32Array(Math.min(128,48000-offset));score+=scheduler.process(out).length;assert.ok(out.every(x=>Number.isFinite(x)&&Math.abs(x)<.8));}
  assert.equal(scheduler.snapshot().queue.length,0);
 }
 assert.equal(score,180);assert.equal(guests,60);assert.equal(scheduler.snapshot().accepted,240);assert.equal(scheduler.snapshot().events,undefined);
});
test('invalid queue replacements and forecasts are atomic and caller edits cannot change commitments',()=>{
 const scheduler=createContinuousTineScheduler(geometry),event={frame:128,strength:.1};scheduler.schedule([event]);event.strength=.025;
 const before=scheduler.snapshot();for(const bad of [[{frame:-1,strength:.1}],Array.from({length:64},()=>({frame:256,strength:.1})),[{frame:128,strength:.1},{frame:64,strength:.1}]])assert.throws(()=>scheduler.schedule(bad));
 assert.deepEqual(scheduler.snapshot(),before);assert.throws(()=>scheduler.process([]));assert.deepEqual(scheduler.snapshot(),before);
 const kernel=createContinuousTineKernel(geometry),initial=kernel.snapshot();assert.throws(()=>kernel.forecast([{frame:384001,strength:.1}]));assert.deepEqual(kernel.snapshot(),initial);
});
