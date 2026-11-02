import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';
import {createInverseTransport} from '../src/inverse/transport.js';
const instrument=createInverseInstrument(composeGrove({seed:3}),{sampleRate:8000});
const prepared={...instrument,strikes:[0,1,2].map(body=>instrument.renderStrike(body))};
function setup(){
 const nodes=[];
 const context={sampleRate:8000,currentTime:0,state:'running',destination:{},createBuffer:()=>({copyToChannel(){}}),createBufferSource(){const node={connect(){},disconnect(){this.disconnected=true;},start(t){this.started=t;},stop(){this.stopped=true;this.onended?.();}};nodes.push(node);return node;}};
 return {context,nodes,transport:createInverseTransport(context)};
}
test('mount is silent, strikes share the observed clock, overlap is capped and Quiet clears sound and picture',()=>{
 const {transport,context,nodes}=setup();transport.mount(prepared);assert.equal(nodes.length,0);
 context.currentTime=2;assert.equal(transport.strike(1),true);assert.equal(nodes[0].started,2);
 context.currentTime=2.25;const state=transport.snapshot();assert.equal(state.strikes[0].age,.25);assert.deepEqual(state.strikes[0].displacement,instrument.frame(1,.25).displacement);
 for(let i=1;i<8;i++)assert.equal(transport.strike(i%3),true);
 assert.equal(transport.strike(0),false);assert.equal(nodes.length,8);
 assert.throws(()=>transport.mount(prepared),/Quiet/);
 transport.quiet();assert.ok(nodes.every(node=>node.stopped&&node.disconnected));assert.equal(transport.snapshot().active,0);
 transport.mount(prepared);assert.equal(nodes.length,8);transport.dispose();transport.dispose();assert.throws(()=>transport.strike(0),/disposed/);
});
test('clock expiry and ended callbacks release slots; suspended contexts and malformed replacements preserve the old candidate',()=>{
 const {transport,context,nodes}=setup();transport.mount(prepared);context.state='suspended';assert.throws(()=>transport.strike(0),/Start listening/);assert.equal(nodes.length,0);
 context.state='running';transport.strike(2);nodes[0].onended();assert.equal(transport.snapshot().active,0);
 transport.strike(0);context.currentTime=instrument.duration;assert.equal(transport.snapshot().active,0);assert.ok(nodes[1].disconnected);
 assert.throws(()=>transport.mount({...prepared,sampleRate:48000}),/does not match/);
 const corrupt={...prepared,strikes:prepared.strikes.map((s,i)=>i? s:{...s,channels:[Float32Array.from(s.channels[0],()=>NaN),s.channels[1]]})};
 assert.throws(()=>transport.mount(corrupt),/output bound/);assert.equal(transport.strike(0),true);assert.throws(()=>transport.strike(3),/Strike body/);transport.quiet();
});
