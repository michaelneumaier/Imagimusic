import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyMovieSource,completeLivingJourneyMoviePlan,createLivingJourneyMoviePlan} from '../src/living/journey-movie-plan.js';
const request={kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'connected'};

test('batched preparation retains exact offline manifest and source after caller edits',async()=>{
 const input={...request},source=createLivingJourneyMovieSource(input),baseline=createLivingJourneyMoviePlan(input);
 input.seed=0;input.treatment='evolving';let yields=0;
 const progress=[];
 const actual=await completeLivingJourneyMoviePlan(source,{yieldFrame:async()=>{yields++;},onProgress:message=>progress.push(message)});
 assert.deepEqual(actual.manifest,baseline.manifest);assert.deepEqual(actual.times,baseline.times);
 assert.equal(yields,Math.ceil(source.times.length/32));assert.equal(progress.length,yields);
 assert.equal(source.manifest.frameHashes.length,0);
 assert.equal(actual.manifest.frameHashes.length,1207);
 assert.deepEqual(actual.sample(5),baseline.sample(5));
});

test('cancellation before work, at a frame batch and during a pending yield publishes no plan',async()=>{
 const source=createLivingJourneyMovieSource(request);
 const before=new AbortController();before.abort();let yields=0;
 await assert.rejects(completeLivingJourneyMoviePlan(source,{signal:before.signal,yieldFrame:async()=>yields++}),{name:'AbortError'});
 assert.equal(yields,0);
 const during=new AbortController();
 await assert.rejects(completeLivingJourneyMoviePlan(source,{signal:during.signal,yieldFrame:async()=>{if(++yields===2)during.abort();}}),{name:'AbortError'});
 assert.equal(yields,2);
 let release;const waiting=new AbortController();
 const pending=completeLivingJourneyMoviePlan(source,{signal:waiting.signal,yieldFrame:()=>new Promise(resolve=>release=resolve)});
 waiting.abort();release();await assert.rejects(pending,{name:'AbortError'});
 assert.equal(source.manifest.frameHashes.length,0);
});
