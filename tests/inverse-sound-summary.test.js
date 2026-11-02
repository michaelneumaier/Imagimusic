import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeInverseSound} from '../src/inverse/sound-summary.js';
const source=channels=>({channels:channels.map(c=>Float64Array.from(c)),sampleRate:8000,frameCount:channels[0].length,duration:channels[0].length/8000,encoding:'float32',peak:Math.max(...channels.flat().map(Math.abs)),atOrAboveUnitySamples:0});
test('waveform intervals cover every frame and retain channel differences',()=>{
 const input=source([[1,-2,3,-4,5],[.1,.2,.3,.4,.5]]),before=input.channels.map(x=>x.slice()),r=summarizeInverseSound(input,2);
 assert.deepEqual([...r.waveforms[0].minimum],[-2,-4]);assert.deepEqual([...r.waveforms[0].maximum],[3,5]);assert.deepEqual([...r.waveforms[1].minimum],[.1,.4]);assert.deepEqual([...r.waveforms[1].maximum],[.3,.5]);
 assert.equal(r.waveforms[0].mean,.6);assert.equal(r.waveforms[0].rms,Math.sqrt(11));assert.equal(r.peak,5);assert.deepEqual(input.channels,before);
});
test('short and silent files keep finite intervals and reject invalid bucket limits',()=>{
 const input=source([[0]]),r=summarizeInverseSound(input);assert.deepEqual([...r.waveforms[0].minimum],[0]);assert.equal(r.waveforms[0].rms,0);
 for(const n of [0,-1,1.5,2049,NaN])assert.throws(()=>summarizeInverseSound(input,n));
});
