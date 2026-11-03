import test from 'node:test';import assert from 'node:assert/strict';
import {createTineLiveCapture} from '../src/tine/live-capture.js';
import {createTineDesign} from '../src/tine/address.js';
const finished={design:createTineDesign(),sampleRate:48000,snapshot:{state:'ended',started:true,frame:1200,endFrame:1200,fadeStart:0,fadeFrames:1200,events:[{frame:0,strength:.1}]}};
function fixture(){const jobs=[],changes=[],capture=createTineLiveCapture({onChange:e=>changes.push(e),createJob:()=>{let resolve,reject;const job={promise:new Promise((a,b)=>{resolve=a;reject=b;}),cancel(){this.cancelled=true;},resolve,reject};jobs.push(job);return job;}});return {capture,jobs,changes};}
test('prior completed pass survives pending, failure and cancellation; stale success cannot replace it',async()=>{
 const {capture,jobs}=fixture();let pending=capture.accept(finished);const first={tag:'first'};jobs[0].resolve(first);await pending;
 pending=capture.accept(finished);assert.equal(capture.current,first);jobs[1].reject(Error('failed'));await pending;assert.equal(capture.current,first);
 pending=capture.accept(finished);capture.cancel();jobs[2].resolve({tag:'stale'});await pending;assert.equal(capture.current,first);assert.equal(capture.pending,false);
});
test('later completed preparation wins, and malformed finish does not cancel valid preparation',async()=>{
 const {capture,jobs}=fixture();const first=capture.accept(finished);await assert.rejects(capture.accept({...finished,snapshot:{}}));assert.equal(jobs[0].cancelled,undefined);
 const second=capture.accept(finished),latest={tag:'latest'};jobs[1].resolve(latest);await second;jobs[0].resolve({tag:'old'});await first;assert.equal(capture.current,latest);
});
