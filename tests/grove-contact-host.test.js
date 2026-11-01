import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,renderRestRecord} from '../src/score/grove-rest.js';
import {createRestHost} from '../src/grove/contact-host.js';
const grove=composeGrove({seed:3}),recipe=createGroveRestRecipe(grove,{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000,zones:[.6]});
function fixture(overrides={}){
 const nodes=[],changes=[],context={sampleRate:8000,currentTime:.01,state:'suspended',destination:{},audioWorklet:{addModule:async()=>{}},async resume(){this.state='running';this.onstatechange?.();},async close(){this.state='closed';}};
 const host=createRestHost({createContext:()=>context,prepareRecipe:async()=>({recipe}),renderRecord:async({record,recipe})=>({pcm:renderRestRecord(record,recipe)}),createNode:(_,options)=>{const n={options,sent:[],port:{postMessage:event=>n.sent.push(event),close(){n.closed=true;}},connect(){},disconnect(){n.detached=true;}};nodes.push(n);return n;},onChange:change=>changes.push(change),...overrides});
 return {host,nodes,context,changes};
}
function finish(node){const generation=node.options.processorOptions.generation;const send=data=>node.port.onmessage({data:{generation,...data}});send({type:'processed',events:[{id:'s',order:0,requestedFrame:80,appliedFrame:80,lateByFrames:0,accepted:true,event:{id:'s',frame:80,kind:'strike',body:0,position:0,velocity:.5}},{id:'q',order:1,requestedFrame:100,appliedFrame:100,lateByFrames:0,accepted:true,event:{id:'q',frame:100,kind:'quiet',fadeFrames:8}}]});send({type:'finished',frame:108,ended:{frame:100,fadeFrames:8}});}
test('live host records decisions, reuses recipe, and ignores an old node after a new passage',async()=>{
 const {host,nodes,context}=fixture();assert.equal(host.quiet().queued,false);await host.enable(grove);assert.equal(host.state,'ready');
 assert.equal(host.send({kind:'strike',body:0,position:0,velocity:.5}).queued,true);assert.equal(nodes[0].sent[0].events[0].frame,80);assert.equal(host.stats.strikes,0);
 const stale=nodes[0].port.onmessage;finish(nodes[0]);assert.equal(host.state,'ended');assert.equal(host.recording().events[0].frame,0);assert.equal((await host.saveAudio()).channels[0].length,28);
 host.newPassage();assert.equal(nodes.length,2);assert.equal(host.stats.strikes,0);stale({data:{generation:'1',type:'error',message:'stale'}});assert.equal(host.state,'ready');
 context.state='suspended';context.onstatechange();assert.equal(host.send({kind:'strike'}).queued,false);await host.resume();assert.equal(host.state,'ready');host.dispose();assert.equal(context.state,'closed');assert.equal(nodes[1].closed,true);
});
test('superseded recipe preparation cannot mount or overwrite the current instrument',async()=>{
 const pending=[];const {host,nodes}=fixture({prepareRecipe:(_,options)=>new Promise(resolve=>pending.push({resolve,signal:options.signal}))});
 const first=host.enable(grove),second=host.enable(grove);assert.equal(pending[0].signal.aborted,true);pending[1].resolve({recipe});await second;pending[0].resolve({recipe:{...recipe,seed:999}});await first;
 assert.equal(nodes.length,1);assert.equal(host.recipe.seed,3);host.dispose();
});
test('audio failure prevents saving, and changing passage aborts an in-flight render',async()=>{
 let pending;const {host,nodes}=fixture({renderRecord:(_,options)=>new Promise(resolve=>{pending={resolve,signal:options.signal};})});await host.enable(grove);finish(nodes[0]);const render=host.saveAudio();host.newPassage();assert.equal(pending.signal.aborted,true);pending.resolve({pcm:{channels:[]}});await assert.rejects(render,/Passage changed/);
 const node=nodes[1];node.port.onmessage({data:{type:'error',generation:node.options.processorOptions.generation,message:'fatal'}});assert.equal(host.state,'error');assert.throws(()=>host.recording(),/fatal/);host.dispose();
});
test('invitation reserves a fresh passage and interruption still permits release commands',async()=>{
 const {host,nodes,context}=fixture();await host.enable(grove);host.schedule([{id:'authored',frame:0,kind:'strike',body:0,position:0,velocity:.5},{id:'end',frame:1000,kind:'quiet',fadeFrames:8}]);
 assert.equal(nodes[0].sent[0].events[0].frame,880);assert.equal(nodes[0].sent[0].events[1].frame,1880);assert.throws(()=>host.schedule([]),/fresh passage/);
 context.state='suspended';context.onstatechange();assert.equal(host.send({kind:'contact',body:0,zone:null}).queued,true);assert.equal(host.quiet().queued,true);assert.equal(host.send({kind:'strike',body:0}).queued,false);host.dispose();
});
test('park retains a finished passage and permits rendering and a fresh explicit start',async()=>{
 const contexts=[];const {host,nodes}=fixture({createContext:()=>{const c={sampleRate:8000,currentTime:0,state:'suspended',destination:{},audioWorklet:{addModule:async()=>{}},async resume(){this.state='running';},async close(){this.state='closed';}};contexts.push(c);return c;}});
 await host.enable(grove);finish(nodes[0]);const record=host.recording();host.park();assert.equal(contexts[0].state,'closed');assert.equal(host.state,'ended');assert.deepEqual(host.recording(),record);assert.equal((await host.saveAudio()).channels[0].length,28);
 await host.newPassage();assert.equal(contexts.length,2);assert.equal(host.state,'ready');assert.equal(host.stats.strikes,0);host.dispose();
});
test('park discards incomplete passage and invalidates pending preparation',async()=>{
 const pending=[];const {host,nodes}=fixture({prepareRecipe:(_,options)=>new Promise(resolve=>pending.push({resolve,signal:options.signal}))});
 const opening=host.enable(grove);host.park();assert.equal(pending[0].signal.aborted,true);pending[0].resolve({recipe});await opening;assert.equal(nodes.length,0);assert.equal(host.state,'idle');assert.equal(host.recording(),null);
 const next=host.enable(grove);pending[1].resolve({recipe});await next;const stale=nodes[0].port.onmessage;host.park();stale({data:{type:'error',generation:nodes[0].options.processorOptions.generation,message:'stale'}});assert.equal(host.state,'idle');assert.equal(host.recording(),null);assert.equal(host.recipe,null);host.dispose();
});
