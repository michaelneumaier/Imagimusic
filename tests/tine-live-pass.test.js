import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineLivePass} from '../src/tine/live-pass.js';
import {createTineLiveKernel} from '../src/tine/live-kernel.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const {geometry}=requestForTineDesign(createTineDesign());
test('idle is silent and clockless; early Quiet uses a fixed non-extending fade with no later touches',()=>{
 const pass=createTineLivePass(geometry),block=new Float32Array(128).fill(1);pass.process(block);assert.ok(block.every(x=>x===0));assert.equal(pass.frame,0);
 assert.throws(()=>pass.strike());assert.throws(()=>pass.quiet());pass.start();assert.throws(()=>pass.start());pass.strike(.1);
 const reference=createTineLiveKernel(geometry);reference.strike(.1);
 pass.process(block);reference.process(new Float32Array(128));const ending=pass.quiet();assert.deepEqual(ending,{frame:128,fadeFrames:1200});assert.throws(()=>pass.strike());
 const raw=new Float32Array(1200),actual=new Float32Array(1400);reference.process(raw);pass.process(actual);
 for(let i=0;i<1200;i++)assert.equal(actual[i],Math.fround(raw[i]*(1-i/1199)));
 assert.ok(actual.subarray(1199).every(x=>x===0));assert.equal(pass.state,'ended');assert.equal(pass.frame,1328);assert.deepEqual(pass.quiet(),ending);
});
test('natural pass closes input at the defined sample boundary and ends at eight seconds with an exact final zero',()=>{
 const pass=createTineLivePass(geometry);pass.start();pass.process(new Float32Array(4*48000));assert.equal(pass.state,'playing');assert.equal(pass.strike(.1).frame,192000);
 pass.process(new Float32Array(1));assert.equal(pass.state,'ringing');assert.throws(()=>pass.strike());
 const last=new Float32Array(4*48000+127);pass.process(last);assert.equal(pass.frame,384000);assert.equal(pass.state,'ended');assert.ok(last.subarray(191998).every(x=>x===0));
 const s=pass.snapshot();assert.equal(s.fadeStart,382800);assert.equal(s.endFrame,384000);assert.equal(s.events[0].frame,192000);
});
test('worklet commands acknowledge actual frames, refuse duplicates and report one bounded ending',async()=>{
 let Processor;globalThis.sampleRate=48000;globalThis.currentFrame=0;
 globalThis.AudioWorkletProcessor=class{constructor(){this.port={messages:[],postMessage(value){this.messages.push(value);},onmessage:null};}};
 globalThis.registerProcessor=(name,klass)=>{assert.equal(name,'imagimusic-tine-live');Processor=klass;};
 try{
  await import('../src/tine/live-worklet.js');const worklet=new Processor({processorOptions:{geometry}}),out=new Float32Array(128);
  const send=data=>worklet.port.onmessage({data});
  worklet.process([],[[out]]);assert.ok(out.every(x=>x===0));
  globalThis.currentFrame=128;send({id:0,type:'start'});send({id:1,type:'strike',strength:.1});worklet.process([],[[out]]);
  send({id:2,type:'strike',strength:.1});send({id:2,type:'strike',strength:1});send({id:3,type:'quiet'});send({id:4,type:'strike'});
  for(let i=0;i<12;i++)worklet.process([],[[out]]);
  const messages=worklet.port.messages,applied=messages.filter(m=>m.type==='applied');assert.deepEqual(applied.map(m=>[m.command,m.frame]),[['start',0],['strike',0],['strike',128],['quiet',128]]);
  assert.equal(messages.filter(m=>m.type==='refused').length,2);const ended=messages.filter(m=>m.type==='finished');assert.equal(ended.length,1);assert.equal(ended[0].originAudioFrame,128);assert.equal(ended[0].snapshot.frame,1328);assert.equal(ended[0].snapshot.events.length,2);
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
