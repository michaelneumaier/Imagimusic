import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingPersonalVariation,createLivingPersonalJourneyStudy,renderLivingPersonalJourneyStudy} from '../src/living/personal-journey-study.js';
import {createTineDesign} from '../src/tine/address.js';
import {createLivingJourneyChoreography} from '../src/living/journey-choreography.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const phrase=(rate=48000)=>({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:rate,events:[{frame:Math.round(.35*rate),strength:.025},{frame:Math.round(.61*rate),strength:.1},{frame:Math.round(1.74*rate),strength:.05},{frame:Math.round(2.15*rate),strength:.025}],fadeStart:Math.round(3.65*rate)});

test('personal development preserves all touches, signed interval reflection and exact source return',()=>{
 for(const rate of [44100,48000]){
  const input=phrase(rate),saved=structuredClone(input),plan=createLivingPersonalJourneyStudy(input);
  assert.deepEqual(input,saved);assert.deepEqual(plan.sections[0].source,plan.source);assert.deepEqual(plan.sections.at(-1).source,plan.source);
  assert.equal(plan.voices.length,17);
  for(const section of plan.sections){assert.equal(section.source.events.length,input.events.length);assert.equal(section.source.fadeStart-section.source.events.at(-1).frame,input.fadeStart-input.events.at(-1).frame);}
  const variation=createLivingPersonalVariation(input,{reflected:true,rotation:1});
  assert.deepEqual(variation.source.events.map(e=>e.strength),[.1,.05,.025,.025]);
  const before=input.events.slice(1).map((e,i)=>e.frame-input.events[i].frame);
  const after=variation.source.events.slice(1).map((e,i)=>e.frame-variation.source.events[i].frame);
  assert.deepEqual(after,before.reverse());
  const choreography=createLivingJourneyChoreography(plan);assert.equal(choreography.score.passes.reduce((n,p)=>n+p.touches.length,0),17*input.events.length);
 }
});

test('whole rendered opening and isolated home preserve the original PCM',()=>{
 const pcm=renderLivingPersonalJourneyStudy(phrase()),original=renderTineLiveRecord(phrase()).channels[0];
 const home=pcm.plan.voices.at(-1);assert.ok(pcm.plan.voices.slice(0,-1).every(v=>v.endFrame<=home.startFrame));
 for(let ch=0;ch<2;ch++){
  const gain=ch===0?Math.cos(Math.PI/4):Math.sin(Math.PI/4),expected=Float32Array.from(original,v=>0+v*gain);
  assert.deepEqual(pcm.channels[ch].slice(0,original.length),expected);
  assert.deepEqual(pcm.channels[ch].slice(home.startFrame,home.endFrame),expected);
 }
});

test('single/coincident touches and full-length tails retain events without exceeding source bounds',()=>{
 for(const count of [1,8]){
  const source={...phrase(),events:Array.from({length:count},()=>({frame:192000,strength:.025})),fadeStart:382800};
  const variation=createLivingPersonalVariation(source,{spacing:1.15,rotation:count-1,reflected:true});
  assert.deepEqual(variation.source,source);const plan=createLivingPersonalJourneyStudy(source);assert.equal(plan.voices.length,17);
  assert.ok(plan.voices[1].startFrame>=plan.voices[0].endFrame);
  const staged=createLivingJourneyChoreography(plan);assert.equal(staged.score.passes.reduce((n,p)=>n+p.touches.length,0),17*count);
 }
 assert.throws(()=>createLivingPersonalJourneyStudy({...phrase(),events:[]}));
 assert.throws(()=>createLivingPersonalJourneyStudy({...phrase(),events:[{frame:100,strength:-.025}]}));
});
