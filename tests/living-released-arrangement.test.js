import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createLivingArrangement,renderLivingArrangement} from '../src/living/arrangement.js';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingReleasedAnswer} from '../src/living/answer-study.js';
import {createLivingPerformanceView} from '../src/living/performance-view.js';
import {createLivingAttentionView} from '../src/living/attention-view.js';
import {createLivingChoreography} from '../src/living/choreography.js';
const pins=[
  {
    "id": "greeting",
    "frames": 832800,
    "sha256": "527ba8af7d7f312d41f076f9f28001640765bceb9f414bb60e578a8f35cf8f00"
  },
  {
    "id": "single",
    "frames": 720000,
    "sha256": "938d8469ca41d9deddcde7ca25aaaf7a55bced903c4c7602d57a423540ea5227"
  },
  {
    "id": "crowded",
    "frames": 720000,
    "sha256": "b612ab97d307782c28dba461e9b4756b49db504aa27f44932282f42ff8866ba9"
  },
  {
    "id": "spaced",
    "frames": 936000,
    "sha256": "0fc5ecb1f6f58ee052b26893d64b300937f63ebe418fa42cb968fe2da0fd12cc"
  },
  {
    "id": "return",
    "frames": 890160,
    "sha256": "67333d8b4cc641520b9a0c0f4f74b6a82634566f8436e4a327c5d69fe46a0d19"
  },
  {
    "id": "linger",
    "frames": 831600,
    "sha256": "ea7f3ea1a07e599e052d36f735c98eb22a8af2743fcc5ec383c8d460c22e15a3"
  },
  {
    "id": "soften",
    "frames": 879600,
    "sha256": "cebfffb1c633075921670a3feac8c5924154500cd1d6bc42d34a90c793dc64cb"
  },
  {
    "id": "open-limit",
    "frames": 1094640,
    "sha256": "b07a58ecd6be2627ea10c8cabd99515bfc42e8e8de1dff5ba14d391f1e17c5f9"
  },
  {
    "id": "close",
    "frames": 686400,
    "sha256": "35c5f616d64c7627115f6c35dd3e280522527c6208abf4b293c208c6efaabf1d"
  }
];

test('arrangement3 retains the exact pre-extraction released-score PCM across nine fixtures',()=>{
 for(const [i,f] of [...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()].entries()){
  const pcm=renderLivingArrangement(f.source,3),hash=createHash('sha256');
  for(const c of pcm.channels)hash.update(new Uint8Array(c.buffer,c.byteOffset,c.byteLength));
  assert.equal(f.id,pins[i].id);assert.equal(pcm.frames,pins[i].frames);assert.equal(hash.digest('hex'),pins[i].sha256);
  assert.equal(pcm.plan.version,3);assert.equal(pcm.plan.kind,'imagimusic-living-arrangement');
  const {kind,version,...actual}=pcm.plan,{kind:k,version:v,...study}=createLivingReleasedAnswer(f.source);assert.deepEqual(actual,study);
  assert.ok(Object.isFrozen(pcm.plan)&&Object.isFrozen(pcm.plan.releases)&&Object.isFrozen(pcm.plan.pacing));
 }
});

test('arrangement3 uses the released response and exact retained touch choreography in shared performance sampling',()=>{
 const source=createLivingGeneratedStudyFixtures()[3].source,plan=createLivingArrangement(source,3),view=createLivingPerformanceView(source,4,3),attention=createLivingAttentionView(plan),choreo=createLivingChoreography(source,'released');
 for(let frame=0;frame<plan.frames;frame+=1600){const t=frame/plan.sampleRate;assert.deepEqual(view.at(t),{...attention.at(t),performers:choreo.at(t)});}
 assert.equal(createLivingArrangement(source).version,1);
});
