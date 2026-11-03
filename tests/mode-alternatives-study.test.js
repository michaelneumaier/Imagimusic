import test from 'node:test';
import assert from 'node:assert/strict';
import {modeAlternatives,chooseByValidation} from '../tools/study-mode-alternatives.mjs';

test('alternative hypotheses retain the original and add at most one explicit mode without mutating input',()=>{
 const frequencies=[200,320],alternatives=modeAlternatives(frequencies,.5,2000);
 assert.deepEqual(frequencies,[200,320]);assert.equal(alternatives.length,13);
 assert.deepEqual(alternatives[0],{id:'initial',addedHz:null,frequencies:[200,320]});
 for(const candidate of alternatives.slice(1)){
  assert.equal(candidate.frequencies.length,3);assert.ok(candidate.frequencies.includes(200)&&candidate.frequencies.includes(320));
  assert.ok(candidate.frequencies.includes(candidate.addedHz));assert.deepEqual([...candidate.frequencies].sort((a,b)=>a-b),candidate.frequencies);
 }
 assert.equal(modeAlternatives([100,200,300,400],.5,2000).length,1);
 assert.throws(()=>modeAlternatives([200,200],.5,2000));
});

test('selection uses validation error and only exact ties favor simpler models',()=>{
 const scores=[{id:'simple',modeCount:2,validationError:.2},{id:'complex',modeCount:3,validationError:.1}];
 assert.equal(chooseByValidation(scores),'complex');
 scores[0].validationError=.1;assert.equal(chooseByValidation(scores),'simple');
 assert.throws(()=>chooseByValidation([{id:'bad',modeCount:2,validationError:NaN}]));
});

test('changing only the final interval cannot change fitted candidates or validation selection',async()=>{
 const {evaluateAlternatives}=await import('../tools/study-mode-alternatives.mjs');
 const {synthesize}=await import('../tools/study-sound-file-target.mjs');
 const {samples,sampleRate}=synthesize({modes:[{hz:220,amplitude:1,decay:2}],seconds:4,sampleRate:1000});
 const altered=samples.slice();altered.fill(99,2*sampleRate);
 const original=evaluateAlternatives(samples,sampleRate),changed=evaluateAlternatives(altered,sampleRate);
 assert.equal(original.status,'compared');assert.equal(original.chosenId,changed.chosenId);
 for(const candidate of original.candidates.filter(c=>c.status==='fitted'))assert.equal(candidate.totalEvaluations,candidate.initializationBudget.evaluations+candidate.fit.evaluations);
 const withoutFinal=report=>report.candidates.map(({finalTestError,...candidate})=>candidate);
 assert.deepEqual(withoutFinal(original),withoutFinal(changed));
 assert.notEqual(original.candidates[0].finalTestError,changed.candidates[0].finalTestError);
});
