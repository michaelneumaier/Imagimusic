import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {validateLivingPersonalJourneyRequest,renderLivingPersonalJourneyArtifact} from '../src/living/personal-journey-artifact.js';
import {readLivingPersonalJourneyReport} from '../src/living/personal-journey-report.js';
import {createLivingJourneyGeneration} from '../src/living/journey-generation.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:29280,strength:.1},{frame:83520,strength:.05},{frame:103200,strength:.025}],fadeStart:175200};
const request={kind:'imagimusic-living-personal-journey-request',version:1,source};

test('personal report reopens the actual original and regenerates identical kept audio',async()=>{
 const artifact=await renderLivingPersonalJourneyArtifact(request),{wav,...report}=artifact;
 const kept=readLivingPersonalJourneyReport(JSON.stringify(report));
 assert.deepEqual(kept.request,request);assert.deepEqual(kept.plan.source,source);
 assert.equal(artifact.seconds,38.775);assert.equal(wav.byteLength,44+artifact.frames*4);
 assert.equal((await renderLivingPersonalJourneyArtifact(kept.request)).sha256,kept.expectedSha256);
 for(const change of [r=>r.version=2,r=>r.previewGain=1,r=>r.frames++,r=>r.source.events[0].strength=.05,r=>r.plan.voices[1].startFrame++,r=>r.extra=1]){
  const changed=structuredClone(report);change(changed);assert.throws(()=>readLivingPersonalJourneyReport(JSON.stringify(changed)));
 }
 for(const value of [{...request,extra:1},{...request,version:2},{...request,kind:'imagimusic-living-journey-request'},{...request,source:{...source,events:[]}}])assert.throws(()=>validateLivingPersonalJourneyRequest(value));
});

test('shared generation session keeps personal identity distinct and verifies original source before downloads',async()=>{
 const artifact=await renderLivingPersonalJourneyArtifact(request),blobs=[];
 const session=createLivingJourneyGeneration({createJob:()=>({promise:Promise.resolve(artifact),cancel(){}}),makeURL:blob=>{blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:()=>{}});
 const result=await session.prepare(request,artifact.plan,artifact.sha256);
 assert.deepEqual(result.source,source);assert.equal(result.seed,undefined);
 const saved=readLivingPersonalJourneyReport(await blobs[1].text());assert.deepEqual(saved.request.source,source);
 assert.equal(await session.prepare(request,artifact.plan,artifact.sha256),result);
 session.clear();
 for(const change of [a=>a.source.events[0].strength=.05,a=>a.kind='imagimusic-living-journey-artifact']){
  const bad=structuredClone(artifact);change(bad);let published=0;
  const wrong=createLivingJourneyGeneration({createJob:()=>({promise:Promise.resolve(bad),cancel(){}}),makeURL:()=>{published++;return 'bad';}});
  await assert.rejects(wrong.prepare(request,artifact.plan),/match/);assert.equal(published,0);
 }
});
