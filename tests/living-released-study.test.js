import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingFragmentAnswer,createLivingReleasedAnswer,renderLivingAnswerStudy,renderLivingStudyBody} from '../src/living/answer-study.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {createLivingChoreography} from '../src/living/choreography.js';
import {createTineDampedRelease} from '../src/tine/damped-release.js';
const fixtures=()=>[...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()];

test('released study follows retimed touches and changes only the first reply motion',()=>{
 for(const {source} of fixtures()){
  const plan=createLivingReleasedAnswer(source),base=createLivingFragmentAnswer(source),view=createLivingArrangementView(plan),old=createLivingArrangementView({...plan,releases:undefined}),release=createTineDampedRelease(plan.bodies[1],plan.releases[1]);
  assert.deepEqual(plan.voices.slice(0,2),base.voices.slice(0,2));assert.deepEqual(plan.bodies,base.bodies);
  const choreo=createLivingChoreography(source,'released');
  for(const [i,voice] of plan.voices.entries())for(const [j,event] of plan.bodies[voice.body].events.entries()){const actors=choreo.at((voice.startFrame+event.frame)/plan.sampleRate);assert.ok(actors.some(a=>a.eventId===`${i}:${j}`&&a.body===voice.body&&a.down>.999999));}
  const start=(plan.voices[1].startFrame+release.startFrame)/plan.sampleRate,end=plan.voices[1].endFrame/plan.sampleRate;
  for(let frame=0;frame<plan.frames;frame+=1600){const seconds=frame/plan.sampleRate,a=view.at(seconds),b=old.at(seconds);
   assert.deepEqual(a.bodies[0],b.bodies[0]);assert.deepEqual(a.bodies[2],b.bodies[2]);assert.equal(a.touches,b.touches);assert.equal(a.cameraOpen,b.cameraOpen);
   if(seconds<start||seconds>=end)assert.deepEqual(a,b);
   else assert.deepEqual(a.bodies[1].points,release.at((seconds*plan.sampleRate-plan.voices[1].startFrame)/plan.sampleRate).points);
  }
 }
});

test('released mix equals independent stems and preserves opening and exact return',()=>{
 const source=createLivingGeneratedStudyFixtures()[1].source,pcm=renderLivingAnswerStudy(source,'released'),base=renderLivingAnswerStudy(source,'fragment'),p=pcm.plan;
 const sums=[new Float64Array(p.frames),new Float64Array(p.frames)];
 for(const v of p.voices){const stem=renderLivingStudyBody(p,v.body).channels[0];for(let c=0;c<2;c++){const gain=(c?Math.sin:Math.cos)((v.pan+1)*Math.PI/4)*v.gain;for(let i=0;i<stem.length;i++)sums[c][v.startFrame+i]+=stem[i]*gain;}}
 assert.deepEqual(pcm.channels,sums.map(c=>Float32Array.from(c)));
 for(let c=0;c<2;c++){
  assert.deepEqual(pcm.channels[c].subarray(0,p.voices[1].startFrame+p.releases[1].startFrame),base.channels[c].subarray(0,p.voices[1].startFrame+p.releases[1].startFrame));
  assert.deepEqual(pcm.channels[c].subarray(p.returnStart),base.channels[c].subarray(base.plan.returnStart));
  assert.notDeepEqual(pcm.channels[c],base.channels[c]);
 }
});

test('an early recorded ending bounds release engagement without changing source timing',()=>{
 const source=createLivingStudyFixtures()[0].source,short={...source,fadeStart:source.events.at(-1).frame};
 const p=createLivingReleasedAnswer({...short,events:[short.events.at(-1)]});assert.equal(p.releases[1].startFrame,short.fadeStart);
 assert.doesNotThrow(()=>renderLivingAnswerStudy({...short,events:[short.events.at(-1)]},'released'));
});


test('a settling beat advances later voices together without changing their local motifs',()=>{
 for(const {source} of fixtures()){
  const p=createLivingReleasedAnswer(source),base=createLivingFragmentAnswer(source),r=p.sampleRate;
  assert.ok(p.pacing.settleFrames>=.4*r&&p.pacing.settleFrames<=.8*r);
  assert.ok(Number.isInteger(p.pacing.advanceFrames)&&p.pacing.advanceFrames>=0);
  for(let i=2;i<5;i++){
   assert.equal(p.voices[i].startFrame,base.voices[i].startFrame-p.pacing.advanceFrames);
   assert.equal(p.voices[i].endFrame-p.voices[i].startFrame,base.phraseFrames);
  }
  assert.equal(p.returnStart,base.returnStart-p.pacing.advanceFrames);
  assert.equal(p.frames,p.returnStart+p.phraseFrames);
  assert.ok(p.voices[1].endFrame<p.returnStart,'first reply cannot overlap final solo return');
  const next=p.voices[2].startFrame+p.source.events[0].frame,engage=p.voices[1].startFrame+p.releases[1].startFrame;
  if(p.pacing.advanceFrames)assert.equal(next-engage,p.pacing.settleFrames);
  assert.ok(next>p.voices[1].startFrame+p.bodies[1].events.at(-1).frame);
 }
});
