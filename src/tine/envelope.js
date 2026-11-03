import {createTineImpulse} from './impulse.js';
import {createTinePhrase} from './phrase.js';
/** Positive displacement-envelope bound, not instantaneous bending or energy.
 * Independent damped modes: |q_n(t)| <= |v_n(0)| exp(-gamma*t)/omegaD.
 * Sum absolute spatial contributions; phase cancellation is deliberately absent.
 */
export function createTineEnvelope(geometry,{count=4,activation=.85,impulseNs=1e-6,events}={}){
 const model=createTineImpulse(geometry,{count});
 const sequence=events===undefined?[{time:0,strength:1}]:createTinePhrase(geometry,{count,activation,impulseNs,pickup:0,events}).events;
 const strikes=sequence.map(event=>({time:event.time,response:model.strike({activation,impulseNs:impulseNs*event.strength})}));
 function at(age,u){
  if(!Number.isFinite(age)||age<0||age>3600)throw Error('Envelope age must be within 0…3600 seconds.');
  if(!Number.isFinite(u)||u<0||u>1)throw Error('Envelope position must be within 0…1.');
  const componentsM=model.modes.map((m,i)=>strikes.reduce((sum,s)=>sum+(age<s.time?0:Math.abs(m.shape(u)*s.response.initialVelocity[i])/m.omegaD*Math.exp(-m.gamma*(age-s.time))),0));
  return {componentsM,totalM:componentsM.reduce((sum,x)=>sum+x,0)};
 }
 function frame(age){return {age,lengthM:model.geometry.lengthM,points:Array.from({length:81},(_,i)=>({u:i/80,...at(age,i/80)}))};}
 return Object.freeze({at,frame,frequenciesHz:Object.freeze(model.modes.map(m=>m.frequencyHz))});
}
