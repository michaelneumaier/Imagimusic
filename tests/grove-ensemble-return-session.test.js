import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleReturnSession} from '../src/grove/ensemble-return-session.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function harness(){const jobs=[],changes=[];const session=createEnsembleReturnSession({prepare:(record,{signal})=>{const job=deferred();jobs.push({...job,record,signal});return job.promise;},onChange:value=>changes.push(value)});return {session,jobs,changes};}
test('source snapshot survives external/job mutation and repeated preparation always starts from the original',async()=>{
 const {session,jobs}=harness(),source={events:[{frame:12}]};session.setSource(source,{origin:'personal'});source.events[0].frame=90;
 const first=session.prepare();assert.equal(jobs[0].record.events[0].frame,12);jobs[0].record.events[0].frame=88;jobs[0].resolve({derived:{events:[{frame:44}]}});await first;
 const again=session.prepare();assert.equal(jobs[1].record.events[0].frame,12);jobs[1].resolve({derived:2});await again;assert.equal(session.origin,'personal');
});
test('cancelled or failed retry preserves the last successful return; late result cannot publish',async()=>{
 const {session,jobs}=harness();session.setSource({source:1});const first=session.prepare();jobs[0].resolve({derived:1});const kept=await first;
 const retry=session.prepare(),cancelled=assert.rejects(retry,{name:'AbortError'});session.cancel();assert.equal(jobs[1].signal.aborted,true);jobs[1].resolve({derived:2});await cancelled;
 assert.equal(session.result,kept);assert.equal(session.state,'ready');
 const failure=session.prepare(),rejected=assert.rejects(failure,/not admitted/);jobs[2].reject(new Error('not admitted'));await rejected;assert.equal(session.result,kept);assert.equal(session.state,'error');
});
test('explicit source replacement clears the old result, cancels the old job and retains the new origin',async()=>{
 const {session,jobs}=harness();session.setSource({source:1},{origin:'demonstration'});const first=session.prepare();jobs[0].resolve({derived:1});await first;
 const old=session.prepare(),cancelled=assert.rejects(old,{name:'AbortError'});session.setSource({source:2},{origin:'personal'});assert.equal(session.result,null);assert.equal(session.origin,'personal');
 const current=session.prepare();jobs[2].resolve({derived:2});await current;jobs[1].resolve({derived:1});await cancelled;assert.deepEqual(session.result,{derived:2});
});
test('clearing and disposal prevent stale publication and refuse preparation without a source',async()=>{
 const {session,jobs,changes}=harness();await assert.rejects(session.prepare(),/source passage/);session.setSource({source:1});const first=session.prepare(),cancelled=assert.rejects(first,{name:'AbortError'});session.clearSource();jobs[0].resolve({derived:1});await cancelled;assert.equal(session.hasSource,false);
 session.setSource({source:2});const second=session.prepare(),closed=assert.rejects(second,{name:'AbortError'});session.dispose();const count=changes.length;jobs[1].resolve({derived:2});await closed;assert.equal(changes.length,count);assert.equal(session.result,null);await assert.rejects(session.prepare(),/closed/);
});

test('invalid replacement and empty job output cannot erase a completed return',async()=>{
 const {session,jobs}=harness();session.setSource({source:1});const first=session.prepare();jobs[0].resolve({derived:1});const kept=await first;
 assert.throws(()=>session.setSource({source:2},{origin:'unknown'}),/origin/);
 assert.throws(()=>session.setSource({cannotClone:()=>{}}));assert.equal(session.result,kept);
 const retry=session.prepare(),rejected=assert.rejects(retry,/no result/);jobs[1].resolve(null);await rejected;assert.equal(session.result,kept);
});
