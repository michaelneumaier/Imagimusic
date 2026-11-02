import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleContinuationSource} from '../src/grove/ensemble-continuation-source.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('source is retained independently, with input, job, result and getter mutations isolated',async()=>{
 const input={gesture:{velocity:.5}},metadata={plan:[{frame:0}]};let rate;
 const session=createEnsembleContinuationSource({prepareSource:async(record,options)=>{rate=options.sampleRate;record.gesture.velocity=1;return metadata;}});
 const pending=session.prepare(input,{origin:'demonstration',sampleRate:48000});input.gesture.velocity=.1;
 const returned=await pending;returned.record.gesture.velocity=.2;returned.prepared.plan[0].frame=99;metadata.plan[0].frame=42;
 const read=session.source;read.record.gesture.velocity=.3;
 assert.deepEqual(session.source,{record:{gesture:{velocity:.5}},origin:'demonstration',prepared:{plan:[{frame:0}]}});assert.equal(rate,48000);assert.equal(session.state,'ready');
});
test('failed or cancelled candidate preserves the previously validated original',async()=>{
 const jobs=[];const session=createEnsembleContinuationSource({prepareSource:(_,options)=>{const job=deferred();jobs.push({...job,signal:options.signal});return job.promise;}});
 const first=session.prepare({name:'original'},{origin:'personal'});jobs[0].resolve({plan:[]});await first;const retained=session.source;
 const failed=session.prepare({name:'invalid'});jobs[1].reject(new Error('wrong kind'));await assert.rejects(failed,/wrong kind/);assert.deepEqual(session.source,retained);
 const cancelled=session.prepare({name:'cancelled'});session.cancel();assert.equal(jobs[2].signal.aborted,true);jobs[2].resolve({plan:[]});await assert.rejects(cancelled,{name:'AbortError'});
 assert.equal(session.state,'ready');assert.deepEqual(session.source,retained);
});
test('a later successful candidate wins over a stale success or failure',async()=>{
 const jobs=[];const session=createEnsembleContinuationSource({prepareSource:()=>{const job=deferred();jobs.push(job);return job.promise;}});
 const first=session.prepare({name:'old'}),second=session.prepare({name:'current'});
 jobs[1].resolve({plan:[2]});await second;jobs[0].resolve({plan:[1]});await assert.rejects(first,{name:'AbortError'});assert.equal(session.source.record.name,'current');
 const third=session.prepare({name:'stale'});session.cancel();jobs[2].reject(new Error('late failure'));await assert.rejects(third,{name:'AbortError'});assert.equal(session.state,'ready');assert.equal(session.source.record.name,'current');
});
test('invalid caller input leaves an active candidate intact; explicit clear cancels and removes the source',async()=>{
 const job=deferred();let signal;const session=createEnsembleContinuationSource({prepareSource:(_,options)=>{signal=options.signal;return job.promise;}});
 const pending=session.prepare({name:'candidate'});
 await assert.rejects(session.prepare({},{origin:'invented'}),/origin/);await assert.rejects(session.prepare({},{sampleRate:1}),/sample rate/);await assert.rejects(session.prepare({fn(){}}));assert.equal(signal.aborted,false);
 session.clear();assert.equal(signal.aborted,true);job.resolve({plan:[]});await assert.rejects(pending,{name:'AbortError'});assert.equal(session.source,null);assert.equal(session.state,'idle');
});
test('dispose suppresses delayed callbacks and unusable results never replace an original',async()=>{
 let result={plan:[]};const changes=[];const session=createEnsembleContinuationSource({prepareSource:async()=>result,onChange:change=>changes.push(change)});
 await session.prepare({name:'original'});result=null;await assert.rejects(session.prepare({name:'bad'}),/no result/);assert.equal(session.source.record.name,'original');
 const pending=session.prepare({name:'departing'});session.dispose();const count=changes.length;await assert.rejects(pending,{name:'AbortError'});assert.equal(changes.length,count);assert.equal(session.source,null);assert.equal(session.state,'disposed');await assert.rejects(session.prepare({}),/closed/);
});
