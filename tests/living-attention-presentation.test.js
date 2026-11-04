import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingGreeting} from '../src/living/greeting.js';
import {createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingRecord,validateLivingRecord} from '../src/living/record.js';
import {createLivingMoviePlan} from '../src/living/movie-plan.js';
import {createLivingPerformanceView} from '../src/living/performance-view.js';
import {traceHash} from '../src/state.js';

test('presentation4 live and film share exact attention poses in both arrangements',()=>{
 for(const source of [createLivingGreeting(),createLivingGeneratedStudyFixtures()[3].source])for(const arrangementVersion of [1,2]){
  const record=createLivingRecord(source,{presentationVersion:4,arrangementVersion}),movie=createLivingMoviePlan(record),view=createLivingPerformanceView(source,4,arrangementVersion),old=createLivingPerformanceView(source,3,arrangementVersion);
  for(const t of movie.times){
   const frame=view.at(t),{cameraShot,...unchanged}=frame;
   assert.deepEqual(movie.sample(t),frame);assert.deepEqual(unchanged,old.at(t));assert.ok(cameraShot);
  }
  assert.match(movie.manifest.hashScope,/camera target/);
  const changed=structuredClone(movie.sample(6));changed.cameraShot.radius+=.01;
  assert.notEqual(traceHash(changed,12),traceHash(movie.sample(6),12));
 }
});
test('held presentation4 films suppress attention before the renderer consumes the frame',()=>{
 const source=createLivingGreeting();
 for(const arrangementVersion of [1,2])for(const reveal of [true,false]){
  const movie=createLivingMoviePlan(createLivingRecord(source,{presentationVersion:4,arrangementVersion,cameraMotion:false,reveal}));
  const old=createLivingMoviePlan(createLivingRecord(source,{presentationVersion:3,arrangementVersion,cameraMotion:false,reveal}));
  for(const t of movie.times){const {cameraShot,...frame}=movie.sample(t);assert.equal(cameraShot,null);assert.equal(frame.cameraOpen,1);assert.deepEqual(frame,old.sample(t));}
 }
});
test('attention presentation retains the positive-contact boundary and strict version identity',()=>{
 const source=createLivingGreeting();
 for(const strength of [0,-.025])assert.throws(()=>createLivingRecord({...source,events:[{frame:24000,strength}]},{presentationVersion:4}),/positive/);
 const record=createLivingRecord(source,{presentationVersion:4});
 for(const version of ['4',5,null,true])assert.throws(()=>validateLivingRecord({...record,presentationVersion:version}));
 assert.equal(createLivingRecord(source).presentationVersion,2,'API default stays compatible; fresh page opts into4');
});
