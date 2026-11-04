import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLivingJourneyMovie} from '../src/living/journey-movie-render.js';
import {traceHash} from '../src/state.js';
const frames=[{seconds:0,instances:[]},{seconds:1/30,instances:[]}];
const plan={manifest:{fps:30,frameHashes:frames.map(f=>traceHash(f,12))},times:[0,1/30],sample:t=>frames[Math.round(t*30)]};
function setup(overrides={}){
 const events=[];const session={async addAudio(){events.push('audio');},draw:frame=>events.push(frame),async addVideo(t,d){events.push([t,d]);},closeVideo:()=>events.push('closed'),async finish(){events.push('finished');return new Blob(['test-double'],{type:'video/mp4'});},cancel:async()=>events.push('cancelled'),dispose:()=>events.push('disposed'),...overrides};
 return {events,backend:{supports:async()=>true,createSession:async()=>session}};
}
test('encoder orchestration renders every exact state/time and disposes on completion',async()=>{
 const {events,backend}=setup();const blob=await renderLivingJourneyMovie(plan,{},backend,{yieldFrame:async()=>{}});
 assert.equal(blob.type,'video/mp4');assert.deepEqual(events.filter(Array.isArray),[[0,1/30],[1/30,1/30]]);
 assert.equal(events.filter(e=>e===frames[0]).length,1);assert.equal(events.filter(e=>e===frames[1]).length,1);
 assert.ok(events.includes('audio'));assert.ok(events.includes('closed'));assert.equal(events.at(-1),'disposed');assert.ok(!events.includes('cancelled'));
});
test('cancellation during pending encoding cancels once and cannot publish the late result',async()=>{
 let release,started;const ready=new Promise(resolve=>started=resolve),controller=new AbortController();
 const {events,backend}=setup({addVideo:()=>new Promise(resolve=>{release=resolve;started();})});
 const pending=renderLivingJourneyMovie(plan,{},backend,{signal:controller.signal,yieldFrame:async()=>{}});
 await ready;controller.abort();release();await assert.rejects(pending,{name:'AbortError'});
 assert.equal(events.filter(e=>e==='cancelled').length,1);assert.equal(events.at(-1),'disposed');assert.ok(!events.includes('finished'));
});
test('unsupported encoder, changed state, track errors and late finalization abort cannot return a film',async()=>{
 await assert.rejects(renderLivingJourneyMovie(plan,{}, {supports:async()=>false,createSession:()=>assert.fail('must not allocate')}),/cannot encode/);
 for(const [changed,overrides,pattern] of [[{...plan,sample:()=>({changed:true})},{},/state changed/],[plan,{addAudio:async()=>{throw Error('audio failure');}},/audio failure/]]){
  const {events,backend}=setup(overrides);await assert.rejects(renderLivingJourneyMovie(changed,{},backend,{yieldFrame:async()=>{}}),pattern);
  assert.equal(events.filter(e=>e==='cancelled').length,1);assert.equal(events.at(-1),'disposed');
 }
 const controller=new AbortController(),{events,backend}=setup({async finish(){controller.abort();return new Blob(['late'],{type:'video/mp4'});}});
 await assert.rejects(renderLivingJourneyMovie(plan,{},backend,{signal:controller.signal,yieldFrame:async()=>{}}),{name:'AbortError'});
 assert.equal(events.at(-1),'disposed');
});
