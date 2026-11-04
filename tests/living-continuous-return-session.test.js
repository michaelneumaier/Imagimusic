import test from 'node:test';
import {Worker} from 'node:worker_threads';
import {createMemoryReturnVerifyJob} from '../src/living/continuous-return-verify-job.js';
import {validateMemoryReturnFinished} from '../src/living/memory-return-result.js';
import assert from 'node:assert/strict';
import {createContinuousReturnSession} from '../src/living/continuous-return-session.js';
import {validateContinuousReturnFinished} from '../src/living/continuous-return-result.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
const verify=input=>validateContinuousReturnFinished(input.seed,input.sampleRate,input.data,input.touches,input.originAudioFrame,input.quietFrame);
test('continuous session through production worklet and injected audio host',async t=>{
 const processors=new Map();let receiver;globalThis.sampleRate=48000;globalThis.currentFrame=4096;
 globalThis.AudioWorkletProcessor=class{constructor(){const deliver=receiver;this.port={postMessage:value=>queueMicrotask(()=>deliver(structuredClone(value)))};}};
 globalThis.registerProcessor=(name,value)=>processors.set(name,value);
 try{
  await import('../src/living/continuous-return-worklet.js');
  await import('../src/living/memory-return-worklet.js');
  function setup({createMemoryVerifyJob=input=>({promise:Promise.resolve().then(()=>validateMemoryReturnFinished(input.seed,input.sampleRate,input.data,input.touches,input.originAudioFrame,input.quietFrame)),cancel(){}}),addModule=async()=>{},rate=48000,changeMessage=x=>x,createVerifyJob=input=>({promise:Promise.resolve().then(()=>verify(input)),cancel(){}})}={}){
   const nodes=[],contexts=[],stages=[],events=[];let done;
   const finished=new Promise(resolve=>done=resolve);
   const session=createContinuousReturnSession({createVerifyJob,createMemoryVerifyJob,
    createContext:requested=>{assert.equal(requested,48000);const c={sampleRate:rate,state:'suspended',currentTime:currentFrame/48000,destination:{},audioWorklet:{addModule},async resume(){this.state='running';},async close(){this.state='closed';this.closed=(this.closed??0)+1;}};contexts.push(c);return c;},
    createListeningStage:()=>{const stage={input:{},output:{connect(){}},setDb(db){this.db=db;},dispose(){this.disposed=true;}};stages.push(stage);return stage;},
    createNode:(context,options)=>{
     const node={connect(){},disconnect(){this.disconnected=true;},port:{close(){this.closed=true;},onmessage:null}};
     receiver=value=>node.port.onmessage?.({data:changeMessage(value)});node.processor=new (processors.get(options.processorOptions.mode==='memory'?'imagimusic-memory-return':'imagimusic-continuous-return'))(options);
     node.port.postMessage=data=>queueMicrotask(()=>node.processor.port.onmessage({data}));nodes.push(node);return node;
    },onChange:event=>{events.push(event);if(event.finished)done(event.finished);},
   });
   async function pump(){const node=nodes.at(-1),context=contexts.at(-1),parts=[];let active=true;
    while(active&&context.state==='running'){const out=new Float32Array(128);active=node.processor.process([],[[out]]);parts.push(out);globalThis.currentFrame+=128;context.currentTime=currentFrame/48000;await Promise.resolve();}
    const samples=new Float32Array(parts.length*128);parts.forEach((part,i)=>samples.set(part,i*128));return samples;
   }
   return {session,nodes,contexts,stages,events,finished,pump};
  }
  await t.test('explicit memory mode runs responsive worklet through a real verification worker',async()=>{
   let worker;
   class Bridge{constructor(url){worker=this;this.thread=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.thread.on('message',data=>{if(!data.testStarted)this.onmessage?.({data});});this.thread.on('error',error=>this.onerror?.({message:error.message}));}postMessage(data){this.thread.postMessage(data);}terminate(){this.stopped=this.thread.terminate();}}
   const s=setup({createMemoryVerifyJob:input=>createMemoryReturnVerifyJob(input,{WorkerClass:Bridge})});await s.session.start(42,{mode:'memory'});
   for(const strength of [.025,.1,.05])await s.session.strike(strength);
   const samples=await s.pump(),result=await s.finished;await worker.stopped;
   assert.equal(result.kind,'imagimusic-memory-return-completion');assert.equal(result.plan.contributions.length,3);assert.equal(result.memory.sealed,true);assert.equal(result.record.events.length,29);
   assert.deepEqual(samples,renderContinuousTineRecord(result.record).channels[0]);assert.equal(s.events.find(e=>e.state==='preparing').mode,'memory');
   await assert.rejects(s.session.start(42,{mode:'unknown'}),/mode/);assert.deepEqual(s.session.finished,result);
  });
  await t.test('wrong ready-mode identity is refused before playing',async()=>{
   const s=setup({changeMessage:value=>{if(value.type==='ready')delete value.kind;return value;}});
   await assert.rejects(s.session.start(42,{mode:'memory'}),/mode/);assert.equal(s.contexts[0].closed,1);assert.equal(s.session.finished,null);
  });
  await t.test('one explicit start finishes unattended, drains audio, and retains isolated verified output',async()=>{
   const s=setup();assert.equal(s.contexts.length,0);await s.session.start(42);assert.equal(s.session.state,'playing');s.session.setListeningDb(3);assert.equal(s.stages[0].db,3);
   const samples=await s.pump(),finished=await s.finished,expected=renderContinuousTineRecord(finished.record);
   assert.deepEqual(samples,expected.channels[0]);assert.equal(finished.record.events.length,25);assert.equal(s.session.state,'ended');assert.equal(s.session.time(),48);
   assert.equal(s.contexts[0].closed,1);assert.equal(s.nodes[0].port.closed,true);assert.equal(s.stages[0].disposed,true);
   finished.record.events.length=0;assert.equal(s.session.finished.record.events.length,25);s.session.park();assert.equal(s.session.finished.record.events.length,25);
  });
  await t.test('acknowledged guest and Quiet keep a short record; failed replacement retains it',async()=>{
   let corrupt=false;const s=setup({changeMessage:value=>{if(corrupt&&value.type==='finished')value.snapshot.body.modes[0].velocityMPerS+=1;return value;}});
   await s.session.start();const touch=s.session.strike(.05);await assert.rejects(s.session.strike(.1),/accepting/);await touch;assert.equal(s.session.touches,1);
   await s.session.quiet();await s.pump();const first=await s.finished;assert.equal(first.record.events.length,1);assert.equal(first.record.fadeStart,0);
   corrupt=true;await s.session.start();await s.session.quiet();await s.pump();await new Promise(resolve=>setTimeout(resolve,10));
   assert.equal(s.session.state,'error');assert.deepEqual(s.session.finished,first);assert.equal(s.contexts.at(-1).closed,1);
  });
  await t.test('Quiet cancels module preparation and blocks a late audio node',async()=>{
   let release,entered;const loaded=new Promise(resolve=>entered=resolve),s=setup({addModule:()=>new Promise(resolve=>{release=resolve;entered();})});
   const pending=s.session.start();await loaded;await s.session.quiet();release();await assert.rejects(pending,{name:'AbortError'});
   assert.equal(s.nodes.length,0);assert.equal(s.contexts[0].closed,1);assert.equal(s.session.finished,null);
  });
  await t.test('parking during verification cancels work and suppresses late results',async()=>{
   let resolveJob,cancels=0,input;const s=setup({createVerifyJob:value=>{input=value;return {promise:new Promise(resolve=>resolveJob=resolve),cancel(){cancels++;}};}});
   await s.session.start();await s.session.quiet();await s.pump();assert.equal(s.session.state,'verifying');s.session.park();resolveJob(verify(input));await Promise.resolve();
   assert.equal(cancels,1);assert.equal(s.session.state,'interrupted');assert.equal(s.session.finished,null);assert.equal(s.contexts[0].closed,1);
  });
  await t.test('rate mismatch and invalid live event evidence close resources before publication',async()=>{
   const mismatch=setup({rate:44100});await assert.rejects(mismatch.session.start(),/sample rate/);assert.equal(mismatch.contexts[0].closed,1);
   for(const corrupt of [value=>{if(value.type==='origin')value.audioFrame=-1;},value=>{if(value.type==='touches')value.touches[0].audioFrame++;}]){
    const s=setup({changeMessage:value=>{corrupt(value);return value;}});await s.session.start();await s.session.strike(.05);await s.pump();
    assert.equal(s.session.state,'error');assert.equal(s.session.finished,null);assert.equal(s.events.some(e=>e.events),false);assert.equal(s.contexts[0].closed,1);
   }
  });
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
