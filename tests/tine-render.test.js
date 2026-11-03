import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineImpulse} from '../src/tine/impulse.js';
import {renderTineImpulse,TINE_PICKUP_GAIN} from '../src/tine/render.js';
const geometry={kind:'beam',support:'clamped-free',lengthM:.08,thicknessM:.001,widthM:.01,material:{E:200e9,rho:7850,eta:.0002}};
const options={sampleRate:16000,seconds:.1,activation:.85,pickup:.3};
test('PCM follows the SI velocity field and explicit fade; width and polarity survive fixed gain',()=>{
 const pcm=renderTineImpulse(geometry,options),strike=createTineImpulse(geometry).strike({activation:options.activation});
 const wide=renderTineImpulse({...geometry,widthM:.02},options),negative=renderTineImpulse(geometry,{...options,impulseNs:-1e-6});
 for(let i=0;i<pcm.frames;i++){
  const fade=Math.min(1,(pcm.frames-1-i)/pcm.fadeFrames);
  assert.equal(pcm.channels[0][i],Math.fround(TINE_PICKUP_GAIN*strike.pointState(i/options.sampleRate,options.pickup).velocityMPerS*fade));
  assert.equal(wide.channels[0][i],pcm.channels[0][i]/2);
  assert.equal(negative.channels[0][i],-pcm.channels[0][i]);
  assert.ok(Math.abs(pcm.channels[0][i])<=pcm.outputBound);
 }
 assert.equal(pcm.channels[0].at(-1),0);assert.equal(wide.pickupGain,pcm.pickupGain);
 const silent=renderTineImpulse(geometry,{...options,activation:0});assert.ok(silent.channels[0].every(x=>x===0));assert.equal(silent.pickupGain,pcm.pickupGain);
});
test('invalid or excessive playback requests refuse rather than drop modes, clip or normalize',()=>{
 assert.throws(()=>renderTineImpulse(geometry,{...options,sampleRate:8000}),/retained mode/);
 assert.throws(()=>renderTineImpulse(geometry,{...options,impulseNs:1e-4}),/headroom/);
 for(const extra of [{seconds:NaN},{seconds:9},{sampleRate:48000.1},{pickup:NaN},{pickup:-.1}])assert.throws(()=>renderTineImpulse(geometry,{...options,...extra}));
 const three=renderTineImpulse(geometry,{...options,sampleRate:8000,count:3});assert.equal(three.frequenciesHz.length,3);
});

test('every displayed dimension and position fits the fixed gain and 48 kHz mode guard',async()=>{
 const {studyTineRange}=await import('../tools/study-tine-range.mjs');
 const report=studyTineRange();
 assert.equal(report.configurations,91728);assert.ok(report.withinHeadroom);assert.ok(report.withinAliasGuard);
 const peak=report.maxDigitalVelocityBound;
 const pcm=renderTineImpulse({...geometry,lengthM:peak.length/1000,widthM:peak.width/1000},{activation:peak.activation,pickup:peak.pickup,sampleRate:48000,seconds:.05});
 assert.equal(pcm.outputBound,peak.value);
 assert.ok(Math.max(...pcm.channels[0].map(Math.abs))<=.8);
});
