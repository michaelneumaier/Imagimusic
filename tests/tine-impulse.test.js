import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineImpulse} from '../src/tine/impulse.js';
const geometry={kind:'beam',support:'clamped-free',lengthM:.08,thicknessM:.001,widthM:.01,material:{E:200e9,rho:7850,eta:.0002}};
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol*Math.max(Math.abs(b),1e-20),`${a} != ${b}`);

test('modal mass and static bending compliance agree with independent uniform-cantilever identities',()=>{
 const model=createTineImpulse(geometry);
 for(const mode of model.modes)near(mode.massKg,model.totalMassKg/4,3e-6);
 const exact=geometry.lengthM**3/(3*geometry.material.E*(geometry.widthM*geometry.thicknessM**3/12));
 const errors=[1,2,3,4].map(count=>Math.abs(createTineImpulse(geometry,{count}).staticCompliance(1,1)/exact-1));
 for(let i=1;i<errors.length;i++)assert.ok(errors[i]<errors[i-1]);
 assert.ok(errors[3]<.0007);
 assert.equal(model.staticCompliance(0,1),0);
});

test('impulse starts at zero displacement; modal energy dissipates and pickup is reciprocal',()=>{
 const model=createTineImpulse({...geometry,material:{...geometry.material,eta:.01}}),strike=model.strike({activation:.3}),swap=model.strike({activation:.8});
 strike.modalState(0).forEach((s,i)=>{assert.equal(s.displacementM,0);near(s.velocityMPerS,1e-6*model.modes[i].shape(.3)/model.modes[i].massKg);});
 for(const age of [0,.001,.025,.2,1]){
  near(strike.pointState(age,.8).displacementM,swap.pointState(age,.3).displacementM);
  near(strike.pointState(age,.8).velocityMPerS,swap.pointState(age,.3).velocityMPerS);
 }
 const t=.023,h=1e-8,a=strike.modalState(t-h),b=strike.modalState(t),c=strike.modalState(t+h);
 b.forEach((s,i)=>{
  near((c[i].displacementM-a[i].displacementM)/(2*h),s.velocityMPerS,2e-7);
  near((c[i].energyJ-a[i].energyJ)/(2*h),-2*model.modes[i].gamma*model.modes[i].massKg*s.velocityMPerS**2,1e-5);
  assert.ok(c[i].energyJ<=a[i].energyJ);
 });
 assert.deepEqual(strike.pointState(-1,.8),{displacementM:0,velocityMPerS:0});
 assert.equal(model.strike({activation:0}).pointState(.1,1).velocityMPerS,0);
});

test('width changes response and mass without retuning; length retunes; input snapshots and bounds are explicit',()=>{
 const a=createTineImpulse(geometry),wide=createTineImpulse({...geometry,widthM:.02}),long=createTineImpulse({...geometry,lengthM:.12});
 a.modes.forEach((m,i)=>{near(wide.modes[i].frequencyHz,m.frequencyHz);near(wide.modes[i].massKg,2*m.massKg);near(long.modes[i].frequencyHz,m.frequencyHz*(.08/.12)**2);});
 near(wide.strike().pointState(.012).velocityMPerS,a.strike().pointState(.012).velocityMPerS/2);
 const copy=structuredClone(geometry),saved=createTineImpulse(copy);copy.material.E=1;copy.lengthM=1;
 assert.equal(saved.geometry.material.E,200e9);assert.equal(saved.geometry.lengthM,.08);
 assert.throws(()=>a.strike({activation:NaN}));assert.throws(()=>a.strike({impulseNs:Infinity}));assert.throws(()=>a.strike().pointState(.1,2));
 assert.throws(()=>createTineImpulse({...geometry,lengthM:.04,thicknessM:.0021}));assert.throws(()=>createTineImpulse(geometry,{count:5}));
 const soft=createTineImpulse({...geometry,thicknessM:.0003,widthM:.003,material:{E:1e9,rho:300,eta:.001}});
 assert.throws(()=>soft.strike({impulseNs:1e-4}),/small-displacement/);
});
