import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLivingArrangement,renderLivingArrangement} from '../src/living/arrangement.js';
import {createLivingSpacedAnswer,renderLivingAnswerStudy} from '../src/living/answer-study.js';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingPerformanceView} from '../src/living/performance-view.js';
import {createLivingGreeting} from '../src/living/greeting.js';

const fixtures=()=>[...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()];
test('version2 preserves the auditioned spacious scores and PCM exactly across authored and generated sources',()=>{
 for(const {source} of fixtures()){
  const before=structuredClone(source),plan=createLivingArrangement(source,2),study=createLivingSpacedAnswer(source);
  assert.deepEqual(source,before);
  assert.deepEqual(plan,{...study,kind:'imagimusic-living-arrangement',version:2});
  const pcm=renderLivingArrangement(source,2),reference=renderLivingAnswerStudy(source,'spaced');
  assert.deepEqual(pcm.channels,reference.channels);assert.equal(pcm.frames,reference.frames);
  assert.ok(Number.isFinite(pcm.peak)&&pcm.peak<=1);
  const answers=plan.voices.filter(v=>v.part==='answer'),first=source.events[0].frame,last=source.events.at(-1).frame;
  for(let i=1;i<answers.length;i++)assert.ok(answers[i].startFrame+first-(answers[i-1].startFrame+last)>=Math.round(.35*source.sampleRate));
  for(const channel of pcm.channels)assert.deepEqual(channel.subarray(0,plan.phraseFrames),channel.subarray(plan.returnStart));
 }
});
test('both score versions stage every accepted contact on its actual voice timeline',()=>{
 for(const {source} of fixtures())for(const version of [1,2]){
  const view=createLivingPerformanceView(source,3,version),plan=view.plan;
  assert.equal(plan.version,version);
  for(const [vi,voice] of plan.voices.entries())for(const [ei,event] of source.events.entries()){
   const pose=view.at((voice.startFrame+event.frame)/source.sampleRate).performers.find(p=>p.eventId===`${vi}:${ei}`&&p.body===voice.body);
   assert.ok(pose);assert.ok(Math.abs(pose.down-1)<1e-12);
  }
  assert.ok(view.at(plan.frames/plan.sampleRate).performers.every(p=>p.down===0));
 }
});
test('default round retains its PCM identity and unsupported score versions are refused',()=>{
 const source=createLivingGreeting(),pcm=renderLivingArrangement(source);
 assert.equal(pcm.plan.version,1);assert.deepEqual(pcm.channels,renderLivingArrangement(source,1).channels);
 const hash=createHash('sha256');for(const channel of pcm.channels)hash.update(new Uint8Array(channel.buffer,channel.byteOffset,channel.byteLength));
 assert.equal(hash.digest('hex'),'6cbea3417e94d7ac26843f51a08fdcf0c66b8faab0fa228e07a694f262a47390');
 for(const version of [0,4,'2',null,NaN,{},true]){
  assert.throws(()=>createLivingArrangement(source,version),/Unsupported/);
  assert.throws(()=>renderLivingArrangement(source,version),/Unsupported/);
  assert.throws(()=>createLivingPerformanceView(source,3,version),/Unsupported/);
 }
});
test('spacious timing remains integer and separates dense, simultaneous and single onsets at admitted rates',()=>{
 for(const rate of [44100,48000,96000])for(const frames of [[0],[0,0],[137,138],[0,Math.round(4*rate)]]){
  const source={...createLivingGreeting(),sampleRate:rate,events:frames.map(frame=>({frame,strength:.025})),fadeStart:Math.round(6*rate)};
  const plan=createLivingArrangement(source,2);
  assert.equal(plan.delayFrames,Math.max(Math.round(.8*rate),frames.at(-1)-frames[0]+Math.round(.35*rate)));
  assert.ok(plan.voices.every(v=>Number.isInteger(v.startFrame)&&v.endFrame-v.startFrame===plan.phraseFrames));
  assert.equal(plan.returnStart-plan.voices[3].endFrame,Math.round(.8*rate));
 }
});
