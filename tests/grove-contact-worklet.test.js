import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
let Processor;
globalThis.sampleRate=8000;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class {constructor(){this.messages=[];this.port={postMessage:message=>this.messages.push(message)};}};
globalThis.registerProcessor=(_,value)=>{Processor=value;};
await import('../src/grove/contact-worklet.js');
const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000,zones:[.6]});
const run=(events,frames)=>{const p=new Processor({processorOptions:{recipe,events,generation:'test'}});for(let frame=0;frame<frames;frame+=128){globalThis.currentFrame=frame;if(!p.process([],[[new Float32Array(128),new Float32Array(128)]]))break;}return p;};
test('worklet counts admitted strikes and contacts, preserving release and Quiet at the limits',()=>{
 const events=Array.from({length:130},(_,i)=>({id:`s${i}`,frame:i,kind:'strike',body:0,position:0,velocity:.00001}));
 for(let i=0;i<258;i++)events.push({id:`c${i}`,frame:256+i,kind:'contact',body:0,zone:0,strength:0});
 events.push({id:'release',frame:600,kind:'contact',body:0,zone:null},{id:'quiet',frame:700,kind:'quiet',fadeFrames:8});
 const p=run(events,1024),acks=p.messages.filter(m=>m.type==='processed').flatMap(m=>m.events);
 assert.equal(acks.filter(a=>a.reason==='strike-limit').length,2);assert.equal(acks.filter(a=>a.reason==='contact-limit').length,2);
 assert.equal(acks.find(a=>a.id==='release').accepted,true);
 const capture=createRestCapture(recipe,{generation:'test'});for(const m of p.messages)capture.consume(m);const record=capture.snapshot();assert.equal(record.events.length,128);assert.equal(record.contacts.length,256);assert.equal(record.contacts.at(-1).end,600);
});
test('worklet automatically closes held contacts at 120 seconds and reserves its ending identity',()=>{
 const events=[{id:'strike',frame:64,kind:'strike',body:0,position:0,velocity:.5},{id:'contact',frame:100,kind:'contact',body:0,zone:0,strength:1}];
 const p=run(events,8000*120+512),capture=createRestCapture(recipe,{generation:'test'});for(const m of p.messages)capture.consume(m);
 const record=capture.snapshot();assert.equal(record.ended.frame,960000);assert.equal(record.ended.fadeFrames,200);assert.equal(record.contacts[0].end,960000);
 assert.throws(()=>new Processor({processorOptions:{recipe,events:[{id:'$rest-auto-quiet',kind:'quiet',frame:0,fadeFrames:8}]}}),/Reserved/);
});
