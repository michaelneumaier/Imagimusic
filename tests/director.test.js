import test from 'node:test';
import assert from 'node:assert/strict';
import {createDirector} from '../src/stage/director.js';
import {createPerformance} from '../src/stage/performance.js';
import {createProjection,stageBindings} from '../src/stage/projection.js';
import {createTraceManifest,compareManifests} from '../src/stage/manifest.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {stagePosition} from '../src/stage/layout.js';

test('camera paths are bounded and seek-independent, with smooth score attention',()=>{
 const passage=createPerformance(DEFAULT_PATCH),direct=createDirector(passage);
 for(const mode of ['establish','follow','detail']){
  const expected=direct(3,mode);direct(29,mode);direct(0,mode);assert.deepEqual(direct(3,mode),expected);
  let previous;
  for(let t=0;t<passage.duration;t+=1/60){const pose=direct(t,mode);assert.ok([...pose.position,...pose.target].every(Number.isFinite));assert.ok(pose.position[1]>2);if(previous)assert.ok(Math.hypot(...pose.position.map((v,i)=>v-previous.position[i]))<.12);previous=pose;}
 }
 const manual={position:[1,2,3],target:[0,1,0]};assert.deepEqual(direct(10,'manual',manual),manual);assert.notEqual(direct(10,'manual',manual).position,manual.position);
 assert.deepEqual(stagePosition('tine'),[-1.6,0,4.1]);
});

test('camera direction participates in export hashes and declared bindings',()=>{
 const passage=createPerformance(DEFAULT_PATCH);passage.duration=1;
 const base=createProjection(DEFAULT_PATCH),direct=createDirector(passage);
 const project=mode=>frame=>{const out=base(frame);out.stage.camera=direct(frame.t,mode);return out;};
 const a=createTraceManifest(passage,{project:project('follow')});
 assert.equal(compareManifests(a,createTraceManifest(passage,{project:project('follow')})).equal,true);
 assert.equal(compareManifests(a,createTraceManifest(passage,{project:project('establish')})).equal,false);
 const binding=stageBindings({camera:true}).find(b=>b.target==='camera');assert.equal(binding.field,'stage.camera');
});
