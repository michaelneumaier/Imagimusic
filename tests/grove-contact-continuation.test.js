import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,renderRestRecord,validateRestAdmission} from '../src/score/grove-rest.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
let Processor;
globalThis.sampleRate=8000;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class {constructor(){this.messages=[];this.port={postMessage:message=>this.messages.push(message)};}};
globalThis.registerProcessor=(_,value)=>{Processor=value;};
await import('../src/grove/contact-worklet.js');
const recipe=createGroveRestRecipe(composeGrove({seed:3}),DEFAULT_VOICE_CONFIG,{sampleRate:8000});
const opening=[{id:'opening-1',frame:64,kind:'strike',body:0,position:1,velocity:.35},{id:'opening-2',frame:1664,kind:'strike',body:1,position:1,velocity:.35}];
const answer=[{id:'answer',frame:4000,kind:'strike',body:2,position:1,velocity:.5},{id:'hand',frame:5000,kind:'contact',body:0,zone:1,strength:0},{id:'lift',frame:6000,kind:'contact',body:0,zone:null},{id:'quiet',frame:8000,kind:'quiet',fadeFrames:200}];
function perform(initial,late=[]){
 const p=new Processor({processorOptions:{recipe,events:initial,generation:'continuation'}}),channels=[[],[]];let beforeAnswer;
 for(let frame=0;frame<8320;frame+=128){
  globalThis.currentFrame=frame;
  if(frame===3840){beforeAnswer=Array.from(p.engine.state);if(late.length)p.port.onmessage({data:{type:'events',events:late}});}
  const output=[new Float32Array(128),new Float32Array(128)];const active=p.process([],[output]);output.forEach((c,i)=>channels[i].push(...c));if(!active)break;
 }
 const capture=createRestCapture(recipe,{generation:'continuation'});p.messages.forEach(m=>capture.consume(m));
 return {record:capture.snapshot(),channels,beforeAnswer,messages:p.messages};
}
test('a later human answer continues the opening state and produces one reproducible passage',()=>{
 const live=perform(opening,answer),scheduled=perform([...opening,...answer]);
 assert.ok(live.beforeAnswer.some(v=>Math.abs(v)>1e-10),'opening still has vibrating state before the answer');
 assert.deepEqual(live.channels,scheduled.channels);assert.deepEqual(live.record,scheduled.record);
 assert.equal(live.record.events.length,3);assert.deepEqual(live.record.events.map(e=>e.frame),[0,1600,3936]);
 assert.equal(live.record.contacts.length,1);validateRestAdmission(live.record,recipe);
 const rebuilt=renderRestRecord(live.record,recipe);
 for(let c=0;c<2;c++)for(let i=0;i<rebuilt.channels[c].length;i++)assert.ok(Math.abs(rebuilt.channels[c][i]-live.channels[c][i+64])<1e-7);
});
test('early Quiet prevents a queued later opening strike from sounding or entering the capture',()=>{
 const stopped=perform([...opening,{id:'early-quiet',frame:512,kind:'quiet',fadeFrames:200}]);
 assert.equal(stopped.record.events.length,1);assert.equal(stopped.record.ended.frame,448);
 assert.equal(stopped.messages.some(m=>m.type==='error'),false);
});
test('a late human command is kept at its processed frame rather than its requested key time',()=>{
 const late=answer.map((e,i)=>i===0?{...e,frame:3700}:e),actual=answer.map((e,i)=>i===0?{...e,frame:3840}:e);
 const live=perform(opening,late),reference=perform([...opening,...actual]);
 assert.equal(live.record.events[2].frame,3840-64);
 const ack=live.messages.filter(m=>m.type==='processed').flatMap(m=>m.events).find(e=>e.id==='answer');
 assert.equal(ack.lateByFrames,140);assert.equal(ack.appliedFrame,3840);
 assert.deepEqual(live.record,reference.record);assert.deepEqual(live.channels,reference.channels);
});
