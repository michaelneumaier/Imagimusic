import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingMotifVariation,createLivingEvolvingJourneyStudy,renderLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {createLivingDirectedPhrase} from '../src/living/generative-phrase.js';
import {createLivingJourneyScore} from '../src/living/journey-score.js';

test('motif development preserves cell boundaries, gaps, accents and admission while reflecting interior timing',()=>{
 for(const seed of [0,42,140182646,2950288811,0xffffffff])for(const spacing of ['close','original','open']){
  const basis=createLivingDirectedPhrase(seed,spacing).source;
  assert.deepEqual(createLivingMotifVariation(seed,{spacing}).source,basis);
  for(const rotation of [0,1,2])for(const reflected of [false,true]){
   const p=createLivingMotifVariation(seed,{spacing,rotation,reflected,strengthScale:.7}).source;
   assert.equal(p.fadeStart,basis.fadeStart);assert.equal(p.events.length,6);
   for(const cell of [0,3]){
    const a=basis.events.slice(cell,cell+3),b=p.events.slice(cell,cell+3);
    assert.equal(a[0].frame,b[0].frame);assert.equal(a[2].frame,b[2].frame);
    const gaps=[a[1].frame-a[0].frame,a[2].frame-a[1].frame];
    assert.deepEqual([b[1].frame-b[0].frame,b[2].frame-b[1].frame],reflected?gaps.reverse():gaps);
    assert.deepEqual(b.map(e=>e.strength),a.map((_,i)=>a[(i+rotation)%3].strength*.7));
   }
  }
 }
 for(const options of [{rotation:3},{rotation:'1'},{reflected:1},{strengthScale:0},{strengthScale:1.01},{strengthScale:NaN}])assert.throws(()=>createLivingMotifVariation(42,options));
});

test('evolving arc develops one seed then restores the original rhythm, accents and exact isolated return',()=>{
 for(const seed of [0,42,2950288811,0xffffffff]){
  const p=createLivingEvolvingJourneyStudy(seed),score=createLivingJourneyScore(p);
  assert.equal(p.sections.length,14);assert.equal(p.voices.length,38);assert.equal(score.passes.length,38);
  assert.deepEqual(p,createLivingEvolvingJourneyStudy(seed));
  assert.deepEqual(p.sections[0].source,createLivingDirectedPhrase(seed).source);
  assert.deepEqual(p.sections.at(-1).source,p.sections[0].source);
  assert.ok(new Set(p.sections.map(s=>JSON.stringify(s.source))).size>=10);
  const first=p.voices[0],last=p.voices.at(-1);
  assert.ok(p.voices[1].startFrame>=first.endFrame);
  assert.ok(last.startFrame>=Math.max(...p.voices.slice(0,-1).map(v=>v.endFrame)));
  assert.equal(last.endFrame,p.frames);
  assert.ok(p.voices.every(v=>Number.isInteger(v.startFrame)&&v.startFrame>=0&&v.endFrame<=p.frames));
 }
 const pcm=renderLivingEvolvingJourneyStudy(42),first=pcm.plan.voices[0],last=pcm.plan.voices.at(-1);
 assert.ok(pcm.peak>0&&pcm.peak<1);
 for(const ch of pcm.channels){
  assert.ok(ch.every(Number.isFinite));
  assert.equal(first.endFrame-first.startFrame,last.endFrame-last.startFrame);
  assert.ok(ch.subarray(first.startFrame,first.endFrame).every((v,i)=>v===ch[last.startFrame+i]));
 }
});
