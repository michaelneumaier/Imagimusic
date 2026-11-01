import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe,recipeForRecord,renderRestRecord,adaptGroveByExchange} from '../src/score/grove-rest.js';
import {prepareRestAdaptation} from '../src/grove/rest-adaptation.js';
function record(){const r=createGroveRestRecipe(composeGrove({seed:3}),undefined,{sampleRate:8000});return {version:2,kind:'imagimusic-grove-rest',grove:r.grove,voice:r.voice,sampleRate:r.sampleRate,outputGain:r.outputGain,zones:r.zones,strengths:r.strengths,events:[{frame:0,order:0,body:0,position:1,velocity:.4},{frame:248,order:1,body:1,position:2,velocity:.4}],contacts:[{body:0,zone:0,strength:0,start:640,end:1200,order:2}],ended:{frame:3200,fadeFrames:200}};}
test('saved-gesture adaptation retains the original and builds one reproducible same-gesture pair',()=>{
 const source=record(),text=JSON.stringify(source),pair=prepareRestAdaptation(text);
 assert.deepEqual(pair.original.record,source);assert.deepEqual(pair.changed.record.events,source.events);assert.deepEqual(pair.changed.record.contacts,source.contacts);assert.deepEqual(pair.changed.record.ended,source.ended);assert.equal(pair.changed.record.outputGain,source.outputGain);
 assert.deepEqual(pair.changed.record.grove,adaptGroveByExchange(source.grove,pair.exchange,{k:.5}));
 for(const item of [pair.original,pair.changed])assert.deepEqual(item.pcm.channels,renderRestRecord(item.record,recipeForRecord(item.record)).channels);
 assert.equal(pair.rule.steps,1);assert.equal(pair.original.pcm.channels[0].length,3400);assert.equal(JSON.stringify(source),text);
});
test('experimental limits refuse oversized work before recipe validation and never resample',()=>{
 const source=record();source.sampleRate=96000;source.outputGain=-1;
 assert.throws(()=>prepareRestAdaptation(JSON.stringify(source)),/48 kHz or below/);
 source.sampleRate=8000;source.ended.frame=20*8000;
 assert.throws(()=>prepareRestAdaptation(JSON.stringify(source)),/up to 20 seconds/);
});
