import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveSession} from '../src/grove/session.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';
import {renderGroveBank} from '../src/grove/performance.js';
import {renderVoiceBank} from '../src/grove/voice-performance.js';
import {mixImpulseRecording} from '../src/touch/session.js';
import {createGroveMoviePlan,validateGroveMovieAudio} from '../src/grove/movie-plan.js';
import {traceHash} from '../src/state.js';
const camera={position:[1,3.6,9.5],target:[0,2,0]};
test('Grove movie clock covers the exact saved mix and reconstructs both capture kinds after arbitrary sampling',()=>{
 for(const rich of [false,true]){
  const grove=composeGrove({seed:3}),session=rich?createGroveVoiceSession({grove,voice:DEFAULT_VOICE_CONFIG},8000):createGroveSession(grove,8000);
  session.strike({frame:0,body:0,position:0,velocity:.4});session.strike({frame:2401,body:2,position:2,velocity:.6});
  const bank=(rich?renderVoiceBank:renderGroveBank)(session.instrument);
  for(const ended of [false,true]){
   if(ended)session.finish(3601,200);const capture=session.snapshot(),plan=createGroveMoviePlan(capture,camera),pcm=mixImpulseRecording(capture,bank);
   validateGroveMovieAudio(pcm,plan.manifest);assert.equal(plan.manifest.audioSamples,pcm.channels[0].length);assert.ok(plan.manifest.videoDuration>=plan.manifest.duration);assert.ok(plan.manifest.videoDuration-plan.manifest.duration<1/30);
   for(const index of [plan.times.length-1,0,5,2])assert.equal(traceHash(plan.sample(plan.times[index])),plan.manifest.modelFrameHashes[index]);
   const initial=plan.sample(.32);capture.events[0].velocity=1;assert.deepEqual(plan.sample(.32),initial);
   assert.throws(()=>validateGroveMovieAudio({...pcm,channels:[pcm.channels[0]]},plan.manifest),/stereo sample count/);
  }
  const corrupt=session.snapshot();corrupt.outputGain+=.1;assert.throws(()=>createGroveMoviePlan(corrupt,camera),/reconstructed model/);
  if(rich){const wrong=session.snapshot();wrong.events[0].bufferIndex=8;assert.throws(()=>createGroveMoviePlan(wrong,camera),/reconstructed model/);}
 }
});
test('movie evidence separately identifies source Float32 samples and saved PCM16 WAV bytes',async()=>{
 const {groveMovieAudioEvidence}=await import('../src/grove/movie-audio.js'),{createHash}=await import('node:crypto');
 const pcm={sampleRate:48000,channels:[new Float32Array([0,.1,-.2]),new Float32Array([.3,0,-.4])]},evidence=await groveMovieAudioEvidence(pcm,'passage.wav');
 for(let c=0;c<2;c++){const bytes=Buffer.alloc(12);pcm.channels[c].forEach((value,i)=>bytes.writeFloatLE(value,i*4));assert.equal(evidence.audio.sourcePcm.sha256[c],createHash('sha256').update(bytes).digest('hex'));}
 assert.equal(evidence.audio.wav.sha256,createHash('sha256').update(Buffer.from(evidence.wav)).digest('hex'));assert.equal(evidence.audio.wav.file,'passage.wav');
});
test('Rest film retains held contacts and exact Quiet length in an immutable model timeline',async()=>{
 const {createGroveRestRecipe,composeRestInvitation,restInvitationRecord,renderRestRecord}=await import('../src/score/grove-rest.js');
 const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000}),record=restInvitationRecord(recipe,composeRestInvitation(recipe,{tempo:120})),plan=createGroveMoviePlan(record,camera),pcm=renderRestRecord(record,recipe);
 validateGroveMovieAudio(pcm,plan.manifest);assert.equal(plan.manifest.audioSamples,record.ended.frame+record.ended.fadeFrames);assert.ok(plan.sample(2.7).contacts[0]);assert.equal(plan.sample(4.1).contacts[0],null);
 for(const i of [0,100,20,plan.times.length-1])assert.equal(traceHash(plan.sample(plan.times[i])),plan.manifest.modelFrameHashes[i]);
 const before=plan.sample(2.7);record.contacts[0].end=1;assert.deepEqual(plan.sample(2.7),before);
 const corrupt=structuredClone(plan.manifest.capture);corrupt.outputGain+=.1;assert.throws(()=>createGroveMoviePlan(corrupt,camera),/gain/);
});
