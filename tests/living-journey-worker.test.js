import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createHash} from 'node:crypto';
import {createAudioRenderJob} from '../src/audio-render-job.js';
import {validateLivingJourneyRequest} from '../src/living/journey-artifact.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';

class BrowserWorkerBridge{
 static instances=[];
 constructor(url){this.started=new Promise(resolve=>this.markStarted=resolve);this.worker=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.worker.on('message',data=>data.testStarted?this.markStarted():this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.({message:error.message}));BrowserWorkerBridge.instances.push(this);}
 postMessage(data){this.worker.postMessage(data);}
 terminate(){this.terminations=(this.terminations??0)+1;this.stopped=this.worker.terminate();}
}
const request={kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'evolving'};
const make=input=>createAudioRenderJob(new URL('../src/living/journey-worker.js',import.meta.url),input,{WorkerClass:BrowserWorkerBridge});

test('strict transient requests refuse unknown identities and seed/treatment coercion',()=>{
 assert.deepEqual(validateLivingJourneyRequest(request),request);
 for(const value of [null,{},[],{...request,extra:1},{...request,seed:'42'},{...request,seed:-1},{...request,seed:2**32},{...request,seed:NaN},{...request,version:2},{...request,treatment:'__proto__'}])assert.throws(()=>validateLivingJourneyRequest(value));
});

test('actual background worker transfers the exact previously rendered evolving fixture',async()=>{
 const job=make(request),worker=BrowserWorkerBridge.instances.at(-1),artifact=await job.promise;await worker.stopped;
 assert.equal(worker.terminations,1);assert.deepEqual(artifact.plan,createLivingEvolvingJourneyStudy(42));
 assert.equal(artifact.sha256,'7f3ef3ff5da122a9e69fb4c6d4ad6029f21176918ce26fe3d1785b5d1557d038');
 assert.equal(createHash('sha256').update(new Uint8Array(artifact.wav)).digest('hex'),artifact.sha256);
 assert.equal(artifact.wav.byteLength,44+artifact.frames*4);assert.equal(artifact.seconds,98.7875);assert.equal(artifact.previewGain,8);
 const wav=new DataView(artifact.wav);assert.equal(wav.getUint32(24,true),48000);assert.equal(wav.getUint16(22,true),2);assert.equal(wav.getUint16(34,true),16);
 assert.equal(artifact.channels,undefined);job.cancel();assert.equal(worker.terminations,1);
});

test('actual worker cancellation rejects promptly and refusal releases the worker',async()=>{
 const cancelled=make(request),first=BrowserWorkerBridge.instances.at(-1);await first.started;cancelled.cancel();
 await assert.rejects(cancelled.promise,{name:'AbortError'});await first.stopped;assert.equal(first.terminations,1);
 const invalid=make({...request,seed:-1}),second=BrowserWorkerBridge.instances.at(-1);
 await assert.rejects(invalid.promise,/Unsupported/);await second.stopped;assert.equal(second.terminations,1);
});

test('a fresh boundary seed renders without any prepared local audio files',async()=>{
 const input={...request,seed:0xffffffff},job=make(input),worker=BrowserWorkerBridge.instances.at(-1),artifact=await job.promise;await worker.stopped;
 assert.equal(artifact.seed,input.seed);assert.deepEqual(artifact.plan,createLivingEvolvingJourneyStudy(input.seed));
 assert.notEqual(artifact.sha256,'7f3ef3ff5da122a9e69fb4c6d4ad6029f21176918ce26fe3d1785b5d1557d038');
 assert.equal(createHash('sha256').update(new Uint8Array(artifact.wav)).digest('hex'),artifact.sha256);
 assert.equal(worker.terminations,1);
});
