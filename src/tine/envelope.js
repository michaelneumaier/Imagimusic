import {createTineImpulse} from './impulse.js';
/** Positive displacement-envelope bound, not instantaneous bending or energy.
 * Independent damped modes: |q_n(t)| <= |v_n(0)| exp(-gamma*t)/omegaD.
 * Sum absolute spatial contributions; phase cancellation is deliberately absent.
 */
export function createTineEnvelope(geometry,{count=4,activation=.85,impulseNs=1e-6}={}){
 const model=createTineImpulse(geometry,{count}),strike=model.strike({activation,impulseNs});
 function at(age,u){
  if(!Number.isFinite(age)||age<0||age>3600)throw Error('Envelope age must be within 0…3600 seconds.');
  if(!Number.isFinite(u)||u<0||u>1)throw Error('Envelope position must be within 0…1.');
  const componentsM=model.modes.map((m,i)=>Math.abs(m.shape(u)*strike.initialVelocity[i])/m.omegaD*Math.exp(-m.gamma*age));
  return {componentsM,totalM:componentsM.reduce((sum,x)=>sum+x,0)};
 }
 function frame(age){return {age,lengthM:model.geometry.lengthM,points:Array.from({length:81},(_,i)=>({u:i/80,...at(age,i/80)}))};}
 return Object.freeze({at,frame,frequenciesHz:Object.freeze(model.modes.map(m=>m.frequencyHz))});
}
