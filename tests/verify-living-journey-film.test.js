import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyLivingJourneyFilm} from '../tools/verify-living-journey-film.mjs';
import {createLivingJourneyMoviePlan} from '../src/living/journey-movie-plan.js';
import {renderLivingJourneyArtifact} from '../src/living/journey-artifact.js';
import {prepareLivingJourneyMovieAudio} from '../src/living/journey-movie-audio.js';
const request={kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'connected'};
const plan=createLivingJourneyMoviePlan(request),artifact=await renderLivingJourneyArtifact(request),sound=await prepareLivingJourneyMovieAudio(artifact,plan.manifest);
const manifest={...plan.manifest,audio:sound.evidence,codecs:{video:'avc',audio:'aac'},encoding:'Test metadata only; no MP4 encoded.'};
const report=JSON.stringify(sound.report);
test('film package verification rebuilds actual source evidence without claiming an encoded movie',async()=>{
 const result=await verifyLivingJourneyFilm(JSON.parse(JSON.stringify(manifest)),report,sound.wav);
 assert.equal(result.ok,true);assert.equal(result.modelFrames,1207);assert.equal(result.audioSamples,1929900);
 assert.match(result.scope,/Does not inspect MP4/);assert.equal(result.checks.length,6);
});
test('frame, camera, audio metadata, report and actual WAV changes are detected',async()=>{
 for(const mutate of [m=>m.frameHashes[10]='changed',m=>m.layout.camera.radius++,m=>m.audio.previewGain=1,m=>m.codecs.audio='pcm']){
  const changed=structuredClone(manifest);mutate(changed);
  assert.equal((await verifyLivingJourneyFilm(changed,report,sound.wav)).ok,false);
 }
 const changedReport=JSON.parse(report);changedReport.sourcePeak*=.5;
 assert.equal((await verifyLivingJourneyFilm(manifest,JSON.stringify(changedReport),sound.wav)).ok,false);
 const bytes=sound.wav.slice(0);new Uint8Array(bytes)[100]^=1;
 assert.equal((await verifyLivingJourneyFilm(manifest,report,bytes)).ok,false);
 assert.equal((await verifyLivingJourneyFilm(manifest,report,bytes.slice(0,-4))).ok,false);
 assert.equal((await verifyLivingJourneyFilm({},'bad',bytes)).ok,false);
});
