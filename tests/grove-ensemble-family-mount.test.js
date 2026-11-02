import test from 'node:test';
import assert from 'node:assert/strict';
import {mountEnsembleFamily} from '../src/grove/ensemble-family-mount.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(){
 const job=deferred(),events=[],groves=[{seed:7}],candidate={dispose(){events.push('dispose');}};
 const host={state:'ended',async enable(received){assert.equal(received,groves);events.push('enable');await job.promise;}};
 let current=true;
 return {job,events,host,groves,cancel(){current=false;},run:()=>mountEnsembleFamily({host,groves,preparePicture(received){assert.equal(received,groves);events.push('prepare');return candidate;},installPicture(received,mounted){assert.equal(received,candidate);assert.equal(mounted,groves);events.push('install');},isCurrent:()=>current})};
}
test('a candidate picture stays detached until a ready or suspended mount succeeds',async()=>{
 for(const state of ['ready','suspended']){
  const f=fixture(),pending=f.run();assert.deepEqual(f.events,['prepare','enable']);
  f.host.state=state;f.job.resolve();assert.equal(await pending,true);assert.deepEqual(f.events,['prepare','enable','install']);
 }
});
test('failure, cancelled generation and an unmounted host discard only the candidate',async()=>{
 const failed=fixture(),pending=failed.run();failed.job.reject(new Error('preparation failed'));await assert.rejects(pending,/preparation failed/);assert.deepEqual(failed.events,['prepare','enable','dispose']);
 for(const mode of ['cancelled','unmounted']){
  const f=fixture(),pending=f.run();f.host.state=mode==='cancelled'?'ready':'ended';if(mode==='cancelled')f.cancel();f.job.resolve();assert.equal(await pending,false);assert.deepEqual(f.events,['prepare','enable','dispose']);
 }
});
test('picture preparation failure cannot replace a completed audio passage',async()=>{
 let enabled=false;
 await assert.rejects(mountEnsembleFamily({host:{enable(){enabled=true;}},groves:[],preparePicture(){throw new Error('picture unavailable');},installPicture(){assert.fail();},isCurrent:()=>true}),/picture unavailable/);
 assert.equal(enabled,false);
});
