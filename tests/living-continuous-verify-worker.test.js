import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {createContinuousReturnVerifyJob,createMemoryReturnVerifyJob} from '../src/living/continuous-return-verify-job.js';
class BrowserWorkerBridge{
 static instances=[];
 constructor(url){this.started=new Promise(resolve=>this.markStarted=resolve);this.worker=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.worker.on('message',data=>data.testStarted?this.markStarted():this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.({message:error.message}));BrowserWorkerBridge.instances.push(this);}
 postMessage(data){this.worker.postMessage(data);}
 terminate(){this.terminations=(this.terminations??0)+1;this.stopped=this.worker.terminate();}
}
function fixture(){
 const p=createContinuousReturnPerformance(42),block=new Float32Array(128),originAudioFrame=8192;p.start();p.tryGuest(.05);
 while(p.state!=='ended')p.process(block);
 const snapshot=p.snapshot();
 return {seed:42,sampleRate:48000,data:{type:'finished',seed:42,originAudioFrame,record:p.record(),snapshot},touches:snapshot.events.map(e=>({...e,audioFrame:originAudioFrame+e.frame})),originAudioFrame,quietFrame:null};
}
const make=input=>createContinuousReturnVerifyJob(input,{WorkerClass:BrowserWorkerBridge});
test('actual verification worker reconstructs a full joined performance and releases itself',async()=>{
 const input=fixture(),job=make(input),worker=BrowserWorkerBridge.instances.at(-1),result=await job.promise;await worker.stopped;
 assert.deepEqual(result.record,input.data.record);assert.deepEqual(result.snapshot,input.data.snapshot);assert.equal(worker.terminations,1);job.cancel();assert.equal(worker.terminations,1);
 result.snapshot.body.modes[0].energyJ=999;assert.notEqual(input.data.snapshot.body.modes[0].energyJ,999);
});
test('actual verification worker rejects changed physical state and malformed requests',async()=>{
 const input=fixture();input.data.snapshot.body.modes[0].velocityMPerS+=1;
 for(const value of [input,{...input,extra:true}]){
  const job=make(value),worker=BrowserWorkerBridge.instances.at(-1);await assert.rejects(job.promise);await worker.stopped;assert.equal(worker.terminations,1);
 }
});
test('cancelling after a real worker starts suppresses its pending reconstruction',async()=>{
 const job=make(fixture()),worker=BrowserWorkerBridge.instances.at(-1);await worker.started;job.cancel();job.cancel();
 await assert.rejects(job.promise,{name:'AbortError'});await worker.stopped;assert.equal(worker.terminations,1);
});
test('timeout, worker errors, malformed replies and clone failures all release once',async()=>{
 let instance;
 class FakeWorker{constructor(){instance=this;this.terminations=0;}postMessage(){}terminate(){this.terminations++;}}
 const input={seed:42,sampleRate:48000,originAudioFrame:0};
 for(const trigger of [w=>w.onerror({message:'Injected error',preventDefault(){}}),w=>w.onmessageerror(),w=>w.onmessage({data:{type:'verified',result:{seed:43}}})]){
  const job=createContinuousReturnVerifyJob(input,{WorkerClass:FakeWorker}),worker=instance,late=worker.onmessage;trigger(worker);await assert.rejects(job.promise);late({data:{type:'error',message:'Late'}});job.cancel();assert.equal(worker.terminations,1);assert.equal(worker.onmessage,null);
 }
 const timeout=createContinuousReturnVerifyJob(input,{WorkerClass:FakeWorker,timeoutMs:5}),timed=instance;await assert.rejects(timeout.promise,/timed out/);assert.equal(timed.terminations,1);
 class CloneFailure extends FakeWorker{postMessage(){throw Error('Clone failed');}}
 const failed=createContinuousReturnVerifyJob(input,{WorkerClass:CloneFailure}),clone=instance;await assert.rejects(failed.promise,/Clone failed/);assert.equal(clone.terminations,1);
});

test('verification jobs refuse a completion from the other composition mode',async()=>{
 let worker;
 class FakeWorker{constructor(){worker=this;this.terminations=0;}postMessage(){}terminate(){this.terminations++;}}
 const input={seed:42,sampleRate:48000,originAudioFrame:0};
 const base={seed:42,originAudioFrame:0,record:{kind:'imagimusic-continuous-tine-record',sampleRate:48000},snapshot:{state:'ended'}};
 for(const [factory,identity] of [
  [createContinuousReturnVerifyJob,{kind:'imagimusic-memory-return-completion',version:1}],
  [createMemoryReturnVerifyJob,{}],
  [createMemoryReturnVerifyJob,{kind:'imagimusic-memory-return-completion',version:2}],
 ]){
  const job=factory(input,{WorkerClass:FakeWorker}),current=worker;
  current.onmessage({data:{type:'verified',result:{...base,...identity}}});
  await assert.rejects(job.promise,/verification response/);assert.equal(current.terminations,1);
 }
});
