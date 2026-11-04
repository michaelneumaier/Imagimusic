import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createTineDesign} from '../src/tine/address.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {prepareContinuousReturnAudio} from '../src/living/continuous-return-audio.js';
import {createAudioRenderJob} from '../src/audio-render-job.js';
import {parseInverseSound} from '../src/inverse/sound-file.js';
import {createContinuousListeningStage} from '../src/living/continuous-return-session.js';
const record={kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:0,strength:.1,origin:'score'},{frame:480000,strength:-.05,origin:'guest'}],fadeStart:12*48000};
test('long capture WAV preserves every float sample, signs and exact recorded ending',()=>{
 const artifact=prepareContinuousReturnAudio(JSON.stringify(record)),expected=renderContinuousTineRecord(record),view=new DataView(artifact.wav);
 assert.deepEqual(artifact.record,record);assert.equal(view.getUint16(20,true),3);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint16(34,true),32);
 assert.equal(view.getUint32(46,true),expected.frames);assert.equal(view.getUint32(54,true),expected.frames*4);assert.equal(artifact.wav.byteLength,58+expected.frames*4);
 for(let i=0;i<expected.frames;i++)assert.ok(Object.is(view.getFloat32(58+i*4,true),expected.channels[0][i]));
});
test('actual worker prepares a kept record, transfers its WAV and refuses malformed text',async()=>{
 let instance;
 class Bridge{constructor(url){instance=this;this.worker=new Worker(new URL('./living-journey-node-worker.js',import.meta.url),{workerData:url.href});this.worker.on('message',data=>{if(!data.testStarted)this.onmessage?.({data});});this.worker.on('error',error=>this.onerror?.({message:error.message}));}postMessage(value){this.worker.postMessage(value);}terminate(){this.stopped=this.worker.terminate();}}
 for(const text of [JSON.stringify(record),'{']){
  const job=createAudioRenderJob(new URL('../src/living/continuous-return-audio-worker.js',import.meta.url),text,{WorkerClass:Bridge}),worker=instance;
  if(text==='{')await assert.rejects(job.promise,/JSON/);else{const artifact=await job.promise;assert.deepEqual(new Uint8Array(artifact.wav),new Uint8Array(prepareContinuousReturnAudio(text).wav));}
  await worker.stopped;
 }
});
test('strong raw captures decode independently without baking in listening amplification',()=>{
 const source={...record,fadeStart:48000,events:Array.from({length:64},()=>({frame:0,strength:.1,origin:'guest'}))};
 const artifact=prepareContinuousReturnAudio(JSON.stringify(source)),decoded=parseInverseSound(artifact.wav),expected=renderContinuousTineRecord(source);
 assert.equal(decoded.encoding,'float32');assert.deepEqual(decoded.channels[0],Float64Array.from(expected.channels[0]));
 let peak=0;for(const x of decoded.channels[0])peak=Math.max(peak,Math.abs(x));assert.ok(peak*8/Math.sqrt(2)>1);assert.ok(peak<.8);
});
test('live and replay share fixed centered gain before adjustable level and ceiling',()=>{
 const nodes=[],node=()=>{const n={gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(value){this.target=value;}},connect(to){this.to=to;},disconnect(){this.closed=true;}};nodes.push(n);return n;};
 const stage=createContinuousListeningStage({currentTime:0,createGain:node,createWaveShaper:node},{db:0});
 assert.equal(stage.input.gain.value,8/Math.sqrt(2));assert.equal(stage.input.to,nodes[0]);assert.equal(nodes[0].to,stage.output);stage.setDb(20);assert.equal(nodes[0].gain.target,10);stage.dispose();assert.ok(nodes.every(n=>n.closed));
});
