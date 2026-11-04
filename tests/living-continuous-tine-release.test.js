import {createTineImpulse} from '../src/tine/impulse.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousTineRelease} from '../src/living/continuous-tine-release.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createContinuousTineKernel} from '../src/living/continuous-tine-kernel.js';
import {TINE_PICKUP_GAIN} from '../src/tine/render.js';
const fixture=(rate=48000)=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign(),sampleRate:rate,events:[{frame:0,strength:.1,origin:'score'},{frame:Math.round(.3*rate),strength:-.025,origin:'guest'}],fadeStart:2*rate});
test('release begins at the actual streaming state, including a touch exactly at engagement',()=>{
 for(const rate of [44100,48000]){
  const record=fixture(rate),startFrame=record.events.at(-1).frame,release=createContinuousTineRelease(record,{startFrame,addedDecayRate:1}),request=requestForTineDesign(record.design),kernel=createContinuousTineKernel(request.geometry,{...request.options,sampleRate:rate});
  kernel.strike(.1);kernel.process(new Float32Array(startFrame));kernel.strike(-.025);
  const actual=release.at(startFrame/rate),expected=kernel.snapshot();actual.modes.forEach((m,i)=>{assert.equal(m.displacementM,expected.modes[i].displacementM);assert.equal(m.velocityMPerS,expected.modes[i].velocityMPerS);});
 }
});
test('release preserves the exact prefix and zero added loss preserves every baseline sample',()=>{
 const record=fixture(),startFrame=48000,baseline=renderContinuousTineRecord(record),zero=createContinuousTineRelease(record,{startFrame,addedDecayRate:0}).render(),changed=createContinuousTineRelease(record,{startFrame,addedDecayRate:1}).render();
 assert.deepEqual(zero.channels,baseline.channels);assert.deepEqual(changed.channels[0].subarray(0,startFrame+1),baseline.channels[0].subarray(0,startFrame+1));assert.notDeepEqual(changed.channels,baseline.channels);assert.equal(changed.kind,'imagimusic-continuous-tine-release-audio');assert.equal(changed.record,undefined);assert.equal(changed.snapshot,undefined);
});
test('modal energy decreases after engagement and its derivative equals negative dissipation',()=>{
 const release=createContinuousTineRelease(fixture(),{startFrame:48000,addedDecayRate:1});let previous=Infinity;
 for(let i=0;i<=1000;i++){const state=release.at(1+i/1000);assert.ok(state.energyJ<=previous*(1+1e-10));previous=state.energyJ;assert.ok(state.modes.every(m=>m.dissipationW>=0));}
 for(const t of [1.1,1.4,1.9]){const h=1e-8,state=release.at(t),derivative=(release.at(t+h).energyJ-release.at(t-h).energyJ)/(2*h),loss=state.modes.reduce((n,m)=>n+m.dissipationW,0);assert.ok(Math.abs(derivative+loss)<Math.max(1e-18,loss*1e-5));}
});
test('analytic pickup and response bounds agree with rendered release samples and signed displacement',()=>{
 const release=createContinuousTineRelease(fixture(),{startFrame:48000,addedDecayRate:2}),rendered=release.render(),model=createTineImpulse(requestForTineDesign(release.source.design).geometry);
 for(const frame of [48000,48001,48321,60000,95000]){const state=release.at(frame/48000),sample=TINE_PICKUP_GAIN*state.pickupVelocityMPerS;assert.ok(Math.abs(rendered.channels[0][frame]-sample)<1e-9);assert.ok(state.points.every(p=>Number.isFinite(p.boundM)&&p.boundM>=0));for(const point of state.points){const displacement=state.modes.reduce((sum,m,i)=>sum+model.modes[i].shape(point.u)*m.displacementM,0);assert.ok(Math.abs(displacement)<=point.boundM+1e-15);}}
 assert.ok(release.at(2).energyJ<createContinuousTineRelease(fixture(),{startFrame:48000,addedDecayRate:0}).at(2).energyJ*.03);
});
test('release refuses future excitation, missing touches and unsupported damping without mutating source',()=>{
 const record=fixture(),before=structuredClone(record);
 for(const options of [{startFrame:1},{startFrame:96001},{startFrame:48000,addedDecayRate:-1},{startFrame:48000,addedDecayRate:41},{startFrame:48000,addedDecayRate:NaN}])assert.throws(()=>createContinuousTineRelease(record,options));
 assert.throws(()=>createContinuousTineRelease({...record,events:[]},{startFrame:0}));assert.deepEqual(record,before);
});

test('release stays passive across admitted body extremes and stronger damping',()=>{
 for(const [lengthMm,widthMm,activation] of [[60,5,.05],[85,10,.85],[120,20,1]])for(const addedDecayRate of [1,40]){
  const record=fixture();record.design=createTineDesign({lengthMm,widthMm,activation});record.events=record.events.map(e=>({...e,strength:e.strength/10}));
  const release=createContinuousTineRelease(record,{startFrame:48000,addedDecayRate}),start=release.at(1),end=release.at(2),samples=release.render().channels[0];
  assert.ok(end.energyJ<start.energyJ);assert.ok(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=.8));
 }
});
