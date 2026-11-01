import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchSession,renderTouchRecording,holdVelocity} from '../src/touch/session.js';
test('a new gesture never changes earlier gains and dense impulses are refused before clipping',()=>{
 const session=createTouchSession();const first=session.strike({frame:0,body:0,velocity:1});assert.equal(first.accepted,true);
 const saved=session.snapshot();let refused=false;
 for(let i=1;i<30;i++){const result=session.strike({frame:i,body:0,velocity:1});if(!result.accepted){assert.equal(result.reason,'headroom');refused=true;break;}}
 assert.ok(refused);assert.equal(session.snapshot().outputGain,saved.outputGain);assert.deepEqual(session.snapshot().events[0],saved.events[0]);
 saved.events[0].velocity=0;assert.equal(session.snapshot().events[0].velocity,1);
 assert.equal(session.strike({frame:48000*30,body:1,velocity:.5}).accepted,true);
});
test('saved impulses retain exact onset frames and the recorded quiet fade',()=>{
 const session=createTouchSession(undefined,8000);session.strike({frame:0,body:0,velocity:.5});session.strike({frame:2,body:1,velocity:.25});
 const bank=[{sampleRate:8000,channels:[new Float32Array([1,2,3,4,5,6]),new Float32Array([2,4,6,8,10,12])]},{sampleRate:8000,channels:[new Float32Array([4,4,4,4]),new Float32Array([8,8,8,8])]}];
 const pcm=renderTouchRecording(session.finish(3,2),bank);
 assert.deepEqual([...pcm.channels[0]],[.5,1,2.5,3,1.75]);assert.deepEqual([...pcm.channels[1]],[1,2,5,6,3.5]);
 assert.equal(session.strike({frame:20,body:0,velocity:1}).reason,'ended');
});
test('hold force is bounded, and reverse visual sampling is stable',()=>{
 assert.equal(holdVelocity(0),.25);assert.equal(holdVelocity(600),1);assert.equal(holdVelocity(6000),1);
 const session=createTouchSession();session.strike({frame:0,body:0,velocity:.8});const pose=session.visual(.4);session.visual(12);assert.deepEqual(session.visual(.4),pose);
 session.finish(48000);assert.deepEqual(session.visual(2).envelope,[0,0]);
});

test('saved multi-position impulses validate the selected buffer rather than substituting the visible body',async()=>{
 const {mixImpulseRecording}=await import('../src/touch/session.js');const bank=[{sampleRate:8000,channels:[Float32Array.of(.2),Float32Array.of(.3)]}];const recording={sampleRate:8000,events:[{frame:0,body:0,bufferIndex:1,velocity:1}],ended:null};
 assert.throws(()=>mixImpulseRecording(recording,bank),/buffer index/);
 recording.events[0].bufferIndex=-1;assert.throws(()=>mixImpulseRecording(recording,bank),/buffer index/);
});
