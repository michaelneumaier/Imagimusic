import test from 'node:test';
import assert from 'node:assert/strict';
import {refineModes} from '../tools/study-refined-modes.mjs';
import {synthesize} from '../tools/study-sound-file-target.mjs';

test('local refinement corrects a frequency offset while preserving its starting point and count',()=>{
 const signal=synthesize({modes:[{hz:220,amplitude:1,decay:2}],seconds:.5,sampleRate:2000});
 const initial={frequencies:[220.03],decays:[2]},snapshot=structuredClone(initial);
 const fit=refineModes(signal.samples,signal.sampleRate,initial);
 assert.deepEqual(initial,snapshot);assert.deepEqual(fit.initial.frequencies,initial.frequencies);
 assert.equal(fit.frequencies.length,1);assert.equal(fit.status,'local-refinement');
 assert.ok(Math.abs(fit.frequencies[0]-220)<.0001);assert.ok(fit.relativeRms<.0001);
 assert.ok(fit.squaredError<fit.initial.squaredError);assert.equal(fit.budgetExhausted,false);
});

test('refinement reports its evaluation cap and keeps close frequency bounds disjoint',()=>{
 const signal=synthesize({modes:[{hz:220,amplitude:1,decay:2}],seconds:.5,sampleRate:2000});
 const fit=refineModes(signal.samples,2000,{frequencies:[220,220.01],decays:[2,3]},{maxEvaluations:1});
 assert.equal(fit.evaluations,1);assert.equal(fit.budgetExhausted,true);
 assert.ok(fit.frequencyBounds[0][1]<fit.frequencyBounds[1][0]);
 assert.throws(()=>refineModes(signal.samples,2000,{frequencies:[220,219],decays:[2,3]}));
 assert.throws(()=>refineModes(signal.samples,2000,{frequencies:[220],decays:[9]}));
});
