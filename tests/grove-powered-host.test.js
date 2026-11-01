import test from 'node:test';import assert from 'node:assert/strict';
import {createPoweredHost} from '../src/grove/powered-host.js';
import {createPoweredProcessor} from '../src/grove/powered-processor.js';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {createPoweredRecipe,composeEncounterRecord,renderPoweredRecord} from '../src/score/grove-powered.js';
const recipe=createPoweredRecipe(createGroveRestRecipe(composeGrove({seed:7}),undefined,{sampleRate:8000,zones:[.3,1],strengths:{c1:1}}));
const driver=composeEncounterRecord(recipe,{forceSeconds:.1,ringSeconds:.1}).driver,prepared={recipe,driver,quietFrame:1600,fadeFrames:200};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function setup(overrides={}){
 const nodes=[],states=[];let renders=0;
 const context={state:'suspended',sampleRate:8000,currentTime:0,destination:{},audioWorklet:{addModule:async()=>{}},resume:async()=>{context.state='running';context.onstatechange?.();},close:()=>{context.state='closed';}};
 const host=createPoweredHost({createContext:()=>context,createNode:(_,options)=>{const n={options,sent:[],connected:false,closed:false,port:{onmessage:null,postMessage:m=>n.sent.push(m),close:()=>n.closed=true},connect:()=>n.connected=true,disconnect:()=>n.connected=false};nodes.push(n);return n;},prepare:async()=>prepared,render:async({record,recipe})=>{renders++;return {pcm:renderPoweredRecord(record,recipe)};},onChange:s=>states.push(s.state),...overrides});
 function finish(){const n=nodes.at(-1),o=n.options.processorOptions,p=createPoweredProcessor(o);let frame=0;while(!p.finished){p.process([new Float32Array(128),new Float32Array(128)],frame);for(const m of p.drain())n.port.onmessage?.({data:{...m,generation:o.generation}});frame+=128;}}
 return {host,context,nodes,states,finish,get renders(){return renders;}};
}
test('cancelled preparation cannot mount a node; a later explicit begin can',async()=>{
 const pending=deferred();let call=0;const s=setup({prepare:()=>++call===1?pending.promise:Promise.resolve(prepared)});
 const old=s.host.begin({});assert.equal(s.host.state,'preparing');s.host.quiet();assert.equal(s.host.state,'idle');await s.host.begin({});pending.resolve(prepared);assert.equal(await old,false);assert.equal(s.nodes.length,1);s.host.dispose();assert.equal(s.nodes[0].closed,true);
});
test('completed audio history saves, caches reconstruction and shows a settled endpoint',async()=>{
 const s=setup();await s.host.begin({});assert.equal(await s.host.begin({}),false);await assert.rejects(s.host.saveAudio(),/finish/);s.finish();assert.equal(s.host.state,'ended');assert.equal(s.nodes[0].closed,true);assert.equal(s.host.recording().ended.frame,1600);assert.equal(s.host.visual().time,.225);assert.equal(s.host.visual().driverActive,false);
 const a=await s.host.saveAudio(),b=await s.host.saveAudio();assert.strictEqual(a,b);assert.equal(s.renders,1);assert.equal(a.channels[0].length,1800);s.host.dispose();
});
test('Quiet during interruption queues once and resumes to ending without restarting',async()=>{
 const s=setup();await s.host.begin({});s.context.state='suspended';s.context.onstatechange();assert.equal(s.host.state,'suspended');assert.equal(s.host.send({kind:'contact',zone:1}),true);s.host.quiet();s.host.quiet();assert.equal(s.nodes[0].sent.length,2);assert.equal(s.host.send({kind:'contact',zone:null}),false);await s.host.resume();assert.equal(s.host.state,'ending');assert.equal(s.nodes.length,1);s.host.dispose();
});
test('late render cannot replace a new encounter; disposal closes audio and rejects begin',async()=>{
 const wait=deferred();const s=setup({render:()=>wait.promise});await s.host.begin({});s.finish();const old=s.host.saveAudio();await s.host.begin({});wait.resolve({pcm:{channels:[]}});await assert.rejects(old,{name:'AbortError'});assert.equal(s.host.state,'playing');s.host.dispose();assert.equal(s.context.state,'closed');await assert.rejects(s.host.begin({}),/disposed/);
});
test('stale generations are ignored and processor errors prevent exporting',async()=>{
 const s=setup();await s.host.begin({});const n=s.nodes[0];n.port.onmessage({data:{type:'error',generation:'old',message:'obsolete'}});assert.equal(s.host.state,'playing');n.onprocessorerror();assert.equal(s.host.state,'error');assert.equal(n.closed,true);assert.throws(()=>s.host.recording(),/unexpectedly/);assert.equal(s.host.visual().driverActive,false);s.host.dispose();
});
test('a hand held through preparation applies at the actual origin and records its duration',async()=>{
 const wait=deferred(),s=setup({prepare:()=>wait.promise}),begin=s.host.begin({});s.context.currentTime=.01;assert.equal(s.host.send({kind:'contact',zone:0}),true);s.context.currentTime=.02;assert.equal(s.host.send({kind:'contact',zone:1}),true);assert.equal(s.host.visual().driverActive,false);wait.resolve(prepared);await begin;
 const config=s.nodes[0].options.processorOptions;assert.deepEqual(config.events,[{id:'contact-0',kind:'contact',zone:1,frame:160}]);assert.ok(config.originFrame>160);s.finish();const record=s.host.recording();assert.deepEqual(record.contacts.map(c=>[c.zone,c.start,c.end]),[[1,0,1600]]);s.host.dispose();
});
test('a hand released during preparation leaves no invented contact in the record',async()=>{
 const wait=deferred(),s=setup({prepare:()=>wait.promise}),begin=s.host.begin({});s.host.send({kind:'contact',zone:0});s.host.send({kind:'contact',zone:null});wait.resolve(prepared);await begin;assert.deepEqual(s.nodes[0].options.processorOptions.events,[]);s.finish();assert.deepEqual(s.host.recording().contacts,[]);s.host.dispose();
});
test('cancelling preparation clears held intent before the next encounter',async()=>{
 const wait=deferred();let calls=0;const s=setup({prepare:()=>++calls===1?wait.promise:Promise.resolve(prepared)}),first=s.host.begin({});s.host.send({kind:'contact',zone:1});s.host.quiet();assert.equal(s.host.send({kind:'contact',zone:0}),false);await s.host.begin({});wait.resolve(prepared);await first;assert.deepEqual(s.nodes[0].options.processorOptions.events,[]);s.finish();assert.deepEqual(s.host.recording().contacts,[]);s.host.dispose();
});
test('parking a completed encounter closes audio, retains its record and allows a fresh context',async()=>{
 let created=0,s;s=setup({createContext:()=>{created++;return s.context;}});await s.host.begin({});s.finish();const record=s.host.recording(),pcm=await s.host.saveAudio();s.host.park();assert.equal(s.context.state,'closed');assert.equal(s.host.state,'ended');assert.deepEqual(s.host.recording(),record);assert.strictEqual(await s.host.saveAudio(),pcm);await s.host.begin({});assert.equal(created,2);assert.equal(s.host.state,'playing');s.host.dispose();
});
test('parking an unfinished encounter does not fabricate a finished capture',async()=>{
 const s=setup();await s.host.begin({});s.host.send({kind:'contact',zone:0});s.host.park();assert.equal(s.host.state,'idle');assert.equal(s.nodes[0].closed,true);assert.equal(s.host.send({kind:'contact',zone:1}),false);assert.throws(()=>s.host.recording(),/Begin/);await s.host.begin({});assert.equal(s.host.state,'playing');s.host.dispose();
});
test('parking during preparation preserves an earlier complete capture and rejects stale preparation',async()=>{
 const wait=deferred();let calls=0;const s=setup({prepare:()=>++calls===1?Promise.resolve(prepared):wait.promise});await s.host.begin({});s.finish();const record=s.host.recording(),begin=s.host.begin({});s.host.park();assert.equal(s.host.state,'ended');assert.deepEqual(s.host.recording(),record);wait.resolve(prepared);assert.equal(await begin,false);assert.equal(s.nodes.length,1);s.host.dispose();
});
