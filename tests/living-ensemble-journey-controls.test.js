import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {setupEnsembleJourneyControls} from '../src/living/ensemble-journey-controls.js';
import {createEnsembleJourneyRecipe} from '../src/living/ensemble-journey-recipe.js';
import {prepareEnsembleJourneyAudio} from '../src/living/ensemble-journey-audio.js';
const gesture=[{frame:0,strength:.025},{frame:14400,strength:.05},{frame:38400,strength:.1}];
const artifact=prepareEnsembleJourneyAudio({gesture});
function element(){const listeners=new Map();return {dataset:{},hidden:true,disabled:false,addEventListener(t,f){if(!listeners.has(t))listeners.set(t,new Set());listeners.get(t).add(f);},removeEventListener(t,f){listeners.get(t)?.delete(f);},setAttribute(k,v){this[k]=v;},async fire(t){for(const f of listeners.get(t)??[])await f();}};}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function fixture(options={}){
 const elements={pads:[element(),element(),element()],chapters:[element(),element(),element()],...Object.fromEntries(['reset','prepare','cancel','listen','status','wav','file','recipe'].map(k=>[k,element()]))},audio={...element(),paused:false,pause(){this.paused=true;}};
 let time=100,id=0;const jobs=[],revoked=[],urls=[],blobs=[];
 const controls=setupEnsembleJourneyControls({elements,audio,now:()=>time,digest:async()=> 'a'.repeat(64),createJob:input=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;}),job={input,promise,resolve,reject,cancel(){this.cancelled=true;reject(new DOMException('cancelled','AbortError'));}};jobs.push(job);return job;},makeURL:blob=>{blobs.push(blob);const url='blob:'+ ++id;urls.push(url);return url;},revokeURL:url=>revoked.push(url),...options});
 return {elements,audio,controls,jobs,revoked,urls,blobs,set time(t){time=t;},async tap(){time=100;await elements.pads[0].fire('click');time=400;await elements.pads[1].fire('click');time=900;await elements.pads[2].fire('click');}};
}
test('three silent taps prepare an isolated personal version without starting audio',async()=>{
 const f=fixture();assert.equal(f.elements.prepare.disabled,true);await f.tap();assert.equal(f.elements.prepare.disabled,false);assert.ok(f.elements.pads.every(p=>p.disabled));
 const pending=f.elements.prepare.fire('click');await flush();assert.equal(f.audio.paused,true);assert.deepEqual(f.jobs[0].input.gesture,gesture);f.jobs[0].resolve(artifact);await pending;
 assert.equal(f.elements.listen.disabled,false);assert.equal(f.elements.listen.dataset.file,'blob:1');assert.equal(f.elements.listen.dataset.sha256,'a'.repeat(64));assert.ok(f.elements.chapters.every(l=>!l.hidden));assert.equal(f.audio.paused,true);
 const saved=f.controls.prepared;saved.record[0].records[0].events[0].strength=99;assert.notEqual(f.controls.prepared.record[0].records[0].events[0].strength,99);f.controls.dispose();assert.deepEqual(f.revoked,f.urls);
});
test('failed or cancelled replacement retains previous personal sound and downloads',async()=>{
 const f=fixture();await f.tap();let pending=f.elements.prepare.fire('click');await flush();f.jobs[0].resolve(artifact);await pending;const original=f.controls.prepared;
 pending=f.elements.prepare.fire('click');await flush();f.jobs[1].reject(Error('admission refused'));await pending;assert.deepEqual(f.controls.prepared,original);assert.equal(f.elements.listen.disabled,false);assert.deepEqual(f.revoked,[]);
 pending=f.elements.prepare.fire('click');await flush();await f.elements.cancel.fire('click');await pending;assert.deepEqual(f.controls.prepared,original);assert.equal(f.jobs[2].cancelled,true);f.controls.dispose();
});
test('playing the offered piece cancels preparation and late hashing cannot publish after stop',async()=>{
 let release;const f=fixture({digest:()=>new Promise(r=>release=r)});await f.tap();const pending=f.elements.prepare.fire('click');await flush();f.jobs[0].resolve(artifact);await flush();await f.audio.fire('play');release('b'.repeat(64));await pending;assert.equal(f.controls.prepared,null);assert.deepEqual(f.urls,[]);f.controls.dispose();
});
test('a successful replacement releases old URLs only after every new URL is ready',async()=>{
 const f=fixture();await f.tap();let pending=f.elements.prepare.fire('click');await flush();f.jobs[0].resolve(artifact);await pending;
 pending=f.elements.prepare.fire('click');await flush();f.jobs[1].resolve(artifact);await pending;assert.equal(f.controls.prepared.identity,'blob:6');assert.deepEqual(f.revoked,['blob:1','blob:2','blob:3','blob:4','blob:5']);f.controls.dispose();
});
test('failed allocation and mismatched chapter history cannot publish a candidate',async()=>{
 let allocated=0;const f=fixture({makeURL:()=>{if(++allocated===3)throw Error('allocation');return 'blob:'+allocated;}});await f.tap();let pending=f.elements.prepare.fire('click');await flush();f.jobs[0].resolve(artifact);await pending;assert.equal(f.controls.prepared,null);assert.deepEqual(f.revoked,['blob:1','blob:2']);
 pending=f.elements.prepare.fire('click');await flush();f.jobs[1].resolve({...artifact,records:[]});await pending;assert.equal(f.controls.prepared,null);f.controls.dispose();
});
test('late or coincident taps are not silently stretched or reordered',async()=>{
 const f=fixture();await f.elements.pads[0].fire('click');await f.elements.pads[1].fire('click');assert.match(f.elements.status.textContent,/1 of 3/);
 f.time=3101;await f.elements.pads[1].fire('click');assert.match(f.elements.status.textContent,/past three seconds/);assert.equal(f.elements.prepare.disabled,true);
 await f.tap();await f.elements.reset.fire('click');assert.equal(f.elements.prepare.disabled,true);assert.ok(f.elements.pads.every(p=>!p.disabled));f.controls.dispose();
});

