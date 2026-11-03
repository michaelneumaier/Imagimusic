import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingArrangement,renderLivingArrangement} from '../src/living/arrangement.js';
import {createTineDesign} from '../src/tine/address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const source=(rate=48000)=>({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:rate,events:[{frame:137,strength:.1},{frame:Math.round(.65*rate),strength:.025},{frame:Math.round(1.7*rate),strength:.05}],fadeStart:Math.round(2.7*rate)});
test('arrangement preserves every local event and ending, with explicit non-overlapping solo and return',()=>{
 for(const rate of [44100,48000,96000]){
  const record=source(rate),before=structuredClone(record),plan=createLivingArrangement(record);
  assert.deepEqual(record,before);assert.deepEqual(plan.source,before);
  assert.deepEqual(plan.bodies.map(b=>b.design.lengthMm),[80,95,65]);
  for(const body of plan.bodies){assert.deepEqual(body.events,record.events);assert.equal(body.fadeStart,record.fadeStart);assert.equal(body.sampleRate,rate);}
  assert.equal(plan.voices[0].endFrame+Math.round(.6*rate),plan.roundStart);
  assert.equal(plan.voices[3].endFrame+Math.round(.8*rate),plan.returnStart);
  assert.equal(plan.voices[4].endFrame,plan.frames);
  assert.ok(plan.voices.every(v=>Number.isInteger(v.startFrame)&&v.endFrame-v.startFrame===plan.phraseFrames));
  record.events[0].frame=0;assert.equal(plan.source.events[0].frame,137);
 }
});
test('stereo rendering equals independently reconstructed stems at every sample, including overlaps and return',()=>{
 const record=source(),pcm=renderLivingArrangement(record),{plan}=pcm,expected=[new Float64Array(pcm.frames),new Float64Array(pcm.frames)];
 for(const v of plan.voices){
  const stem=renderTineLiveRecord(plan.bodies[v.body]).channels[0];
  for(let i=0;i<stem.length;i++){expected[0][v.startFrame+i]+=stem[i]*Math.cos((v.pan+1)*Math.PI/4)*v.gain;expected[1][v.startFrame+i]+=stem[i]*Math.sin((v.pan+1)*Math.PI/4)*v.gain;}
 }
 assert.deepEqual(pcm.channels,expected.map(c=>Float32Array.from(c)));
 for(const ch of pcm.channels){assert.equal(ch.at(-1),0);assert.ok(ch.subarray(plan.voices[0].endFrame,plan.roundStart).every(v=>v===0));assert.deepEqual(ch.subarray(0,plan.phraseFrames),ch.subarray(plan.returnStart));}
 assert.notDeepEqual(pcm.channels[0],pcm.channels[1]);assert.ok(pcm.peak>0&&pcm.peak<1);
});
test('rhythmic delay handles single and simultaneous touches, bounded spacing and empty refusal',()=>{
 const record=source();record.events=[{frame:137,strength:.1},{frame:137,strength:-.1}];
 assert.equal(createLivingArrangement(record).delayFrames,31200);assert.equal(renderLivingArrangement(record).peak,0);
 record.events=[{frame:137,strength:.1},{frame:138,strength:.1}];assert.equal(createLivingArrangement(record).delayFrames,16800);
 record.events=[{frame:137,strength:.1},{frame:120137,strength:.1}];assert.equal(createLivingArrangement(record).delayFrames,57600);
 record.events=[];assert.throws(()=>createLivingArrangement(record),/opening phrase/);
});
