import test from 'node:test';
import assert from 'node:assert/strict';
import {fitFixedModes,reconstructModes,fitJointDecays} from '../tools/study-joint-decay.mjs';
import {synthesize} from '../tools/study-sound-file-target.mjs';

test('joint fixed-mode fit recovers signed quadratures and independently reconstructs the source',()=>{
 const modes=[{hz:200,decay:2,amplitude:1,phase:.3},{hz:201,decay:.8,amplitude:.1,phase:-.7},{hz:320,decay:3,amplitude:.5,phase:1}];
 const {samples,sampleRate}=synthesize({modes,seconds:.5,sampleRate:2000});
 const frequencies=modes.map(m=>m.hz),fit=fitFixedModes(samples,sampleRate,frequencies,modes.map(m=>m.decay));
 modes.forEach((m,i)=>{assert.ok(Math.abs(fit.coefficients[2*i]-m.amplitude*Math.cos(m.phase))<1e-10);assert.ok(Math.abs(fit.coefficients[2*i+1]+m.amplitude*Math.sin(m.phase))<1e-10);});
 const rebuilt=reconstructModes({...fit,frequencies},sampleRate,samples.length);
 assert.ok(rebuilt.every((x,i)=>Math.abs(x-samples[i])<1e-10));
 assert.ok(fit.relativeRms<1e-11);
 assert.equal(fitFixedModes(samples,sampleRate,[200,200],[2,2]),null,'identical columns are refused');
});

test('joint decay search respects its work budget and reports it without promising convergence',()=>{
 const {samples,sampleRate}=synthesize({modes:[{hz:200,decay:2,amplitude:1}],seconds:.5,sampleRate:2000});
 const fit=fitJointDecays(samples,sampleRate,[200],{maxEvaluations:1});
 assert.equal(fit.evaluations,1);assert.equal(fit.budgetExhausted,true);assert.equal(fit.status,'local-fit');
 assert.throws(()=>fitJointDecays(samples,sampleRate,[200],{maxEvaluations:Infinity}));
});

test('bounded joint search recovers the clean nearby-mode control when frequencies are supplied',()=>{
 const modes=[{hz:200,decay:2,amplitude:1},{hz:201,decay:.8,amplitude:.1},{hz:320,decay:3,amplitude:1}];
 const {samples,sampleRate}=synthesize({modes,seconds:.5,sampleRate:2000});
 const fit=fitJointDecays(samples,sampleRate,modes.map(m=>m.hz));
 assert.equal(fit.budgetExhausted,false);
 assert.equal(fit.atBound,false);
 fit.decays.forEach((tau,i)=>assert.ok(Math.abs(tau/modes[i].decay-1)<.005));
 assert.ok(fit.relativeRms<.0001);
 const reference=synthesize({modes,seconds:4,sampleRate}).samples;
 const future=reconstructModes(fit,sampleRate,reference.length);
 let error=0,energy=0;
 for(let i=samples.length;i<reference.length;i++){error+=(future[i]-reference[i])**2;energy+=reference[i]**2;}
 assert.ok(Math.sqrt(error/energy)<.002,'predicts the unused clean continuation for this exact-frequency control');
});
