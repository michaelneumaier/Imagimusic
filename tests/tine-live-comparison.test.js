import test from 'node:test';import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {createTineLiveComparison,renderTineLiveComparison} from '../src/tine/live-comparison.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const source=(extra={})=>({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:137,strength:.1},{frame:137,strength:-.05},{frame:45679,strength:.1},{frame:96001,strength:.1}],fadeStart:140003,...extra});
test('the same performed phrase on twice the width preserves every frame and halves every fixed-gain sample',()=>{
 const record=source(),before=structuredClone(record),pair=renderTineLiveComparison(record,{lengthMm:80,widthMm:20});
 assert.deepEqual(record,before);assert.deepEqual(pair.original.channels,renderTineLiveRecord(record).channels);
 assert.deepEqual(pair.candidate.record.events,record.events);assert.equal(pair.candidate.frames,pair.original.frames);assert.equal(pair.candidate.sampleRate,pair.original.sampleRate);
 for(let i=0;i<pair.original.frames;i++)assert.equal(pair.candidate.channels[0][i],pair.original.channels[0][i]/2);
 assert.equal(pair.candidate.record.design.activation,.85);assert.equal(pair.candidate.record.design.pickup,.85);
});
test('length changes the sound while preserving the original and the exact gesture/ending, including simultaneous events',()=>{
 const record=source(),pair=renderTineLiveComparison(record,{lengthMm:105,widthMm:10});
 assert.deepEqual(pair.original.record,record);assert.deepEqual(pair.candidate.record.events,record.events);assert.equal(pair.candidate.record.fadeStart,record.fadeStart);assert.notDeepEqual(pair.candidate.channels,pair.original.channels);
 const identity=renderTineLiveComparison(record,{lengthMm:80,widthMm:10});assert.deepEqual(identity.original.channels,identity.candidate.channels);
 const copy=createTineLiveComparison(record,{lengthMm:105,widthMm:10});record.events[0].frame=0;assert.equal(copy.original.events[0].frame,137);assert.equal(copy.candidate.events[0].frame,137);
});
test('candidate admission refuses a rate or headroom failure without altering the source or dropping touches',()=>{
 const low=source({design:createTineDesign({lengthMm:120,widthMm:20}),sampleRate:8000,events:[{frame:0,strength:.1}],fadeStart:60000}),before=structuredClone(low);
 assert.throws(()=>createTineLiveComparison(low,{lengthMm:60,widthMm:20}),/sample-rate/);assert.deepEqual(low,before);
 for(const dimensions of [{lengthMm:80},{lengthMm:80,widthMm:10,pickup:0},{lengthMm:'80',widthMm:10},{lengthMm:80,widthMm:4}])assert.throws(()=>createTineLiveComparison(source(),dimensions));
 const strong=source({design:createTineDesign({lengthMm:120,widthMm:20,activation:1,pickup:1}),events:Array.from({length:8},(_,i)=>({frame:i*100,strength:1}))});
 // First establish that the original is admissible; refusal must belong to the candidate.
 renderTineLiveRecord(strong);assert.throws(()=>createTineLiveComparison(strong,{lengthMm:60,widthMm:5}),/headroom/);
});
