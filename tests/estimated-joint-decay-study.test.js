import test from 'node:test';
import assert from 'node:assert/strict';
import {fitEstimatedModes} from '../tools/study-estimated-joint-decay.mjs';
import {synthesize} from '../tools/study-sound-file-target.mjs';

test('estimated-mode fitting uses only the observed prefix and refuses silence without inventing modes',()=>{
 const {samples,sampleRate}=synthesize({modes:[{hz:220,amplitude:1,decay:2}],seconds:2,sampleRate:2000});
 const prefix=samples.slice(0,1000),altered=samples.slice();altered.fill(100,1000);
 const expected=fitEstimatedModes(prefix,sampleRate,.5);
 assert.equal(expected.status,'local-fit');assert.equal(expected.candidateCount,1);
 assert.deepEqual(fitEstimatedModes(altered,sampleRate,.5),expected,'unobserved samples cannot influence spectrum or joint fit');
 assert.equal(fitEstimatedModes(new Float64Array(1000),sampleRate,.5).status,'count-refused');
 const short=fitEstimatedModes(samples,sampleRate,.25);
 assert.equal(short.status,'count-refused');assert.equal(short.candidateCount,0,'one projection frame supplies no decay candidate');
});

test('estimated-mode fitting neither trims excess peaks nor invents a missing third mode',()=>{
 const separated=synthesize({modes:[{hz:140,amplitude:1,decay:.8},{hz:190,amplitude:1,decay:2.4},{hz:260,amplitude:1,decay:3}],seconds:2,sampleRate:2000});
 const crowded=fitEstimatedModes(separated.samples,2000,2,{window:'rect'});
 assert.ok(crowded.candidateCount>4);assert.equal(crowded.status,'count-refused');assert.equal(crowded.joint,undefined);
 const nearby=synthesize({modes:[{hz:200,amplitude:1,decay:2},{hz:201,amplitude:.1,decay:.8},{hz:320,amplitude:1,decay:3}],seconds:.5,sampleRate:2000});
 const missing=fitEstimatedModes(nearby.samples,2000,.5);
 assert.equal(missing.candidateCount,2);assert.equal(missing.joint.frequencies.length,2);
 assert.equal(missing.status,'local-fit','local fit describes optimization only, not recovery of the known three modes');
});
