import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineLiveKernel} from '../src/tine/live-kernel.js';
import {createTinePhrase} from '../src/tine/phrase.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const {geometry}=requestForTineDesign(createTineDesign());
function stream(source,events,frames,blockSize=128,options={}){
 const kernel=createTineLiveKernel(source,options),pcm=new Float32Array(frames);let at=0,index=0;
 while(at<frames){
  while(index<events.length&&events[index].frame===at)kernel.strike(events[index++].strength);
  const next=Math.min(frames,at+blockSize,events[index]?.frame??Infinity);
  kernel.process(pcm.subarray(at,next));at=next;
 }
 return {kernel,pcm};
}
test('streaming impulses retain analytic overlap and signed interference across sample frames',t=>{
 for(const sampleRate of [44100,48000,96000]){
 const events=[{frame:0,strength:.25},{frame:Math.round(.80035*sampleRate),strength:-.15},{frame:Math.round(2.1000625*sampleRate),strength:.25}];
 const {kernel,pcm}=stream(geometry,events,8*sampleRate,128,{sampleRate});
 const phrase=createTinePhrase(geometry,{events:events.map(e=>({time:e.frame/sampleRate,strength:e.strength}))});
 let error=0;
 for(let i=0;i<pcm.length;i++)error=Math.max(error,Math.abs(pcm[i]-Math.fround(100*phrase.pointState(i/sampleRate).velocityMPerS)));
 assert.ok(error<1e-8,`max Float32 sample error ${error}`);t.diagnostic(`${sampleRate} Hz: max Float32 difference ${error}`);
 const actual=kernel.snapshot(),expected=phrase.modalState(8);
 for(let i=0;i<4;i++){
  assert.ok(Math.abs(actual.modes[i].displacementM-expected[i].displacementM)<1e-15);
  assert.ok(Math.abs(actual.modes[i].velocityMPerS-expected[i].velocityMPerS)<1e-12);
 }
 assert.deepEqual(actual.events,events);assert.equal(actual.frame,8*sampleRate);
 assert.throws(()=>kernel.process(new Float32Array(1)));
 }
});
test('streaming is independent of block boundaries, preserves width scale and clamps silently',()=>{
 const events=[{frame:0,strength:.1},{frame:129,strength:.1},{frame:777,strength:.1}];
 const a=stream(geometry,events,48000,128),b=stream(geometry,events,48000,257),wide=stream({...geometry,widthM:.02},events,48000,64);
 assert.deepEqual(a.pcm,b.pcm);
 for(let i=0;i<a.pcm.length;i++)assert.equal(wide.pcm[i],a.pcm[i]/2);
 const quiet=stream(geometry,events,48000,128,{activation:0});assert.ok(quiet.pcm.every(x=>x===0));
 const kernel=createTineLiveKernel(geometry);kernel.strike(.25);kernel.strike(-.25);const buffer=new Float32Array(4800);kernel.process(buffer);assert.ok(buffer.every(x=>x===0));
});
test('rejected touches do not mutate live state, event history or admission budget',()=>{
 const worst={...geometry,lengthM:.06,widthM:.005},kernel=createTineLiveKernel(worst,{activation:1,pickup:1});kernel.strike(1);
 const before=kernel.snapshot();assert.throws(()=>kernel.strike(.2),/headroom/);assert.deepEqual(kernel.snapshot(),before);
 before.modes[0].velocityMPerS=99;before.events.length=0;assert.equal(kernel.snapshot().events.length,1);assert.notEqual(kernel.snapshot().modes[0].velocityMPerS,99);
 for(const bad of [NaN,Infinity,1.1,'0.1'])assert.throws(()=>kernel.strike(bad));
 const eight=createTineLiveKernel(geometry);for(let i=0;i<8;i++)eight.strike();const full=eight.snapshot();assert.throws(()=>eight.strike(),/eight touches/);assert.deepEqual(eight.snapshot(),full);
 const thin=createTineLiveKernel({...geometry,widthM:.003,thicknessM:.0005},{pickup:0});
 let refused=false;for(let i=0;i<8;i++){const state=thin.snapshot();try{thin.strike(1);}catch(error){assert.match(error.message,/small-displacement/);assert.deepEqual(thin.snapshot(),state);refused=true;break;}}assert.ok(refused);
 const late=createTineLiveKernel(geometry);late.process(new Float32Array(4*48000+1));assert.throws(()=>late.strike(),/window/);
 assert.throws(()=>createTineLiveKernel(geometry,{sampleRate:8000}),/retained mode/);
});
