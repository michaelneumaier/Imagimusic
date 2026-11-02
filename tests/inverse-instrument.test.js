import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove,groveSystem,groveEnvelope} from '../src/score/grove.js';
import {networkStrikeResponse} from '../src/coupling.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';

test('candidate sound and picture follow the searched three-mass model at the same times, with fixed cross-candidate scale',()=>{
 for(const seed of [3,7,11]){
  const grove=composeGrove({seed}),system=groveSystem(grove),voice=createInverseInstrument(grove,{sampleRate:8000});
  assert.equal(voice.outputGain,8);assert.equal(voice.impulseNs,.01);
  assert.deepEqual(voice.normalFrequenciesHz,system.normalFreqsHz);
  for(const body of [0,1,2]){
   const response=networkStrikeResponse(system,[0,1,2].map(i=>i===body?.01:0)),rendered=voice.renderStrike(body);
   assert.equal(rendered.channels[0].length,voice.frames);assert.equal(rendered.channels[1].length,voice.frames);
   assert.ok(rendered.peak>0&&rendered.peak<=voice.singleStrikePeakBound*(1+1e-6));
   for(const frame of [0,1,17,801,voice.ringFrames-1,voice.ringFrames,voice.frames-2,voice.frames-1]){
    const t=frame/voice.sampleRate,state=voice.frame(body,t),physical=response.x(t),envelope=groveEnvelope(system,response,t);
    for(let channel=0;channel<2;channel++){
     const expected=Math.fround(8*physical[voice.pickupBodies[channel]]*state.fade);
     assert.ok(Math.abs(rendered.channels[channel][frame]-expected)<1e-9,'samples match independent full physical response');
    }
    for(let i=0;i<3;i++){assert.equal(state.displacement[i],physical[i]*state.fade);assert.equal(state.envelope[i],envelope[i]*state.fade);}
   }
   assert.deepEqual(voice.frame(body,voice.duration).envelope,[0,0,0]);
   assert.equal(rendered.channels[0].at(-1),0);
  }
 }
});

test('prepared identity is immutable and buffers are separate; malformed requests refuse before rendering',()=>{
 const grove=composeGrove({seed:3}),voice=createInverseInstrument(grove,{sampleRate:8000});
 grove.bodies[0].mass=.04;
 assert.notEqual(voice.grove.bodies[0].mass,grove.bodies[0].mass);
 assert.throws(()=>{voice.grove.bodies[0].mass=.04;},TypeError);
 const a=voice.renderStrike(0),b=voice.renderStrike(0);assert.deepEqual(a.channels,b.channels);
 a.channels[0][1]=1;assert.notEqual(a.channels[0][1],b.channels[0][1]);
 assert.throws(()=>voice.renderStrike(3));assert.throws(()=>voice.renderStrike('0'));
 assert.throws(()=>voice.frame(0,NaN));assert.throws(()=>voice.frame(0,-1));assert.throws(()=>voice.frame(0,voice.duration+1));
 for(const options of [null,[],{sampleRate:Infinity},{sampleRate:8000.1},{sampleRate:192000},{gain:1}])assert.throws(()=>createInverseInstrument(grove,options));
});
