import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingFragmentAnswer,createLivingReleasedAnswer,renderLivingAnswerStudy,renderLivingStudyBody} from '../src/living/answer-study.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {createLivingChoreography} from '../src/living/choreography.js';
import {createTineDampedRelease} from '../src/tine/damped-release.js';
const fixtures=()=>[...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()];

test('released study changes only the first reply motion, with the exact retained choreography',()=>{
 for(const {source} of fixtures()){
  const plan=createLivingReleasedAnswer(source),base=createLivingFragmentAnswer(source),view=createLivingArrangementView(plan),old=createLivingArrangementView(base),release=createTineDampedRelease(plan.bodies[1],plan.releases[1]);
  assert.deepEqual(plan.voices,base.voices);assert.deepEqual(plan.bodies,base.bodies);
  const choreo=createLivingChoreography(source,'released'),original=createLivingChoreography(source,'fragment');
  const start=(plan.voices[1].startFrame+release.startFrame)/plan.sampleRate,end=plan.voices[1].endFrame/plan.sampleRate;
  for(let frame=0;frame<plan.frames;frame+=1600){const seconds=frame/plan.sampleRate,a=view.at(seconds),b=old.at(seconds);
   assert.deepEqual(choreo.at(seconds),original.at(seconds));
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
  assert.deepEqual(pcm.channels[c].subarray(p.voices[1].endFrame),base.channels[c].subarray(p.voices[1].endFrame));
  assert.notDeepEqual(pcm.channels[c],base.channels[c]);
 }
});

test('an early recorded ending bounds release engagement without changing source timing',()=>{
 const source=createLivingStudyFixtures()[0].source,short={...source,fadeStart:source.events.at(-1).frame};
 const p=createLivingReleasedAnswer({...short,events:[short.events.at(-1)]});assert.equal(p.releases[1].startFrame,short.fadeStart);
 assert.doesNotThrow(()=>renderLivingAnswerStudy({...short,events:[short.events.at(-1)]},'released'));
});
