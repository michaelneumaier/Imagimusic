import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestImportSession} from '../src/grove/rest-import-session.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('a cancelled file read never starts reconstruction',async()=>{
 const reading=deferred();let jobs=0;const session=createRestImportSession({read:()=>reading.promise,prepare:()=>{jobs++;}});
 const pending=session.open({});const rejected=assert.rejects(pending,{name:'AbortError'});session.cancel();reading.resolve({name:'old',text:'old'});await rejected;assert.equal(jobs,0);assert.equal(session.result,null);
});
test('superseded workers and failures preserve the last successful passage',async()=>{
 const jobs=[];const session=createRestImportSession({read:async file=>file,prepare:(data,{signal})=>{const job=deferred();jobs.push({...job,signal});return job.promise;}});
 const first=session.open({name:'first',text:'first'});await Promise.resolve();jobs[0].resolve({record:1});await first;
 const old=session.result,pending=session.open({name:'stale',text:'stale'}),cancelled=assert.rejects(pending,{name:'AbortError'});await Promise.resolve();
 const next=session.open({name:'chosen',text:'chosen'});await Promise.resolve();assert.equal(jobs[1].signal.aborted,true);jobs[2].resolve({record:3});await next;jobs[1].resolve({record:2});await cancelled;
 assert.equal(session.result.name,'chosen');assert.notEqual(session.result,old);
 const failure=session.open({name:'bad',text:'bad'}),rejected=assert.rejects(failure,/invalid/);await Promise.resolve();jobs[3].reject(new Error('invalid'));await rejected;assert.equal(session.result.name,'chosen');
});
test('dispose cancels reconstruction and suppresses publication',async()=>{
 const job=deferred();let changes=0;const session=createRestImportSession({read:async()=>({name:'x',text:'x'}),prepare:()=>job.promise,onChange:()=>changes++});
 const pending=session.open({}),rejected=assert.rejects(pending,{name:'AbortError'});await Promise.resolve();session.dispose();const count=changes;job.resolve({record:1});await rejected;assert.equal(changes,count);assert.equal(session.result,null);
});
