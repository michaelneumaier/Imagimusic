import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleJourneyStudy} from '../src/living/ensemble-journey-study.js';
import {createEnsembleJourneyView} from '../src/living/ensemble-journey-view.js';
import {createContinuousEnsembleReplayView} from '../src/living/continuous-ensemble-replay-view.js';
import {createSavedTouchMotion} from '../src/living/saved-touch-motion.js';
const records=()=>createEnsembleJourneyStudy().chapters.map(c=>c.record);
test('journey seeking uses the exact chapter state and anticipation on both sides of boundaries',()=>{
 const source=records(),models=createEnsembleJourneyView(source);
 for(const time of [0,1.9,2,47.99,48,49.9,50,95.99,96,98,136,144,10]){
  const chapter=Math.min(2,Math.floor(time/48)),local=time-chapter*48,expected=createContinuousEnsembleReplayView(source[chapter]).at(local),actual=models.view.at(time);
  assert.deepEqual(actual,{...expected,chapter,journeySeconds:time});assert.deepEqual(models.motion.at(time),createSavedTouchMotion(source[chapter]).at(local));
 }
 assert.equal(models.view.at(48).touches,0);assert.equal(models.view.at(96).touches,0);assert.deepEqual(models.motion.at(144),[]);
});
test('journey view copies input and refuses incompatible chapter geometry, duration and clocks',()=>{
 const source=records(),models=createEnsembleJourneyView(source),expected=models.view.at(2);source[0].records[0].events[0].strength=.09;assert.deepEqual(models.view.at(2),expected);
 assert.throws(()=>createEnsembleJourneyView([]));for(const t of [-1,145,NaN])assert.throws(()=>models.view.at(t));
 for(const edit of [r=>r[1].records.forEach(b=>{b.sampleRate=44100;b.fadeStart=48*44100-Math.round(.025*44100);}),r=>r[1].records.forEach(b=>b.fadeStart--),r=>r[1].records[0].design={...r[1].records[0].design,lengthMm:90}]){const r=records();edit(r);assert.throws(()=>createEnsembleJourneyView(r));}
});
