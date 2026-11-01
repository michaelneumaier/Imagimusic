import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchTransport} from '../src/touch/transport.js';
function fake(){
 const nodes=[],gains=[],context={sampleRate:8000,currentTime:1,state:'running',destination:{},async resume(){},close(){},createBuffer:(_c,n)=>({copyToChannel(){},length:n}),createGain(){const events=[],node={gain:{value:1,setValueAtTime:(v,t)=>events.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>events.push(['ramp',v,t])},connect(){},disconnect(){},events};gains.push(node);return node;},createBufferSource(){const node={connect(){},disconnect(){},start(...args){node.started=args;},stop(...args){node.stopped=args;}};nodes.push(node);return node;}};
 const bank=[0,1].map(()=>({sampleRate:8000,channels:[new Float32Array(100),new Float32Array(100)]}));
 return {context,nodes,gains,bank};
}
test('live impulses use captured sample-aligned times and Quiet is recorded at the bus fade',async()=>{
 const {context,nodes,gains,bank}=fake(),transport=createTouchTransport({createContext:()=>context,prepare:()=>({promise:Promise.resolve(bank),cancel(){}})});
 await transport.enable({});transport.strike(0,.5);context.currentTime=1.12345;transport.strike(1,.7);
 const record=transport.recording();assert.equal(record.events[0].frame,0);assert.equal(record.events[1].frame,988);
 assert.equal(nodes[1].started[0],nodes[0].started[0]+988/8000);assert.equal(gains[2].gain.value,.7);
 context.currentTime=1.23456;transport.quiet();const end=transport.recording().ended;
 assert.equal(end.frame,1677);assert.equal(gains[0].events[0][2],nodes[0].started[0]+end.frame/8000);assert.equal(transport.state,'ended');
 transport.newPassage();assert.equal(transport.recording().events.length,0);assert.equal(transport.state,'ready');
});
test('superseded bank preparation cannot replace the newer instrument',async()=>{
 const {context,bank}=fake(),requests=[];
 const transport=createTouchTransport({createContext:()=>context,prepare:()=>{let resolve;const promise=new Promise(r=>resolve=r);requests.push(resolve);return {promise,cancel(){}};}});
 const first=transport.enable({frequency:180});await Promise.resolve();const second=transport.enable({frequency:240});await Promise.resolve();requests[1](bank);await second;requests[0](bank);await first;
 assert.equal(transport.recording().settings.frequency,240);assert.equal(transport.state,'ready');
});

test('an interrupted context resumes the existing capture rather than discarding it',async()=>{
 const {context,bank,nodes}=fake();context.resume=async()=>{context.state='running';context.onstatechange?.();};
 const transport=createTouchTransport({createContext:()=>context,prepare:()=>({promise:Promise.resolve(bank),cancel(){}})});
 await transport.enable({});transport.strike(0,.5);const first=transport.recording().events[0];
 context.state='interrupted';context.onstatechange();assert.equal(transport.state,'suspended');assert.equal(transport.strike(1,.5).accepted,false);
 await transport.resume();assert.equal(transport.state,'playing');assert.deepEqual(transport.recording().events,[first]);
 context.currentTime+=.5;transport.strike(1,.5);assert.equal(transport.recording().events[1].frame,4000);assert.equal(nodes.length,2);
});

test('a finite authored sequence is validated before playback and keeps its exact scheduled frames',async()=>{
 const {context,bank,nodes}=fake();const transport=createTouchTransport({createContext:()=>context,prepare:()=>({promise:Promise.resolve(bank),cancel(){}})});
 await transport.enable({});const record=transport.playSequence([{frame:280,body:0,velocity:.7},{frame:12000,body:1,velocity:.6}]);
 assert.equal(record.events.length,2);assert.ok(Math.abs(nodes[1].started[0]-nodes[0].started[0]-(12000-280)/8000)<1e-12);
 assert.throws(()=>transport.playSequence([{frame:0,body:9,velocity:1}]),/Invalid/);assert.equal(transport.recording().events.length,2);assert.equal(nodes.length,2);
 context.currentTime=1.1;transport.quiet();assert.equal(transport.recording().ended.frame,520);
});
