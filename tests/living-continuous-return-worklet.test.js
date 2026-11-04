import test from 'node:test';
import assert from 'node:assert/strict';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
test('continuous return worklet host contract',async t=>{
 let Processor;globalThis.sampleRate=48000;globalThis.currentFrame=8192;
 globalThis.AudioWorkletProcessor=class{constructor(){this.port={messages:[],postMessage:value=>this.port.messages.push(structuredClone(value))};}};
 globalThis.registerProcessor=(name,ctor)=>{assert.equal(name,'imagimusic-continuous-return');Processor=ctor;};
 try{
  await import('../src/living/continuous-return-worklet.js');
  const make=()=>new Processor({processorOptions:{sampleRate,seed:42}}),send=(p,data)=>p.port.onmessage({data});
  function block(p){const left=new Float32Array(128),right=new Float32Array(128);const active=p.process([],[[left,right]]);assert.deepEqual(left,right);globalThis.currentFrame+=128;return {left,active};}
  const touches=p=>p.port.messages.filter(m=>m.type==='touches').flatMap(m=>m.touches);
  await t.test('one start runs the complete unattended score and publishes exact replay evidence',()=>{
   const p=make();assert.ok(block(p).left.every(x=>x===0));assert.equal(p.port.messages.some(m=>m.type==='origin'),false);
   send(p,{id:0,type:'start'});const origin=currentFrame,all=new Float32Array(48*sampleRate);let offset=0,active=true;
   while(active){const b=block(p);all.set(b.left,offset);offset+=128;active=b.active;}
   const finished=p.port.messages.find(m=>m.type==='finished'),expected=renderContinuousTineRecord(finished.record);
   assert.deepEqual(all,expected.channels[0]);assert.equal(touches(p).length,25);
   assert.ok(touches(p).every((e,i)=>e.index===i&&e.audioFrame===origin+e.frame&&e.origin==='score'));
   assert.equal(finished.originAudioFrame,origin);block(p);assert.equal(p.port.messages.filter(m=>m.type==='finished').length,1);
  });
  await t.test('pre-origin touch, duplicate refusal and Quiet produce one reconstructible short capture',()=>{
   const p=make();send(p,{id:0,type:'start'});send(p,{id:1,type:'strike',strength:.05});send(p,{id:1,type:'strike',strength:.1});
   assert.equal(touches(p).length,0);const origin=currentFrame,all=[];all.push(...block(p).left);
   send(p,{id:2,type:'quiet'});send(p,{id:3,type:'strike',strength:.025});let active=true;
   while(active){const b=block(p);all.push(...b.left);active=b.active;}
   const finished=p.port.messages.find(m=>m.type==='finished'),expected=renderContinuousTineRecord(finished.record);
   assert.deepEqual(Float32Array.from(all.slice(0,expected.frames)),expected.channels[0]);assert.ok(all.slice(expected.frames).every(x=>x===0));
   assert.deepEqual(touches(p).map(e=>[e.frame,e.origin,e.audioFrame]),[[0,'guest',origin]]);assert.equal(finished.record.fadeStart,128);
   assert.equal(p.port.messages.filter(m=>m.type==='refused').length,2);
  });
  await t.test('cancellation discards the pending capture without publishing a finished record',()=>{
   const p=make();send(p,{id:0,type:'start'});send(p,{id:1,type:'strike',strength:.1});send(p,{id:2,type:'cancel'});
   const result=block(p);assert.equal(result.active,false);assert.ok(result.left.every(x=>x===0));
   assert.equal(p.pending.length,0);assert.equal(touches(p).length,0);assert.equal(p.port.messages.filter(m=>m.type==='cancelled').length,1);
   assert.equal(p.port.messages.some(m=>m.type==='finished'||m.type==='origin'),false);send(p,{id:3,type:'start'});assert.equal(p.port.messages.at(-1).type,'refused');
  });
  await t.test('invalid commands cannot play and context rate cannot silently retime the score',()=>{
   assert.throws(()=>new Processor({processorOptions:{sampleRate:44100,seed:42}}),/sample rate/);
   const p=make();for(const data of [{id:8192,type:'start'},{id:0,type:'unknown'},{id:1,type:'strike',strength:.1},{id:2,type:'quiet'}])send(p,data);
   assert.equal(p.performance.state,'idle');send(p,{id:3,type:'start'});send(p,{id:4,type:'strike',strength:NaN});send(p,{id:4,type:'strike',strength:.05});
   assert.equal(p.performance.snapshot().events.length,0);assert.equal(p.port.messages.filter(m=>m.type==='refused').length,6);
  });
  await t.test('processing failure silences every channel and reports only once',()=>{
   const p=make();send(p,{id:0,type:'start'});p.performance={...p.performance,process(){throw Error('Injected failure');}};
   assert.equal(block(p).active,false);assert.ok(block(p).left.every(x=>x===0));assert.equal(p.port.messages.filter(m=>m.type==='error').length,1);
   send(p,{id:1,type:'strike',strength:.1});assert.equal(p.port.messages.at(-1).type,'refused');
  });
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
