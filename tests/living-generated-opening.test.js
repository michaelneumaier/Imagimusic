import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {createLivingSharedPhrasePass} from '../src/living/shared-phrase-pass.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
import {personalOriginalWav} from '../src/living/personal-original.js';
import {renderLivingJourneyArtifact} from '../src/living/journey-artifact.js';
import {livingPersonalJourneyHref,readLivingPersonalPhrase} from '../src/living/personal-journey-input.js';
import {createLivingPersonalJourneyStudy} from '../src/living/personal-journey-study.js';
const makers={chapters:createLivingJourneyStudy,connected:createLivingConnectedJourneyStudy,evolving:createLivingEvolvingJourneyStudy};
test('generated openings admit shared participation without changing the selected journey',()=>{
 for(const seed of [0,42,2950288811,4294967295])for(const maker of Object.values(makers)){
  const plan=maker(seed),before=JSON.stringify(plan),source=plan.sections[0].source,pass=createLivingSharedPhrasePass(source);
  assert.equal(pass.guestLimit,2);pass.start();pass.process(new Float32Array(source.events[0].frame));pass.strike(.05);pass.strike(.025);
  assert.throws(()=>pass.strike(.025),/reserved/);
  pass.process(new Float32Array(source.fadeStart+Math.round(.025*source.sampleRate)-pass.frame));
  const accepted=pass.snapshot();assert.equal(accepted.events.length,8);assert.equal(accepted.applied.filter(e=>e.origin==='score').length,6);
  const combined={...source,events:accepted.events},href=livingPersonalJourneyHref(combined),reopened=readLivingPersonalPhrase(new URL(href,'http://localhost:8081/').href);
  const next=createLivingPersonalJourneyStudy(reopened);assert.deepEqual(next.sections[0].source,combined);assert.deepEqual(next.sections.at(-1).source,combined);
  assert.equal(JSON.stringify(plan),before);
 }
});
test('opening-only preview equals the selected generated recording opening in all three structures',async()=>{
 for(const [treatment,maker] of Object.entries(makers)){
  const plan=maker(42),source=plan.sections[0].source,pcm=renderTineLiveRecord(source),preview=personalOriginalWav(pcm,source);
  const artifact=await renderLivingJourneyArtifact({kind:'imagimusic-living-journey-request',version:1,seed:42,treatment});
  assert.deepEqual(new Uint8Array(preview,44),new Uint8Array(artifact.wav,44,pcm.frames*4));
 }
});
