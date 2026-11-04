import test from 'node:test';import assert from 'node:assert/strict';
import {readLivingRecipeFile} from '../src/living/recipe-file.js';
import {createLivingRecord} from '../src/living/record.js';
import {createTineDesign} from '../src/tine/address.js';
const record=createLivingRecord({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:137,strength:.1}],fadeStart:50003},{cameraMotion:false,reveal:false});
test('downloaded pretty JSON recipe restores exact source and presentation without relying on MIME or filename',async()=>{
 assert.deepEqual(await readLivingRecipeFile(new Blob([JSON.stringify(record,null,2)],{type:'application/octet-stream'})),record);
});
test('bounded reader refuses oversized files before reading and refuses manifests, malformed JSON and unsupported recipes',async()=>{
 let read=false;await assert.rejects(readLivingRecipeFile({size:8193,text:async()=>{read=true;return '{}';}}));assert.equal(read,false);
 await assert.rejects(readLivingRecipeFile({size:2,text:async()=>'é'.repeat(5000)}));
 for(const value of [null,{...record,version:3},{...record,gain:8},{...record,source:{...record.source,events:[]}}])await assert.rejects(readLivingRecipeFile(new Blob([JSON.stringify(value)])));
 await assert.rejects(readLivingRecipeFile(new Blob(['{'])));await assert.rejects(readLivingRecipeFile(new Blob([JSON.stringify({kind:'imagimusic-living-movie'})])),/film manifest/);
 await assert.rejects(readLivingRecipeFile({size:2,text:async()=>{throw Error('read failed');}}),/read failed/);
});

test('shared opener accepts paired files while retaining the original recipe size boundary',async()=>{
 const {readLivingKeptFile}=await import('../src/living/recipe-file.js');
 const {createLivingExploration}=await import('../src/living/exploration-record.js');
 const response={...record.source,design:{...record.source.design,lengthMm:95}};
 const pair=createLivingExploration(record,response);
 assert.deepEqual(await readLivingKeptFile(new Blob([JSON.stringify(pair)])),pair);
 assert.deepEqual(await readLivingKeptFile(new Blob([JSON.stringify(record)])),record);
 assert.deepEqual(await readLivingKeptFile(new Blob([JSON.stringify(pair)+' '.repeat(8500)])),pair);
 await assert.rejects(readLivingKeptFile(new Blob([JSON.stringify(record)+' '.repeat(8500)])),/8 KiB/);
 await assert.rejects(readLivingKeptFile({size:2,text:async()=>'é'.repeat(9000)}),/too large/);
 await assert.rejects(readLivingKeptFile(new Blob([JSON.stringify({kind:'imagimusic-living-movie'})])),/film manifest/);
 await assert.rejects(readLivingKeptFile(new Blob([JSON.stringify({...pair,response:null})])));
});
