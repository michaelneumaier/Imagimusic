import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Worker} from 'node:worker_threads';
import {prepareEnsembleJourneyAudio} from '../src/living/ensemble-journey-audio.js';
import {createAudioRenderJob} from '../src/audio-render-job.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {stereoWav} from '../src/loom/model.js';
const hash=wav=>createHash('sha256').update(new Uint8Array(wav)).digest('hex');
test('default worker-ready preparation preserves the original unattended WAV exactly',()=>{
 const result=prepareEnsembleJourneyAudio({});assert.equal(hash(result.wav),'58df437ce18da2d237e12155563e3f2e01afb9b67803ffa4ded085cac9ba054c');assert.equal(result.frames,144*48000);assert.equal(result.motifSource,'offered');assert.equal(result.records.length,3);
});
test('personal preparation is reconstructible from its admitted chapters with unchanged preview gain',()=>{
 const gesture=[{frame:0,strength:.025},{frame:2000,strength:.1},{frame:12000,strength:.05}],result=prepareEnsembleJourneyAudio({sampleRate:44100,gesture}),mono=new Float32Array(result.frames);
 result.records.forEach((r,i)=>mono.set(renderContinuousEnsembleRecord(r).channels[0],i*48*44100));
 const channels=[0,1].map(()=>Float32Array.from(mono,x=>x*24/Math.sqrt(2)));assert.equal(hash(result.wav),hash(stereoWav({sampleRate:44100,channels})));assert.equal(result.motifSource,'personal');assert.equal(result.previewGain,24);assert.ok(result.previewPeak>0&&result.previewPeak<1);
 const data=new DataView(result.wav);assert.equal(data.getUint32(24,true),44100);assert.equal(data.getUint16(22,true),2);
});
test('production worker transfers a personal journey, refuses invalid input and can be cancelled',async()=>{
 let instance;
 class Bridge{constructor(url){instance=this;this.started=new Promise(resolve=>this.markStarted=resolve);this.worker=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.worker.on('message',data=>data.testStarted?this.markStarted():this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.({message:error.message}));}postMessage(value){this.worker.postMessage(value);}terminate(){this.stopped=this.worker.terminate();}}
 const make=input=>createAudioRenderJob(new URL('../src/living/ensemble-journey-audio-worker.js',import.meta.url),input,{WorkerClass:Bridge});
 const job=make({sampleRate:44100,gesture:[{frame:0,strength:.025},{frame:1000,strength:.1},{frame:3000,strength:.05}]}),worker=instance,result=await job.promise;await worker.stopped;assert.equal(result.frames,144*44100);assert.equal(result.records.length,3);assert.ok(result.wav instanceof ArrayBuffer);
 const bad=make({gesture:[]}),failed=instance;await assert.rejects(bad.promise,/three touches/);await failed.stopped;
 const cancelled=make({}),pending=instance;const rejected=assert.rejects(cancelled.promise,{name:'AbortError'});await pending.started;cancelled.cancel();await rejected;await pending.stopped;
});
test('unsupported preparation fields and insufficient sampling rates are refused',()=>{for(const input of [null,[],{surprise:1},{gesture:'notes'},{sampleRate:8000}])assert.throws(()=>prepareEnsembleJourneyAudio(input));});
