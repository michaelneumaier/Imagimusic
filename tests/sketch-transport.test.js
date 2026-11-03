import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSketchPlayback,createSketchTransport,SKETCH_MIX_BOUND,SKETCH_MAX_ACTIVE} from '../src/sketch/transport.js';
const parameters={frequencies:[200],decays:[2],coefficients:[1,0]};
function fixture(){
 const nodes=[],copies=[];let resumes=0;
 const context={sampleRate:8000,currentTime:0,state:'running',destination:{},resume(){resumes++;},createBuffer:(count,frames,rate)=>({copyToChannel(samples){copies.push(samples.slice());}}),createGain:()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){this.disconnected=true;}}),createBufferSource(){const node={connect(){},disconnect(){this.disconnected=true;},start(time){this.started=time;},stop(time){this.stopped=time;}};nodes.push(node);return node;}};
 const prepared=prepareSketchPlayback(parameters,8000),transport=createSketchTransport(context,prepared);
 return {context,prepared,transport,nodes,copies,get resumes(){return resumes;}};
}
test('sketch preparation is silent, snapshots stay on the context clock, and individual/whole buffers agree',()=>{
 const f=fixture();assert.equal(f.resumes,0);assert.equal(f.nodes.length,0);assert.deepEqual(f.copies[0],f.copies[1]);
 f.context.state='suspended';assert.throws(()=>f.transport.activate(),/Start listening/);assert.equal(f.nodes.length,0);
 f.context.state='running';assert.equal(f.transport.activate({mode:0,strength:.5}).accepted,true);
 f.prepared.parameters.coefficients[0]=99;f.prepared.buffers[1].fill(99);
 f.context.currentTime=.125;const state=f.transport.snapshot(),expected=f.transport.sketch.modeState(0,.125,.5);
 assert.ok(Math.abs(state.modes[0].displacement-expected.displacement)<1e-12);assert.ok(Math.abs(state.modes[0].envelope-expected.envelope)<1e-12);
 assert.equal(state.time,.125);assert.ok(f.copies[1].every(x=>Math.abs(x)<=.25));
 f.transport.dispose();assert.throws(()=>f.transport.activate(),/disposed/);
});
test('overlap admission retains reservations through Quiet and ignores stale completion callbacks',()=>{
 const f=fixture();for(let i=0;i<3;i++)assert.equal(f.transport.activate({strength:1}).accepted,true);
 assert.equal(f.transport.activate({strength:1}).reason,'headroom');assert.ok(f.transport.snapshot().allocatedBound<=SKETCH_MIX_BOUND);
 const oldEnded=f.nodes[0].onended;f.transport.quiet();f.transport.quiet();
 assert.equal(f.transport.activate({strength:1}).reason,'headroom');
 f.context.currentTime=.0125;assert.ok(f.transport.snapshot().modes[0].envelope<1.5);
 f.context.currentTime=.031;assert.equal(f.transport.snapshot().active,0);assert.equal(f.transport.activate({strength:1}).accepted,true);
 oldEnded();assert.equal(f.transport.snapshot().active,1);
 f.context.currentTime=4.04;assert.equal(f.transport.snapshot().active,0);assert.equal(f.transport.snapshot().allocatedBound,0);
});
test('node count, zero activations, failed starts and malformed preparation are bounded',()=>{
 const f=fixture();assert.equal(f.transport.activate({strength:0}).reason,'zero-strength');
 for(let i=0;i<SKETCH_MAX_ACTIVE;i++)assert.equal(f.transport.activate({strength:.001}).accepted,true);
 assert.equal(f.transport.activate({strength:.001}).reason,'voice-count');f.transport.dispose();
 const g=fixture();g.context.createBufferSource=()=>({connect(){},disconnect(){},stop(){},start(){throw Error('start failed');}});
 assert.throws(()=>g.transport.activate(),/start failed/);assert.equal(g.transport.snapshot().active,0);
 const bad=prepareSketchPlayback(parameters,8000);bad.buffers[0][0]=2;assert.throws(()=>createSketchTransport(g.context,bad),/PCM/);
 const wrong=prepareSketchPlayback(parameters,8000);wrong.sampleRate=16000;assert.throws(()=>createSketchTransport(g.context,wrong),/context/);
});
