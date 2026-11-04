import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {renderLivingJourneyArtifact} from '../src/living/journey-artifact.js';
import {createLivingJourneyMoviePlan} from '../src/living/journey-movie-plan.js';
import {prepareLivingJourneyMovieAudio} from '../src/living/journey-movie-audio.js';
const request={kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'connected'};
const artifact=await renderLivingJourneyArtifact(request),{manifest}=createLivingJourneyMoviePlan(request);
const hash=bytes=>createHash('sha256').update(new Uint8Array(bytes)).digest('hex');

test('film soundtrack preserves every kept PCM16 sample and its original WAV bytes',async()=>{
 const result=await prepareLivingJourneyMovieAudio(artifact,manifest),view=new DataView(artifact.wav);
 assert.notEqual(result.wav,artifact.wav);assert.deepEqual(result.wav,artifact.wav);
 assert.equal(hash(result.wav),artifact.sha256);
 for(let i=0;i<artifact.frames;i++)for(let ch=0;ch<2;ch++)assert.equal(result.pcm.channels[ch][i],view.getInt16(44+(i*2+ch)*2,true)/32768);
 assert.equal(result.pcm.frames,manifest.audioSamples);assert.equal(result.report.previewGain,8);
});

test('film refuses a wrong score, modified audio, malformed canonical header or truncation',async()=>{
 await assert.rejects(prepareLivingJourneyMovieAudio(artifact,{...manifest,audioSamples:manifest.audioSamples+1}),/different journey/);
 const bad=structuredClone(artifact);new Uint8Array(bad.wav)[100]^=1;
 await assert.rejects(prepareLivingJourneyMovieAudio(bad,manifest),/identity/);
 for(const offset of [0,4,8,12,16,20,22,24,28,32,34,36,40]){
  const malformed=structuredClone(artifact);new Uint8Array(malformed.wav)[offset]^=1;malformed.sha256=hash(malformed.wav);
  await assert.rejects(prepareLivingJourneyMovieAudio(malformed,manifest),/canonical/);
 }
 await assert.rejects(prepareLivingJourneyMovieAudio({...artifact,wav:artifact.wav.slice(0,-4)},manifest),/canonical/);
 await assert.rejects(prepareLivingJourneyMovieAudio({...artifact,previewGain:1},manifest),/Unsupported/);
});

test('hashing uses a snapshot and cancellation prevents publishing a prepared soundtrack',async()=>{
 const copy=structuredClone(artifact);let finish;
 const pending=prepareLivingJourneyMovieAudio(copy,manifest,{digest:bytes=>new Promise(resolve=>finish=()=>resolve(crypto.subtle.digest('SHA-256',bytes)))});
 new Uint8Array(copy.wav).fill(0);copy.plan.seed=0;copy.seed=0;finish();
 const result=await pending;assert.equal(result.report.seed,42);assert.equal(hash(result.wav),artifact.sha256);
 const controller=new AbortController();
 const cancelled=prepareLivingJourneyMovieAudio(artifact,manifest,{signal:controller.signal,digest:bytes=>new Promise(resolve=>finish=()=>resolve(crypto.subtle.digest('SHA-256',bytes)))});
 controller.abort();finish();await assert.rejects(cancelled,{name:'AbortError'});
 await assert.rejects(prepareLivingJourneyMovieAudio(artifact,manifest,{signal:controller.signal}),{name:'AbortError'});
});
