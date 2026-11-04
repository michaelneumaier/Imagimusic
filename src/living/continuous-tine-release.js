import {createContinuousTineReleaseResponse} from './continuous-tine-release-response.js';
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
 const {geometry,options}=requestForTineDesign(source.design),model=createTineImpulse(geometry);
 const gammas=model.modes.map(m=>m.gamma+addedDecayRate);
 if(model.modes.some((m,i)=>gammas[i]>=m.omega))throw Error('Release requires underdamped retained modes.');
 // Recover the same numerical state used by the exact continuous renderer.
 const kernel=createContinuousTineKernel(geometry,{...options,sampleRate:rate}),scratch=new Float32Array(16384);
 const advance=end=>{while(kernel.frame<end)kernel.process(scratch.subarray(0,Math.min(scratch.length,end-kernel.frame)));};
 for(const event of source.events){advance(event.frame);kernel.strike(event.strength);}advance(startFrame);
 const initial=kernel.snapshot().modes.map(m=>({q:m.displacementM,v:m.velocityMPerS})),weights=model.modes.map(m=>m.shape(source.design.pickup));
 const response=createContinuousTineReleaseResponse(source,{kind:'imagimusic-continuous-release-checkpoint',version:1,startFrame,addedDecayRate,modes:initial}),at=response.at;
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
 return {source,startFrame,addedDecayRate,at,render,get checkpoint(){return response.checkpoint;}};
}
