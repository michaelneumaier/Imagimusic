import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,restRecordVisual} from '../src/score/grove-rest.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
import {createRestReplayPicture,restReplayFrame} from '../src/grove/rest-replay-picture.js';
test('replay pictures agree with shared model at sampled times and preserve exact terminal silence',()=>{
 const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000,zones:[.6]});const capture=createRestCapture(recipe,{generation:'test'});
 const events=[{kind:'strike',frame:0,body:0,position:0,velocity:.5},{kind:'contact',frame:100,body:1,zone:0,strength:1},{kind:'quiet',frame:800,fadeFrames:200}];capture.consume({type:'processed',generation:'test',events:events.map((event,order)=>({id:String(order),order,requestedFrame:event.frame,appliedFrame:event.frame,lateByFrames:0,accepted:true,event:{...event,id:String(order)}}))});capture.consume({type:'finished',generation:'test',frame:1000,ended:{frame:800,fadeFrames:200}});
 const record=capture.snapshot(),before=JSON.stringify(record),picture=createRestReplayPicture(record,recipe),model=restRecordVisual(record,recipe);
 for(const time of [.09,0,.124,.02,.125,99]){const actual=restReplayFrame(picture,time),sampled=time>=picture.duration?picture.duration:Math.floor(time*60)/60;assert.deepEqual(actual,model.visual(sampled));}
 assert.ok(restReplayFrame(picture,.04).contacts[1]);assert.deepEqual(restReplayFrame(picture,99).envelope,[0,0,0]);assert.equal(JSON.stringify(record),before);
});
