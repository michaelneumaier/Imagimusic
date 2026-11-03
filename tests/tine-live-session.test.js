import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineLiveSession} from '../src/tine/live-session.js';
import {createTineDesign} from '../src/tine/address.js';
function fixture({moduleGate,...options}={}){
 const contexts=[],nodes=[],changes=[];
 const host=createTineLiveSession({...options,onChange:e=>changes.push(e),createContext:()=>{const c={state:'suspended',sampleRate:48000,destination:{},onstatechange:null,closed:0,audioWorklet:{addModule:()=>moduleGate??Promise.resolve()},resume:async()=>{c.state='running';},close:async()=>{c.state='closed';c.closed++;}};contexts.push(c);return c;},createNode:()=>{
  const node={closed:0,disconnected:0,commands:[],connect(target){node.target=target;queueMicrotask(()=>node.send({type:'ready',sampleRate:48000}));},disconnect(){node.disconnected++;},send(data){node.port.onmessage?.({data});},port:{onmessage:null,close(){node.closed++;},postMessage(data){node.commands.push(data);if(data.type==='start')queueMicrotask(()=>node.send({type:'applied',id:data.id,command:'start',frame:0,state:'playing'}));}}};nodes.push(node);return node;
 }});return {host,contexts,nodes,changes};
}
test('session gates readiness, acknowledges touches, preserves source snapshot and closes once on completion',async()=>{
 const f=fixture(),design={...createTineDesign()};await f.host.start(design);design.widthMm=20;
 assert.equal(f.host.state,'playing');const touch=f.host.strike();assert.equal(f.host.touches,0);
 const command=f.nodes[0].commands.at(-1);f.nodes[0].send({type:'applied',id:command.id,command:'strike',frame:128,strength:.1});await touch;assert.equal(f.host.touches,1);
 const quiet=f.host.quiet();assert.equal(f.host.state,'ending');f.nodes[0].send({type:'state',state:'playing'});assert.equal(f.host.state,'ending');
 const q=f.nodes[0].commands.at(-1);f.nodes[0].send({type:'applied',id:q.id,command:'quiet',frame:256});await quiet;
 f.nodes[0].send({type:'finished',originAudioFrame:1024,snapshot:{frame:1456,events:[{frame:128,strength:.1}]}});
 assert.equal(f.host.state,'ending');assert.equal(f.contexts[0].closed,0);await new Promise(r=>setTimeout(r,100));
 assert.equal(f.host.state,'ended');assert.equal(f.host.finished.design.widthMm,10);assert.equal(f.contexts[0].closed,1);assert.equal(f.nodes[0].closed,1);
 await assert.rejects(f.host.strike());f.host.dispose();assert.equal(f.contexts[0].closed,1);
});
test('leaving during module loading prevents a late node and does not resurrect the pass',async()=>{
 let resolve;const gate=new Promise(r=>resolve=r),f=fixture({moduleGate:gate}),starting=f.host.start(createTineDesign());
 await Promise.resolve();f.host.park();resolve();await assert.rejects(starting,{name:'AbortError'});
 assert.equal(f.nodes.length,0);assert.equal(f.contexts[0].closed,1);assert.equal(f.host.state,'interrupted');
});
test('suspension rejects pending input, closes resources and ignores stale callbacks after another start',async()=>{
 const f=fixture();await f.host.start(createTineDesign());const old=f.nodes[0],receive=old.port.onmessage,pending=f.host.strike();
 f.contexts[0].state='suspended';f.contexts[0].onstatechange();await assert.rejects(pending,{name:'AbortError'});assert.equal(f.host.state,'interrupted');assert.equal(old.disconnected,1);
 await f.host.start(createTineDesign({widthMm:13}));receive({data:{type:'finished',snapshot:{}}});assert.equal(f.host.state,'playing');assert.equal(f.host.finished,null);f.host.dispose();
});
test('in-flight touches consume admission slots so rapid input cannot queue beyond eight',async()=>{
 const f=fixture();await f.host.start(createTineDesign());const pending=Array.from({length:8},()=>f.host.strike());await assert.rejects(f.host.strike());
 assert.equal(f.nodes[0].commands.filter(c=>c.type==='strike').length,8);f.host.dispose();await Promise.all(pending.map(p=>assert.rejects(p,{name:'AbortError'})));
});

test('leaving during output drain closes immediately and cannot finish a later pass',async()=>{
 const f=fixture();await f.host.start(createTineDesign());
 f.nodes[0].send({type:'finished',originAudioFrame:0,snapshot:{frame:384000,events:[]}});
 assert.equal(f.host.state,'ending');f.host.park();assert.equal(f.contexts[0].closed,1);
 await f.host.start(createTineDesign());await new Promise(r=>setTimeout(r,100));
 assert.equal(f.host.state,'playing');assert.equal(f.host.finished,null);f.host.dispose();
});

test('shared downstream listening level persists across passes without entering commands or finished records',async()=>{
 const stages=[],f=fixture({listeningDb:0,createListeningStage:(context,{db})=>{const stage={input:{},output:{connect(target){stage.destination=target;}},db,disposed:0,setDb(value){stage.db=value;},dispose(){stage.disposed++;}};stages.push(stage);return stage;}});
 f.host.setListeningDb(12);await f.host.start(createTineDesign());
 assert.equal(stages[0].db,12);assert.equal(f.nodes[0].target,stages[0].input);assert.equal(stages[0].destination,f.contexts[0].destination);
 const commands=structuredClone(f.nodes[0].commands);f.host.setListeningDb(20);assert.equal(stages[0].db,20);assert.deepEqual(f.nodes[0].commands,commands);
 assert.throws(()=>f.host.setListeningDb(21));assert.equal(stages[0].db,20);
 f.nodes[0].send({type:'finished',snapshot:{frame:1200,events:[]}});await new Promise(r=>setTimeout(r,100));assert.equal(stages[0].disposed,1);assert.equal('listeningDb' in f.host.finished,false);
 await f.host.start(createTineDesign());assert.equal(stages[1].db,20);f.host.park();assert.equal(stages[1].disposed,1);
});
test('listening connection failure releases the stage and context; the next pass can retry',async()=>{
 let attempts=0,disposed=0;const f=fixture({listeningDb:0,createListeningStage:()=>({input:{},output:{connect(){if(attempts++===0)throw Error('connection failed');}},setDb(){},dispose(){disposed++;}})});
 await assert.rejects(f.host.start(createTineDesign()),/connection failed/);assert.equal(f.host.state,'error');assert.equal(disposed,1);assert.equal(f.contexts[0].closed,1);
 await f.host.start(createTineDesign());assert.equal(f.host.state,'playing');f.host.dispose();assert.equal(disposed,2);
});
