import {renderContinuousTineRecord} from './continuous-tine-record.js';
import {createContinuousTineKernel} from './continuous-tine-kernel.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from '../tine/render.js';

/** Separate research treatment: ideal mass-proportional viscous loss engages
 * after the last touch. Force per mode is -2*m*addedDecayRate*v. No contact pad,
 * collision, acoustic radiation or new saved-capture version is implied. */
export function createContinuousTineRelease(value,{startFrame,addedDecayRate=1}={}){
 if(!Number.isInteger(startFrame)||startFrame<0||!Number.isFinite(addedDecayRate)||addedDecayRate<0||addedDecayRate>40)throw Error('Invalid release timing or decay rate.');
 const baseline=renderContinuousTineRecord(value),source=baseline.record,rate=source.sampleRate;
 if(!source.events.length||startFrame<source.events.at(-1).frame||startFrame>source.fadeStart)throw Error('Release must follow the last touch and precede the recording fade.');
 const {geometry,options}=requestForTineDesign(source.design),model=createTineImpulse(geometry),unit=model.strike({activation:source.design.activation,impulseNs:1e-6});
 const gammas=model.modes.map(m=>m.gamma+addedDecayRate);
 if(model.modes.some((m,i)=>gammas[i]>=m.omega))throw Error('Release requires underdamped retained modes.');
 // Recover the same numerical state used by the exact continuous renderer.
 const kernel=createContinuousTineKernel(geometry,{...options,sampleRate:rate}),scratch=new Float32Array(16384);
 const advance=end=>{while(kernel.frame<end)kernel.process(scratch.subarray(0,Math.min(scratch.length,end-kernel.frame)));};
 for(const event of source.events){advance(event.frame);kernel.strike(event.strength);}advance(startFrame);
 const initial=kernel.snapshot().modes.map(m=>({q:m.displacementM,v:m.velocityMPerS})),weights=model.modes.map(m=>m.shape(source.design.pickup));
 const energyBounds=model.modes.map((m,i)=>Math.hypot(initial[i].v,m.omega*initial[i].q));
 if(TINE_PICKUP_GAIN*energyBounds.reduce((sum,b,i)=>sum+Math.abs(weights[i])*b,0)>TINE_OUTPUT_BOUND||energyBounds.reduce((sum,b,i)=>sum+b/model.modes[i].omega,0)>model.geometry.thicknessM*.1)throw Error('Release energy bound exceeds the admitted range.');
 const propagate=(q,v,m,gamma,age)=>{const wd=Math.sqrt(m.omega*m.omega-gamma*gamma),decay=Math.exp(-gamma*age),c=Math.cos(wd*age),s=Math.sin(wd*age)/wd;return {q:decay*((c+gamma*s)*q+s*v),v:decay*(-m.omega*m.omega*s*q+(c-gamma*s)*v)};};
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>baseline.seconds)throw Error('Release time is outside the capture.');
  const rawFrame=seconds*rate,nearest=Math.round(rawFrame),frame=Math.abs(rawFrame-nearest)<1e-7?nearest:rawFrame,engaged=frame>=startFrame;
  const states=model.modes.map((m,i)=>{
   if(engaged)return propagate(initial[i].q,initial[i].v,m,gammas[i],(frame-startFrame)/rate);
   let q=0,v=0;for(const event of source.events){const age=seconds-event.frame/rate;if(age<0)break;const state=propagate(0,event.strength*unit.initialVelocity[i],m,m.gamma,age);q+=state.q;v+=state.v;}return {q,v};
  });
  const modes=states.map(({q,v},i)=>{const m=model.modes[i],gamma=engaged?gammas[i]:m.gamma,wd=Math.sqrt(m.omega*m.omega-gamma*gamma);return {displacementM:q,velocityMPerS:v,energyJ:.5*m.massKg*(v*v+m.omega*m.omega*q*q),dissipationW:2*m.massKg*gamma*v*v,amplitudeBoundM:Math.hypot(q,(v+gamma*q)/wd)};});
  return {engaged,modes,energyJ:modes.reduce((sum,m)=>sum+m.energyJ,0),pickupVelocityMPerS:modes.reduce((sum,m,i)=>sum+weights[i]*m.velocityMPerS,0),points:Array.from({length:81},(_,i)=>({u:i/80,boundM:modes.reduce((sum,m,j)=>sum+Math.abs(model.modes[j].shape(i/80))*m.amplitudeBoundM,0)}))};
 }
 function render(){
  const samples=baseline.channels[0].slice();
  if(addedDecayRate!==0){
   const q=initial.map(s=>s.q),v=initial.map(s=>s.v),transitions=model.modes.map((m,i)=>{const gamma=gammas[i],wd=Math.sqrt(m.omega*m.omega-gamma*gamma),decay=Math.exp(-gamma/rate),c=Math.cos(wd/rate),s=Math.sin(wd/rate)/wd;return [decay*(c+gamma*s),decay*s,-decay*m.omega*m.omega*s,decay*(c-gamma*s)];});
   for(let frame=startFrame;frame<samples.length;frame++){
    let sample=0;for(let i=0;i<q.length;i++){sample+=weights[i]*v[i];const [a,b,c,d]=transitions[i],before=q[i];q[i]=a*before+b*v[i];v[i]=c*before+d*v[i];}
    samples[frame]=TINE_PICKUP_GAIN*sample;
    if(frame>=source.fadeStart)samples[frame]*=Math.max(0,(samples.length-1-frame)/(Math.round(.025*rate)-1));
    if(!Number.isFinite(samples[frame])||Math.abs(samples[frame])>TINE_OUTPUT_BOUND)throw Error('Release exceeded the pickup range.');
   }
  }
  return {kind:'imagimusic-continuous-tine-release-audio',version:1,source,release:{startFrame,addedDecayRate},sampleRate:rate,frames:baseline.frames,seconds:baseline.seconds,channels:[samples],terminalState:at(baseline.seconds)};
 }
 return {source,startFrame,addedDecayRate,at,render};
}
