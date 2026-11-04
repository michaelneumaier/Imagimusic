import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingRecord,validateLivingRecord,livingFragment,readLivingAddress} from '../src/living/record.js';
import {createLivingGreeting} from '../src/living/greeting.js';
import {createLivingGeneratedPhrase} from '../src/living/generative-phrase.js';
import {createLivingMoviePlan,validateLivingMovieAudio} from '../src/living/movie-plan.js';
import {createLivingPerformanceView} from '../src/living/performance-view.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {createLivingExploration,serializeLivingExploration,readLivingExplorationFile} from '../src/living/exploration-record.js';
import {createTineLiveComparison} from '../src/tine/live-comparison.js';
import {readLivingKeptFile} from '../src/living/recipe-file.js';

test('spacious and released encounters survive address, recipe, paired origin and every film frame',async()=>{
 for(const source of [createLivingGreeting(),createLivingGeneratedPhrase(42).source])for(const presentationVersion of [1,2,3,4])for(const arrangementVersion of [2,3]){
  const record=createLivingRecord(source,{arrangementVersion,presentationVersion});
  assert.deepEqual(readLivingAddress(livingFragment(record)),record);
  assert.deepEqual(await readLivingKeptFile(new Blob([JSON.stringify(record)])),record);
  const response=createTineLiveComparison(source,{lengthMm:65,widthMm:10}).candidate;
  const pair=createLivingExploration(record,response),reopened=await readLivingExplorationFile(new Blob([serializeLivingExploration(pair)]));
  assert.deepEqual(reopened.original,record);
  const film=createLivingMoviePlan(reopened.original),view=createLivingPerformanceView(source,presentationVersion,arrangementVersion),pcm=renderLivingArrangement(source,arrangementVersion);
  validateLivingMovieAudio(pcm,film.manifest);assert.equal(film.manifest.record.arrangementVersion,arrangementVersion);
  assert.equal(film.manifest.audioSamples,view.plan.frames);
  for(const t of film.times)assert.deepEqual(film.sample(t),view.at(t));
  assert.throws(()=>validateLivingMovieAudio(renderLivingArrangement(source,1),film.manifest),/sample count/);
 }
 const legacy={...createLivingRecord(createLivingGreeting()),version:1,arrangementVersion:2};delete legacy.presentationVersion;
 assert.throws(()=>validateLivingRecord(legacy),/Unsupported/);
});

test('arrangement worker accepts exact encounters and legacy sources without silently downgrading invalid versions',async()=>{
 const previous=globalThis.self;let reply,transfers;
 globalThis.self={postMessage:(value,buffers)=>{reply=value;transfers=buffers;}};
 try{
  await import('../src/living/arrangement-worker.js');
  const source=createLivingGreeting();
  for(const version of [1,2,3]){
   const record=createLivingRecord(source,{arrangementVersion:version,presentationVersion:3});
   self.onmessage({data:record});assert.deepEqual(reply.pcm,renderLivingArrangement(source,version));assert.equal(transfers.length,2);
  }
  self.onmessage({data:source});assert.deepEqual(reply.pcm,renderLivingArrangement(source));
  for(const version of [0,4,'2','3']){self.onmessage({data:{...createLivingRecord(source),arrangementVersion:version}});assert.match(reply.error,/Unsupported/);assert.equal(reply.pcm,undefined);}
 }finally{if(previous===undefined)delete globalThis.self;else globalThis.self=previous;}
});
