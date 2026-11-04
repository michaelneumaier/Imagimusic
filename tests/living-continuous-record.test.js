import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createContinuousTineScheduler} from '../src/living/continuous-tine-scheduler.js';
import {CONTINUOUS_TINE_RECORD_LIMIT,validateContinuousTineRecord,readContinuousTineRecord,renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
const base=(sampleRate=48000)=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign(),sampleRate,events:[],fadeStart:0});

for(const sampleRate of [44100,48000])test(`twelve-second score and optional guests reconstruct exactly at ${sampleRate}Hz`,()=>{
 const source=base(sampleRate),{geometry,options}=requestForTineDesign(source.design),scheduler=createContinuousTineScheduler(geometry,{...options,sampleRate});
 const fadeFrames=Math.round(.025*sampleRate);source.fadeStart=12*sampleRate;
 const expected=new Float32Array(source.fadeStart+fadeFrames);
 const remember=events=>source.events.push(...events.map(({frame,strength,origin})=>({frame,strength,origin})));
 for(let second=0;second<12;second++){
  const start=second*sampleRate;
  scheduler.schedule([{frame:start,strength:.05},{frame:start+Math.round(.4*sampleRate),strength:-.025}]);
  if(second%3===0)remember(scheduler.tryGuest(.025).events);
  for(let frame=start;frame<start+sampleRate;frame+=137)remember(scheduler.process(expected.subarray(frame,Math.min(frame+137,start+sampleRate))));
 }
 // Include an accepted touch exactly at the beginning of the ending.
 remember(scheduler.tryGuest(.05).events);
 remember(scheduler.process(expected.subarray(source.fadeStart)));
 for(let i=0;i<fadeFrames;i++)expected[source.fadeStart+i]*=(fadeFrames-1-i)/(fadeFrames-1);
 const rendered=renderContinuousTineRecord(source);
 assert.deepEqual(rendered.channels[0],expected);assert.ok(expected.at(-1)===0);
 const {queue,...state}=scheduler.snapshot();assert.deepEqual(rendered.snapshot,state);
 assert.ok(source.events.some(e=>e.frame>8*sampleRate));assert.equal(queue.length,0);
 assert.deepEqual(readContinuousTineRecord(JSON.stringify(source)),rendered.record);
 source.events[0].strength=.1;assert.equal(rendered.record.events[0].strength,.05);
 assert.ok(Object.isFrozen(rendered.record.events[0]));
 rendered.snapshot.modes[0].velocityMPerS=999;
 assert.notEqual(renderContinuousTineRecord(rendered.record).snapshot.modes[0].velocityMPerS,999);
});

test('strict capture boundaries reject malformed or physically inadmissible histories',()=>{
 const event={frame:0,strength:.1,origin:'score'};
 const invalid=[{extra:true},{version:2},{sampleRate:7999},{sampleRate:48000.5},{fadeStart:-1},{fadeStart:60*48000-1199},
  {events:Array(4097).fill(event)}, {events:[{...event,strength:0}]},{events:[{...event,strength:NaN}]},
  {events:[{...event,origin:'unknown'}]},{events:[{...event,index:0}]},{events:[{...event,frame:1}]},
  {fadeStart:10,events:[{...event,frame:5},event]}, {events:Array(4096).fill(event)}];
 for(const replacement of invalid){const value={...base(),...replacement};assert.throws(()=>validateContinuousTineRecord(value));assert.throws(()=>renderContinuousTineRecord(value));}
 assert.throws(()=>readContinuousTineRecord('{'));
 assert.throws(()=>readContinuousTineRecord(' '.repeat(CONTINUOUS_TINE_RECORD_LIMIT+1)),/limit/);
 assert.throws(()=>readContinuousTineRecord('é'.repeat(CONTINUOUS_TINE_RECORD_LIMIT/2+1)),/limit/);
});

test('empty and sixty-second captures have explicit output endings',()=>{
 const empty=renderContinuousTineRecord(base());assert.equal(empty.frames,1200);assert.ok(empty.channels[0].every(x=>x===0));
 const source={...base(),fadeStart:60*48000-1200,events:[{frame:0,strength:.025,origin:'score'}]};
 const rendered=renderContinuousTineRecord(source);assert.equal(rendered.seconds,60);assert.equal(rendered.channels[0].at(-1),0);
 assert.equal(rendered.snapshot.frame,60*48000);assert.equal(rendered.snapshot.accepted,1);
});
