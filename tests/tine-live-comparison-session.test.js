import test from 'node:test';import assert from 'node:assert/strict';
import {createTineComparisonSession} from '../src/tine/live-comparison-session.js';
import {createTineDesign} from '../src/tine/address.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:0,strength:.1}],fadeStart:10000};
function fixture(){const jobs=[],session=createTineComparisonSession({createJob:input=>{let resolve,reject;const job={input,promise:new Promise((a,b)=>{resolve=a;reject=b;}),resolve,reject,cancel(){this.cancelled=true;}};jobs.push(job);return job;}});session.setSource(source);return {session,jobs};}
test('comparison failure and cancellation retain the prior pair; invalid draft does not cancel pending work',async()=>{
 const {session,jobs}=fixture();let pending=session.prepare({lengthMm:100,widthMm:10});jobs[0].resolve({tag:'first'});await pending;const first=session.current;
 pending=session.prepare({lengthMm:105,widthMm:10});await assert.rejects(session.prepare({lengthMm:999,widthMm:10}));assert.equal(jobs[1].cancelled,undefined);jobs[1].reject(Error('failed'));await pending;assert.equal(session.current,first);
 pending=session.prepare({lengthMm:110,widthMm:10});session.cancel();jobs[2].resolve({tag:'late'});await pending;assert.equal(session.current,first);
});
test('a new source invalidates the old pair and stale worker, preserving the new exact phrase',async()=>{
 const {session,jobs}=fixture();const pending=session.prepare({lengthMm:100,widthMm:10});session.setSource({...source,events:[{frame:99,strength:.1}]});jobs[0].resolve({tag:'old'});await pending;assert.equal(session.current,null);
 const next=session.prepare({lengthMm:105,widthMm:10});assert.equal(jobs[1].input.source.events[0].frame,99);jobs[1].resolve({tag:'new'});await next;assert.equal(session.current.tag,'new');
});
