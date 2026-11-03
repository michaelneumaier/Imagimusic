import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineForceStudy,halfSineForcePulse} from '../src/tine/force-study.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const geometry=requestForTineDesign(createTineDesign()).geometry;
function rk4(y,dt,derivative){
 const a=derivative(y),b=derivative(y.map((x,i)=>x+dt*a[i]/2)),c=derivative(y.map((x,i)=>x+dt*b[i]/2)),d=derivative(y.map((x,i)=>x+dt*c[i]));
 return y.map((x,i)=>x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6);
}
test('exact held-force response agrees with independent RK4 displacement, velocity, work and damping loss',()=>{
 const sampleRate=48000,model=createTineImpulse(geometry),study=createTineForceStudy(geometry),states=model.modes.map(()=>[0,0,0,0]);
 const pulse=halfSineForcePulse({frames:48});
 for(let frame=0;frame<240;frame++){
  const force=pulse[frame]??0;study.advance(force);
  model.modes.forEach((m,i)=>{
   const f=force*m.shape(.85),damping=2*m.gamma*m.massKg;
   for(let k=0;k<32;k++)states[i]=rk4(states[i],1/(sampleRate*32),([q,v])=>[v,(f-damping*v-m.stiffnessNPerM*q)/m.massKg,f*v,damping*v*v]);
  });
 }
 const result=study.snapshot();
 for(let i=0;i<4;i++){
  const s=result.modes[i],r=states[i];
  assert.ok(Math.abs(s.displacementM-r[0])<1e-15);
  assert.ok(Math.abs(s.velocityMPerS-r[1])<1e-10);
  assert.ok(Math.abs(s.workJ-r[2])<1e-19);
  assert.ok(Math.abs(s.dissipatedJ-r[3])<1e-19);
  assert.ok(s.dissipatedJ>=0);
 }
});
test('pulse averages preserve signed total impulse; width scaling and free decay retain physical units',()=>{
 for(const frames of [1,2,48,480,9600])for(const sampleRate of [8000,48000,96000]){
  const pulse=halfSineForcePulse({frames,sampleRate,impulseNs:-1e-7});
  assert.ok(Math.abs(pulse.reduce((a,b)=>a+b,0)/sampleRate+1e-7)<1e-20);
 }
 const original=createTineForceStudy(geometry),wide=createTineForceStudy({...geometry,widthM:.02});
 for(const f of halfSineForcePulse()){original.advance(f);wide.advance(f);}
 const a=original.snapshot(),b=wide.snapshot();assert.equal(b.pickupVelocityMPerS,a.pickupVelocityMPerS/2);
 for(let i=0;i<4;i++)assert.equal(b.modes[i].energyJ,a.modes[i].energyJ/2);
 for(let i=0;i<480;i++)original.advance(0);
 original.snapshot().modes.forEach((m,i)=>{assert.ok(m.energyJ<a.modes[i].energyJ);assert.equal(m.workJ,a.modes[i].workJ);});
});
test('rejected force preserves state and external geometry mutations cannot change admission',()=>{
 const source=structuredClone(geometry),study=createTineForceStudy(source);source.thicknessM=100;
 const before=study.snapshot();for(const force of [NaN,Infinity,1e9]){assert.throws(()=>study.advance(force));assert.deepEqual(study.snapshot(),before);}
 assert.throws(()=>createTineForceStudy(geometry,{sampleRate:8000}));
 for(const args of [{frames:0},{frames:1.5},{impulseNs:Infinity},{impulseNs:.1},{sampleRate:0}])assert.throws(()=>halfSineForcePulse(args));
});
