import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleContinuationKeepSession} from '../src/grove/ensemble-continuation-keep-session.js';
const fixture=()=>({source:{id:'original'},continuation:{ledger:[{accepted:true}]},ensemble:{id:'finished'}});
const verified=()=>({seeded:{id:'wrapped'},text:'canonical\n',verification:{verified:true}});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('keeping snapshots source, history and capture; failures preserve them for retry',async()=>{
 let input,fail=true;
 const session=createEnsembleContinuationKeepSession({prepare:async value=>{input=value;value.source.id='job mutation';if(fail)throw Error('verification failure');return verified();}});
 const original=fixture();session.setCapture(original,{origin:'demonstration'});original.ensemble.id='caller mutation';
 await assert.rejects(session.prepare(),/verification failure/);
 assert.equal(session.state,'error');assert.deepEqual(session.capture,fixture());assert.equal(session.origin,'demonstration');assert.equal(session.result,null);
 fail=false;const result=await session.prepare();result.seeded.id='returned mutation';input.continuation.ledger.length=0;
 assert.deepEqual(session.capture,fixture());assert.equal(session.result.seeded.id,'wrapped');
 const exposed=session.capture;exposed.source.id='getter mutation';assert.equal(session.capture.source.id,'original');
 fail=true;await assert.rejects(session.prepare());assert.equal(session.result.seeded.id,'wrapped');
});
test('cancel and source replacement exclude stale verification, even if worker ignores abort',async()=>{
 const jobs=[];const session=createEnsembleContinuationKeepSession({prepare:(_value,{signal})=>{const job={...deferred(),signal};jobs.push(job);return job.promise;}});
 session.setCapture(fixture());const first=session.prepare();session.cancel();assert.equal(jobs[0].signal.aborted,true);
 jobs[0].resolve(verified());await assert.rejects(first,{name:'AbortError'});assert.equal(session.result,null);assert.equal(session.hasCapture,true);
 const second=session.prepare();const other=fixture();other.ensemble.id='replacement';session.setCapture(other,{origin:'personal'});
 jobs[1].resolve(verified());await assert.rejects(second,{name:'AbortError'});assert.equal(session.capture.ensemble.id,'replacement');assert.equal(session.result,null);
 const third=session.prepare();jobs[2].resolve(verified());await third;session.cancel();assert.equal(session.state,'ready');assert.ok(session.result);
});
test('unverified results cannot become download text; clear and dispose invalidate pending work',async()=>{
 const session=createEnsembleContinuationKeepSession({prepare:async()=>({...verified(),verification:{verified:false}})});
 session.setCapture(fixture());await assert.rejects(session.prepare(),/could not be verified/);assert.equal(session.result,null);assert.ok(session.capture);
 assert.throws(()=>session.setCapture(fixture(),{origin:'unknown'}));assert.ok(session.capture);
 const jobs=[];let changes=0;const pending=createEnsembleContinuationKeepSession({prepare:()=>{const job=deferred();jobs.push(job);return job.promise;},onChange:()=>changes++});
 pending.setCapture(fixture());const first=pending.prepare();pending.clear();jobs[0].resolve(verified());await assert.rejects(first,{name:'AbortError'});assert.equal(pending.hasCapture,false);
 pending.setCapture(fixture());const second=pending.prepare();pending.dispose();const count=changes;jobs[1].resolve(verified());await assert.rejects(second,{name:'AbortError'});assert.equal(changes,count);assert.equal(pending.capture,null);assert.equal(pending.state,'disposed');assert.throws(()=>pending.setCapture(fixture()),/closed/);
});
