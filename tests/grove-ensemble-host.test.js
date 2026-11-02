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
 const host=createEnsembleHost({createListeningStage:()=>({input:{},output:{connect(){}},setDb(){},dispose(){}}),createContext:()=>{const c={sampleRate:8000,currentTime:1,state:'suspended',destination:{},audioWorklet:{addModule:async()=>{}},async resume(){this.state='running';},async close(){this.state='closed';}};contexts.push(c);return c;},prepareRecipes:async()=>({recipes}),renderRecord:async({record})=>({pcm:renderEnsembleRecord(record)}),createNode:(_,options)=>{const n={options,sent:[],port:{postMessage:data=>n.sent.push(data),close(){n.closed=true;}},connect(){},disconnect(){n.detached=true;}};nodes.push(n);return n;},onDecision:ack=>decisions.push(ack),...overrides});
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

test('listening gain is downstream and never changes the saved model record',async()=>{
 const levels=[],stage={input:{},output:{connect(){}},setDb:db=>levels.push(db),dispose(){}};
 const {host,nodes}=fixture({createListeningStage:(_,options)=>{levels.push(options.db);return stage;}});
 host.setListeningDb(12);await host.enable(groves);complete(nodes[0]);const before=host.recording();
 host.setListeningDb(20);assert.deepEqual(host.recording(),before);assert.deepEqual(levels,[12,20]);assert.throws(()=>host.setListeningDb(21));host.dispose();
});

const opening=[{part:0,time:0,command:{kind:'strike',body:0,position:0,velocity:.5}},{part:1,time:1.25,command:{kind:'strike',body:0,position:0,velocity:.5}},{part:0,time:3,command:{kind:'quiet',fadeFrames:200}}];
test('authored opening shares one clock, remains acknowledgement-led and can be ended early',async()=>{
 const {host,nodes,contexts}=fixture();await host.enable(groves);const result=host.scheduleOpening(opening);assert.equal(result.queued,true);assert.equal(result.originFrame,8280);
 assert.deepEqual(nodes[0].sent.map(m=>[m.part,m.events.map(e=>e.frame)]),[[0,[8280,32280]],[1,[18280]]]);
 assert.equal(host.stats[0].strikes,0);assert.equal(host.hasRecording,false);
 assert.equal(host.send(2,{kind:'strike',body:0,position:0,velocity:.5}).reason,'authored-opening');assert.equal(host.scheduleOpening(opening).reason,'not-fresh');
 contexts[0].currentTime=1.1;assert.equal(host.quiet().queued,true);assert.equal(nodes[0].sent.at(-1).events[0].frame,9080);assert.equal(nodes[0].sent.at(-1).events[0].kind,'quiet');
 host.park();assert.equal(contexts[0].state,'closed');await host.enable(groves);assert.equal(host.send(2,{kind:'strike',body:0,position:0,velocity:.5}).queued,true);host.dispose();
});
test('opening validates the entire score before posting and cannot enter a personal passage before its first ack',async()=>{
 const {host,nodes}=fixture();await host.enable(groves);
 for(const steps of [[],opening.slice(0,-1),[...opening,{part:2,time:4,command:{kind:'strike',body:0,position:0,velocity:.5}}],opening.map((s,i)=>i===1?{...s,part:9}:s),opening.map((s,i)=>i===1?{...s,time:NaN}:s),opening.map((s,i)=>i===2?{...s,time:21}:s)])assert.equal(host.scheduleOpening(steps).reason,'invalid-opening');
 assert.equal(nodes[0].sent.length,0);host.send(2,{kind:'strike',body:0,position:0,velocity:.5});assert.equal(host.state,'ready');assert.equal(host.scheduleOpening(opening).reason,'not-fresh');assert.equal(nodes[0].sent.length,1);host.dispose();
});

