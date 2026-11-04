import test from 'node:test';import assert from 'node:assert/strict';
import {createTineDampedRelease} from '../src/tine/damped-release.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
import {createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';
import {createLivingFragmentAnswer} from '../src/living/answer-study.js';
import {TINE_PICKUP_GAIN} from '../src/tine/render.js';
const sources=()=>createLivingGeneratedStudyFixtures().map(f=>createLivingFragmentAnswer(f.source).bodies[1]);
const close=(a,b,scale=1)=>assert.ok(Math.abs(a-b)<=scale,`${a} != ${b}`);

test('release preserves initial state and dissipates modal energy without another impulse',()=>{
 for(const source of sources()){
  const rate=source.sampleRate,startFrame=source.events.at(-1).frame+Math.round(.45*rate),t=startFrame/rate;
  const release=createTineDampedRelease(source,{startFrame}),reference=createTineDampedRelease(source,{startFrame,addedDecayRate:0});
  const initial=release.at(t),unchanged=reference.at(t);
  initial.modes.forEach((m,i)=>{close(m.displacementM,unchanged.modes[i].displacementM,1e-20);close(m.velocityMPerS,unchanged.modes[i].velocityMPerS,1e-20);});
  let prior=initial.energyJ;
  for(let step=1;step<=400;step++){
   const at=release.at(t+step/1000);assert.ok(at.energyJ<=prior*(1+1e-12));prior=at.energyJ;
   at.modes.forEach(m=>assert.ok(m.dissipationW>=0));
  }
  assert.ok(prior<reference.at(t+.4).energyJ*.0002);
  const sample=t+.123,dt=1e-8,state=release.at(sample),slope=(release.at(sample+dt).energyJ-release.at(sample-dt).energyJ)/(2*dt),loss=state.modes.reduce((sum,m)=>sum+m.dissipationW,0);
  close(slope,-loss,Math.max(1e-20,loss*1e-5));
 }
});

test('released PCM preserves every earlier sample and matches analytical velocity and final recording fade',()=>{
 for(const source of sources()){
  const startFrame=source.events.at(-1).frame+21600,release=createTineDampedRelease(source,{startFrame}),pcm=release.render(),base=renderTineLiveRecord(source),fadeFrames=Math.round(.025*source.sampleRate);
  assert.deepEqual(pcm.channels[0].subarray(0,startFrame),base.channels[0].subarray(0,startFrame));assert.equal(pcm.frames,base.frames);assert.equal(pcm.snapshot,undefined);
  for(let f=startFrame;f<pcm.frames;f+=97){let expected=Math.fround(release.at(f/pcm.sampleRate).pickupVelocityMPerS*TINE_PICKUP_GAIN);if(f>=source.fadeStart)expected=Math.fround(expected*Math.max(0,1-(f-source.fadeStart)/(fadeFrames-1)));close(pcm.channels[0][f],expected,1e-9);}
  assert.equal(Math.abs(pcm.channels[0].at(-1)),0);
  assert.deepEqual(createTineDampedRelease(source,{startFrame,addedDecayRate:0}).render(),base);
 }
});

test('release controls reject invalid timing and loss instead of silently changing the source',()=>{
 const source=sources()[0],before=structuredClone(source),last=source.events.at(-1).frame;
 for(const startFrame of [last-1,source.fadeStart+1,.5,NaN,Infinity,'48000',null])assert.throws(()=>createTineDampedRelease(source,{startFrame}));
 for(const addedDecayRate of [-1,41,NaN,Infinity,'12',null])assert.throws(()=>createTineDampedRelease(source,{startFrame:last,addedDecayRate}));
 const release=createTineDampedRelease(source,{startFrame:last});for(const t of [-1,Infinity,NaN,9])assert.throws(()=>release.at(t));
 assert.deepEqual(source,before);
});
