import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingChoreography} from '../src/living/choreography.js';
import {createLivingFragmentAnswer} from '../src/living/answer-study.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {createLivingAttentionView} from '../src/living/attention-view.js';

test('partial reply stages precisely the retained score across authored and generated fixtures',()=>{
 for(const {source} of [...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()]){
  const choreography=createLivingChoreography(source,'fragment'),plan=createLivingFragmentAnswer(source),view=createLivingArrangementView(plan),attention=createLivingAttentionView(plan);
  assert.deepEqual(choreography.score,plan);
  let count=0;
  for(const [voiceIndex,voice] of plan.voices.entries())for(const [eventIndex,event] of plan.bodies[voice.body].events.entries()){
   const time=(voice.startFrame+event.frame)/plan.sampleRate;
   const matching=choreography.at(time).filter(actor=>actor.eventId===`${voiceIndex}:${eventIndex}`&&actor.body===voice.body);
   assert.equal(matching.length,1);assert.ok(matching[0].down>.999999);count++;
   const {cameraShot,...frame}=attention.at(time);assert.deepEqual(frame,view.at(time));assert.ok(Number.isFinite(cameraShot.radius));
  }
  const end=view.at(plan.frames/plan.sampleRate);assert.equal(end.touches,count);assert.equal(end.totalTouches,count);
  assert.equal(count,source.events.length*4+plan.bodies[1].events.length);
 }
});
