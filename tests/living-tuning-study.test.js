import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLivingTuningStudy} from '../tools/render-living-tuning-study.mjs';
import {renderLivingArrangement} from '../src/living/arrangement.js';

test('tuning baseline reproduces existing arrangement PCM and every treatment preserves score and home',()=>{
 const original=renderLivingTuningStudy(42,'existing');
 const reference=renderLivingArrangement(original.source,2);
 assert.deepEqual(original.channels,reference.channels);
 for(const treatment of ['adjacent','fifths']){
  const candidate=renderLivingTuningStudy(42,treatment);
  assert.deepEqual(candidate.source,original.source);
  assert.deepEqual(candidate.voices,original.voices);
  assert.equal(candidate.frames,original.frames);
  for(const body of candidate.bodies)assert.deepEqual(body.events,original.source.events);
  for(let ch=0;ch<2;ch++){
   assert.deepEqual(candidate.channels[ch].slice(0,candidate.phraseFrames),original.channels[ch].slice(0,original.phraseFrames));
   assert.deepEqual(candidate.channels[ch].slice(candidate.returnStart),original.channels[ch].slice(original.returnStart));
   assert.notDeepEqual(candidate.channels[ch],original.channels[ch]);
  }
  assert.ok(candidate.peak*8<1);
 }
});

test('precise lengths produce intended modal ratios without changing saved design identity',()=>{
 const result=renderLivingTuningStudy(2950288811,'fifths');
 for(let mode=0;mode<4;mode++){
  assert.ok(Math.abs(result.bodies[1].frequenciesHz[mode]/result.bodies[0].frequenciesHz[mode]-2/3)<1e-12);
  assert.ok(Math.abs(result.bodies[2].frequenciesHz[mode]/result.bodies[0].frequenciesHz[mode]-1.5)<1e-12);
 }
 assert.equal(result.source.design.lengthMm,80);
 assert.throws(()=>renderLivingTuningStudy(42,'unknown'),/Unknown/);
});
