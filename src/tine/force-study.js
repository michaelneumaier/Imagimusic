import {createTineImpulse} from './impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from './render.js';

/** Offline prescribed-force study. Exact response to force held over each sample.
 * This is not a hammer collision, force sensor, acoustic radiator or live format.
 */
export function createTineForceStudy(geometry,{sampleRate=48000,activation=.85,pickup=.85}={}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Use an integer sample rate within 8–96 kHz.');
 if(!Number.isFinite(pickup)||pickup<0||pickup>1)throw Error('Invalid pickup position.');
 const model=createTineImpulse(geometry),unit=model.strike({activation,impulseNs:1e-6}),h=1/sampleRate;
 if(model.modes.some(m=>m.frequencyHz>=.45*sampleRate))throw Error('A retained mode exceeds the sample-rate guard.');
 const weights=model.modes.map(m=>m.shape(pickup));
 const outputPerUnit=TINE_PICKUP_GAIN*model.modes.reduce((sum,m,i)=>sum+Math.abs(weights[i]*unit.initialVelocity[i])*Math.hypot(1,m.gamma/m.omegaD),0);
 const steps=model.modes.map(m=>{
  const e=Math.exp(-m.gamma*h),s=Math.sin(m.omegaD*h)/m.omegaD,c=Math.cos(m.omegaD*h);
  // Stable evaluation of 1-a avoids subtracting two nearly equal numbers.
  const oneMinusA=-Math.expm1(-m.gamma*h)+e*(2*Math.sin(m.omegaD*h/2)**2-m.gamma*s);
  return {a:e*(c+m.gamma*s),b:e*s,c:-e*m.omega*m.omega*s,d:e*(c-m.gamma*s),qForce:oneMinusA*m.shape(activation)/m.stiffnessNPerM,vForce:e*s*m.shape(activation)/m.massKg,phi:m.shape(activation)};
 });
 const q=new Float64Array(4),v=new Float64Array(4),work=new Float64Array(4);
 let frame=0,impulseNs=0,absoluteImpulseNs=0;
 function advance(forceN){
  if(!Number.isFinite(forceN)||frame>=8*sampleRate)throw Error('Finite force within an eight-second study is required.');
  const next=absoluteImpulseNs+Math.abs(forceN)*h,strength=next/1e-6;
  // Convolution with impulse responses is bounded by the integral of |force|.
  if(strength*unit.displacementBoundM>model.geometry.thicknessM*.1||strength*outputPerUnit>TINE_OUTPUT_BOUND)throw Error('Force exceeds the accumulated impulse admission bound.');
  for(let i=0;i<4;i++){
   const t=steps[i],before=q[i],velocity=v[i];
   q[i]=t.a*before+t.b*velocity+t.qForce*forceN;
   v[i]=t.c*before+t.d*velocity+t.vForce*forceN;
   work[i]+=forceN*t.phi*(q[i]-before);
  }
  impulseNs+=forceN*h;absoluteImpulseNs=next;frame++;
 }
 function snapshot(){const modes=model.modes.map((m,i)=>{
  const energyJ=.5*m.massKg*v[i]**2+.5*m.stiffnessNPerM*q[i]**2;
  return {displacementM:q[i],velocityMPerS:v[i],energyJ,workJ:work[i],dissipatedJ:work[i]-energyJ};
 });return {frame,impulseNs,absoluteImpulseNs,modes,pickupVelocityMPerS:v.reduce((sum,value,i)=>sum+weights[i]*value,0)};}
 return {advance,snapshot};
}

/** Sample-interval averages of J*pi/(2*T)*sin(pi*t/T), with T=frames/rate.
 * The stepper receives these held averages, not the continuous sine itself.
 */
export function halfSineForcePulse({impulseNs=1e-7,frames=48,sampleRate=48000}={}){
 if(!Number.isFinite(impulseNs)||Math.abs(impulseNs)>1e-6||!Number.isInteger(frames)||frames<1||frames>9600||!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Invalid bounded force pulse.');
 return Float64Array.from({length:frames},(_,i)=>impulseNs*sampleRate*Math.sin(Math.PI*(i+.5)/frames)*Math.sin(Math.PI/(2*frames)));
}
