import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyScore} from '../src/living/journey-score.js';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';

test('score diagram retains exact rendered body, voice and accepted-touch clocks in both structures',()=>{
 for(const make of [createLivingJourneyStudy,createLivingConnectedJourneyStudy])for(const seed of [42,2950288811]){
  const plan=make(seed),score=createLivingJourneyScore(plan);
  assert.equal(score.frames,plan.frames);assert.equal(score.sampleRate,plan.sampleRate);
  assert.equal(score.passes.length,plan.voices?17:35);
  assert.ok(Object.isFrozen(score.passes));
  for(const pass of score.passes){
   const section=plan.sections[pass.section],original=(plan.voices??section.arrangement.voices).find(v=>v.body===section.arrangement.bodies.findIndex(b=>b.design.lengthMm===pass.bodyMm)&&v.part===pass.part&&(!plan.voices||v.section===pass.section));
   assert.ok(original);
   const offset=plan.voices?0:section.startFrame;
   assert.equal(pass.startFrame,original.startFrame+offset);
   assert.equal(pass.endFrame,original.endFrame+offset);
   assert.deepEqual(pass.touches,section.arrangement.bodies[original.body].events.map(e=>({...e,frame:e.frame+pass.startFrame})));
   assert.ok(pass.touches.every(e=>e.frame>=pass.startFrame&&e.frame<pass.endFrame));
   assert.ok(pass.startFrame>=0&&pass.endFrame<=score.frames);
  }
  const first=score.passes[0],last=score.passes.at(-1);
  assert.deepEqual(first.touches.map(e=>({...e,frame:e.frame-first.startFrame})),last.touches.map(e=>({...e,frame:e.frame-last.startFrame})));
 }
});
