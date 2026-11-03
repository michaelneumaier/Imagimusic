import test from 'node:test';
import assert from 'node:assert/strict';
import {tineFloatWav} from '../src/tine/wav.js';
import {parseInverseSound} from '../src/inverse/sound-file.js';
import {createTineDesign} from '../src/tine/address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
test('export preserves every completed-pass sample, rate and ending without changing its record',()=>{
 for(const sampleRate of [44100,48000,96000]){
  const pcm=renderTineLiveRecord({kind:'imagimusic-tine-live',version:1,design:createTineDesign({lengthMm:80,widthMm:10,activation:.85,pickup:.85}),sampleRate,events:[{frame:13,strength:.1}],fadeStart:17039});
  const before=structuredClone(pcm),bytes=tineFloatWav(pcm),decoded=parseInverseSound(bytes);
  assert.equal(decoded.encoding,'float32');assert.equal(decoded.sampleRate,sampleRate);assert.equal(decoded.frameCount,pcm.frames);assert.equal(decoded.channels.length,1);
  assert.deepEqual(decoded.channels[0],Float64Array.from(pcm.channels[0]));assert.ok(decoded.channels[0].at(-1)===0);assert.deepEqual(pcm,before);
 }
});
test('float export retains tiny signed samples and refuses invalid layouts',()=>{
 const channels=[new Float32Array([1e-12,-1e-12,-0,0])];
 assert.deepEqual(parseInverseSound(tineFloatWav({sampleRate:48000,channels})).channels[0],Float64Array.from(channels[0]));
 for(const value of [{sampleRate:NaN,channels},{sampleRate:48000,channels:[]},{sampleRate:48000,channels:[channels[0],channels[0]]},{sampleRate:48000,channels:[new Float32Array([NaN])]},{sampleRate:8000,channels:[new Float32Array(64001)]}])assert.throws(()=>tineFloatWav(value));
});
