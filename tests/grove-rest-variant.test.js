import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe,recipeForRecord,renderRestRecord} from '../src/score/grove-rest.js';
import {prepareRestVariant} from '../src/grove/rest-variant.js';
function capture(seed=3,strikes=1){
 const r=createGroveRestRecipe(composeGrove({seed}),undefined,{sampleRate:8000});
 return {version:2,kind:'imagimusic-grove-rest',grove:r.grove,voice:r.voice,sampleRate:r.sampleRate,outputGain:r.outputGain,zones:r.zones,strengths:r.strengths,events:Array.from({length:strikes},(_,order)=>({frame:0,order,body:0,position:2,velocity:1})),contacts:[{body:1,zone:1,strength:0,start:80,end:600,order:strikes}],ended:{frame:800,fadeFrames:200}};
}
test('explicit same-seed structural variation keeps every gesture and reconstructs from its record',()=>{
 const original=capture(),before=structuredClone(original),target=structuredClone(original.grove);target.bridges[0].coupling*=1.2;
 const result=prepareRestVariant(original,target,{fps:30});
 assert.deepEqual(original,before);assert.deepEqual(result.record.events,original.events);assert.deepEqual(result.record.contacts,original.contacts);assert.deepEqual(result.record.ended,original.ended);
 assert.equal(result.record.grove.seed,original.grove.seed);assert.notEqual(result.sourceIdentity,result.targetIdentity);assert.equal(result.record.grove.bridges[0].coupling,target.bridges[0].coupling);
 const pcm=renderRestRecord(result.record,recipeForRecord(result.record));assert.deepEqual(pcm.channels,result.pcm.channels);assert.equal(result.picture.duration,1000/8000);
 const baseline=renderRestRecord(original,recipeForRecord(original));assert.ok(result.pcm.channels[0].some((v,i)=>v!==baseline.channels[0][i]));
 target.bridges[0].coupling*=1.1;assert.notEqual(target.bridges[0].coupling,result.record.grove.bridges[0].coupling,'result owns its target snapshot');
});
test('identical structures, empty passages and any dropped strike refuse an audition pair',()=>{
 const original=capture();assert.throws(()=>prepareRestVariant(original,original.grove),/unchanged/);
 assert.throws(()=>prepareRestVariant(capture(3,0),composeGrove({seed:7})),/at least one strike/);
 const crowded=capture(11,11),before=structuredClone(crowded);assert.throws(()=>prepareRestVariant(crowded,composeGrove({seed:3})),/every saved strike/);assert.deepEqual(crowded,before);
});
