import test from 'node:test';
import assert from 'node:assert/strict';
import {readLivingJourneyReport,LIVING_JOURNEY_REPORT_LIMIT} from '../src/living/journey-report.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {renderLivingJourneyArtifact} from '../src/living/journey-artifact.js';
import {createLivingJourneyGeneration} from '../src/living/journey-generation.js';

function fixture(){const plan=createLivingEvolvingJourneyStudy(42);return {kind:'imagimusic-living-journey-artifact',version:1,seed:42,treatment:'evolving',plan,previewGain:8,sampleRate:plan.sampleRate,frames:plan.frames,seconds:plan.frames/plan.sampleRate,sourcePeak:.01,sha256:'1'.repeat(64)};}
test('only bounded generated reports with the complete supported score reopen',()=>{
 const original=fixture(),text=JSON.stringify(original),kept=readLivingJourneyReport(text);
 assert.equal(kept.expectedSha256,original.sha256);assert.deepEqual(kept.plan,original.plan);assert.equal(JSON.stringify(original),text);
 for(const mutate of [r=>r.version=2,r=>r.seed=43,r=>r.treatment='__proto__',r=>r.previewGain=1,r=>r.frames++,r=>r.seconds++,r=>r.sampleRate=44100,r=>r.extra=true,r=>r.sha256='bad',r=>r.sourcePeak=0,r=>r.plan.sections[1].source.events[0].strength=.001]){
  const report=structuredClone(original);mutate(report);assert.throws(()=>readLivingJourneyReport(JSON.stringify(report)));
 }
 for(const text of ['{','null','[]',' '.repeat(LIVING_JOURNEY_REPORT_LIMIT+1)])assert.throws(()=>readLivingJourneyReport(text));
});

test('a generated report round-trips quietly and later regeneration matches its kept WAV identity',async()=>{
 const request={kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'evolving'},artifact=await renderLivingJourneyArtifact(request);
 const {wav,...report}=artifact,kept=readLivingJourneyReport(JSON.stringify(report));let jobs=0,made=0;
 const session=createLivingJourneyGeneration({createJob:input=>{jobs++;assert.deepEqual(input,request);return {promise:renderLivingJourneyArtifact(input),cancel(){}};},makeURL:()=>`blob:${++made}`,revokeURL:()=>{}});
 assert.equal(jobs,0);assert.equal(made,0);assert.equal(wav.byteLength,44+kept.plan.frames*4);
 const result=await session.prepare(kept.request,kept.plan,kept.expectedSha256);
 assert.equal(jobs,1);assert.equal(made,2);assert.equal(result.seed,42);session.clear();
});
