import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createContinuousEnsembleSession,createContinuousEnsembleListeningStage} from '../src/living/continuous-ensemble-session.js';
import {validateContinuousEnsembleFinished} from '../src/living/continuous-ensemble-result.js';
import {createContinuousEnsembleVerifyJob} from '../src/living/continuous-ensemble-verify-job.js';
import {createContinuousEnsembleView} from '../src/living/continuous-ensemble-view.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
const verify=input=>validateContinuousEnsembleFinished(input.seed,input.sampleRate,input.data,input.touches,input.originAudioFrame,input.quietFrame);
test('ensemble session with production worklet and injected audio host',async t=>{
 let Processor,receiver;globalThis.sampleRate=48000;globalThis.currentFrame=4096;
 globalThis.AudioWorkletProcessor=class{constructor(){const deliver=receiver;this.port={postMessage:value=>queueMicrotask(()=>deliver(structuredClone(value)))};}};
 globalThis.registerProcessor=(name,value)=>{assert.equal(name,'imagimusic-continuous-ensemble');Processor=value;};
 try{
  await import('../src/living/continuous-ensemble-worklet.js');
  function setup({addModule=async()=>{},rate=48000,changeMessage=x=>x,createVerifyJob=input=>({promise:Promise.resolve().then(()=>verify(input)),cancel(){}})}={}){
   const nodes=[],contexts=[],stages=[],events=[],view=createContinuousEnsembleView();let done;
   const finished=new Promise(resolve=>done=resolve);
   const session=createContinuousEnsembleSession({createVerifyJob,
    createContext:()=>{const c={sampleRate:rate,state:'suspended',currentTime:currentFrame/48000,destination:{},audioWorklet:{addModule},async resume(){this.state='running';},async close(){this.state='closed';this.closed=(this.closed??0)+1;}};contexts.push(c);return c;},
    createListeningStage:()=>{const stage={input:{},output:{connect(){}},setDb(db){this.db=db;},dispose(){this.disposed=true;}};stages.push(stage);return stage;},
    createNode:(context,options)=>{
     assert.equal(options.processorOptions.mode,'ensemble');const node={connect(){},disconnect(){this.disconnected=true;},port:{close(){this.closed=true;},onmessage:null}};
     receiver=value=>node.port.onmessage?.({data:changeMessage(value)});node.processor=new Processor(options);node.port.postMessage=data=>queueMicrotask(()=>node.processor.port.onmessage({data}));nodes.push(node);return node;
    },onChange:event=>{events.push(event);if(event.events)view.accept(event.events);if(event.finished)done(event.finished);},
   });
   async function pump(){const node=nodes.at(-1),context=contexts.at(-1),parts=[];let active=true;
    while(active&&context.state==='running'){const output=new Float32Array(128);active=node.processor.process([],[[output]]);parts.push(output);globalThis.currentFrame+=128;context.currentTime=currentFrame/48000;await Promise.resolve();}
    const samples=new Float32Array(parts.length*128);parts.forEach((part,i)=>samples.set(part,i*128));return samples;
   }
   return {session,nodes,contexts,stages,events,view,finished,pump};
  }
  await t.test('one start connects exact audio, acknowledged picture, real worker and resource draining',async()=>{
   let worker;
   class Bridge{constructor(url){worker=this;this.thread=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.thread.on('message',data=>{if(!data.testStarted)this.onmessage?.({data});});this.thread.on('error',error=>this.onerror?.({message:error.message}));}postMessage(data){this.thread.postMessage(data);}terminate(){this.stopped=this.thread.terminate();}}
   const s=setup({createVerifyJob:input=>createContinuousEnsembleVerifyJob(input,{WorkerClass:Bridge})});assert.equal(s.contexts.length,0);await s.session.start();s.session.setListeningDb(3);
   const samples=await s.pump(),result=await s.finished;await worker.stopped;const channels=result.records.map(r=>renderContinuousTineRecord(r).channels[0]);
   assert.deepEqual(samples,Float32Array.from(samples,(_,i)=>(channels[0][i]+channels[1][i]+channels[2][i])*result.plan.mixGain));
   assert.equal(s.view.at(48).touches,25);assert.equal(s.session.touches,25);assert.equal(s.session.state,'ended');assert.equal(s.session.time(),48);assert.equal(s.stages[0].db,3);
   assert.equal(s.contexts[0].closed,1);assert.equal(s.nodes[0].port.closed,true);assert.equal(s.stages[0].disposed,true);
   result.records.length=0;assert.equal(s.session.finished.records.length,3);await assert.rejects(s.session.start(-1));assert.equal(s.session.finished.records.length,3);
  });
  await t.test('optional body touches correlate acknowledgments and history, then keep the exact shared mix',async()=>{
   const s=setup();await s.session.start();const first=s.session.strike(2,.05);await assert.rejects(s.session.strike(0,.025),/accepting/);await first;
   await s.session.strike(0,.025);await s.session.strike(1,.05);assert.equal(s.session.guests,3);assert.equal(s.view.accepted.length,0);
   const samples=await s.pump(),result=await s.finished,channels=result.records.map(r=>renderContinuousTineRecord(r).channels[0]);
   assert.deepEqual(samples,Float32Array.from(samples,(_,i)=>(channels[0][i]+channels[1][i]+channels[2][i])/3));
   assert.equal(s.view.accepted.filter(e=>e.origin==='guest').length,3);assert.equal(s.session.touches,28);assert.equal(result.records.reduce((n,r)=>n+r.events.filter(e=>e.origin==='guest').length,0),3);
  });
  await t.test('guest command/acknowledgment mismatches cannot become a verified capture',async()=>{
   for(const mutate of [value=>value.body=1,value=>value.strength=.1]){
    const s=setup({changeMessage:value=>{if(value.type==='applied'&&value.command==='strike')mutate(value);return value;}});await s.session.start();await assert.rejects(s.session.strike(0,.05),/guest acknowledgment/);assert.equal(s.session.state,'error');assert.equal(s.session.finished,null);
   }
   for(const mutate of [value=>value.body=1,value=>value.strength=.1]){
    const s=setup({changeMessage:value=>{if(value.type==='touches'&&value.touches[0].origin==='guest')mutate(value.touches[0]);return value;}});await s.session.start();await s.session.strike(0,.05);await s.pump();assert.equal(s.session.state,'error');assert.equal(s.view.accepted.length,0);assert.equal(s.session.finished,null);
   }
   const frame=setup({changeMessage:value=>{if(value.type==='applied'&&value.command==='strike')value.frame++;return value;}});await frame.session.start();await frame.session.strike(0,.05);await frame.pump();assert.equal(frame.session.state,'error');assert.equal(frame.view.accepted.length,0);
  });
  await t.test('Quiet after an accepted pre-origin touch keeps it and rejects further commands',async()=>{
   const s=setup();await s.session.start();await s.session.strike(1,.025);await s.session.quiet();await assert.rejects(s.session.strike(2,.05),/accepting/);await s.pump();const result=await s.finished;
   assert.deepEqual(result.records.map(r=>r.events.length),[0,1,0]);assert.ok(result.records.every(r=>r.fadeStart===0));
  });
  await t.test('Quiet retains a short verified result when a later attempt fails',async()=>{
   let corrupt=false;const s=setup({changeMessage:value=>{if(corrupt&&value.type==='finished')value.snapshot[1].body.modes[0].velocityMPerS+=1;return value;}});
   await s.session.start();await s.session.quiet();await s.pump();const first=await s.finished;assert.ok(first.records.every(r=>r.fadeStart===0));
   corrupt=true;await s.session.start();await s.session.quiet();await s.pump();await new Promise(resolve=>setTimeout(resolve,10));
   assert.equal(s.session.state,'error');assert.deepEqual(s.session.finished,first);assert.equal(s.contexts.at(-1).closed,1);
  });
  await t.test('Quiet cancels preparation and rejects late creation',async()=>{
   let release,entered;const loaded=new Promise(resolve=>entered=resolve),s=setup({addModule:()=>new Promise(resolve=>{release=resolve;entered();})});
   const pending=s.session.start();await loaded;await s.session.quiet();release();await assert.rejects(pending,{name:'AbortError'});assert.equal(s.nodes.length,0);assert.equal(s.contexts[0].closed,1);
  });
  await t.test('parking verification suppresses a late successful result',async()=>{
   let resolveJob,input,cancels=0;const s=setup({createVerifyJob:value=>{input=value;return {promise:new Promise(resolve=>resolveJob=resolve),cancel(){cancels++;}};}});
   await s.session.start();await s.session.quiet();await s.pump();assert.equal(s.session.state,'verifying');s.session.park();resolveJob(verify(input));await Promise.resolve();
   assert.equal(cancels,1);assert.equal(s.session.finished,null);assert.equal(s.contexts[0].closed,1);
  });
  await t.test('wrong ready identity, rate and accepted body evidence cannot reach the view',async()=>{
   const wrong=setup({rate:44100});await assert.rejects(wrong.session.start(),/sample rate/);assert.equal(wrong.contexts[0].closed,1);
   const ready=setup({changeMessage:value=>{if(value.type==='ready')value.kind='other';return value;}});await assert.rejects(ready.session.start(),/mode/);
   for(const mutate of [e=>e.body=1,e=>e.index=1,e=>e.strength=.099,e=>e.audioFrame++,e=>e.origin='guest']){
    const s=setup({changeMessage:value=>{if(value.type==='touches')mutate(value.touches[0]);return value;}});await s.session.start();await s.pump();
    assert.equal(s.session.state,'error');assert.equal(s.events.some(e=>e.events),false);assert.equal(s.view.accepted.length,0);assert.equal(s.contexts[0].closed,1);
   }
  });
  await t.test('invalid command timing and backward transport state fail before publication',async()=>{
   const start=setup({changeMessage:value=>{if(value.type==='applied'&&value.command==='start')value.frame=1;return value;}});await assert.rejects(start.session.start(),/start acknowledgment/);
   const quiet=setup({changeMessage:value=>{if(value.type==='applied'&&value.command==='quiet')value.frame=48*48000;return value;}});await quiet.session.start();await assert.rejects(quiet.session.quiet(),/Quiet acknowledgment/);assert.equal(quiet.events.some(e=>e.endingFrame!==undefined),false);
   const backward=setup({changeMessage:value=>{if(value.type==='state')value.frame=-1;return value;}});await backward.session.start();await backward.pump();assert.equal(backward.session.state,'error');assert.equal(backward.contexts[0].closed,1);
  });
  await t.test('an audio interruption parks the session and ignores late processor messages',async()=>{
   const s=setup();await s.session.start();const context=s.contexts[0],late=s.nodes[0].port.onmessage;context.state='suspended';context.onstatechange();
   assert.equal(s.session.state,'interrupted');late({data:{type:'error',message:'stale'}});assert.equal(s.session.state,'interrupted');assert.equal(context.closed,1);assert.equal(s.session.finished,null);
  });
 }finally{delete globalThis.sampleRate;delete globalThis.currentFrame;delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;}
});
test('ensemble listening gain matches its declared fixed preview stage and remains downstream',()=>{
 const nodes=[],node=()=>{const n={gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(value){this.target=value;}},connect(to){this.to=to;},disconnect(){this.closed=true;}};nodes.push(n);return n;};
 const stage=createContinuousEnsembleListeningStage({currentTime:0,createGain:node,createWaveShaper:node},{db:0});
 assert.equal(stage.input.gain.value,24/Math.sqrt(2));assert.equal(stage.input.to,nodes[0]);assert.equal(nodes[0].to,stage.output);stage.setDb(20);assert.equal(nodes[0].gain.target,10);stage.dispose();assert.ok(nodes.every(n=>n.closed));
});
