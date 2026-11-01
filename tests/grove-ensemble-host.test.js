import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {createEnsembleHost} from '../src/grove/ensemble-host.js';
const grove=composeGrove({seed:3}),groves=[grove,grove,grove],recipe=createGroveRestRecipe(grove,{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000}),recipes=[recipe,recipe,recipe];
function fixture(overrides={}){
 const nodes=[],contexts=[],decisions=[];
 const host=createEnsembleHost({createContext:()=>{const c={sampleRate:8000,currentTime:1,state:'suspended',destination:{},audioWorklet:{addModule:async()=>{}},async resume(){this.state='running';},async close(){this.state='closed';}};contexts.push(c);return c;},prepareRecipes:async()=>({recipes}),renderRecord:async({record})=>({pcm:renderEnsembleRecord(record)}),createNode:(_,options)=>{const n={options,sent:[],port:{postMessage:data=>n.sent.push(data),close(){n.closed=true;}},connect(){},disconnect(){n.detached=true;}};nodes.push(n);return n;},onDecision:ack=>decisions.push(ack),...overrides});
 return {host,nodes,contexts,decisions};
}
function complete(node,{empty=false}={}){
 const generation=node.options.processorOptions.generation,ended={frame:9000,fadeFrames:8};
 const emit=data=>node.port.onmessage({data:{generation,...data}});
 const events=[0,1,2].map(part=>{const commands=part===1&&!empty?[{id:'strike',frame:8000,kind:'strike',body:0,position:0,velocity:.5}]:[];commands.push({id:'quiet',frame:9000,kind:'quiet',fadeFrames:8});return commands.map((event,order)=>({id:event.id,event,order,requestedFrame:event.frame,appliedFrame:event.frame,lateByFrames:0,accepted:true}));});
 events.forEach((events,part)=>emit({type:'processed',part,events}));
 emit({type:'finished',frame:9008,ended,origin:empty?null:8000,parts:events.map((e,part)=>({part,accepted:e.length,refused:0,ended}))});
}
test('one node shares rate and lead, keeps actual decisions, preserves silent parts, and renders the saved ensemble',async()=>{
 const {host,nodes,contexts,decisions}=fixture();await host.enable(groves);assert.equal(contexts.length,1);assert.equal(host.state,'ready');assert.equal(nodes[0].options.processorOptions.postAudio,false);
 host.send(2,{kind:'strike',body:0,position:0,velocity:.5});assert.equal(nodes[0].sent[0].part,2);assert.equal(nodes[0].sent[0].events[0].frame,8280);assert.equal(host.stats[2].strikes,0);
 const stale=nodes[0].port.onmessage;complete(nodes[0]);const record=host.recording();assert.equal(host.state,'ended');assert.deepEqual(record.parts.map(p=>p.silent),[true,false,true]);assert.equal(record.parts[1].record.events[0].frame,0);assert.equal(record.ended.frame,1000);assert.equal(decisions.length,4);assert.equal((await host.saveAudio()).channels[0].length,1008);
 record.parts[1].record.events[0].velocity=1;assert.equal(host.recording().parts[1].record.events[0].velocity,.5);
 await host.enable(groves);stale({data:{generation:'1',type:'error',message:'old'}});assert.equal(host.state,'ready');assert.equal(host.hasRecording,false);host.dispose();
});
test('Quiet cancels preparation and stale workers cannot mount',async()=>{
 const pending=[];const {host,nodes,contexts}=fixture({prepareRecipes:(_,options)=>new Promise(resolve=>pending.push({resolve,signal:options.signal}))});
 const opening=host.enable(groves);assert.equal(host.quiet().reason,'cancelled');assert.equal(pending[0].signal.aborted,true);pending[0].resolve({recipes});await opening;assert.equal(nodes.length,0);assert.equal(contexts[0].state,'closed');assert.equal(host.state,'idle');host.dispose();
});
test('a failed new beginning keeps the completed record and can still rebuild audio',async()=>{
 let count=0;const {host,nodes}=fixture({prepareRecipes:async()=>{if(count++)throw new Error('preparation broke');return {recipes};}});
 await host.enable(groves);complete(nodes[0]);const record=host.recording();await assert.rejects(host.enable(groves),/preparation broke/);assert.equal(host.state,'ended');assert.deepEqual(host.recording(),record);assert.equal((await host.saveAudio()).channels[0].length,1008);host.dispose();
});
test('processor failure invalidates the whole passage; even a retained message handler cannot finish it afterward',async()=>{
 const {host,nodes,contexts}=fixture();await host.enable(groves);const message=nodes[0].port.onmessage;
 message({data:{generation:'1',type:'error',message:'part 2 failed'}});assert.equal(host.state,'error');assert.equal(contexts[0].state,'closed');assert.throws(()=>host.recording(),/part 2/);
 message({data:{generation:'1',type:'finished'}});assert.equal(host.state,'error');assert.equal(host.send(0,{kind:'strike'}).queued,false);host.dispose();
});
test('Quiet without any effective gesture ends without inventing a recording; park never resumes audio',async()=>{
 const {host,nodes,contexts}=fixture();await host.enable(groves);host.quiet();assert.equal(nodes[0].sent[0].part,0);complete(nodes[0],{empty:true});assert.equal(host.state,'ended');assert.equal(host.hasRecording,false);assert.throws(()=>host.recording(),/Finish a passage/);host.park();assert.equal(host.state,'idle');assert.equal(contexts[0].state,'closed');host.dispose();await assert.rejects(host.enable(groves),/closed/);
});
test('park preserves a completed record and cancels an outstanding render',async()=>{
 let resolve;const {host,nodes}=fixture({renderRecord:()=>new Promise(r=>resolve=r)});await host.enable(groves);complete(nodes[0]);const record=host.recording(),rendering=host.saveAudio();host.park();resolve({pcm:{channels:[]}});await assert.rejects(rendering,/Passage changed/);assert.deepEqual(host.recording(),record);assert.equal(host.state,'ended');host.dispose();
});

test('invalid local gestures are refused without ending the live passage',async()=>{
 const {host,nodes}=fixture();await host.enable(groves);
 for(const command of [null,{kind:'strike',body:99,position:0,velocity:.5},{kind:'contact',body:0,zone:999,strength:1},{kind:'quiet',fadeFrames:0},{kind:'strike',body:0,position:0,velocity:NaN}])assert.equal(host.send(0,command).reason,'invalid-command');
 assert.equal(nodes[0].sent.length,0);assert.equal(host.state,'ready');host.dispose();
});