test('a kept recipe reconstructs silently and mismatched sound retains the previous result',async()=>{
 const f=fixture(),text=JSON.stringify(createEnsembleJourneyRecipe(gesture,'a'.repeat(64)));
 f.elements.file.files=[{size:text.length,text:async()=>text}];let pending=f.elements.file.fire('change');await flush();await flush();f.jobs[0].resolve(artifact);await pending;
 assert.equal(f.audio.paused,true);assert.equal(f.elements.recipe.href,'blob:5');assert.equal(f.elements.recipe.hidden,false);const original=f.controls.prepared;
 const changed=text.replace('a'.repeat(64),'b'.repeat(64));f.elements.file.files=[{size:changed.length,text:async()=>changed}];pending=f.elements.file.fire('change');await flush();await flush();f.jobs[1].resolve(artifact);await pending;
 assert.deepEqual(f.controls.prepared,original);assert.match(f.elements.status.textContent,/does not match/);assert.deepEqual(f.revoked,[]);f.controls.dispose();
});
test('oversized files are refused before reading and cancelled reads cannot start workers',async()=>{
 const f=fixture();f.elements.file.files=[{size:4097,text(){throw Error('must not read');}}];await f.elements.file.fire('change');assert.equal(f.jobs.length,0);assert.match(f.elements.status.textContent,/4 KiB/);
 let release;f.elements.file.files=[{size:300,text:()=>new Promise(r=>release=r)}];const pending=f.elements.file.fire('change');await flush();f.controls.stop();release(JSON.stringify(createEnsembleJourneyRecipe(gesture,'a'.repeat(64))));await pending;assert.equal(f.jobs.length,0);assert.equal(f.controls.prepared,null);f.controls.dispose();
});

test('real prepared audio fingerprint survives recipe keeping and silent reopening',async()=>{
 const digest=async bytes=>createHash('sha256').update(new Uint8Array(bytes)).digest('hex'),f=fixture({digest});await f.tap();let pending=f.elements.prepare.fire('click');await flush();f.jobs[0].resolve(artifact);await pending;
 const text=await f.blobs[4].text(),saved=JSON.parse(text);assert.equal(saved.wavSha256,await digest(artifact.wav));assert.deepEqual(saved.gesture,gesture);
 f.elements.file.files=[{size:new TextEncoder().encode(text).length,text:async()=>text}];pending=f.elements.file.fire('change');await flush();await flush();f.jobs[1].resolve(artifact);await pending;
 assert.equal(f.controls.prepared.identity,'blob:6');assert.equal(f.audio.paused,true);assert.equal(f.elements.prepare.disabled,false);f.controls.dispose();
});
