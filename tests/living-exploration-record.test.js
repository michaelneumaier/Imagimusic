import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingGreeting} from '../src/living/greeting.js';
import {createLivingRecord,validateLivingRecord} from '../src/living/record.js';
import {createTineLiveComparison} from '../src/tine/live-comparison.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
import {createLivingExploration,validateLivingExploration,serializeLivingExploration,readLivingExplorationFile,renderLivingExploration} from '../src/living/exploration-record.js';
function fixture(lengthMm=95){
 const original=createLivingRecord(createLivingGreeting(),{cameraMotion:false,reveal:false,presentationVersion:1});
 const candidate=createTineLiveComparison(original.source,{lengthMm,widthMm:10}).candidate;
 const response={...candidate,events:[{frame:1234,strength:.05},{frame:45678,strength:.025}],fadeStart:100000};
 return {original,response};
}

test('exploration keeps independent performances and an immutable original context',async()=>{
 for(const length of [65,95]){
  const {original,response}=fixture(length),mutableOriginal=structuredClone(original),mutableResponse=structuredClone(response);
  const pair=createLivingExploration(mutableOriginal,mutableResponse),text=serializeLivingExploration(pair);
  mutableOriginal.source.events[0].frame=0;mutableResponse.events[0].strength=.1;
  assert.deepEqual(pair.original,original);assert.deepEqual(pair.response,response);
  assert.deepEqual(await readLivingExplorationFile(new Blob([text],{type:'application/octet-stream'})),pair);
  assert.equal(pair.original.presentationVersion,1);assert.equal(pair.original.cameraMotion,false);assert.equal(pair.original.reveal,false);
  assert.notDeepEqual(pair.original.source.events,pair.response.events);
  assert.ok(Object.isFrozen(pair)&&Object.isFrozen(pair.response.events));
 }
});

test('reconstruction preserves each solo PCM exactly, including independent sample rates and endings',()=>{
 const {original,response}=fixture();
 const otherRate={...response,sampleRate:44100,events:[{frame:2000,strength:.05}],fadeStart:45000};
 const pair=createLivingExploration(original,otherRate),rendered=renderLivingExploration(pair);
 assert.deepEqual(rendered.original,renderTineLiveRecord(original.source));
 assert.deepEqual(rendered.response,renderTineLiveRecord(otherRate));
 assert.equal(rendered.original.sampleRate,48000);assert.equal(rendered.response.sampleRate,44100);
 assert.notEqual(rendered.original.frames,rendered.response.frames);
});

test('legacy encounter identity is preserved and paired records cannot masquerade as a film recipe',()=>{
 const {original,response}=fixture(),legacy={...original,version:1};delete legacy.presentationVersion;
 const pair=createLivingExploration(legacy,response);
 assert.deepEqual(pair.original,legacy);assert.throws(()=>validateLivingRecord(pair),/Unsupported/);
 assert.throws(()=>validateLivingExploration(original),/Unsupported/);
});

test('strict schema refuses false body relations, invalid children and unknown metadata',()=>{
 const {original,response}=fixture(),pair=createLivingExploration(original,response);
 for(const changes of [{version:2},{version:'1'},{selected:'response'},{original:null},{response:null},{kind:'imagimusic-living-movie'}])assert.throws(()=>validateLivingExploration({...pair,...changes}));
 for(const changes of [{lengthMm:80},{lengthMm:90},{widthMm:12},{activation:.5},{pickup:.5}])assert.throws(()=>createLivingExploration(original,{...response,design:{...response.design,...changes}}));
 for(const events of [[],[{frame:1000,strength:.11}],[{frame:-1,strength:.05}]])assert.throws(()=>createLivingExploration(original,{...response,events}));
 assert.throws(()=>renderLivingExploration({...pair,response:{...response,events:[]}}));
});

test('bounded file reader rejects size lies, bad JSON and read failures',async()=>{
 let read=false;await assert.rejects(readLivingExplorationFile({size:16385,text:async()=>{read=true;return '{}';}}));assert.equal(read,false);
 await assert.rejects(readLivingExplorationFile({size:2,text:async()=>'é'.repeat(9000)}),/too large/);
 await assert.rejects(readLivingExplorationFile(new Blob(['{'])),/JSON/);
 await assert.rejects(readLivingExplorationFile({size:2,text:async()=>{throw Error('read failed');}}),/read failed/);
 for(const value of [null,[],{}, {kind:'imagimusic-living-movie'}])await assert.rejects(readLivingExplorationFile(new Blob([JSON.stringify(value)])));
});

test('worker returns both transferable buffers together or one error',async()=>{
 const {original,response}=fixture(),messages=[];
 globalThis.self={postMessage:(...args)=>messages.push(args)};
 try{
  await import('../src/living/exploration-worker.js');
  self.onmessage({data:createLivingExploration(original,response)});
  assert.equal(messages.length,1);const [{pcm},buffers]=messages[0];
  assert.equal(buffers.length,2);assert.equal(buffers[0],pcm.original.channels[0].buffer);assert.equal(buffers[1],pcm.response.channels[0].buffer);
  assert.deepEqual(pcm.record.original,original);assert.deepEqual(pcm.record.response,response);
  self.onmessage({data:{}});assert.equal(messages.length,2);assert.equal(typeof messages[1][0].error,'string');assert.equal(messages[1][0].pcm,undefined);
 }finally{delete globalThis.self;}
});
