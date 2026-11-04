import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {createLivingJourneyMovieSource,createLivingJourneyMoviePlan} from '../src/living/journey-movie-plan.js';
import {createLivingJourneyView} from '../src/living/journey-view.js';
import {createLivingJourneyLayout} from '../src/living/journey-layout.js';
import {renderLivingPersonalJourneyArtifact} from '../src/living/personal-journey-artifact.js';
import {prepareLivingJourneyMovieAudio} from '../src/living/journey-movie-audio.js';
import {createLivingJourneyMovieSession} from '../src/living/journey-movie-session.js';
import {verifyLivingJourneyFilm} from '../tools/verify-living-journey-film.mjs';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:28800,strength:.1},{frame:48000,strength:.05}],fadeStart:120000};
const request={kind:'imagimusic-living-personal-journey-request',version:1,source};
test('personal film samples match the live score and use its full ensemble framing',()=>{
 const movie=createLivingJourneyMovieSource(request),view=createLivingJourneyView(movie.manifest.journey);
 assert.equal(movie.manifest.kind,'imagimusic-living-personal-journey-movie-plan');
 assert.deepEqual(movie.manifest.request,request);
 assert.deepEqual(movie.manifest.layout,createLivingJourneyLayout(view.allocation,{fitAllInstances:true}));
 for(const t of [0,.35,.6,1,9,20,movie.manifest.duration]){
  const {cameraShot,...frame}=movie.sample(t);assert.deepEqual(frame,view.at(t));assert.deepEqual(cameraShot,movie.manifest.layout.camera);
 }
 const hidden=createLivingJourneyMovieSource(request,{reveal:false});
 assert.ok(hidden.sample(1).instances.every(i=>i.points===null));
 const long=createLivingJourneyMovieSource({...request,source:{...source,sampleRate:48000,events:Array.from({length:8},()=>({frame:16800,strength:.1})),fadeStart:382800}});
 assert.equal(long.manifest.layout.instances.length,12);assert.ok(long.manifest.layout.camera.radius>24);
});
test('personal source package round trips and refuses mismatched source or film kind',async()=>{
 const plan=createLivingJourneyMoviePlan(request),artifact=await renderLivingPersonalJourneyArtifact(request);
 const sound=await prepareLivingJourneyMovieAudio(artifact,plan.manifest);
 assert.deepEqual(sound.report.source,source);assert.equal(sound.evidence.sha256,artifact.sha256);
 const manifest={...plan.manifest,audio:sound.evidence,codecs:{video:'avc',audio:'aac'},encoding:'Model-only test; no MP4 encoded.'};
 const checked=await verifyLivingJourneyFilm(JSON.parse(JSON.stringify(manifest)),JSON.stringify(sound.report),sound.wav);
 assert.equal(checked.ok,true);assert.equal(checked.personal,true);assert.equal(checked.touches,3);
 await assert.rejects(prepareLivingJourneyMovieAudio(artifact,{...plan.manifest,kind:'imagimusic-living-journey-movie-plan'}),/different journey/);
 const changed=structuredClone(plan.manifest);changed.request.source.events[0].strength=.05;
 await assert.rejects(prepareLivingJourneyMovieAudio(artifact,changed),/different journey/);
 const changedManifest=structuredClone(manifest);changedManifest.journey.source.events[0].strength=.05;
 assert.equal((await verifyLivingJourneyFilm(changedManifest,JSON.stringify(sound.report),sound.wav)).ok,false);
 const corrupt=sound.wav.slice(0);new Uint8Array(corrupt)[100]^=1;
 assert.equal((await verifyLivingJourneyFilm(manifest,JSON.stringify(sound.report),corrupt)).ok,false);
});
test('personal film session snapshots source, exposes personal labels and cancels late completion',async()=>{
 let received,release,revoked=[],count=0;
 const session=createLivingJourneyMovieSession({
  createJob:value=>{received=value;return {promise:Promise.resolve({sha256:'a'.repeat(64)}),cancel(){}};},
  exportMovie:()=>new Promise(resolve=>{release=()=>resolve({stem:'personal',blob:new Blob(['double']),wav:new ArrayBuffer(44),report:{},manifest:{duration:30}});}),
  makeURL:()=>`blob:${++count}`,revokeURL:url=>revoked.push(url),
 });
 const mutable=structuredClone(request),pending=session.prepare({request:mutable});
 mutable.source.events[0].strength=.1;await Promise.resolve();
 assert.deepEqual(received,request);release();const result=await pending;
 assert.equal(result.personal,true);assert.equal(result.touches,3);assert.equal(result.seed,undefined);assert.equal(result.links.length,4);
 const next=session.prepare({request});await Promise.resolve();session.cancel();release();
 await assert.rejects(next,{name:'AbortError'});assert.equal(session.current,result);assert.equal(count,4);assert.deepEqual(revoked,[]);
});
