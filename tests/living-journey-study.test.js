import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyStudy,renderLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingDirectedPhrase} from '../src/living/generative-phrase.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';

test('journey retains one seed and closes with the exact opening, across boundary seeds',()=>{
 for(const seed of [0,42,2950288811,0xffffffff]){
  const p=createLivingJourneyStudy(seed);
  assert.deepEqual(p,createLivingJourneyStudy(seed));
  assert.deepEqual(p.sections[0].source,createLivingDirectedPhrase(seed).source);
  assert.deepEqual(p.sections.at(-1).source,p.sections[0].source);
  assert.equal(p.sections.at(-1).endFrame,p.frames);
  assert.ok(Object.isFrozen(p.sections));
  for(let i=0;i<p.sections.length;i++){
   const s=p.sections[i],basis=createLivingDirectedPhrase(seed,s.spacing).source;
   assert.deepEqual(s.source.events,basis.events.slice(0,s.firstCellOnly?3:6).map(e=>({...e,strength:e.strength*s.strengthScale})));
   assert.equal(s.endFrame-s.startFrame,s.arrangement.frames);
   if(i)assert.equal(s.startFrame,p.sections[i-1].endFrame+Math.round(p.sections[i-1].gapSeconds*p.sampleRate));
  }
 }
 for(const seed of [-1,2**32,NaN,'42'])assert.throws(()=>createLivingJourneyStudy(seed));
});

test('render preserves every arranged chapter sample, silence between chapters and exact final return',()=>{
 const pcm=renderLivingJourneyStudy(42);
 assert.ok(pcm.seconds>100&&pcm.seconds<180);
 assert.ok(pcm.peak>0&&pcm.peak<1);
 for(let i=0;i<pcm.plan.sections.length;i++){
  const s=pcm.plan.sections[i],expected=renderLivingArrangement(s.source,s.arrangementVersion);
  for(let ch=0;ch<2;ch++){
   assert.deepEqual(pcm.channels[ch].subarray(s.startFrame,s.endFrame),expected.channels[ch]);
   const next=pcm.plan.sections[i+1]?.startFrame??pcm.frames;
   assert.ok(pcm.channels[ch].subarray(s.endFrame,next).every(x=>x===0));
  }
 }
 const first=pcm.plan.sections[0],last=pcm.plan.sections.at(-1);
 for(const ch of pcm.channels)assert.deepEqual(ch.subarray(first.startFrame,first.endFrame),ch.subarray(last.startFrame,last.endFrame));
});
