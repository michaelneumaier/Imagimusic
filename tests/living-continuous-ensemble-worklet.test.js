import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {validateContinuousEnsembleFinished} from '../src/living/continuous-ensemble-result.js';
import {createContinuousEnsembleVerifyJob} from '../src/living/continuous-ensemble-verify-job.js';
class Bridge{
 static last;
 constructor(url){Bridge.last=this;this.started=new Promise(resolve=>this.markStarted=resolve);this.worker=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.worker.on('message',data=>data.testStarted?this.markStarted():this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.({message:error.message}));}
 postMessage(data){this.worker.postMessage(data);}
 terminate(){this.terminations=(this.terminations??0)+1;this.stopped=this.worker.terminate();}
}
test('continuous ensemble production worklet and completion evidence',async t=>{
 let Processor;globalThis.sampleRate=48000;globalThis.currentFrame=8192;
 globalThis.AudioWorkletProcessor=class{constructor(){this.port={messages:[],postMessage:value=>this.port.messages.push(structuredClone(value))};}};
 globalThis.registerProcessor=(name,value)=>{assert.equal(name,'imagimusic-continuous-ensemble');Processor=value;};
 try{
  await import('../src/living/continuous-ensemble-worklet.js');
  const make=()=>new Processor({processorOptions:{sampleRate,seed:42,mode:'ensemble'}}),send=(p,data)=>p.port.onmessage({data});
  function block(p){const left=new Float32Array(128),right=new Float32Array(128),active=p.process([],[[left,right]]);assert.deepEqual(left,right);globalThis.currentFrame+=128;return {left,active};}
  const touches=p=>p.port.messages.filter(m=>m.type==='touches').flatMap(m=>m.touches);
  let fullInput;
  await t.test('unattended piece publishes one common origin and three exactly replayable histories',async()=>{
   const p=make();assert.equal(p.port.messages[0].kind,'imagimusic-continuous-ensemble-study');assert.ok(block(p).left.every(x=>x===0));assert.equal(p.port.messages.some(m=>m.type==='origin'),false);
   send(p,{id:0,type:'start'});const origin=currentFrame,all=new Float32Array(48*sampleRate);let offset=0,active=true;
   while(active){const result=block(p);all.set(result.left,offset);offset+=128;active=result.active;}
   const data=p.port.messages.find(m=>m.type==='finished'),channels=data.records.map(r=>renderContinuousTineRecord(r).channels[0]);
   assert.deepEqual(all,Float32Array.from(all,(_,i)=>(channels[0][i]+channels[1][i]+channels[2][i])*data.plan.mixGain));
   fullInput={seed:42,sampleRate,data,touches:touches(p),originAudioFrame:origin,quietFrame:null};
   const job=createContinuousEnsembleVerifyJob(fullInput,{WorkerClass:Bridge}),worker=Bridge.last,result=await job.promise;await worker.stopped;
   assert.deepEqual(result.records,data.records);assert.equal(worker.terminations,1);assert.equal(result.kind,'imagimusic-continuous-ensemble-completion');
   assert.equal(touches(p).length,25);assert.ok(touches(p).every(e=>e.audioFrame===origin+e.frame));assert.ok(block(p).left.every(x=>x===0));assert.equal(p.port.messages.filter(m=>m.type==='finished').length,1);
  });
  await t.test('signed guests across all bodies survive live playback, real worker verification and raw replay',async()=>{
   const p=make();send(p,{id:0,type:'start'});send(p,{id:1,type:'strike',body:2,strength:.05});send(p,{id:2,type:'strike',body:0,strength:-.025});
   send(p,{id:3,type:'strike',body:9,strength:.05});send(p,{id:2,type:'strike',body:1,strength:.05});assert.equal(touches(p).length,0);
   const origin=currentFrame,all=new Float32Array(48*sampleRate);let offset=0,active=true,joined=false;
   while(active){if(offset>=51200&&!joined){send(p,{id:4,type:'strike',body:1,strength:.025});joined=true;}const result=block(p);all.set(result.left,offset);offset+=128;active=result.active;}
   const data=p.port.messages.find(m=>m.type==='finished'),history=touches(p),channels=data.records.map(r=>renderContinuousTineRecord(r).channels[0]);
   assert.deepEqual(all,Float32Array.from(all,(_,i)=>(channels[0][i]+channels[1][i]+channels[2][i])*data.plan.mixGain));
   assert.deepEqual(history.filter(e=>e.origin==='guest').map(e=>[e.body,e.frame,e.strength]),[[2,0,.05],[0,0,-.025],[1,51200,.025]]);
   const acks=p.port.messages.filter(m=>m.type==='applied'&&m.command==='strike');assert.deepEqual(acks.map(e=>[e.body,e.strength]),[[2,.05],[0,-.025],[1,.025]]);assert.equal(p.port.messages.filter(m=>m.type==='refused').length,2);
   const input={seed:42,sampleRate,data,touches:history,originAudioFrame:origin,quietFrame:null},job=createContinuousEnsembleVerifyJob(input,{WorkerClass:Bridge}),worker=Bridge.last;
   assert.deepEqual((await job.promise).records,data.records);await worker.stopped;
   for(const change of [x=>x[0].strength=.04,x=>x[0].body=1,x=>x[0].origin='score',x=>x.reverse()]){const altered=structuredClone(history);change(altered);assert.throws(()=>validateContinuousEnsembleFinished(42,sampleRate,data,altered,origin));}
  });
  await t.test('an immediate Quiet retains accepted pre-origin guests and no later score',()=>{
   const p=make();send(p,{id:0,type:'start'});send(p,{id:1,type:'strike',body:1,strength:.05});send(p,{id:2,type:'quiet'});send(p,{id:3,type:'strike',body:0,strength:.05});
   const origin=currentFrame;let active=true;while(active)active=block(p).active;
   const data=p.port.messages.find(m=>m.type==='finished'),result=validateContinuousEnsembleFinished(42,sampleRate,data,touches(p),origin,0);
   assert.deepEqual(result.records.map(r=>r.events.length),[0,1,0]);assert.equal(touches(p)[0].audioFrame,origin);assert.equal(p.port.messages.filter(m=>m.type==='refused').length,1);
  });
  await t.test('Quiet before origin and during music preserves all body endings',()=>{
   for(const blocks of [0,400]){
    const p=make();send(p,{id:0,type:'start'});const origin=currentFrame;for(let i=0;i<blocks;i++)block(p);
    send(p,{id:1,type:'quiet'});let active=true;while(active)active=block(p).active;
    const data=p.port.messages.find(m=>m.type==='finished'),result=validateContinuousEnsembleFinished(42,sampleRate,data,touches(p),origin,blocks*128);
    assert.ok(result.records.every(r=>r.fadeStart===blocks*128));assert.ok(result.snapshot.every(s=>s.body.frame===blocks*128+1200));
   }
  });
  await t.test('altered bodies, mix, histories, clocks and physical state are refused',()=>{
   for(const change of [x=>x.data.kind='other',x=>x.data.version=2,x=>x.data.records.reverse(),x=>x.data.plan.mixGain=1,x=>x.data.snapshot[1].body.modes[0].velocityMPerS+=1,x=>x.touches[4].body=0,x=>x.touches[4].index++,x=>x.touches[4].audioFrame++,x=>x.touches.pop(),x=>x.quietFrame=0,x=>x.data.records[0].fadeStart--]){
    const input=structuredClone(fullInput);change(input);assert.throws(()=>validateContinuousEnsembleFinished(input.seed,input.sampleRate,input.data,input.touches,input.originAudioFrame,input.quietFrame));
   }
   const input=structuredClone(fullInput),result=validateContinuousEnsembleFinished(input.seed,input.sampleRate,input.data,input.touches,input.originAudioFrame);
   input.data.snapshot[0].body.modes[0].energyJ=999;assert.notEqual(result.snapshot[0].body.modes[0].energyJ,999);
  });
  await t.test('real worker cancellation and malformed requests release their worker once',async()=>{
   const job=createContinuousEnsembleVerifyJob(fullInput,{WorkerClass:Bridge}),worker=Bridge.last;await worker.started;job.cancel();job.cancel();await assert.rejects(job.promise,{name:'AbortError'});await worker.stopped;assert.equal(worker.terminations,1);
   const bad=createContinuousEnsembleVerifyJob({...fullInput,extra:true},{WorkerClass:Bridge}),other=Bridge.last;await assert.rejects(bad.promise,/request/);await other.stopped;assert.equal(other.terminations,1);
  });
  await t.test('explicit mode, monotonic commands, cancellation and terminal error silence are enforced',()=>{
   assert.throws(()=>new Processor({processorOptions:{sampleRate,seed:42}}),/explicitly/);assert.throws(()=>new Processor({processorOptions:{sampleRate:44100,seed:42,mode:'ensemble'}}),/sample rate/);
   const p=make();send(p,{id:0,type:'quiet'});send(p,{id:1,type:'strike',strength:.05});assert.equal(p.performance.state,'idle');
   send(p,{id:2,type:'start'});send(p,{id:2,type:'start'});send(p,{id:3,type:'cancel'});assert.ok(block(p).left.every(x=>x===0));assert.equal(p.port.messages.some(m=>m.type==='finished'||m.type==='origin'),false);
   const bad=make();send(bad,{id:0,type:'start'});bad.performance={...bad.performance,process(){throw Error('Injected');}};assert.equal(block(bad).active,false);assert.ok(block(bad).left.every(x=>x===0));assert.equal(bad.port.messages.filter(m=>m.type==='error').length,1);
  });
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
test('ensemble verification job refuses wrong identity and disposes timeout or clone failures',async()=>{
 let instance;
 class FakeWorker{constructor(){instance=this;this.terminations=0;}postMessage(){}terminate(){this.terminations++;}}
 const input={seed:42,sampleRate:48000,originAudioFrame:0},base={kind:'imagimusic-continuous-ensemble-completion',version:1,seed:42,originAudioFrame:0,records:Array.from({length:3},()=>({kind:'imagimusic-continuous-tine-record',sampleRate:48000})),snapshot:Array.from({length:3},()=>({state:'ended'}))};
 for(const patch of [{kind:'imagimusic-memory-return-completion'},{version:2},{records:[]},{snapshot:[{state:'ended'}]},{originAudioFrame:1}]){
  const job=createContinuousEnsembleVerifyJob(input,{WorkerClass:FakeWorker}),worker=instance;worker.onmessage({data:{type:'verified',result:{...base,...patch}}});await assert.rejects(job.promise,/response/);assert.equal(worker.terminations,1);
 }
 const job=createContinuousEnsembleVerifyJob(input,{WorkerClass:FakeWorker,timeoutMs:5}),worker=instance;await assert.rejects(job.promise,/timed out/);assert.equal(worker.terminations,1);
 class CloneFailure extends FakeWorker{postMessage(){throw Error('Clone failed');}}
 const bad=createContinuousEnsembleVerifyJob(input,{WorkerClass:CloneFailure}),other=instance;await assert.rejects(bad.promise,/Clone failed/);assert.equal(other.terminations,1);
});
