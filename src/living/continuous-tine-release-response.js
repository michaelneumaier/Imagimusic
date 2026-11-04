import {parseContinuousTineRecord} from './continuous-tine-record.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from '../tine/render.js';

/** Lightweight view of a trusted renderer checkpoint. Shape/energy bounds are
 * checked here; this does not admit the source history or prove its checkpoint. */
export function createContinuousTineReleaseResponse(value,checkpoint){
 const source=parseContinuousTineRecord(value),rate=source.sampleRate,duration=(source.fadeStart+Math.round(.025*rate))/rate;
 if(!checkpoint||Object.keys(checkpoint).length!==5||checkpoint.kind!=='imagimusic-continuous-release-checkpoint'||checkpoint.version!==1)throw Error('Unsupported release checkpoint.');
 const {startFrame,addedDecayRate}=checkpoint;
 if(!Number.isInteger(startFrame)||!source.events.length||startFrame<source.events.at(-1).frame||startFrame>source.fadeStart||!Number.isFinite(addedDecayRate)||addedDecayRate<0||addedDecayRate>40)throw Error('Invalid release checkpoint timing or loss.');
 if(!Array.isArray(checkpoint.modes)||checkpoint.modes.length!==4)throw Error('Release checkpoint needs four modal states.');
 const initial=checkpoint.modes.map(m=>{if(!m||Object.keys(m).length!==2||!Number.isFinite(m.q)||!Number.isFinite(m.v))throw Error('Invalid release modal state.');return {q:m.q,v:m.v};});
 const model=createTineImpulse(requestForTineDesign(source.design).geometry),unit=model.strike({activation:source.design.activation,impulseNs:1e-6}),weights=model.modes.map(m=>m.shape(source.design.pickup)),gammas=model.modes.map(m=>m.gamma+addedDecayRate);
 if(model.modes.some((m,i)=>m.frequencyHz>=.45*rate||gammas[i]>=m.omega))throw Error('Release modes exceed sampling or damping limits.');
 const energyBounds=model.modes.map((m,i)=>Math.hypot(initial[i].v,m.omega*initial[i].q));
 if(TINE_PICKUP_GAIN*energyBounds.reduce((sum,b,i)=>sum+Math.abs(weights[i])*b,0)>TINE_OUTPUT_BOUND||energyBounds.reduce((sum,b,i)=>sum+b/model.modes[i].omega,0)>model.geometry.thicknessM*.1)throw Error('Release energy bound exceeds the admitted range.');
 const propagate=(q,v,m,gamma,age)=>{const wd=Math.sqrt(m.omega*m.omega-gamma*gamma),decay=Math.exp(-gamma*age),c=Math.cos(wd*age),s=Math.sin(wd*age)/wd;return {q:decay*((c+gamma*s)*q+s*v),v:decay*(-m.omega*m.omega*s*q+(c-gamma*s)*v)};};
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>duration)throw Error('Release time is outside the capture.');
  const rawFrame=seconds*rate,nearest=Math.round(rawFrame),frame=Math.abs(rawFrame-nearest)<1e-7?nearest:rawFrame,engaged=frame>=startFrame;
  const states=model.modes.map((m,i)=>{
   if(engaged)return propagate(initial[i].q,initial[i].v,m,gammas[i],(frame-startFrame)/rate);
   let q=0,v=0;for(const event of source.events){const age=seconds-event.frame/rate;if(age<0)break;const state=propagate(0,event.strength*unit.initialVelocity[i],m,m.gamma,age);q+=state.q;v+=state.v;}return {q,v};
  });
  const modes=states.map(({q,v},i)=>{const m=model.modes[i],gamma=engaged?gammas[i]:m.gamma,wd=Math.sqrt(m.omega*m.omega-gamma*gamma);return {displacementM:q,velocityMPerS:v,energyJ:.5*m.massKg*(v*v+m.omega*m.omega*q*q),dissipationW:2*m.massKg*gamma*v*v,amplitudeBoundM:Math.hypot(q,(v+gamma*q)/wd)};});
  return {engaged,modes,energyJ:modes.reduce((sum,m)=>sum+m.energyJ,0),pickupVelocityMPerS:modes.reduce((sum,m,i)=>sum+weights[i]*m.velocityMPerS,0),points:Array.from({length:81},(_,i)=>({u:i/80,boundM:modes.reduce((sum,m,j)=>sum+Math.abs(model.modes[j].shape(i/80))*m.amplitudeBoundM,0)}))};
 }
 return {source,startFrame,addedDecayRate,duration,at,get checkpoint(){return {kind:'imagimusic-continuous-release-checkpoint',version:1,startFrame,addedDecayRate,modes:initial.map(m=>({...m}))};}};
}
