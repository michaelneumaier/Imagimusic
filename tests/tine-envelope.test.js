import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createTineEnvelope} from '../src/tine/envelope.js';
const geometry={kind:'beam',support:'clamped-free',lengthM:.08,thicknessM:.001,widthM:.01,material:{E:200e9,rho:7850,eta:.0002}};
test('spatial envelope bounds signed mechanical displacement without treating phase cancellation as decay',()=>{
 const model=createTineImpulse(geometry),strike=model.strike({activation:.3}),envelope=createTineEnvelope(geometry,{activation:.3});
 for(let ti=0;ti<=200;ti++)for(let xi=0;xi<=40;xi++){
  const t=ti*.0037,u=xi/40,bound=envelope.at(t,u);
  assert.ok(Math.abs(strike.pointState(t,u).displacementM)<=bound.totalM+1e-20);
  assert.ok(bound.totalM<=envelope.at(0,u).totalM+1e-20);
 }
 assert.equal(strike.pointState(0,.8).displacementM,0);
 assert.ok(envelope.at(0,.8).totalM>0,'an initial envelope is not initial displacement');
 assert.equal(envelope.at(.1,0).totalM,0);
});
test('envelope preserves fixed physical scale, source snapshots, modal decay and arbitrary-time evaluation',()=>{
 const source=structuredClone(geometry),a=createTineEnvelope(source),wide=createTineEnvelope({...geometry,widthM:.02}),reverse=createTineEnvelope(geometry,{impulseNs:-1e-6});
 source.lengthM=.12;source.material.E=1;
 const first=a.frame(.123);a.frame(4);assert.deepEqual(a.frame(.123),first);assert.equal(first.points.length,81);assert.equal(first.lengthM,.08);
 const gamma=createTineImpulse(geometry).modes.map(m=>m.gamma);
 for(const u of [.1,.4,.85,1]){
  const initial=a.at(0,u),later=a.at(.2,u);assert.deepEqual(reverse.at(.2,u),later);
  later.componentsM.forEach((value,i)=>{assert.ok(Math.abs(value-initial.componentsM[i]*Math.exp(-gamma[i]*.2))<1e-20);assert.equal(wide.at(.2,u).componentsM[i],value/2);});
 }
 assert.ok(createTineEnvelope(geometry,{activation:0}).frame(0).points.every(p=>p.totalM===0));
 assert.ok(a.at(4,1).totalM>0,'mechanical envelope does not pretend audition fade ends the vibration');
 for(const args of [[-1,.5],[NaN,.5],[1,2],[3601,.5]])assert.throws(()=>a.at(...args));
});

test('phrase envelopes admit only arrived strikes and bound overlapping signed displacement',async()=>{
 const {createTinePhrase}=await import('../src/tine/phrase.js');
 const geometry={kind:'beam',support:'clamped-free',lengthM:.08,widthM:.01,thicknessM:.001,material:{E:200e9,rho:7850,eta:.0002}};
 const events=[{time:.2,strength:.25},{time:.8,strength:-.15},{time:2.1,strength:.25}],envelope=createTineEnvelope(geometry,{events});
 assert.equal(envelope.at(.199,.85).totalM,0);
 assert.ok(envelope.at(.2,.85).totalM>0);
 assert.ok(envelope.at(.8,.85).totalM>envelope.at(.799999,.85).totalM);
 for(const pickup of [0,.2,.5,.85,1]){
  const phrase=createTinePhrase(geometry,{events,pickup});
  for(let k=0;k<=610;k++){const t=k/100;assert.ok(Math.abs(phrase.pointState(t).displacementM)<=envelope.at(t,pickup).totalM+1e-18);}
 }
 events[0].strength=1;assert.equal(envelope.at(.199,.85).totalM,0);
});
