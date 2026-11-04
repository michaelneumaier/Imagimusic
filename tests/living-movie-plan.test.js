import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingMoviePlan,validateLivingMovieAudio} from '../src/living/movie-plan.js';
import {createLivingRecord} from '../src/living/record.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {createTineDesign} from '../src/tine/address.js';
import {traceHash} from '../src/state.js';
const source=rate=>({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:rate,events:[{frame:137,strength:.1}],fadeStart:Math.round(.9*rate)+7});
test('fixed film timestamps cover the exact soundtrack and rebuild the live response in either seek order',()=>{
 for(const rate of [44100,48000,96000]){
  const record=createLivingRecord(source(rate)),plan=createLivingMoviePlan(record),pcm=renderLivingArrangement(record.source),view=createLivingArrangementView(pcm.plan);
  validateLivingMovieAudio(pcm,plan.manifest);
  assert.equal(plan.manifest.audioSamples,pcm.frames);assert.ok(plan.manifest.videoDuration>=pcm.seconds&&plan.manifest.videoDuration-pcm.seconds<1/30);
  assert.ok(plan.times.every((t,i)=>t===i/30&&t<pcm.seconds));
  for(let i=plan.times.length-1;i>=0;i--){const t=plan.times[i];assert.deepEqual(plan.sample(t),view.at(t));assert.equal(traceHash(plan.sample(t),12),plan.manifest.frameHashes[i]);}
 }
});
test('kept presentation choices affect the film state without altering its sound or accepting mismatched PCM',()=>{
 const normal=createLivingRecord(source(48000)),still=createLivingRecord(normal.source,{cameraMotion:false,reveal:false});
 const a=createLivingMoviePlan(normal),b=createLivingMoviePlan(still),pcm=renderLivingArrangement(normal.source);
 const frame=a.sample(.2),changed=structuredClone(frame);changed.bodies[0].points[40].boundM+=1e-9;assert.notEqual(traceHash(frame,12),traceHash(changed,12));
 assert.notDeepEqual(a.manifest.frameHashes,b.manifest.frameHashes);
 for(const t of b.times){const frame=b.sample(t);assert.equal(frame.cameraOpen,1);assert.ok(frame.bodies.every(body=>body.points===null));}
 assert.deepEqual(renderLivingArrangement(still.source).channels,pcm.channels);validateLivingMovieAudio(pcm,b.manifest);
 assert.throws(()=>validateLivingMovieAudio({...pcm,sampleRate:44100},b.manifest));
 assert.throws(()=>validateLivingMovieAudio({...pcm,channels:[pcm.channels[0]]},b.manifest));
 const bad=structuredClone(pcm);bad.channels[0][5]=NaN;assert.throws(()=>validateLivingMovieAudio(bad,b.manifest));
});

test('film appearance follows recipe identity without changing score or frame-state hashes',()=>{
 const fresh=createLivingRecord(source(48000)),warm=createLivingRecord(fresh.source,{presentationVersion:1});
 const {presentationVersion,...legacyFields}=warm,legacy={...legacyFields,version:1};
 const a=createLivingMoviePlan(fresh),b=createLivingMoviePlan(warm),c=createLivingMoviePlan(legacy);
 assert.equal(a.manifest.presentationVersion,2);assert.equal(b.manifest.presentationVersion,1);assert.equal(c.manifest.presentationVersion,1);
 assert.deepEqual(a.times,c.times);assert.deepEqual(a.manifest.frameHashes,c.manifest.frameHashes);
 assert.deepEqual(a.sample(.5),c.sample(.5));assert.deepEqual(c.manifest.record,legacy);
});
