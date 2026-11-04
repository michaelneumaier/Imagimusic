import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLivingGreeting} from '../src/living/greeting.js';
import {createLivingGeneratedPhrase} from '../src/living/generative-phrase.js';
import {createLivingRecord,livingFragment,readLivingAddress,validateLivingRecord} from '../src/living/record.js';
import {createLivingPerformanceView} from '../src/living/performance-view.js';
import {createLivingMoviePlan} from '../src/living/movie-plan.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {livingStrikerPose} from '../src/living/striker-geometry.js';
import {traceHash} from '../src/state.js';

test('earlier appearance frames and film hashes retain their pre-contact identity',()=>{
 const source=createLivingGreeting();
 for(const version of [1,2]){
  const record=createLivingRecord(source,{presentationVersion:version}),film=createLivingMoviePlan(record),view=createLivingPerformanceView(source,version),legacy=createLivingArrangementView(view.plan);
  for(const t of film.times)assert.deepEqual(view.at(t),legacy.at(t));
  assert.equal(createHash('sha256').update(JSON.stringify(film.manifest.frameHashes)).digest('hex'),'c8314812987a4100b41eeef73f51db0f6b0756c50436d81b9864e21282523f0e');
  assert.equal('performers' in film.sample(.5),false);
 }
});

test('presentation3 live and film share all timed poses, with exact contacts on every body',()=>{
 for(const source of [createLivingGreeting(),createLivingGeneratedPhrase(42).source]){
  const record=createLivingRecord(source,{presentationVersion:3}),film=createLivingMoviePlan(record),view=createLivingPerformanceView(source,3);
  assert.deepEqual(readLivingAddress(livingFragment(record)),record);
  if(source.events.length===3)assert.equal(createHash('sha256').update(JSON.stringify(film.manifest.frameHashes)).digest('hex'),'ecba38d1fbf4cf0862cacd5c6134908982d96801a784370f5f84b23aa1c9330f');
  for(let i=film.times.length-1;i>=0;i--){const t=film.times[i];assert.deepEqual(film.sample(t),view.at(t));assert.equal(traceHash(view.at(t),12),film.manifest.frameHashes[i]);}
  for(const [voiceIndex,voice] of view.plan.voices.entries())for(const [eventIndex,event] of source.events.entries()){
   const t=(voice.startFrame+event.frame)/source.sampleRate,pose=view.at(t).performers.find(p=>p.eventId===`${voiceIndex}:${eventIndex}`&&p.body===voice.body);
   assert.ok(pose);assert.ok(Math.abs(pose.down-1)<1e-12);
   const geometry=livingStrikerPose(view.plan.bodies[pose.body].design.lengthMm,pose.down,pose.lane,pose.headRadius);
   assert.ok(Math.abs(geometry.head[1]-pose.headRadius-3.55)<1e-10);
  }
  const changed=structuredClone(film.sample(.5));changed.performers[0].down+=.01;
  assert.notEqual(traceHash(changed,12),traceHash(film.sample(.5),12));
 }
});

test('contact presentation does not change sound and can hide veils or hold the camera independently',()=>{
 const source=createLivingGreeting(),old=createLivingRecord(source,{presentationVersion:2}),record=createLivingRecord(source,{presentationVersion:3,reveal:false,cameraMotion:false});
 const film=createLivingMoviePlan(record),frame=film.sample(.5);
 assert.equal(frame.cameraOpen,1);assert.ok(frame.bodies.every(b=>b.points===null));assert.ok(frame.performers.length>0);
 assert.deepEqual(renderLivingArrangement(record.source).channels,renderLivingArrangement(old.source).channels);
 const signed={...source,events:[{frame:24000,strength:-.05}]};
 assert.doesNotThrow(()=>createLivingRecord(signed,{presentationVersion:2}));
 assert.throws(()=>createLivingRecord(signed,{presentationVersion:3}),/positive/);
 assert.throws(()=>validateLivingRecord({...record,presentationVersion:5}));
 for(const version of [5,'3','__proto__',null])assert.throws(()=>createLivingPerformanceView(source,version));
});
