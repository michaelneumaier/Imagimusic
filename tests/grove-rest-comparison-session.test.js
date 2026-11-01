import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestComparisonSession} from '../src/grove/rest-comparison-session.js';
function harness(){
 const jobs=[],states=[];const session=createRestComparisonSession({onChange:s=>states.push(s),prepareComparison:(data,{signal})=>new Promise((resolve,reject)=>jobs.push({data,signal,resolve,reject}))});
 return {session,jobs,states};
}
test('preparation snapshots its source and a superseded worker cannot replace the chosen comparison',async()=>{
 const {session,jobs}=harness(),record={grove:{seed:3},events:[{frame:4}]};
 const first=session.prepare(record,7);const firstCancelled=assert.rejects(first,{name:'AbortError'});
 record.events[0].frame=99;assert.equal(jobs[0].data.record.events[0].frame,4);
 const second=session.prepare(record,11);assert.equal(jobs[0].signal.aborted,true);
 const chosen={targetSeed:11};jobs[1].resolve(chosen);assert.equal(await second,chosen);
 jobs[0].resolve({targetSeed:7});await firstCancelled;assert.equal(session.result,chosen);assert.equal(session.state,'ready');
});
test('cancelling or failing a new preparation keeps the previous result; clear prevents stale publication',async()=>{
 const {session,jobs}=harness();const ready=session.prepare({},7);const previous={targetSeed:7};jobs[0].resolve(previous);await ready;
 const pending=session.prepare({},11);const rejected=assert.rejects(pending,{name:'AbortError'});session.cancel();jobs[1].resolve({targetSeed:11});await rejected;assert.equal(session.result,previous);
 const failed=session.prepare({},11);const failure=assert.rejects(failed,/worker failed/);jobs[2].reject(new Error('worker failed'));await failure;assert.equal(session.result,previous);assert.equal(session.state,'error');
 const stale=session.prepare({},11);const cleared=assert.rejects(stale,{name:'AbortError'});session.clear();jobs[3].resolve({targetSeed:11});await cleared;assert.equal(session.result,null);assert.equal(session.state,'idle');
});
test('disposal aborts preparation and suppresses later notifications',async()=>{
 const {session,jobs,states}=harness();const pending=session.prepare({},7);const rejected=assert.rejects(pending,{name:'AbortError'});session.dispose();const count=states.length;
 assert.equal(jobs[0].signal.aborted,true);jobs[0].resolve({targetSeed:7});await rejected;assert.equal(states.length,count);assert.equal(session.result,null);assert.equal(session.state,'disposed');
 await assert.rejects(session.prepare({},11),/disposed/);
});
