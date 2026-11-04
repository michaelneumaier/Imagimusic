import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousReturnView} from '../src/living/continuous-return-view.js';
import {createMemoryReturnPerformance} from '../src/living/memory-return-study.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {requestForTineDesign} from '../src/tine/address.js';

function run({guests=[],quiet=null,observe=()=>{}}={}){
 const p=createMemoryReturnPerformance(),history=[];p.start();
 const collect=events=>{history.push(...events);observe(events,p);};
 function advance(frame){while(p.frame<frame&&p.state!=='ended')collect(p.process(new Float32Array(Math.min(1024,frame-p.frame))));}
 for(const [seconds,strength] of guests){advance(Math.round(seconds*48000));collect(p.tryGuest(strength).events);}
 if(quiet!==null){advance(Math.round(quiet*48000));collect(p.quiet());}
 while(p.state!=='ended')collect(p.process(new Float32Array(1024)));
 return {p,history};
}
test('remembered visual responses agree with the streaming body through both answers',()=>{
 const view=createContinuousReturnView(42,{mode:'memory'}),model=createTineImpulse(requestForTineDesign(view.plan.design).geometry);let checks=0;
 const {p,history}=run({guests:[[0,.025],[1,-.05],[5,.05],[5.5,.025],[6,.025],[24,.025]],observe(events,p){
  view.accept(events);
  if(!events.length)return;
  const actual=view.at(p.frame/48000),physical=p.snapshot().body;
  model.modes.forEach((m,i)=>{const s=physical.modes[i],expected=Math.hypot(s.displacementM,(s.velocityMPerS+m.gamma*s.displacementM)/m.omegaD);assert.ok(Math.abs(actual.amplitudesM[i]-expected)<1e-15);});checks++;
 }});
 assert.ok(checks>20);assert.deepEqual(view.plan,p.plan);assert.deepEqual(view.accepted,history);assert.equal(view.plan.contributions.length,3);assert.equal(view.plan.timeScale,.6);
 assert.equal(view.at(48).instances[0].endingOpacity,0);
});
test('whole batches derive the same memory; rejected late notes cannot partially commit it',()=>{
 const {p,history}=run({guests:[[0,.025],[1,.05],[2,.025]]}),view=createContinuousReturnView(42,{mode:'memory'}),original=view.plan;
 const corrupt=structuredClone(history);corrupt.at(-1).strength=.099;
 assert.throws(()=>view.accept(corrupt),/score/);assert.equal(view.plan,original);assert.deepEqual(view.accepted,[]);
 view.accept(history);assert.deepEqual(view.plan,p.plan);
 const fixed=createContinuousReturnView();assert.throws(()=>fixed.accept(history),/score/);assert.equal(fixed.accepted.length,0);
});
test('unattended memory view agrees with fixed response and preserves distinct plan identity',()=>{
 const memory=createContinuousReturnView(42,{mode:'memory'}),fixed=createContinuousReturnView(),{history,p}=run();
 memory.accept(history);fixed.accept(history);assert.deepEqual(memory.plan,p.plan);
 for(const seconds of [0,1,6,18.5,24,36.5,47.99,48])assert.deepEqual(memory.at(seconds),fixed.at(seconds));
 assert.equal(memory.plan.kind,'imagimusic-memory-return-study');assert.throws(()=>createContinuousReturnView(42,{mode:'other'}),/mode/);
});
test('Quiet keeps early memory unsealed and derives a sealed plan at the boundary',()=>{
 for(const quiet of [1,6,6.1]){
  const {history,p}=run({guests:[[0,.025]],quiet}),view=createContinuousReturnView(42,{mode:'memory'});
  view.accept(history);view.end(Math.round(quiet*48000));assert.deepEqual(view.plan,p.plan);
  assert.equal(view.at(quiet+.025).instances[0].endingOpacity,0);
 }
});
