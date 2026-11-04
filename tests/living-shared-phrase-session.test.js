import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {createLivingSharedPhraseSession} from '../src/living/shared-phrase-session.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:0,strength:.025},{frame:64,strength:.05},{frame:128,strength:.1}],fadeStart:512};
test('shared session lifecycle with the production worklet under an injected audio host',async t=>{
 let Processor,receiver;
 globalThis.sampleRate=48000;globalThis.currentFrame=1024;
 globalThis.AudioWorkletProcessor=class{constructor(){const deliver=receiver;this.port={postMessage:value=>queueMicrotask(()=>deliver(structuredClone(value)))};}};
 globalThis.registerProcessor=(_,value)=>{Processor=value;};
 try{
  await import('../src/living/shared-phrase-worklet.js');
  function setup({addModule=async()=>{},rate=48000,changeMessage=x=>x}={}){
   const nodes=[],contexts=[],events=[];let ended;
   const finished=new Promise(r=>ended=r);
   const session=createLivingSharedPhraseSession({
    createContext:requested=>{assert.equal(requested,48000);const c={sampleRate:rate,state:'suspended',currentTime:0,destination:{},audioWorklet:{addModule},async resume(){this.state='running';},async close(){this.state='closed';}};contexts.push(c);return c;},
    createNode:(context,options)=>{
     const node={connect(){},disconnect(){this.disconnected=true;},port:{close(){this.closed=true;},onmessage:null}};
     receiver=value=>node.port.onmessage?.({data:changeMessage(value)});
     const processor=new Processor(options);node.processor=processor;
     node.port.postMessage=data=>queueMicrotask(()=>processor.port.onmessage({data}));nodes.push(node);return node;
    },onChange:event=>{events.push(event);if(event.finished)ended(event.finished);},
   });
   async function pump(){const p=nodes.at(-1).processor,all=[];let active=true;while(active){const out=new Float32Array(128);active=p.process([],[[out]]);all.push(...out);globalThis.currentFrame+=128;await Promise.resolve();}return all;}
   return {session,nodes,contexts,events,finished,pump};
  }
  await t.test('explicit start, acknowledged guest, verified ending, output drain and immutable retained result',async()=>{
   const s=setup();assert.equal(s.contexts.length,0);await s.session.start(source,{guestLimit:1});assert.equal(s.session.state,'playing');
   const pending=s.session.strike(.05);await assert.rejects(s.session.strike(.05),/accepting/);await pending;
   assert.equal(s.session.touches,1);const samples=await s.pump(),finished=await s.finished;
   assert.equal(s.session.state,'ended');assert.equal(s.contexts[0].state,'closed');assert.equal(s.nodes[0].disconnected,true);
   assert.deepEqual(finished.snapshot.applied.map(e=>e.origin),['score','guest','score','score']);
   const expected=renderTineLiveRecord(finished.record);assert.deepEqual(Float32Array.from(samples.slice(0,expected.frames)),expected.channels[0]);
   finished.record.events[0]={frame:0,strength:1};assert.equal(s.session.finished.record.events[0].strength,.025);
   const copy=s.session.finished;copy.snapshot.applied.length=0;assert.equal(s.session.finished.snapshot.applied.length,4);
   s.session.park();assert.equal(s.session.finished.record.events.length,4);
   await s.session.start(source);const processor=s.nodes.at(-1).processor,send=processor.port.postMessage;
   processor.port.postMessage=value=>{if(value.type==='finished')value.record.fadeStart++;send(value);};
   await s.pump();assert.equal(s.session.state,'error');assert.equal(s.session.finished.record.events.length,4);
  });
  await t.test('Quiet during module loading closes setup and prevents a late node',async()=>{
   let resume,entered;const ready=new Promise(r=>entered=r);
   const s=setup({addModule:()=>new Promise(r=>{resume=r;entered();})});const pending=s.session.start(source);await ready;
   await s.session.quiet();resume();await assert.rejects(pending,{name:'AbortError'});assert.equal(s.nodes.length,0);assert.equal(s.contexts[0].state,'closed');assert.equal(s.session.finished,null);
  });
  await t.test('device rate mismatch and altered finished provenance are refused',async()=>{
   const mismatch=setup({rate:44100});await assert.rejects(mismatch.session.start(source),/sample rate/);assert.equal(mismatch.contexts[0].state,'closed');assert.equal(mismatch.nodes.length,0);
   const bad=setup({changeMessage:value=>{if(value.type==='finished')value.snapshot.applied[0].origin='guest';return value;}});
   await bad.session.start(source);await bad.pump();assert.equal(bad.session.state,'error');assert.equal(bad.session.finished,null);assert.equal(bad.contexts[0].state,'closed');
  });
  await t.test('invalid clock and touch messages fail before emitting misleading visible events',async()=>{
   for(const corrupt of [value=>{if(value.type==='origin')value.sampleRate=44100;},value=>{if(value.type==='touches')value.touches[0].index=5;},value=>{if(value.type==='touches')value.touches[0].audioFrame++;}]){
    const s=setup({changeMessage:value=>{corrupt(value);return value;}});await s.session.start(source);await s.pump();
    assert.equal(s.session.state,'error');assert.equal(s.session.finished,null);assert.equal(s.events.some(e=>e.events),false);
   }
  });
  await t.test('early Quiet produces a verified short record while future source events are cancelled',async()=>{
   const s=setup();await s.session.start(source);await s.session.quiet();await s.pump();const result=await s.finished;
   assert.equal(result.record.fadeStart,0);assert.deepEqual(result.record.events,[]);assert.equal(result.snapshot.frame,1200);
  });
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
