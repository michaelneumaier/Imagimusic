import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';
import {createInverseTransport,INVERSE_MAX_LISTENING_LEVEL,INVERSE_MAX_STRIKES} from '../src/inverse/transport.js';
const instrument=createInverseInstrument(composeGrove({seed:3}),{sampleRate:8000});
const prepared={...instrument,strikes:[0,1,2].map(body=>instrument.renderStrike(body))};
function setup(){
 const nodes=[],automation=[];const output={gain:{value:0,cancelScheduledValues:t=>automation.push(['cancel',t]),setValueAtTime:(v,t)=>automation.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>automation.push(['ramp',v,t])},connect(destination){this.destination=destination;},disconnect(){this.disconnected=true;}};
 const context={sampleRate:8000,currentTime:0,state:'running',destination:{},createGain:()=>output,createBuffer:()=>({copyToChannel(){}}),createBufferSource(){const node={connect(destination){this.destination=destination;},disconnect(){this.disconnected=true;},start(t){this.started=t;},stop(){this.stopped=true;this.onended?.();}};nodes.push(node);return node;}};
 return {context,nodes,output,automation,transport:createInverseTransport(context)};
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

test('one shared listening level preserves model responses, remains across mounts, and has bounded digital headroom',()=>{
 const {transport,context,nodes,output,automation}=setup();assert.equal(transport.listeningLevel,1);assert.equal(output.gain.value,1);
 transport.setListeningLevel(4);assert.deepEqual(automation,[['cancel',0],['set',4,0]]);
 transport.mount(prepared);transport.strike(1);assert.equal(nodes[0].destination,output);assert.equal(output.destination,context.destination);
 assert.deepEqual(transport.snapshot().strikes[0].envelope,instrument.frame(1,0).envelope);
 transport.quiet();transport.mount(prepared);assert.equal(transport.listeningLevel,4);
 assert.ok(instrument.singleStrikePeakBound*INVERSE_MAX_STRIKES*INVERSE_MAX_LISTENING_LEVEL<.51);
 const count=automation.length;for(const value of [-1,4.01,NaN,Infinity,'2'])assert.throws(()=>transport.setListeningLevel(value),/0..4/);
 assert.equal(automation.length,count);assert.equal(transport.listeningLevel,4);
 transport.dispose();assert.equal(output.disconnected,true);assert.throws(()=>transport.setListeningLevel(1),/disposed/);
});
test('rapid live level changes continue from the interpolated gain; quiet and suspended changes are immediate',()=>{
 const {transport,context,automation}=setup();transport.mount(prepared);transport.strike(0);
 transport.setListeningLevel(4);assert.deepEqual(automation.slice(-3),[['cancel',0],['set',1,0],['ramp',4,.03]]);
 context.currentTime=.015;transport.setListeningLevel(0);
 assert.deepEqual(automation.slice(-3),[['cancel',.015],['set',2.5,.015],['ramp',0,.045]]);
 context.currentTime=.03;transport.setListeningLevel(1);
 assert.ok(Math.abs(automation.at(-2)[1]-1.25)<1e-12);
 context.state='suspended';const before=automation.length;transport.setListeningLevel(0);
 assert.equal(automation.length,before+2);assert.deepEqual(automation.at(-1),['set',0,.03]);
});

test('shared gestures reserve future slots, use one audio origin, and show only started responses',()=>{
 const {transport,context,nodes,automation}=setup();transport.mount(prepared);context.currentTime=10;
 const origin=transport.playGesture([{body:0,at:0},{body:2,at:1.5},{body:1,at:3}]);
 assert.equal(origin,10.03);assert.deepEqual(nodes.map(n=>n.started),[10.03,11.53,13.03]);
 assert.deepEqual(transport.snapshot(),{time:10,active:0,pending:3,strikes:[]});
 assert.throws(()=>transport.mount(prepared),/Quiet/);assert.throws(()=>transport.playGesture([{body:0,at:0}]),/quiet/);
 transport.setListeningLevel(2);assert.deepEqual(automation.slice(-2),[['cancel',10],['set',2,10]]);
 context.currentTime=origin+.5;const state=transport.snapshot();assert.equal(state.active,1);assert.equal(state.pending,2);assert.equal(state.strikes[0].age,.5);
 assert.deepEqual(state.strikes[0].displacement,instrument.frame(0,.5).displacement);
 for(let i=0;i<5;i++)assert.equal(transport.strike(i%3),true);
 assert.equal(transport.strike(0),false);assert.equal(nodes.length,8);
 transport.quiet();assert.ok(nodes.every(n=>n.stopped&&n.disconnected));assert.deepEqual(transport.snapshot(),{time:origin+.5,active:0,pending:0,strikes:[]});
 context.currentTime=origin+4;assert.equal(transport.snapshot().active,0);
});
test('gesture validation and suspended state create no sources, and a failed start rolls back every phrase source',()=>{
 const {transport,context,nodes}=setup();transport.mount(prepared);
 for(const events of [[],new Array(2),Array.from({length:9},()=>({body:0,at:0})),[{body:0,at:9}],[{body:3,at:0}],[{body:0,at:NaN}],[{body:0,at:1},{body:1,at:0}]])assert.throws(()=>transport.playGesture(events),RangeError);
 assert.equal(nodes.length,0);context.state='suspended';assert.throws(()=>transport.playGesture([{body:0,at:0}]),/Start listening/);assert.equal(nodes.length,0);context.state='running';
 const create=context.createBufferSource;
 context.createBufferSource=()=>{const node=create();if(nodes.length===2)node.start=()=>{throw new Error('start failed');};return node;};
 assert.throws(()=>transport.playGesture([{body:0,at:0},{body:1,at:1},{body:2,at:2}]),/start failed/);
 assert.equal(nodes.length,3);assert.ok(nodes.every(n=>n.stopped&&n.disconnected));assert.equal(transport.snapshot().pending,0);assert.equal(transport.snapshot().active,0);
 context.createBufferSource=create;assert.equal(transport.strike(1),true);transport.quiet();
});

test('manual touch receipts name the actual scheduled origin, not the caller clock before source creation',()=>{
 const {transport,context,nodes}=setup();transport.mount(prepared);context.currentTime=4;
 const create=context.createBufferSource;context.createBufferSource=()=>{context.currentTime+=.016;return create();};
 const receipt=transport.strikeWithReceipt(2);
 assert.deepEqual(receipt,{body:2,time:4.016});assert.equal(receipt.time,nodes[0].started);assert.ok(Object.isFrozen(receipt));
 context.currentTime=5;assert.equal(receipt.time,4.016);
 for(let i=0;i<7;i++)assert.ok(transport.strikeWithReceipt(i%3));
 assert.equal(transport.strikeWithReceipt(0),null);assert.equal(nodes.length,8);
 transport.quiet();context.state='suspended';assert.throws(()=>transport.strikeWithReceipt(0),/Start listening/);
 assert.throws(()=>transport.strikeWithReceipt(3),/Strike body/);assert.equal(nodes.length,8);
 context.state='running';assert.equal(transport.strike(0),true);transport.dispose();
});
