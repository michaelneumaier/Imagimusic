import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleContinuationBarrier} from '../src/grove/ensemble-continuation-barrier.js';
const steps=[100,50,0].map((frame,part)=>({id:'remembered-'+part,part,frame}));
const ack=(step,overrides={})=>({id:step.id,event:{id:step.id,frame:step.frame},requestedFrame:step.frame,appliedFrame:step.frame,lateByFrames:0,accepted:true,...overrides});

test('part-grouped delivery uses all identities and maximum actual frame, not the last message',()=>{
 const b=createEnsembleContinuationBarrier(steps,{handoffFrame:100});
 b.observeFrame(128);
 b.acknowledge(0,ack(steps[0]));assert.equal(b.state,'waiting','last planned frame alone is insufficient');
 b.acknowledge(1,ack(steps[1]));assert.equal(b.state,'waiting');
 b.acknowledge(2,ack(steps[2]));assert.equal(b.state,'completed');assert.equal(b.boundaryFrame,100);
 assert.deepEqual(b.snapshot().ledger.map(a=>a.appliedFrame),[100,50,0]);
});
test('a long tail waits for processor time and late commands extend the boundary',()=>{
 const b=createEnsembleContinuationBarrier(steps,{handoffFrame:1000});
 steps.forEach(s=>b.acknowledge(s.part,ack(s,s.part===1?{appliedFrame:1100,lateByFrames:1050}:{})));
 b.observeFrame(1001);assert.equal(b.state,'waiting');
 b.observeFrame(1100);assert.equal(b.state,'waiting','next sample must pass the applied sample');
 b.observeFrame(1101);assert.equal(b.boundaryFrame,1100);
});
test('refused commands are accounted for without becoming accepted gestures',()=>{
 const b=createEnsembleContinuationBarrier(steps,{handoffFrame:100});
 steps.forEach(s=>b.acknowledge(s.part,ack(s,s.part===2?{accepted:false,reason:'headroom'}:{})));
 b.observeFrame(101);const result=b.snapshot();
 assert.equal(result.state,'completed');assert.equal(result.acknowledged,3);assert.equal(result.accepted,2);assert.equal(result.refused,1);
 assert.equal(result.ledger[2].reason,'headroom');
});
test('Quiet before handoff aborts permanently; delayed acknowledgements cannot invent completion',()=>{
 const b=createEnsembleContinuationBarrier(steps,{handoffFrame:100});
 b.acknowledge(0,ack(steps[0]));b.cancel();
 steps.slice(1).forEach(s=>assert.equal(b.acknowledge(s.part,ack(s)),true));b.observeFrame(999);
 const result=b.snapshot();assert.equal(result.state,'aborted');assert.equal(result.acknowledged,3,'already processed decisions still count');assert.equal('boundaryFrame' in result,false);assert.equal(b.boundaryFrame,null);
});
test('unrelated events cannot complete the barrier and invalid known acknowledgements do not count',()=>{
 const b=createEnsembleContinuationBarrier(steps,{handoffFrame:100});
 assert.equal(b.acknowledge(0,{id:'$ensemble-quiet'}),false);
 for(const a of [ack(steps[0],{requestedFrame:99}),ack(steps[0],{appliedFrame:99}),ack(steps[0],{lateByFrames:1}),ack(steps[0],{accepted:false}),ack(steps[0],{event:{id:'other',frame:100}})])assert.throws(()=>b.acknowledge(0,a),/Invalid remembered/);
 assert.throws(()=>b.acknowledge(2,ack(steps[0])),/Invalid remembered/);
 assert.equal(b.snapshot().acknowledged,0);b.acknowledge(0,ack(steps[0]));
 assert.throws(()=>b.acknowledge(0,ack(steps[0])),/Invalid remembered/);
 b.observeFrame(100);assert.throws(()=>b.observeFrame(99),/Invalid continuation clock/);assert.equal(b.state,'waiting');
});
test('plan and result mutations cannot alter accounting; invalid plans fail before use',()=>{
 const plan=structuredClone(steps),b=createEnsembleContinuationBarrier(plan,{handoffFrame:100});
 plan[0].frame=99;const a=ack(steps[0]);b.acknowledge(0,a);a.appliedFrame=999;
 const result=b.snapshot();result.ledger[0].appliedFrame=999;assert.equal(b.snapshot().ledger[0].appliedFrame,100);
 for(const bad of [[],[steps[0],steps[0]],[{...steps[0],part:3}],[{...steps[0],id:'$reserved'}],[{...steps[0],frame:101}]])assert.throws(()=>createEnsembleContinuationBarrier(bad,{handoffFrame:100}));
 assert.throws(()=>createEnsembleContinuationBarrier(steps,{handoffFrame:NaN}));
});
