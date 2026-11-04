import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineLiveKernel} from '../src/tine/live-kernel.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createContinuousTineKernel} from '../src/living/continuous-tine-kernel.js';
const {geometry}=requestForTineDesign(createTineDesign());
function advance(kernel,frames,block=128){let peak=0;while(frames){const samples=new Float32Array(Math.min(block,frames));kernel.process(samples);for(const value of samples){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}frames-=samples.length;}return peak;}
test('continuous research body preserves existing streaming samples for the same admitted input',()=>{
 const old=createTineLiveKernel(geometry),next=createContinuousTineKernel(geometry);
 for(let i=0;i<1000;i++){
  if([0,100,500].includes(i)){const strength=i===100?-.05:.1;old.strike(strength);next.strike(strength);}
  const a=new Float32Array(127),b=new Float32Array(127);old.process(a);next.process(b);assert.deepEqual(b,a);
 }
 assert.deepEqual(next.snapshot().modes,old.snapshot().modes);
});
test('saturated allowance refuses without mutation, then recovers through decay without resetting the body',()=>{
 const kernel=createContinuousTineKernel(geometry);let count=0;
 while(count<100000){try{kernel.strike(.1);count++;}catch{break;}}
 assert.ok(count>8&&count<100000);const full=kernel.snapshot();assert.throws(()=>kernel.strike(.1),/headroom/);assert.deepEqual(kernel.snapshot(),full);
 const peak=advance(kernel,48000);assert.ok(peak<=full.outputBound+1e-6);
 const decayed=kernel.snapshot();assert.ok(decayed.weightedStrength<full.weightedStrength);assert.ok(decayed.modes.some(m=>m.energyJ>0));
 kernel.strike(.1);const joined=kernel.snapshot();assert.deepEqual(joined.modes.map(m=>m.displacementM),decayed.modes.map(m=>m.displacementM));assert.equal(joined.accepted,count+1);
});
test('a sixty-second repeated phrase retains continuous state, finite bounds and constant-sized snapshots',()=>{
 const kernel=createContinuousTineKernel(geometry),model=createTineImpulse(geometry),unit=model.strike(),events=[];
 const initialKeys=Object.keys(kernel.snapshot());let peak=0;
 for(let i=0;i<120;i++){const strength=[.025,.1,.05][i%3];events.push({frame:i*24000,strength});kernel.strike(strength);peak=Math.max(peak,advance(kernel,24000,1001));}
 const final=kernel.snapshot();assert.equal(final.frame,2880000);assert.equal(final.accepted,120);assert.deepEqual(Object.keys(final),initialKeys);assert.equal(final.events,undefined);assert.equal(final.modes.length,4);assert.ok(peak<.8);
 for(let i=0;i<4;i++){
  const expected=events.reduce((sum,e)=>{const state=unit.modalState((final.frame-e.frame)/48000)[i];sum.q+=e.strength*state.displacementM;sum.v+=e.strength*state.velocityMPerS;return sum;},{q:0,v:0});
  assert.ok(Math.abs(final.modes[i].displacementM-expected.q)<1e-15);assert.ok(Math.abs(final.modes[i].velocityMPerS-expected.v)<1e-11);
 }
});
test('admission budget and output remain stable across block partitions; malformed input is atomic',()=>{
 const a=createContinuousTineKernel(geometry),b=createContinuousTineKernel(geometry);a.strike(.1);b.strike(.1);advance(a,48000,128);advance(b,48000,1001);
 assert.deepEqual(a.snapshot().modes,b.snapshot().modes);assert.equal(a.snapshot().weightedStrength,b.snapshot().weightedStrength);
 const before=a.snapshot();for(const bad of [0,.11,NaN,Infinity])assert.throws(()=>a.strike(bad));assert.throws(()=>a.process(new Float32Array(16385)));assert.throws(()=>a.process([]));assert.deepEqual(a.snapshot(),before);
});
