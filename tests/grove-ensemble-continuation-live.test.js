import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {createEnsembleHost} from '../src/grove/ensemble-host.js';
const processors={};
globalThis.sampleRate=8000;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.messages=[];this.port={postMessage:m=>this.messages.push(m)};}};
globalThis.registerProcessor=(name,value)=>{processors[name]=value;};
await import('../src/grove/ensemble-worklet.js');
const grove=composeGrove({seed:3}),recipe=createGroveRestRecipe(grove,{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000}),recipes=[recipe,recipe,recipe];
const steps=[{part:0,frame:0,command:{kind:'strike',body:0,position:0,velocity:.25}},{part:0,frame:100,command:{kind:'contact',body:0,zone:2,strength:1}},{part:0,frame:200,command:{kind:'contact',body:0,zone:null}}];
function fixture(){
 let processor,node,nextFrame=0;const audio=[[],[]],changes=[];
 const context={sampleRate:8000,currentTime:0,state:'running',destination:{},audioWorklet:{addModule:async()=>{}},async resume(){},async close(){this.state='closed';}};
 const host=createEnsembleHost({createContext:()=>context,prepareRecipes:async()=>({recipes}),createListeningStage:()=>({input:{},output:{connect(){}},dispose(){},setDb(){}}),createNode:(_,options)=>{
  processor=new processors['imagimusic-grove-ensemble']({processorOptions:options.processorOptions});
  node={port:{postMessage:data=>processor.port.onmessage({data}),close(){}},connect(){},disconnect(){}};return node;
 },onChange:change=>changes.push(change)});
 function block(){
  globalThis.currentFrame=nextFrame;const output=[new Float32Array(128),new Float32Array(128)];processor.process([],[output]);output.forEach((c,ch)=>audio[ch].push(...c));nextFrame+=128;context.currentTime=nextFrame/8000;
  for(const message of processor.messages.splice(0))node.port.onmessage?.({data:message});
 }
 function until(condition){for(let i=0;i<1000&&!condition();i++)block();assert.ok(condition(),'expected state within bounded render');}
 function verify(){
  const record=host.recording(),pcm=renderEnsembleRecord(record),origin=host.continuation.originFrame;
  for(let ch=0;ch<2;ch++)assert.deepEqual(Float32Array.from(audio[ch].slice(origin,origin+pcm.channels[ch].length)),pcm.channels[ch]);
  return record;
 }
 return {host,block,until,verify,changes};
}
test('production processor keeps remembered gestures and a later personal answer in one exact reconstruction',async()=>{
 const {host,until,verify}=fixture();await host.enable([grove,grove,grove]);host.scheduleContinuation(steps,{handoffFrame:500});
 assert.equal(host.send(2,steps[0].command).reason,'continuation');until(()=>host.continuation.state==='completed');
 assert.equal(host.continuation.boundaryFrame,host.continuation.baseFrame+500);
 assert.equal(host.send(2,steps[0].command).queued,true);until(()=>host.stats[2].strikes===1);
 host.quiet();until(()=>host.state==='ended');const record=verify();
 assert.equal(record.parts[0].record.events.length,1);assert.equal(record.parts[2].record.events.length,1);
 assert.ok(record.parts[2].record.events[0].frame>500);assert.equal(record.parts[0].record.contacts[0].start,100);assert.equal(record.parts[0].record.contacts[0].end,200);
 assert.equal(host.continuation.state,'completed');assert.equal(host.continuation.acknowledged,3);host.dispose();
});
test('production early Quiet yields a partial remembered capture, no completed boundary, and exact rendered output',async()=>{
 const {host,block,until,verify}=fixture();await host.enable([grove,grove,grove]);host.scheduleContinuation(steps,{handoffFrame:2000});
 block();host.quiet();until(()=>host.state==='ended');const record=verify();
 assert.equal(host.continuation.state,'aborted');assert.equal('boundaryFrame' in host.continuation,false);
 assert.equal(record.parts[0].record.events.length,1);assert.equal(record.parts[0].record.contacts[0].end,record.ended.frame);
 assert.equal(record.parts[2].record.events.length,0);assert.equal(host.continuation.refused,1,'release after Quiet is recorded as refused, not lost');host.dispose();
});
