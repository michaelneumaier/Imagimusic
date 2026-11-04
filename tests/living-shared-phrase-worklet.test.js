import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:0,strength:.025},{frame:64,strength:.05},{frame:128,strength:.1}],fadeStart:512};
test('shared worklet uses accepted sample frames and produces a replayable single-body performance',async t=>{
 let Processor;
 globalThis.sampleRate=48000;globalThis.currentFrame=4096;
 globalThis.AudioWorkletProcessor=class{constructor(){this.port={messages:[],postMessage:value=>this.port.messages.push(structuredClone(value))};}};
 globalThis.registerProcessor=(name,value)=>{assert.equal(name,'imagimusic-living-shared-phrase');Processor=value;};
 try{
  await import('../src/living/shared-phrase-worklet.js');
  const make=()=>new Processor({processorOptions:{source}});
  const send=(p,data)=>p.port.onmessage({data});
  const block=p=>{const left=new Float32Array(128),right=new Float32Array(128);const active=p.process([],[[left,right]]);assert.deepEqual(right,left);globalThis.currentFrame+=128;return {left,active};};
  await t.test('idle is silent; no participation equals original output, including in-block score events',()=>{
   const p=make();assert.ok(block(p).left.every(v=>v===0));assert.equal(p.port.messages.some(m=>m.type==='origin'),false);
   send(p,{id:0,type:'start'});const origin=currentFrame,all=[];let active=true;
   while(active){const b=block(p);all.push(...b.left);active=b.active;}
   const expected=renderTineLiveRecord(source);assert.deepEqual(Float32Array.from(all.slice(0,expected.frames)),expected.channels[0]);assert.ok(all.slice(expected.frames).every(v=>v===0));
   const touches=p.port.messages.filter(m=>m.type==='touches').flatMap(m=>m.touches);
   assert.deepEqual(touches.map(e=>[e.frame,e.audioFrame,e.origin]),source.events.map(e=>[e.frame,origin+e.frame,'score']));
   assert.equal(p.port.messages.filter(m=>m.type==='finished').length,1);block(p);assert.equal(p.port.messages.filter(m=>m.type==='finished').length,1);
  });
  await t.test('guest at a quantum boundary follows the scheduled touch and all samples replay',()=>{
   const p=make();send(p,{id:0,type:'start'});const first=block(p).left;
   send(p,{id:1,type:'strike',strength:.05});send(p,{id:1,type:'strike',strength:.1});
   send(p,{id:2,type:'quiet'});send(p,{id:3,type:'strike',strength:.025});
   const all=[...first];let active=true;while(active){const b=block(p);all.push(...b.left);active=b.active;}
   const messages=p.port.messages,finished=messages.find(m=>m.type==='finished'),touches=messages.filter(m=>m.type==='touches').flatMap(m=>m.touches);
   assert.deepEqual(touches.map(e=>[e.frame,e.origin]),[[0,'score'],[64,'score'],[128,'score'],[128,'guest']]);
   assert.deepEqual(touches.map(e=>e.index),[0,1,2,3]);assert.equal(messages.filter(m=>m.type==='refused').length,2);
   const expected=renderTineLiveRecord(finished.record);assert.equal(finished.record.fadeStart,128);assert.deepEqual(Float32Array.from(all.slice(0,expected.frames)),expected.channels[0]);
  });
  await t.test('a guest before the first quantum waits for the audio origin before touch publication',()=>{
   const p=make();send(p,{id:0,type:'start'});send(p,{id:1,type:'strike',strength:.025});
   assert.equal(p.port.messages.some(m=>m.type==='touches'),false);const origin=currentFrame;block(p);
   const touches=p.port.messages.filter(m=>m.type==='touches').flatMap(m=>m.touches);
   assert.deepEqual(touches.slice(0,2).map(e=>[e.origin,e.audioFrame]),[['score',origin],['guest',origin]]);
  });
  await t.test('a processing error silences all channels and reports failure only once',()=>{
   const p=make();send(p,{id:0,type:'start'});
   p.pass={...p.pass,process(){throw Error('Injected processing failure');}};
   const left=new Float32Array(128).fill(1),right=new Float32Array(128).fill(1);
   assert.equal(p.process([],[[left,right]]),false);assert.ok(left.every(v=>v===0)&&right.every(v=>v===0));
   assert.equal(p.process([],[[left,right]]),false);assert.equal(p.port.messages.filter(m=>m.type==='error').length,1);
   send(p,{id:1,type:'strike',strength:.1});assert.equal(p.port.messages.at(-1).type,'refused');
  });
  await t.test('rate mismatch is refused and malformed or duplicate commands cannot add touches',()=>{
   assert.throws(()=>new Processor({processorOptions:{source:{...source,sampleRate:44100}}}),/sample rate/);
   const p=make();for(const command of [{id:32,type:'start'},{id:0,type:'unknown'},{id:1,type:'strike',strength:.1}])send(p,command);
   assert.equal(p.pass.state,'idle');send(p,{id:2,type:'start'});send(p,{id:3,type:'strike',strength:NaN});send(p,{id:3,type:'strike',strength:.1});
   assert.equal(p.pass.snapshot().guestTouches,0);assert.equal(p.port.messages.filter(m=>m.type==='refused').length,5);
  });
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
