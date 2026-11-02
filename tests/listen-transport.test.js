import test from 'node:test';
import assert from 'node:assert/strict';
import {createListeningTransport} from '../src/listen/transport.js';
function fixture(){
 const nodes=[],jobs=[],changes=[],gainValues=[];
 const context={currentTime:0,sampleRate:48000,destination:{},resume:async()=>{},close(){},createBuffer:()=>({copyToChannel(){}}),createGain:()=>({gain:{cancelScheduledValues(){},setValueAtTime(value,time){gainValues.push({value,time});},linearRampToValueAtTime(){}},connect(){},disconnect(){}}),createBufferSource(){const node={connect(){},disconnect(){},start(...args){this.started=args;},stop(){this.stopped=true;}};nodes.push(node);return node;}};
 const prepare=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});const job={promise,resolve,reject,cancel(){this.cancelled=true;reject(new Error('cancelled'));}};jobs.push(job);return job;};
 const transport=createListeningTransport({createContext:()=>context,prepare,onChange:c=>changes.push(c)});
 const pcm={channels:[new Float32Array(48000*3),new Float32Array(48000*3)],sampleRate:48000};
 return {transport,context,nodes,jobs,changes,pcm,gainValues};
}
test('superseded preparation cannot start or replace the selected passage',async()=>{
 const f=fixture();f.transport.select(3);const first=f.transport.play({});await Promise.resolve();assert.equal(f.jobs.length,1);
 f.transport.select(4);assert.equal(f.jobs[0].cancelled,true);await first;assert.equal(f.nodes.length,0);assert.equal(f.transport.pcm,null);
 const second=f.transport.play({});await Promise.resolve();f.jobs[1].resolve(f.pcm);await second;assert.equal(f.nodes.length,1);assert.equal(f.transport.state,'playing');
});
test('audio clock, pause, seek, resume, old source ending and replay preserve the selected timeline',async()=>{
 const f=fixture();f.transport.select(3);const playing=f.transport.play({});await Promise.resolve();f.jobs[0].resolve(f.pcm);await playing;
 f.context.currentTime=1.035;assert.ok(Math.abs(f.transport.time()-1)<1e-12);f.transport.stop();assert.ok(Math.abs(f.transport.time()-1)<1e-12);
 f.context.currentTime=2;await f.transport.play({});assert.equal(f.jobs.length,1);assert.ok(Math.abs(f.nodes[1].started[1]-1)<1e-12);assert.ok(Math.abs(f.transport.time()-1)<1e-12);
 f.nodes[0].onended();assert.equal(f.transport.state,'playing');
 f.transport.seek(2.5);assert.equal(f.transport.time(),2.5);await f.transport.play({});assert.equal(f.nodes[2].started[1],2.5);
 f.nodes[2].onended();assert.equal(f.transport.state,'ended');assert.equal(f.transport.time(),3);
 await f.transport.play({});assert.equal(f.nodes[3].started[1],0);
});
test('a preparation error is surfaced and retry can render again',async()=>{
 const f=fixture();f.transport.select(3);const playing=f.transport.play({});await Promise.resolve();f.jobs[0].reject(new Error('render failed'));await assert.rejects(playing,/render failed/);assert.equal(f.transport.state,'error');
 const retry=f.transport.play({});await Promise.resolve();f.jobs[1].resolve(f.pcm);await retry;assert.equal(f.transport.state,'playing');
});

test('quiet during the attack releases from the scheduled ramp value without jumping to full gain',async()=>{
 const f=fixture();f.transport.select(3);const playing=f.transport.play({});await Promise.resolve();f.jobs[0].resolve(f.pcm);await playing;
 f.context.currentTime=.01;f.transport.stop();assert.ok(Math.abs(f.gainValues.at(-1).value-.2)<1e-12);assert.equal(f.gainValues.at(-1).time,.01);
});

test('a restored listening place remains silent until explicit play and starts at that offset',async()=>{
 const f=fixture();f.transport.select(3);f.transport.seek(1.2);
 assert.equal(f.transport.state,'idle');assert.equal(f.transport.time(),1.2);assert.equal(f.jobs.length,0);assert.equal(f.nodes.length,0);
 const playing=f.transport.play({});await Promise.resolve();f.jobs[0].resolve(f.pcm);await playing;
 assert.equal(f.nodes[0].started[1],1.2);assert.equal(f.transport.state,'playing');
});
