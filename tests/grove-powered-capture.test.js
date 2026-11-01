import test from 'node:test';import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {createPoweredRecipe,composeEncounterRecord,renderPoweredRecord,POWERED_RECORD_VERSION} from '../src/score/grove-powered.js';
import {createPoweredProcessor} from '../src/grove/powered-processor.js';import {createPoweredCapture} from '../src/grove/powered-capture.js';
const recipe=createPoweredRecipe(createGroveRestRecipe(composeGrove({seed:7}),undefined,{sampleRate:8000,zones:[.3,1],strengths:{c1:1}})),driver=composeEncounterRecord(recipe,{forceSeconds:.1,ringSeconds:.1}).driver,fadeFrames=200;
function run(events){const originFrame=128,p=createPoweredProcessor({recipe,driver,originFrame,quietFrame:1600,fadeFrames,events}),messages=[],channels=[[],[]];let frame=0;while(!p.finished){const out=[new Float32Array(128),new Float32Array(128)];p.process(out,frame);out.forEach((ch,i)=>channels[i].push(...ch));messages.push(...p.drain().map(m=>({...m,generation:'current'})));frame+=128;}return {messages,channels:channels.map(c=>Float32Array.from(c)),originFrame};}
function capture(messages){const c=createPoweredCapture(recipe,{generation:'current',driver,fadeFrames});for(const m of messages)c.consume(m);return c;}
test('record uses actual late contact frames, closes at Quiet and rebuilds both heard channels',()=>{
 const heard=run([{id:'late',kind:'contact',zone:0,frame:1},{id:'tip',kind:'contact',zone:1,frame:300},{id:'quiet',kind:'quiet',frame:500},{id:'rejected',kind:'contact',zone:0,frame:501}]),c=capture(heard.messages),record=c.snapshot();
 assert.equal(record.version,POWERED_RECORD_VERSION);assert.equal(record.driver.forcedFrames,372);assert.deepEqual(record.contacts.map(k=>[k.zone,k.start,k.end]),[[0,0,172],[1,172,372]]);assert.equal(c.stats.rejected,1);
 const pcm=renderPoweredRecord(record,recipe);for(let ch=0;ch<2;ch++)assert.deepEqual(pcm.channels[ch],heard.channels[ch].slice(128,700));
 record.contacts[0].start=99;assert.equal(c.snapshot().contacts[0].start,0,'snapshot cannot mutate captured history');
});
test('Quiet at relative frames zero and one are valid silent captures with no invented source sample',()=>{
 for(const frame of [128,129]){const heard=run([{id:'quiet',kind:'quiet',frame}]),record=capture(heard.messages).snapshot();assert.equal(record.driver.forcedFrames,frame-128);assert.ok(renderPoweredRecord(record,recipe).channels.every(ch=>ch.every(v=>v===0)));}
});
test('missing acknowledgements, changed source, or mismatched completion poison capture',()=>{
 const {messages}=run([{id:'hold',kind:'contact',zone:0,frame:200},{id:'quiet',kind:'quiet',frame:500}]);
 const lost=messages.filter(m=>m.id!=='hold');assert.throws(()=>capture(lost),/missing powered acknowledgement/);
 const changed=structuredClone(messages);changed.at(-1).driver.amplitude*=.5;assert.throws(()=>capture(changed),/source differs/);
 const wrong=structuredClone(messages);wrong.at(-1).frame++;assert.throws(()=>capture(wrong),/completion differs/);
});
test('stale generations and queue receipts cannot become capture history',()=>{
 const c=createPoweredCapture(recipe,{generation:'current',driver,fadeFrames});assert.deepEqual(c.consume({generation:'old',type:'error',message:'stale'}),{ignored:true});c.consume({generation:'current',type:'queued'});assert.equal(c.state,'waiting');assert.throws(()=>c.snapshot(),/finish/);
 assert.throws(()=>c.consume({generation:'current',type:'error',message:'failed'}),/audio failed/);assert.equal(c.state,'error');assert.throws(()=>c.snapshot(),/audio failed/);
});
test('capture rejects recipes whose index zero would mislabel the applied contact',()=>{
 const wrong={...recipe,strengths:[{name:'soft',c:.1},{name:'c1',c:1}]};assert.throws(()=>createPoweredCapture(wrong,{generation:'current',driver,fadeFrames}),/single c1/);assert.throws(()=>createPoweredProcessor({recipe:wrong,driver,quietFrame:1600,fadeFrames}),/single c1/);
});