const continuationSteps=[
 {part:2,frame:0,command:{kind:'strike',body:0,position:0,velocity:.25}},
 {part:1,frame:50,command:{kind:'strike',body:0,position:0,velocity:.25}},
 {part:0,frame:100,command:{kind:'strike',body:0,position:0,velocity:.25}}
];
function continuationDriver(node){
 const generation=node.options.processorOptions.generation,orders=[0,0,0];
 const emit=data=>node.port.onmessage({data:{generation,...data}});
 const processed=(part,events)=>emit({type:'processed',part,events:events.map(event=>({id:event.id,event,order:orders[part]++,requestedFrame:event.frame,appliedFrame:event.frame,lateByFrames:0,accepted:true}))});
 return {processed,clock:frame=>emit({type:'state',frame,parts:[0,1,2].map(part=>({part}))}),finish:(end,origin)=>{
  const ended={frame:end,fadeFrames:8};
  for(let part=0;part<3;part++)processed(part,[{id:'end-'+part,kind:'quiet',frame:end,fadeFrames:8}]);
  emit({type:'finished',frame:end+8,ended,origin,parts:orders.map((accepted,part)=>({part,accepted,refused:0,ended}))});
 }};
}
test('continuation hands off only after all voice decisions and processor time, then clamps new input after the boundary',async()=>{
 const {host,nodes}=fixture();await host.enable(groves);
 const result=host.scheduleContinuation(continuationSteps,{handoffFrame:800});assert.equal(result.handoffFrame,9080);
 const driver=continuationDriver(nodes[0]);
 driver.clock(9200);driver.processed(0,nodes[0].sent[0].events);
 assert.equal(host.send(0,continuationSteps[0].command).reason,'continuation');
 driver.processed(1,nodes[0].sent[1].events);driver.processed(2,nodes[0].sent[2].events);
 assert.equal(host.continuation.state,'completed');assert.equal(host.continuation.boundaryFrame,9080);assert.equal(host.continuation.originFrame,8280);
 assert.equal(host.send(0,continuationSteps[0].command).queued,true);
 assert.equal(nodes[0].sent.at(-1).events[0].frame,9081,'fake context clock behind barrier cannot schedule personal input inside the opening');
 const snapshot=host.continuation;snapshot.steps[0].command.velocity=1;snapshot.ledger[0].appliedFrame=0;
 assert.equal(host.continuation.steps[0].command.velocity,.25);assert.notEqual(host.continuation.ledger[0].appliedFrame,0);host.dispose();assert.equal(host.continuation,null);
});
test('continuation Quiet aborts handoff while retaining delayed accepted decisions and no ordinary input slips in',async()=>{
 const {host,nodes}=fixture();await host.enable(groves);host.scheduleContinuation(continuationSteps,{handoffFrame:800});
 const scheduled=nodes[0].sent.slice(),driver=continuationDriver(nodes[0]);assert.equal(host.quiet().queued,true);
 scheduled.forEach(m=>driver.processed(m.part,m.events));driver.clock(9200);
 assert.equal(host.continuation.state,'aborted');assert.equal(host.continuation.acknowledged,3);assert.equal('boundaryFrame' in host.continuation,false);
 assert.equal(host.send(0,continuationSteps[0].command).reason,'continuation');host.park();assert.equal(host.continuation,null);host.dispose();
});
test('continuation validates the complete plan before posting and cannot mix with demonstration scheduling',async()=>{
 const {host,nodes}=fixture();await host.enable(groves);
 for(const steps of [[],[...continuationSteps,{part:0,frame:200,command:{kind:'quiet',fadeFrames:8}}],[...continuationSteps].reverse(),continuationSteps.map((s,i)=>i? s:{...s,frame:.5}),continuationSteps.map(s=>({...s,part:99}))])assert.equal(host.scheduleContinuation(steps,{handoffFrame:800}).reason,'invalid-continuation');
 assert.equal(host.scheduleContinuation(continuationSteps,{handoffFrame:160001}).reason,'invalid-continuation');assert.equal(nodes[0].sent.length,0);
 host.scheduleContinuation(continuationSteps,{handoffFrame:800});assert.equal(host.scheduleOpening(opening).reason,'not-fresh');assert.equal(host.scheduleContinuation(continuationSteps,{handoffFrame:800}).reason,'not-fresh');host.dispose();
});
test('completed continuation metadata survives parking and failed mounting, then clears on successful fresh mount',async()=>{
 let count=0;const nodes=[],contexts=[];
 const {host}=fixture({createNode:(context,options)=>{
  contexts.push(context);if(count++===1)throw new Error('mount failed');
  const node={options,sent:[],port:{postMessage:m=>node.sent.push(m),close(){}},connect(){},disconnect(){}};nodes.push(node);return node;
 }});
 await host.enable(groves);host.scheduleContinuation(continuationSteps,{handoffFrame:800});const driver=continuationDriver(nodes[0]);
 nodes[0].sent.forEach(m=>driver.processed(m.part,m.events));driver.clock(9200);driver.finish(9300,8280);
 const before=host.continuation,record=host.recording();host.park();assert.deepEqual(host.continuation,before);
 await assert.rejects(host.enable(groves),/mount failed/);assert.deepEqual(host.recording(),record);assert.deepEqual(host.continuation,before);
 await host.enable(groves);assert.equal(host.continuation,null);assert.equal(host.hasRecording,false);host.dispose();
});
