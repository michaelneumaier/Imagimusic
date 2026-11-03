import {requestForTineDesign,validateTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';

/** A conservative spatial displacement envelope, not instantaneous vibration,
 * RMS, energy or acoustic pressure. Combine signed events BEFORE taking each
 * modal quadrature magnitude so cancellation and reinforcement are retained.
 * Between impulses each magnitude decays exactly as exp(-gamma * time).
 */
export function createLivingResponse(design,sampleRate){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('Invalid sample rate.');
 design=validateTineDesign(design);
 const model=createTineImpulse(requestForTineDesign(design).geometry);
 const unit=model.strike({activation:design.activation,impulseNs:1e-6});
 const events=[],positions=Array.from({length:81},(_,i)=>i/80);
 const shapes=positions.map(u=>model.modes.map(m=>Math.abs(m.shape(u))));
 function accept(event){
  if(!event||!Number.isInteger(event.frame)||event.frame<0||event.frame>4*sampleRate||!Number.isFinite(event.strength)||Math.abs(event.strength)>.1||event.strength===0||events.length>=8||event.frame<(events.at(-1)?.frame??0))throw Error('Invalid accepted touch.');
  events.push({frame:event.frame,strength:event.strength});
 }
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>8.025)throw Error('Response time is outside the pass.');
  const amplitudesM=model.modes.map((mode,i)=>{
   let sine=0,cosine=0;
   for(const event of events){
    const age=seconds-event.frame/sampleRate;if(age<0)continue;
    const a=event.strength*unit.initialVelocity[i]/mode.omegaD*Math.exp(-mode.gamma*age),phase=mode.omegaD*age;
    sine+=a*Math.sin(phase);cosine+=a*Math.cos(phase);
   }
   return Math.hypot(sine,cosine);
  });
  return {amplitudesM,points:positions.map((u,i)=>({u,boundM:shapes[i].reduce((sum,s,j)=>sum+s*amplitudesM[j],0)}))};
 }
 return {accept,at};
}
