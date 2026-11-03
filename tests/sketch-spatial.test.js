import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpatialSketch,sketchShape} from '../src/sketch/spatial.js';
const parameters={frequencies:[200,201,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]};
const close=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol,`${a} differs from ${b}`);
test('authored shapes have exact declared nodes, signed lobes and numerically orthogonal profiles',()=>{
 for(let i=0;i<4;i++){for(let node=0;node<=i+1;node++)assert.equal(sketchShape(i,node/(i+1)),0);}
 assert.ok(sketchShape(1,.25)>0);assert.ok(sketchShape(1,.75)<0);
 const steps=4096;for(let i=0;i<4;i++)for(let j=0;j<4;j++){let inner=0;for(let k=1;k<steps;k++)inner+=sketchShape(i,k/steps)*sketchShape(j,k/steps)/steps;close(inner,i===j?.5:0);}
 assert.throws(()=>sketchShape(4,.5));assert.throws(()=>sketchShape(0,1.1));
});
test('activation and pickup project the same signed field with one gain, while pickup does not change modal energy',()=>{
 const spatial=createSpatialSketch(parameters),age=.123,activation=.25,pickup=.7;
 const modes=spatial.modalState(age,{activation}),point=spatial.pointState(age,{activation,pickup});
 close(point.displacement,modes.reduce((s,m,i)=>s+sketchShape(i,pickup)*m.displacement,0));
 const h=1e-7;close((spatial.pointState(age+h,{activation,pickup}).displacement-spatial.pointState(age-h,{activation,pickup}).displacement)/(2*h),point.velocity,2e-5);
 close(spatial.sample(age,{activation,pickup}),spatial.sample(age,{activation:pickup,pickup:activation}));
 assert.equal(spatial.modalState(age,{activation:.5})[1].energy,0);
 const before=spatial.modalState(age,{activation});spatial.pointState(age,{activation,pickup:.1});spatial.pointState(age,{activation,pickup:.9});assert.deepEqual(spatial.modalState(age,{activation}),before);
 assert.equal(spatial.sample(age,{activation:0,pickup}),0);assert.equal(spatial.sample(age,{activation,pickup:1}),0);
 for(const m of modes)assert.ok(m.energy>=0);
 assert.throws(()=>spatial.sample(NaN));assert.throws(()=>spatial.sample(0,{activation:-1}));assert.throws(()=>spatial.sample(0,{strength:-1}));
});
test('rendered spatial signal equals its point state through the declared fade, without position normalization',()=>{
 const spatial=createSpatialSketch(parameters);
 for(const [activation,pickup] of [[.25,.25],[.25,.75],[.5,.5],[0,.7],[.2,1]]){
  const r=spatial.render({seconds:.1,activation,pickup});assert.equal(r.pickupGain,spatial.source.pickupGain);
  for(let i=0;i<r.frames;i++){const fade=i<r.frames-r.fadeFrames?1:(r.frames-1-i)/(r.fadeFrames-1);close(r.channels[0][i],spatial.sample(i/8000,{activation,pickup})*fade,2e-8);assert.ok(Math.abs(r.channels[0][i])<=r.peakBound+1e-7);}
  assert.equal(r.channels[0].at(-1),0);
 }
 const atNode=spatial.render({activation:0});assert.ok(atNode.channels[0].every(x=>x===0));
 const nearNode=spatial.render({activation:1e-5});assert.ok(Math.max(...nearNode.channels[0].map(Math.abs))<.0001);
});
