import test from 'node:test';
import assert from 'node:assert/strict';
import {createResonanceSketch} from '../src/sketch/model.js';
import {reconstructModes} from '../tools/study-joint-decay.mjs';
const parameters={frequencies:[200,201,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]};

test('sketch reproduces its supplied mixture with one explicit pickup gain',()=>{
 const input=structuredClone(parameters),sketch=createResonanceSketch(input);
 input.coefficients[0]=99;
 const reference=reconstructModes(parameters,8000,8000);
 for(let i=0;i<reference.length;i++)assert.ok(Math.abs(sketch.sample(i/8000)-reference[i]*sketch.pickupGain)<1e-12);
 assert.ok(sketch.singleActivationPeakBound<=.25);
 assert.equal(sketch.sample(-1),0);assert.equal(sketch.sample(1e308),0);
 assert.equal(sketch.sample(.2,{strength:0}),0);
 const sum=sketch.modes.reduce((s,_,mode)=>s+sketch.sample(.125,{mode}),0);
 assert.ok(Math.abs(sum-sketch.sample(.125))<1e-14);
 assert.ok(Object.isFrozen(sketch.modes[0]));
});

test('modal initial conditions and energy loss obey the constructed damped oscillator',()=>{
 const sketch=createResonanceSketch(parameters),h=1e-7;
 for(let i=0;i<sketch.modes.length;i++){
  const m=sketch.modes[i],initial=sketch.modeState(i,0);
  assert.equal(initial.displacement,m.initialDisplacement);assert.equal(initial.velocity,m.initialVelocity);
  for(const t of [.001,.0123,.151]){
   const state=sketch.modeState(i,t),before=sketch.modeState(i,t-h),after=sketch.modeState(i,t+h);
   assert.ok(Math.abs((after.displacement-before.displacement)/(2*h)-state.velocity)<1e-4);
   const acceleration=(after.velocity-before.velocity)/(2*h),expected=-m.damping*state.velocity-m.stiffness*state.displacement;
   assert.ok(Math.abs(acceleration-expected)<.2);
   const loss=(after.energy-before.energy)/(2*h),expectedLoss=-m.damping*state.velocity**2;
   assert.ok(Math.abs(loss-expectedLoss)<.2);
  }
 }
});

test('bounded audition preserves mode balance and applies only its declared ending fade',()=>{
 const sketch=createResonanceSketch(parameters),rendered=sketch.render({sampleRate:8000,seconds:.1,strength:.5});
 assert.equal(rendered.frames,800);assert.equal(rendered.fadeFrames,200);assert.equal(rendered.channels.length,1);
 for(let i=0;i<600;i++)assert.equal(rendered.channels[0][i],Math.fround(sketch.sample(i/8000,{strength:.5})));
 assert.equal(rendered.channels[0].at(-1),0);assert.ok(rendered.channels[0].every(x=>Math.abs(x)<=.125));
 assert.throws(()=>sketch.render({seconds:9}));assert.throws(()=>sketch.sample(0,{mode:4}));
 assert.throws(()=>sketch.sample(0,{strength:2}));
 assert.throws(()=>createResonanceSketch({...parameters,coefficients:[0,0,0,0,0,0]}));
 assert.throws(()=>createResonanceSketch({...parameters,decays:[2,0,3]}));
 assert.throws(()=>createResonanceSketch({...parameters,frequencies:[200,,320]}));
});
