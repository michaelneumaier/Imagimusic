import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineLivePass} from '../src/tine/live-pass.js';
import {validateTineLiveRecord,tineLiveRecordFromFinished,renderTineLiveRecord} from '../src/tine/live-record.js';
const design=createTineDesign({lengthMm:105,widthMm:7,activation:.3,pickup:.75});
const raw=(extra={})=>({kind:'imagimusic-tine-live',version:1,design,sampleRate:48000,events:[{frame:13,strength:.1}],fadeStart:382800,...extra});
test('finished applied-frame records reconstruct every sample across rates, partitioning and early endings',()=>{
 for(const rate of [44100,48000,96000])for(const early of [false,true]){
  const {geometry,options}=requestForTineDesign(design),pass=createTineLivePass(geometry,{...options,sampleRate:rate});pass.start();
  const end=early?17039:8*rate-Math.round(.025*rate),output=new Float32Array(end+Math.round(.025*rate));
  const advance=target=>{while(pass.frame<target)pass.process(output.subarray(pass.frame,Math.min(target,pass.frame+257)));};
  for(const event of [{frame:13,strength:.1},{frame:12032,strength:.2},{frame:12032,strength:-.1},{frame:16001,strength:.1}]){advance(event.frame);pass.strike(event.strength);}
  advance(end);if(early)pass.quiet();advance(output.length);
  const record=tineLiveRecordFromFinished({design,sampleRate:rate,snapshot:pass.snapshot()}),replay=renderTineLiveRecord(record);
  assert.deepEqual(replay.channels[0],output);assert.deepEqual(replay.snapshot,pass.snapshot());assert.ok(output.at(-1)===0);
 }
});
test('silence, simultaneous cancellation and a touch immediately before same-frame Quiet remain exact',()=>{
 for(const events of [[],[{frame:0,strength:.1},{frame:0,strength:-.1}]])assert.ok(renderTineLiveRecord(raw({events,fadeStart:0})).channels[0].every(x=>x===0));
 const output=renderTineLiveRecord(raw({events:[{frame:0,strength:.1}],fadeStart:0}));assert.notEqual(output.channels[0][0],0);assert.equal(output.channels[0].at(-1),0);
});
test('records copy their source and refuse malformed schema, timing, budgets and incomplete finishes',()=>{
 const source=raw(),record=validateTineLiveRecord(source);source.events[0].frame=99;assert.equal(record.events[0].frame,13);assert.ok(Object.isFrozen(record.events[0]));
 for(const invalid of [raw({extra:0}),raw({version:2}),raw({sampleRate:NaN}),raw({sampleRate:undefined}),raw({events:[{frame:0,strength:undefined}]}),raw({fadeStart:-1}),raw({fadeStart:384000}),raw({events:[{frame:14,strength:.1},{frame:13,strength:.1}]}),raw({events:[{frame:192001,strength:.1}]}),raw({fadeStart:12}),raw({events:[{frame:0,strength:Infinity}]}),raw({events:[{frame:0,strength:.1,extra:1}]}),raw({events:Array.from({length:9},()=>({frame:0,strength:.1}))})])assert.throws(()=>validateTineLiveRecord(invalid));
 assert.throws(()=>validateTineLiveRecord(raw({design:createTineDesign({lengthMm:60,widthMm:5,activation:1,pickup:1}),events:Array.from({length:8},()=>({frame:0,strength:1}))})));
 assert.throws(()=>tineLiveRecordFromFinished({design,sampleRate:48000,snapshot:{state:'ending'}}));
});
