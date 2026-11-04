import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {CONTINUOUS_ENSEMBLE_RECORD_LIMIT,readContinuousEnsembleRecord,validateContinuousEnsembleRecord,renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {prepareContinuousEnsembleAudio} from '../src/living/continuous-ensemble-audio.js';
import {readContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {createAudioRenderJob} from '../src/audio-render-job.js';
import {parseInverseSound} from '../src/inverse/sound-file.js';
function capture(quietFrame=null,sampleRate=48000){
 const p=createContinuousEnsemblePerformance(42,{sampleRate}),samples=new Float32Array(quietFrame===null?p.plan.frames:quietFrame+Math.round(.025*sampleRate));p.start();
 while(p.state!=='ended'){
  if(p.frame===quietFrame)p.quiet();const end=Math.min(samples.length,p.frame+1001,p.frame<quietFrame?quietFrame:Infinity);p.process(samples.subarray(p.frame,end));
 }
 return {record:{kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:p.records()},samples};
}
test('three-body file reproduces the exact production mix at48k and44.1k, including short endings',()=>{
 for(const [rate,quiet] of [[48000,null],[44100,null],[48000,0],[48000,60001]]){
  const {record,samples}=capture(quiet,rate),read=readContinuousEnsembleRecord(JSON.stringify(record)),rendered=renderContinuousEnsembleRecord(read);
  assert.deepEqual(rendered.channels[0],samples);assert.equal(rendered.frames,samples.length);assert.equal(rendered.sampleRate,rate);assert.deepEqual(rendered.record,record);
  assert.ok(Object.isFrozen(read.records));assert.ok(Object.isFrozen(read.records[0].events));
 }
});
test('strict compound admission rejects identity, mix, clock, history and physical-headroom alterations',()=>{
 const {record}=capture(60001);
 for(const mutate of [x=>x.version=2,x=>x.kind='other',x=>x.extra=true,x=>x.seed=42,x=>x.mixGain=1,x=>x.records.pop(),x=>x.records[1].sampleRate=44100,x=>x.records[1].fadeStart++,x=>x.records[0].events[0].strength=.2,x=>x.records[0].events[0].frame=-1,x=>x.records[0].events.push({frame:0,strength:.1,origin:'score'}),x=>x.records[1].events=Array.from({length:4096},()=>({frame:0,strength:.1,origin:'guest'}))]){
  const changed=structuredClone(record);mutate(changed);assert.throws(()=>validateContinuousEnsembleRecord(changed));
 }
 assert.throws(()=>readContinuousEnsembleRecord('{'),/JSON/);assert.throws(()=>readContinuousEnsembleRecord(' '.repeat(CONTINUOUS_ENSEMBLE_RECORD_LIMIT+1)),/limit/);
 assert.throws(()=>readContinuousEnsembleRecord('é'.repeat(Math.floor(CONTINUOUS_ENSEMBLE_RECORD_LIMIT/2)+1)),/limit/);
 assert.throws(()=>readContinuousEnsembleRecord(JSON.stringify(record.records[0])));assert.throws(()=>readContinuousTineRecord(JSON.stringify(record)));
 const original=structuredClone(record),admitted=validateContinuousEnsembleRecord(original);original.records[0].events.length=0;assert.notEqual(admitted.records[0].events.length,0);
});
test('raw ensemble WAV decodes independently to the exact shared-clock mix without preview gain',()=>{
 const {record,samples}=capture(60001),audio=prepareContinuousEnsembleAudio(JSON.stringify(record)),decoded=parseInverseSound(audio.wav);
 assert.equal(audio.kind,'imagimusic-continuous-ensemble-audio');assert.equal(decoded.encoding,'float32');assert.deepEqual(decoded.channels[0],Float64Array.from(samples));
 assert.equal(audio.wav.byteLength,58+4*samples.length);assert.deepEqual(audio.record,record);
 const data=new DataView(audio.wav);for(let i=0;i<samples.length;i++)assert.ok(Object.is(data.getFloat32(58+4*i,true),samples[i]));
});
test('real audio worker transfers the combined WAV and refuses inconsistent body clocks',async()=>{
 let instance;
 class Bridge{constructor(url){instance=this;this.worker=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.worker.on('message',data=>{if(!data.testStarted)this.onmessage?.({data});});this.worker.on('error',error=>this.onerror?.({message:error.message}));}postMessage(value){this.worker.postMessage(value);}terminate(){this.stopped=this.worker.terminate();}}
 const {record}=capture(60001),bad=structuredClone(record);bad.records[1].fadeStart++;
 for(const input of [record,bad]){
  const text=JSON.stringify(input),job=createAudioRenderJob(new URL('../src/living/continuous-ensemble-audio-worker.js',import.meta.url),text,{WorkerClass:Bridge}),worker=instance;
  if(input===bad)await assert.rejects(job.promise,/ending/);else assert.deepEqual(new Uint8Array((await job.promise).wav),new Uint8Array(prepareContinuousEnsembleAudio(text).wav));
  await worker.stopped;
 }
});
