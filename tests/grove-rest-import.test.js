import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe,renderRestRecord} from '../src/score/grove-rest.js';
import {parseRestImport,prepareRestImport} from '../src/grove/rest-import.js';
import {readRestFile,REST_IMPORT_MAX_BYTES} from '../src/grove/read-rest-file.js';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),undefined,{sampleRate:8000});
const record={version:2,kind:'imagimusic-grove-rest',grove:recipe.grove,voice:recipe.voice,sampleRate:recipe.sampleRate,outputGain:recipe.outputGain,zones:recipe.zones,strengths:recipe.strengths,events:[{frame:0,order:0,body:0,position:2,velocity:.55}],contacts:[{body:1,zone:1,strength:0,start:80,end:600,order:1}],ended:{frame:800,fadeFrames:200}};
const text=JSON.stringify(record);
test('reopened passage preserves exact PCM, gestures, configuration and picture endpoint',()=>{
 const result=prepareRestImport(text,{fps:30});
 assert.deepEqual(result.record,record);assert.deepEqual(result.pcm,renderRestRecord(record,recipe));
 assert.equal(result.picture.duration,1000/8000);assert.equal(result.picture.frames.at(-1).time,1000/8000);
 assert.equal(JSON.stringify(record),text);
});
test('reader bounds work before recipe construction, and never accepts another study kind',()=>{
 for(const patch of [{kind:'imagimusic-forced-study'},{sampleRate:1e9},{ended:null},{ended:{frame:1e12,fadeFrames:200}},{ended:{frame:800,fadeFrames:1e12}},{zones:Array(500).fill(.5)},{strengths:Array(500).fill('light')},{events:[]}])assert.throws(()=>parseRestImport(JSON.stringify({...record,...patch})));
 assert.throws(()=>parseRestImport('x'.repeat(REST_IMPORT_MAX_BYTES+1)),/256 KiB/);
 assert.throws(()=>parseRestImport('{broken'),/valid gesture JSON/);
});
test('canonical and admission validation reject changed gain and inadmissible strikes',()=>{
 assert.throws(()=>prepareRestImport(JSON.stringify({...record,outputGain:1})),/sample rate or gain/);
 assert.throws(()=>prepareRestImport(JSON.stringify({...record,contacts:[],events:Array.from({length:20},(_,order)=>({...record.events[0],order,velocity:1}))})),/would have been rejected/);
});
test('file intake bounds bytes before reading and cancels a read already in flight',async()=>{
 let reads=0;const bytes=new TextEncoder().encode(text);const file={name:'passage.json',size:bytes.length,arrayBuffer:async()=>{reads++;return bytes.buffer;}};
 assert.deepEqual(await readRestFile(file),{name:'passage.json',text});
 await assert.rejects(readRestFile({...file,size:REST_IMPORT_MAX_BYTES+1}),/256 KiB/);assert.equal(reads,1);
 const controller=new AbortController();let finish;
 const pending=readRestFile({...file,arrayBuffer:()=>new Promise(resolve=>{finish=resolve;})},{signal:controller.signal});controller.abort();finish(bytes.buffer);
 await assert.rejects(pending,{name:'AbortError'});
 await assert.rejects(readRestFile({...file,arrayBuffer:async()=>new ArrayBuffer(1)}),/size changed/);
});
