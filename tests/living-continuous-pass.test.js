import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {createContinuousTinePass} from '../src/living/continuous-tine-pass.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
const design=createTineDesign();
test('autonomous twelve-second transport with optional guests retains exact reconstructible output',()=>{
 const rate=48000,pass=createContinuousTinePass(design,{endFrame:12*rate}),out=new Float32Array(12*rate+128);
 pass.process(new Float32Array(128).fill(1));assert.equal(pass.frame,0);assert.equal(pass.state,'idle');pass.start();
 for(let second=0;second<12;second++){
  pass.schedule([{frame:second*rate,strength:.05},{frame:second*rate+12000,strength:.025}]);
  if(second===6)assert.equal(pass.tryGuest(.1).admitted,true);
  for(let frame=second*rate;frame<(second+1)*rate;frame+=128)pass.process(out.subarray(frame,Math.min(frame+128,(second+1)*rate)));
 }
 assert.equal(pass.state,'ended');assert.equal(pass.frame,12*rate);
 const record=pass.record(),rendered=renderContinuousTineRecord(record);
 assert.deepEqual(out.subarray(0,12*rate),rendered.channels[0]);assert.equal(record.events.length,25);
 assert.equal(record.events.filter(e=>e.origin==='guest').length,1);
 const {queue,...body}=pass.snapshot().body;assert.deepEqual(body,rendered.snapshot);assert.equal(queue.length,0);
 const after=new Float32Array(128).fill(1);pass.process(after);assert.ok(after.every(x=>x===0));assert.equal(pass.frame,12*rate);
});
test('Quiet includes due notes, cancels later commitments, and fades without resetting physical state',()=>{
 const pass=createContinuousTinePass(design);pass.start();pass.schedule([{frame:0,strength:.1},{frame:128,strength:.05},{frame:256,strength:.1}]);
 const first=new Float32Array(128);pass.process(first);
 assert.deepEqual(pass.quiet().map(e=>e.frame),[128]);assert.deepEqual(pass.quiet(),[]);
 assert.equal(pass.tryGuest(.1).admitted,false);assert.throws(()=>pass.schedule([]));
 const tail=new Float32Array(1500);pass.process(tail);const record=pass.record(),rendered=renderContinuousTineRecord(record);
 assert.equal(record.fadeStart,128);assert.deepEqual(record.events.map(e=>e.frame),[0,128]);
 assert.deepEqual(Float32Array.from([...first,...tail.subarray(0,1200)]),rendered.channels[0]);assert.ok(tail.subarray(1200).every(x=>x===0));
 assert.ok(pass.snapshot().body.modes.some(m=>m.energyJ>0));
});
test('capture capacity reserves score slots and refuses overflow without losing scheduled notes',()=>{
 const pass=createContinuousTinePass(design);pass.start();
 for(let batch=0;batch<63;batch++){
  pass.schedule(Array.from({length:64},()=>({frame:pass.frame,strength:1e-8})));pass.process(new Float32Array(128));
 }
 pass.schedule(Array.from({length:63},()=>({frame:pass.frame,strength:1e-8})));pass.process(new Float32Array(128));
 pass.schedule([{frame:pass.frame+128,strength:1e-8}]);const before=pass.snapshot();
 assert.equal(pass.tryGuest(.025).admitted,false);assert.throws(()=>pass.schedule([{frame:pass.frame+256,strength:1e-8}]));assert.deepEqual(pass.snapshot(),before);
 pass.process(new Float32Array(256));pass.quiet();pass.process(new Float32Array(1200));assert.equal(pass.record().events.length,4096);
});
test('cancellation, malformed requests, and automatic-ending boundary have explicit outcomes',()=>{
 assert.throws(()=>createContinuousTinePass(design,{endFrame:1199}));assert.throws(()=>createContinuousTinePass(design,{endFrame:2880001}));
 const pass=createContinuousTinePass(design,{endFrame:1328});assert.throws(()=>pass.record());pass.start();
 const before=pass.snapshot();assert.throws(()=>pass.schedule([{frame:129,strength:.1}]));assert.throws(()=>pass.tryGuest(NaN));assert.throws(()=>pass.process(new Float32Array(16385)));assert.deepEqual(pass.snapshot(),before);
 pass.schedule([{frame:128,strength:.1}]);pass.process(new Float32Array(128));assert.equal(pass.tryGuest(.1).admitted,false);
 const rest=new Float32Array(1200);assert.equal(pass.process(rest).length,1);assert.equal(pass.record().events[0].frame,128);
 const cancelled=createContinuousTinePass(design);cancelled.start();cancelled.tryGuest(.1);cancelled.cancel();cancelled.cancel();
 assert.equal(cancelled.state,'cancelled');assert.throws(()=>cancelled.record());assert.throws(()=>cancelled.start());assert.equal(cancelled.snapshot().events.length,0);
 const silent=new Float32Array(128).fill(1);cancelled.process(silent);assert.ok(silent.every(x=>x===0));assert.equal(cancelled.frame,0);
});
