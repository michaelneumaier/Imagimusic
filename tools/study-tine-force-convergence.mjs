import {pathToFileURL} from 'node:url';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createTineForceStudy,halfSineForcePulse} from '../src/tine/force-study.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';

// Independently integrate the continuous forcing against the impulse Green function.
function continuousEnd(model,activation,J,T,steps){
 return model.modes.map(m=>{
  let q=0,v=0;
  for(let k=0;k<=steps;k++){
   const t=k*T/steps,age=T-t,weight=k===0||k===steps?1:k%2?4:2;
   const amplitude=J*Math.PI/(2*T)*Math.sin(Math.PI*t/T)*m.shape(activation)/m.massKg*Math.exp(-m.gamma*age);
   q+=weight*amplitude*Math.sin(m.omegaD*age)/m.omegaD;
   v+=weight*amplitude*(Math.cos(m.omegaD*age)-m.gamma/m.omegaD*Math.sin(m.omegaD*age));
  }
  return {displacementM:q*T/(3*steps),velocityMPerS:v*T/(3*steps)};
 });
}
export function forceConvergenceReport(){
 const design=createTineDesign(),{geometry}=requestForTineDesign(design),model=createTineImpulse(geometry),impulseNs=1e-7;
 const unit=model.strike({activation:design.activation,impulseNs});
 const distance=(a,b,i)=>Math.hypot(model.modes[i].omega*(a.displacementM-b.displacementM),a.velocityMPerS-b.velocityMPerS)/Math.abs(unit.initialVelocity[i]);
 const cases=[.000125,.0005,.001,.004].map(durationS=>{
  const reference=continuousEnd(model,design.activation,impulseNs,durationS,8192),coarse=continuousEnd(model,design.activation,impulseNs,durationS,4096);
  const referenceRefinement=reference.map((m,i)=>distance(m,coarse[i],i));
  const rates=[24000,48000,96000].map(sampleRate=>{
   const frames=Math.round(durationS*sampleRate),study=createTineForceStudy(geometry,{sampleRate,activation:design.activation,pickup:design.pickup});
   for(const force of halfSineForcePulse({impulseNs,frames,sampleRate}))study.advance(force);
   const end=study.snapshot();return {sampleRate,frames,impulseNs:end.impulseNs,normalizedStateErrors:end.modes.map((m,i)=>distance(m,reference[i],i))};
  });return {durationS,referenceRefinement,rates};
 });
 return {kind:'imagimusic-force-convergence',version:1,design,impulseNs,cases,metric:'norm(omega*displacement error, velocity error) divided by the initial velocity from the equal ideal impulse, separately for each mode; not divided by near-zero pulse response',limits:'Continuous reference uses Simpson convolution at8192 intervals, checked against4096. Finite sample-rate forces are held interval averages. This checks four pulse durations on one body, not all geometries, forces, or perceptual equivalence.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(forceConvergenceReport(),null,2));
