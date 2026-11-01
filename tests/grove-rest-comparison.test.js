import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe,renderRestRecord,recipeForRecord,validateRestAdmission} from '../src/score/grove-rest.js';
import {prepareRestComparison} from '../src/grove/rest-comparison.js';

function recordFor(recipe,{strikes=1}={}){
 return {version:2,kind:'imagimusic-grove-rest',grove:recipe.grove,voice:recipe.voice,sampleRate:recipe.sampleRate,outputGain:recipe.outputGain,zones:recipe.zones,strengths:recipe.strengths,
  events:Array.from({length:strikes},(_,order)=>({frame:0,order,body:0,position:2,velocity:1})),
  contacts:[{body:1,zone:1,strength:0,start:80,end:600,order:strikes}],ended:{frame:800,fadeFrames:200}};
}
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}

test('comparison preserves the frozen source and gesture parameters while sound and picture use the chosen grove',()=>{
 const source=createGroveRestRecipe(composeGrove({seed:3}),undefined,{sampleRate:8000,zones:[.2,.55,.9],strengths:{Light:8,Firm:42}});
 const record=freeze(recordFor(source)),before=JSON.stringify(record),original=renderRestRecord(record,source);
 const result=prepareRestComparison(record,7,{fps:30});
 assert.equal(JSON.stringify(record),before);assert.equal(result.sourceSeed,3);assert.equal(result.record.grove.seed,7);
 assert.equal(result.available,true);assert.equal(result.complete,true);assert.equal(result.dropped.length,0);
 assert.deepEqual(result.record.events,record.events);assert.deepEqual(result.record.contacts,record.contacts);
 assert.deepEqual(result.record.zones,record.zones);assert.deepEqual(result.record.strengths,record.strengths);assert.deepEqual(result.record.voice,record.voice);
 assert.equal(result.pcm.channels[0].length,1000);assert.equal(result.picture.duration,1000/8000);
 assert.ok(result.pcm.channels[0].some((sample,i)=>sample!==original.channels[0][i]));
 const rebuilt=recipeForRecord(result.record);validateRestAdmission(result.record,rebuilt);
 const pcm=renderRestRecord(result.record,rebuilt);assert.deepEqual(result.pcm.channels,pcm.channels,'saved target alone reconstructs its soundtrack');
});

test('an admissible source can lose strikes in another grove; omissions are explicit and remaining gestures re-admit',()=>{
 const source=createGroveRestRecipe(composeGrove({seed:11}),undefined,{sampleRate:8000});
 const record=recordFor(source,{strikes:11}),before=JSON.stringify(record);validateRestAdmission(record,source);
 const result=prepareRestComparison(record,3);
 assert.equal(result.record.events.length,6);assert.equal(result.dropped.length,5);assert.match(result.note,/5 of 11 strikes.*left out/);assert.equal(result.complete,false);
 assert.equal(JSON.stringify(record),before);assert.deepEqual(result.record.contacts,record.contacts);
 validateRestAdmission(result.record,recipeForRecord(result.record));
 assert.deepEqual(result.record.events,record.events.slice(0,6),'accepted strengths and times are not softened or moved');
});

test('comparison rejects unknown or identical destinations, impossible source gestures, and an empty passage',()=>{
 const source=createGroveRestRecipe(composeGrove({seed:3}),undefined,{sampleRate:8000}),record=recordFor(source);
 assert.throws(()=>prepareRestComparison(record,3),/different grove/);assert.throws(()=>prepareRestComparison(record,99),/available groves/);
 assert.throws(()=>prepareRestComparison(recordFor(source,{strikes:20}),7),/would have been rejected/);
 assert.throws(()=>prepareRestComparison(recordFor(source,{strikes:0}),7),/at least one strike/);
});
