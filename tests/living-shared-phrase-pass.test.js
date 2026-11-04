import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
import {createLivingSharedPhrasePass} from '../src/living/shared-phrase-pass.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:28800,strength:.1},{frame:48000,strength:.05}],fadeStart:120000};
function finish(pass,frames,block=128){const samples=new Float32Array(frames);for(let i=0;i<frames;i+=block)pass.process(samples.subarray(i,Math.min(frames,i+block)));return samples;}
test('without guest input, shared playback equals every original sample across arbitrary block sizes',()=>{
 for(const block of [1,127,128,1001,200000]){
  const pass=createLivingSharedPhrasePass(source),expected=renderTineLiveRecord(source);pass.start();
  assert.deepEqual(finish(pass,expected.frames,block),expected.channels[0]);assert.equal(pass.state,'ended');
  assert.deepEqual(pass.snapshot().events,source.events);assert.ok(pass.snapshot().applied.every(e=>e.origin==='score'));
 }
});
test('guest and scheduled touches share continuing state and replay exactly as one accepted record',()=>{
 const pass=createLivingSharedPhrasePass(source);pass.start();const samples=new Float32Array(121200);
 pass.process(samples.subarray(0,28800));
 const before=pass.snapshot();assert.ok(before.modes.some(m=>m.energyJ>0));
 pass.strike(.05);const after=pass.snapshot();
 assert.deepEqual(after.modes.map(m=>m.displacementM),before.modes.map(m=>m.displacementM));
 assert.deepEqual(after.applied.slice(-2).map(e=>e.origin),['score','guest']);
 pass.process(samples.subarray(28800,72000));pass.strike(.025);pass.process(samples.subarray(72000));
 const accepted=pass.snapshot(),replayed=renderTineLiveRecord({...source,events:accepted.events});
 assert.deepEqual(samples,replayed.channels[0]);assert.equal(accepted.guestTouches,2);assert.equal(accepted.events.length,5);
});
test('guest quota preserves every future scheduled note, and early Quiet cancels future notes',()=>{
 const pass=createLivingSharedPhrasePass(source);pass.start();pass.strike(.1);pass.strike(.1);pass.strike(.1);
 assert.throws(()=>pass.strike(.1),/reserved/);finish(pass,121200,256);
 assert.equal(pass.snapshot().applied.filter(e=>e.origin==='score').length,3);
 const early=createLivingSharedPhrasePass(source);early.start();const lead=finish(early,24000);early.quiet();
 assert.throws(()=>early.strike(.1),/accepting/);const tail=finish(early,1200);assert.equal(early.state,'ended');
 const expected=renderTineLiveRecord({...source,events:[source.events[0]],fadeStart:24000});
 assert.deepEqual(Float32Array.from([...lead,...tail]),expected.channels[0]);
 assert.throws(()=>createLivingSharedPhrasePass(source,{guestLimit:6}),/fit/);
});
test('idle, ending, inclusive touch-window boundary and caller edits keep the bounded contract',()=>{
 const mutable={...source,events:[{frame:0,strength:.025},{frame:192000,strength:.05}],fadeStart:382800};
 const pass=createLivingSharedPhrasePass(mutable),idle=new Float32Array(128).fill(1);pass.process(idle);
 assert.ok(idle.every(v=>v===0));assert.equal(pass.frame,0);
 mutable.events[0].strength=.1;assert.equal(pass.source.events[0].strength,.025);
 pass.start();assert.throws(()=>pass.start(),/already/);
 for(const strength of [0,-.1,.11,NaN])assert.throws(()=>pass.strike(strength),/strength/);
 assert.equal(pass.snapshot().events.length,0);
 finish(pass,192000,127);pass.strike(.1);
 assert.deepEqual(pass.snapshot().applied.slice(-2).map(e=>e.origin),['score','guest']);
 assert.equal(pass.snapshot().guestTouches,1);
 pass.process(new Float32Array(1));assert.throws(()=>pass.strike(.025),/accepting/);
 assert.equal(pass.snapshot().guestTouches,1);
 const frame=pass.frame;assert.throws(()=>pass.process([]),/Float32/);assert.equal(pass.frame,frame);
 finish(pass,384000-frame);assert.equal(pass.state,'ended');
 const after=new Float32Array(128).fill(1);pass.process(after);assert.ok(after.every(v=>v===0));
});
