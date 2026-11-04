import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleJourneyStudy} from '../src/living/ensemble-journey-study.js';
import {validateContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
test('a single opening returns exactly after distribution, reversal and thinning',()=>{
 const plan=createEnsembleJourneyStudy(),first=plan.chapters[0].events.slice(0,3),last=plan.chapters[2].events.slice(-3);
 assert.deepEqual(first.map(e=>({...e,frame:e.frame-first[0].frame})),last.map(e=>({...e,frame:e.frame-last[0].frame})));
 assert.equal(plan.chapters.length,3);assert.equal(plan.seconds,144);
 assert.ok(new Set(plan.chapters[1].events.map(e=>e.body)).size===3);
 for(const chapter of plan.chapters){assert.ok(chapter.events.every((e,i,a)=>e.strength>0&&e.strength<=.1&&e.frame>=0&&e.frame<44*plan.sampleRate&&(!i||e.frame>=a[i-1].frame)));}
});
test('every chapter is independently admitted at both playback rates for offered seeds',()=>{
 for(const sampleRate of [44100,48000])for(const seed of [42,3911836942,3382146154]){
  const plan=createEnsembleJourneyStudy(seed,{sampleRate});
  for(const chapter of plan.chapters){const checked=validateContinuousEnsembleRecord(chapter.record);assert.equal(checked.records.reduce((n,r)=>n+r.events.length,0),chapter.events.length);assert.equal(checked.records[0].fadeStart,48*sampleRate-Math.round(.025*sampleRate));}
 }
});
test('deterministic seeds vary the motif while caller mutation does not affect a new journey',()=>{
 const first=createEnsembleJourneyStudy();assert.deepEqual(first,createEnsembleJourneyStudy());assert.notDeepEqual(first.motif,createEnsembleJourneyStudy(3382146154).motif);
 first.chapters[0].record.records[0].events[0].strength=99;assert.notDeepEqual(first,createEnsembleJourneyStudy());
 for(const seed of [-1,NaN,2**32])assert.throws(()=>createEnsembleJourneyStudy(seed));
});

test('three personal touches retain exact timing and accents at the opening and both home returns',()=>{
 for(const sampleRate of [44100,48000]){
  const gesture=[{frame:0,strength:.05},{frame:Math.round(.317*sampleRate),strength:.1},{frame:3*sampleRate,strength:.025}],plan=createEnsembleJourneyStudy(42,{sampleRate,gesture});
  const expected=gesture.map(e=>({...e,body:0}));
  assert.deepEqual(plan.chapters[0].events.slice(0,3).map(e=>({...e,frame:e.frame-2*sampleRate})),expected);
  for(const start of [32,40])assert.deepEqual(plan.chapters[2].events.filter(e=>e.frame>=start*sampleRate&&e.frame<=(start+3)*sampleRate).map(e=>({...e,frame:e.frame-start*sampleRate})),expected);
  for(const c of plan.chapters)validateContinuousEnsembleRecord(c.record);
  gesture[0].strength=.09;assert.equal(plan.motif[0].strength,.05);assert.equal(plan.motifSource,'personal');
 }
});
test('personal input refuses truncation, coincident touches and unsupported fields',()=>{
 const good=[{frame:0,strength:.025},{frame:1,strength:.1},{frame:144000,strength:.05}];
 for(const gesture of [[],good.slice(0,2),[...good,good[2]],[{...good[0],frame:1},...good.slice(1)],[good[0],{...good[1],frame:0},good[2]],[...good.slice(0,2),{...good[2],frame:144001}],[{...good[0],strength:-.1},...good.slice(1)],[{...good[0],label:'extra'},...good.slice(1)]])assert.throws(()=>createEnsembleJourneyStudy(42,{gesture}));
});
