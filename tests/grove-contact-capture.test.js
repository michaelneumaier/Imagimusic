import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,canonicalRestRecord} from '../src/score/grove-rest.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000,zones:[.6]});
const ack=(order,appliedFrame,event,accepted=true)=>({id:String(order),order,requestedFrame:event.frame??appliedFrame,appliedFrame,lateByFrames:appliedFrame-(event.frame??appliedFrame),event:{id:String(order),frame:appliedFrame,...event},accepted});
const send=(capture,events)=>capture.consume({type:'processed',generation:'one',events});
test('capture uses heard frames, omits rejected and zero-length gestures, and closes hands on Quiet',()=>{
 const capture=createRestCapture(recipe,{generation:'one'});
 assert.deepEqual(capture.consume({type:'processed',generation:'old',events:[]}),{ignored:true});capture.consume({type:'queued',generation:'one',ids:['0']});assert.equal(capture.state,'empty');
 send(capture,[ack(0,900,{kind:'strike',body:0,position:1,velocity:1},false),ack(1,1000,{kind:'strike',body:0,position:1,velocity:.5}),ack(2,1010,{kind:'contact',body:0,zone:0,strength:1}),ack(3,1020,{kind:'contact',body:1,zone:0,strength:0,frame:1}),ack(4,1025,{kind:'contact',body:2,zone:0,strength:0}),ack(5,1025,{kind:'contact',body:2,zone:null}),ack(6,1050,{kind:'quiet',fadeFrames:8}),ack(7,1052,{kind:'strike',body:2,position:1,velocity:.5},false)]);
 assert.equal(capture.originFrame,1000);assert.equal(capture.state,'ending');assert.throws(()=>capture.snapshot(),/Finish/);capture.consume({type:'finished',generation:'one',frame:1058,ended:{frame:1050,fadeFrames:8}});
 const record=capture.snapshot();assert.deepEqual(record.events,[{frame:0,order:1,body:0,position:1,velocity:.5}]);assert.deepEqual(record.contacts,[{body:0,zone:0,strength:1,start:10,order:2,end:50},{body:1,zone:0,strength:0,start:20,order:3,end:50}]);assert.deepEqual(record.ended,{frame:50,fadeFrames:8});assert.equal(capture.stats.rejected,2);assert.equal(capture.state,'complete');canonicalRestRecord(record,recipe);
 record.events[0].velocity=1;assert.equal(capture.snapshot().events[0].velocity,.5);
});
test('a contact before a strike starts the timeline; a redundant release does not',()=>{
 const capture=createRestCapture(recipe,{generation:'one'});send(capture,[ack(0,100,{kind:'contact',body:0,zone:null}),ack(1,200,{kind:'contact',body:0,zone:0,strength:0}),ack(2,220,{kind:'strike',body:0,position:0,velocity:.5}),ack(3,250,{kind:'quiet',fadeFrames:8})]);capture.consume({type:'finished',generation:'one',frame:258,ended:{frame:250,fadeFrames:8}});assert.equal(capture.originFrame,200);assert.equal(capture.snapshot().events[0].frame,20);
});
test('missing, duplicated or contradictory acknowledgements cannot yield a valid capture',()=>{
 for(const broken of [ack(1,0,{kind:'strike',body:0,position:1,velocity:.5}),{...ack(0,0,{kind:'strike',body:0,position:1,velocity:.5}),lateByFrames:1}]){const capture=createRestCapture(recipe,{generation:'one'});assert.throws(()=>send(capture,[broken]),/acknowledgement/);assert.equal(capture.state,'error');assert.throws(()=>capture.snapshot());}
 const capture=createRestCapture(recipe,{generation:'one'}),first=ack(0,0,{kind:'strike',body:0,position:1,velocity:.5});send(capture,[first]);assert.throws(()=>send(capture,[first]),/acknowledgement/);
});
