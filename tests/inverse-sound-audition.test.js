import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSoundAudition} from '../src/inverse/sound-audition.js';
test('source audition attenuates with one shared scalar and leaves analysis samples untouched',()=>{
 for(const peak of [.01,1,4,3.4e38]){
  const source={sampleRate:96000,peak,channels:[Float64Array.of(peak,-peak,0),Float64Array.of(peak/2,0,-peak/4)]};
  const before=structuredClone(source),copy=prepareSoundAudition(source);
  assert.deepEqual(source,before);assert.equal(copy.sampleRate,96000);
  assert.equal(copy.gain,.25/Math.max(1,peak));
  assert.equal(copy.channels.length,2);
  for(let c=0;c<2;c++)for(let i=0;i<3;i++)assert.equal(copy.channels[c][i],Math.fround(source.channels[c][i]*copy.gain));
  assert.ok(copy.channels[0].every(x=>Math.abs(x)<=.25));
 }
 const silent=prepareSoundAudition({sampleRate:8000,peak:0,channels:[new Float64Array(3)]});
 assert.equal(silent.gain,.25);assert.deepEqual([...silent.channels[0]],[0,0,0]);
});
