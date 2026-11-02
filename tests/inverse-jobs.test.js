import test from 'node:test';
import assert from 'node:assert/strict';
import {createInverseJobs} from '../src/inverse/jobs.js';
const setup=()=>{
 const workers=[];
 const jobs=createInverseJobs({makeWorker:()=>{const worker={stopped:0,postMessage(payload){this.payload=structuredClone(payload);},terminate(){this.stopped++;}};workers.push(worker);return worker;}});
 return {jobs,workers};
};
test('replacing and cancelling stop computation and exclude stale messages',async()=>{
 const {jobs,workers}=setup();
 const first=jobs.run({kind:'search',target:{id:1}}),firstRefused=assert.rejects(first,{name:'AbortError'});
 const oldMessage=workers[0].onmessage;
 const second=jobs.run({kind:'search',target:{id:2}});await firstRefused;
 assert.equal(workers[0].stopped,1);
 oldMessage({data:{result:{id:1}}});
 workers[1].onmessage({data:{result:{id:2}}});assert.deepEqual(await second,{id:2});assert.equal(workers[1].stopped,1);
 const third=jobs.run({kind:'candidate'}),thirdRefused=assert.rejects(third,{name:'AbortError'});
 jobs.cancel();jobs.cancel();await thirdRefused;assert.equal(workers[2].stopped,1);
});
test('worker failures and malformed responses settle once and permit retry',async()=>{
 const {jobs,workers}=setup();
 const a=jobs.run({kind:'search'}),bad=assert.rejects(a,/invalid response/);workers[0].onmessage({data:{}});await bad;
 const b=jobs.run({kind:'search'}),failed=assert.rejects(b,/source invalid/);workers[1].onmessage({data:{error:'source invalid'}});await failed;
 const c=jobs.run({kind:'candidate'}),crashed=assert.rejects(c,/worker crashed/);workers[2].onerror({message:'worker crashed'});await crashed;
 const d=jobs.run({kind:'candidate'}),unreadable=assert.rejects(d,/could not be read/);workers[3].onmessageerror();await unreadable;
 const e=jobs.run({kind:'search'});workers[4].onmessage({data:{result:42}});assert.equal(await e,42);
 assert.ok(workers.every(w=>w.stopped===1));
});
test('creation and structured-clone failures reject without leaving an active job',async()=>{
 const broken=createInverseJobs({makeWorker:()=>{throw new Error('worker unavailable');}});
 await assert.rejects(broken.run({}),/worker unavailable/);broken.cancel();
 const {jobs,workers}=setup();await assert.rejects(jobs.run({uncloneable(){}}),{name:'DataCloneError'});assert.equal(workers[0].stopped,1);jobs.cancel();
});
