import {validateTineLiveRecord,renderTineLiveRecord} from './live-record.js';
import {requestForTineDesign} from './address.js';
import {createTineImpulse} from './impulse.js';
import {TINE_PICKUP_GAIN} from './render.js';

/** Experimental release after the final impulse. Add mass-proportional viscous
 * damping: each modal force is -2*m*addedDecayRate*v. Displacement and velocity
 * are continuous at engagement; the damper dissipates energy, supplies no force
 * impulse and introduces no new excitation. This is an ideal distributed loss,
 * NOT a localized felt contact, collision, acoustic radiation or saved recipe.
 * The existing record's final 25ms output fade remains a recording convention.
 */
export function createTineDampedRelease(value,{startFrame,addedDecayRate=12}={}){
 const source=validateTineLiveRecord(value),rate=source.sampleRate;
 if(!source.events.length||!Number.isInteger(startFrame)||startFrame<source.events.at(-1).frame||startFrame>source.fadeStart)throw Error('Release must begin after the final touch and before the recording fade.');
 if(typeof addedDecayRate!=='number'||!Number.isFinite(addedDecayRate)||addedDecayRate<0||addedDecayRate>40)throw Error('Added decay rate must be within 0…40 per second.');
 const model=createTineImpulse(requestForTineDesign(source.design).geometry),unit=model.strike({activation:source.design.activation,impulseNs:1e-6});
 const start=startFrame/rate,end=(source.fadeStart+Math.round(.025*rate))/rate;
 const gammas=model.modes.map(m=>m.gamma+addedDecayRate);
 if(model.modes.some((m,i)=>gammas[i]>=m.omega))throw Error('This release study requires underdamped retained modes.');
 function original(t){return model.modes.map((m,i)=>{
  let q=0,v=0;
  for(const e of source.events){const age=t-e.frame/rate;if(age<0)continue;const a=e.strength*unit.initialVelocity[i]*Math.exp(-m.gamma*age),phase=m.omegaD*age;
   q+=a*Math.sin(phase)/m.omegaD;v+=a*(Math.cos(phase)-m.gamma/m.omegaD*Math.sin(phase));
  }return {q,v};
 });}
 const initial=original(start),positions=Array.from({length:81},(_,i)=>i/80);
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>end)throw Error('Release time is outside the recording.');
  const engaged=seconds>=start,age=seconds-start;
  const states=engaged?model.modes.map((m,i)=>{
   const gamma=gammas[i],wd=Math.sqrt(m.omega*m.omega-gamma*gamma),decay=Math.exp(-gamma*age),c=Math.cos(wd*age),s=Math.sin(wd*age)/wd,{q,v}=initial[i];
   return {q:decay*((c+gamma*s)*q+s*v),v:decay*(-m.omega*m.omega*s*q+(c-gamma*s)*v)};
  }):original(seconds);
  const modes=states.map(({q,v},i)=>{const m=model.modes[i],gamma=engaged?gammas[i]:m.gamma,wd=Math.sqrt(m.omega*m.omega-gamma*gamma);
   return {displacementM:q,velocityMPerS:v,energyJ:.5*m.massKg*v*v+.5*m.stiffnessNPerM*q*q,dissipationW:2*m.massKg*gamma*v*v,amplitudeBoundM:Math.hypot(q,(v+gamma*q)/wd)};
  });
  return {engaged,modes,energyJ:modes.reduce((s,m)=>s+m.energyJ,0),pickupVelocityMPerS:modes.reduce((s,m,i)=>s+model.modes[i].shape(source.design.pickup)*m.velocityMPerS,0),points:positions.map(u=>({u,boundM:modes.reduce((s,m,i)=>s+Math.abs(model.modes[i].shape(u))*m.amplitudeBoundM,0)}))};
 }
 function render(){
  const baseline=renderTineLiveRecord(source);if(addedDecayRate===0)return baseline;
  const samples=baseline.channels[0].slice(),fadeFrames=Math.round(.025*rate);
  const q=initial.map(s=>s.q),v=initial.map(s=>s.v),weights=model.modes.map(m=>m.shape(source.design.pickup));
  const transitions=model.modes.map((m,i)=>{const gamma=gammas[i],wd=Math.sqrt(m.omega*m.omega-gamma*gamma),decay=Math.exp(-gamma/rate),c=Math.cos(wd/rate),s=Math.sin(wd/rate)/wd;return [decay*(c+gamma*s),decay*s,-decay*m.omega*m.omega*s,decay*(c-gamma*s)];});
  for(let frame=startFrame;frame<samples.length;frame++){
   let sample=0;
   for(let i=0;i<q.length;i++){sample+=weights[i]*v[i];const [a,b,c,d]=transitions[i],before=q[i];q[i]=a*before+b*v[i];v[i]=c*before+d*v[i];}
   samples[frame]=TINE_PICKUP_GAIN*sample;
   if(frame>=source.fadeStart)samples[frame]*=Math.max(0,1-(frame-source.fadeStart)/(fadeFrames-1));
   if(!Number.isFinite(samples[frame])||Math.abs(samples[frame])>1)throw Error('Release exceeds source PCM range.');
  }
  // Do not inherit the undamped baseline's terminal-state snapshot.
  const {snapshot,...pcm}=baseline;
  return {...pcm,channels:[samples],release:{kind:'imagimusic-modal-release-study',startFrame,addedDecayRate}};
 }
 return {source,startFrame,addedDecayRate,at,render};
}
