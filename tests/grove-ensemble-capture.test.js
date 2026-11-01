import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,renderRestRecord} from '../src/score/grove-rest.js';
import {ensemblePartsFromAcknowledgements} from '../src/grove/ensemble-capture.js';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000,zones:[.6]}),recipes=[recipe,recipe,recipe];
const ack=(order,requestedFrame,appliedFrame,event)=>({id:String(order),order,requestedFrame,appliedFrame,lateByFrames:appliedFrame-requestedFrame,accepted:true,event:{id:String(order),frame:requestedFrame,...event}});
function fixture(){
 const ending={frame:3000,fadeFrames:8},quiet=order=>ack(order,3000,3000,{kind:'quiet',fadeFrames:8});
 const acknowledgements=[
  [ack(0,990,1000,{kind:'strike',body:0,position:1,velocity:.5}),quiet(1)],
  [ack(0,1500,1500,{kind:'contact',body:1,zone:0,strength:1}),quiet(1)],
  [quiet(0)]
 ];
 return {generation:'one',acknowledgements,finished:{type:'finished',generation:'one',origin:1000,ended:ending,frame:3008,parts:acknowledgements.map((events,part)=>({part,accepted:events.length,refused:0,ended:{...ending}}))}};
}
test('common origin follows actual late acceptance, preserving silent contact and untouched parts',()=>{
 const input=fixture(),before=structuredClone(input),result=ensemblePartsFromAcknowledgements(recipes,input);
 assert.deepEqual(input,before);assert.equal(result.originFrame,1000);assert.deepEqual(result.ended,{frame:2000,fadeFrames:8});
 assert.equal(result.parts[0].events[0].frame,0);
 assert.deepEqual(result.parts[1].events,[]);assert.deepEqual(result.parts[1].contacts,[{body:1,zone:0,strength:1,start:500,end:2000,order:0}]);
 assert.deepEqual(result.parts[2].events,[]);assert.deepEqual(result.parts[2].contacts,[]);
 for(const part of result.parts)assert.deepEqual(part.ended,result.ended);
 for(const part of result.parts.slice(1))assert.ok(renderRestRecord(part,recipe).channels.every(channel=>channel.length===2008&&channel.every(value=>value===0)));
});
test('contradictory or incomplete ensemble evidence cannot become a kept record',()=>{
 for(const mutate of [
  x=>{x.finished.origin=990;},
  x=>{x.finished.parts[1].accepted=99;},
  x=>{x.finished.parts[2].ended.frame--;},
  x=>{x.acknowledgements[1].pop();},
  x=>{x.finished.generation='old';},
  x=>{x.acknowledgements[0][0].lateByFrames=0;}
 ]){
  const input=fixture();mutate(input);assert.throws(()=>ensemblePartsFromAcknowledgements(recipes,input));
 }
});
