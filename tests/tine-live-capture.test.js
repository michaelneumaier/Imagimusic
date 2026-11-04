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

test('paired staging validates and copies before silent commit; observers see both installed',async()=>{
 const {renderTineLiveRecord,tineLiveRecordFromFinished}=await import('../src/tine/live-record.js');
 const pcm=renderTineLiveRecord(tineLiveRecordFromFinished(finished));
 const observed=[];let a,b;
 a=createTineLiveCapture({onChange:()=>observed.push([a.current,b.current])});
 b=createTineLiveCapture({onChange:()=>observed.push([a.current,b.current])});
 const commitA=a.stage(pcm);
 assert.throws(()=>b.stage({...pcm,channels:[new Float32Array(1)]}),/Invalid/);
 assert.equal(a.current,null);assert.equal(b.current,null);assert.equal(observed.length,0);
 const commitB=b.stage(pcm),sample=pcm.channels[0][1];pcm.channels[0][1]=123;
 commitA();commitB();assert.equal(observed.length,0);
 a.publish();b.publish();assert.equal(observed.length,2);
 assert.ok(observed.every(([x,y])=>x===a.current&&y===b.current));
 assert.equal(a.current.channels[0][1],sample);assert.equal(b.current.channels[0][1],sample);
 assert.notEqual(a.current.channels[0],b.current.channels[0]);
 for(const value of [{...pcm,frames:3},{...pcm,seconds:NaN},{...pcm,sampleRate:44100},{...pcm,channels:[Float32Array.from({length:pcm.frames},()=>NaN)]}])assert.throws(()=>a.stage(value));
});

test('staged adoption retires pending work and delayed worker completion cannot replace it',async()=>{
 const {renderTineLiveRecord,tineLiveRecordFromFinished}=await import('../src/tine/live-record.js');
 const {capture,jobs,changes}=fixture(),pending=capture.accept(finished);
 const commit=capture.stage(renderTineLiveRecord(tineLiveRecordFromFinished(finished))),count=changes.length;
 commit();assert.equal(changes.length,count);assert.equal(jobs[0].cancelled,true);
 const adopted=capture.current;capture.publish();jobs[0].resolve({tag:'stale'});await pending;
 assert.equal(capture.current,adopted);assert.equal(capture.pending,false);
 commit();assert.equal(capture.current,adopted);
});
