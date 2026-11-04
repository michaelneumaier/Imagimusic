import {createLivingArrangementView} from './arrangement-view.js';

const ease=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
const mix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
const solo={target:[3.5,2,0],direction:unit([10,6.5,14]),radius:6.6};
const wide={target:[3,2,-2],direction:unit([5,9,19]),radius:16};
const positions=[[0,0,0],[-11,0,-4],[10,0,-4]];

/** Presentation4 phrase-level attention. Preserve for saved encounters/films. Each answer draws the camera in
 * over800ms before its first touch, holds through its final touch plus300ms,
 * then releases over800ms. Overlapping invitations share a weighted frame.
 * This is artistic direction, not acoustic energy or a physical camera model.
 * Pure time sampling supports reverse scrubbing without state or smoothing lag.
 */
export function createLivingAttentionView(plan){
 const view=createLivingArrangementView(plan),rate=plan.sampleRate;
 const answers=plan.voices.filter(v=>v.part==='answer').map(v=>{
  const body=plan.bodies[v.body],offset=positions[v.body];
  return {first:(v.startFrame+body.events[0].frame)/rate,last:(v.startFrame+body.events.at(-1).frame)/rate,
   target:[offset[0]+body.design.lengthMm/20,2,offset[2]]};
 });
 return {at(seconds){
  const frame=view.at(seconds),opening=frame.cameraOpen;
  const baseline={target:mix(solo.target,wide.target,opening),direction:unit(mix(solo.direction,wide.direction,opening)),radius:solo.radius+(wide.radius-solo.radius)*opening};
  const weights=answers.map(a=>ease((seconds-a.first+.8)/.8)*(1-ease((seconds-a.last-.3)/.8))),total=weights.reduce((a,b)=>a+b,0);
  if(total===0)return {...frame,cameraShot:baseline};
  const target=[0,1,2].map(axis=>answers.reduce((sum,a,i)=>sum+a.target[axis]*weights[i],0)/total);
  // Widen as contributing phrase centres separate, capped at the established
  // wide radius. A framing heuristic, not an occlusion or frustum proof.
  const variance=answers.reduce((sum,a,i)=>sum+a.target.reduce((distance,v,k)=>distance+(v-target[k])**2,0)*weights[i],0)/total;
  // Smooth saturation avoids switching the winning body or hitting a hard
  // radius cap. Smooth influence also has zero slope at full attention.
  const radius=9+7*variance/(variance+16),amount=ease(total)*opening;
  return {...frame,cameraShot:{target:mix(baseline.target,target,amount),direction:baseline.direction,radius:baseline.radius+(radius-baseline.radius)*amount}};
 }};
}
