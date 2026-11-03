import {createTineImpulse} from './impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from './render.js';

/** Streaming SI state for one fixed body, without an audio ending fade.
 * At each frame: admit impulses, read velocity pickup, advance one sample.
 * Inputs last at most four seconds; output spans at most eight seconds.
 * Admission adds absolute global bounds, without reclaiming decayed budget.
 */
export function createTineLiveKernel(geometry,{sampleRate=48000,count=4,activation=.85,pickup=.85}={}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Sample rate must be an integer within 8000…96000.');
 if(!Number.isFinite(pickup)||pickup<0||pickup>1)throw Error('Pickup must be within 0…1.');
 const model=createTineImpulse(geometry,{count}),unit=model.strike({activation,impulseNs:1e-6});
 if(model.modes.some(m=>m.frequencyHz>=.45*sampleRate))throw Error('A retained mode exceeds the 0.45 × sample-rate guard.');
 const q=new Float64Array(count),v=new Float64Array(count),weights=model.modes.map(m=>m.shape(pickup));
 const transitions=model.modes.map(m=>{
  const decay=Math.exp(-m.gamma/sampleRate),c=Math.cos(m.omegaD/sampleRate),s=Math.sin(m.omegaD/sampleRate)/m.omegaD;
  return [decay*(c+m.gamma*s),decay*s,-decay*m.omega*m.omega*s,decay*(c-m.gamma*s)];
 });
 const unitOutputBound=TINE_PICKUP_GAIN*model.modes.reduce((sum,m,i)=>sum+Math.abs(weights[i]*unit.initialVelocity[i])*Math.hypot(1,m.gamma/m.omegaD),0);
 const events=[];let frame=0,absoluteStrength=0;
 function strike(strength=.1){
  if(!Number.isFinite(strength)||Math.abs(strength)>1)throw Error('Strength must be within ±1.');
  if(frame>4*sampleRate)throw Error('The four-second touch window has ended.');
  if(events.length>=8)throw Error('This playing pass accepts at most eight touches.');
  const next=absoluteStrength+Math.abs(strength);
  if(next*unit.displacementBoundM>model.geometry.thicknessM*.1)throw Error('Touches exceed the combined small-displacement bound.');
  if(next*unitOutputBound>TINE_OUTPUT_BOUND)throw Error('Touches exceed fixed-gain headroom; no normalization is applied.');
  const event=Object.freeze({frame,strength});
  for(let i=0;i<count;i++)v[i]+=strength*unit.initialVelocity[i];
  absoluteStrength=next;events.push(event);return event;
 }
 function process(output){
  if(!(output instanceof Float32Array)||output.length>8*sampleRate-frame)throw Error('Output must fit within the eight-second playing pass.');
  for(let k=0;k<output.length;k++){
   let value=0;
   for(let i=0;i<count;i++){
    value+=weights[i]*v[i];
    const [a,b,c,d]=transitions[i],before=q[i];q[i]=a*before+b*v[i];v[i]=c*before+d*v[i];
   }
   output[k]=TINE_PICKUP_GAIN*value;frame++;
  }
  return output;
 }
 function snapshot(){return {
  frame,absoluteStrength,outputBound:absoluteStrength*unitOutputBound,displacementBoundM:absoluteStrength*unit.displacementBoundM,
  events:events.slice(),modes:model.modes.map((m,i)=>({displacementM:q[i],velocityMPerS:v[i],energyJ:.5*m.massKg*v[i]*v[i]+.5*m.stiffnessNPerM*q[i]*q[i]}))
 };}
 return Object.freeze({geometry:model.geometry,sampleRate,count,activation,pickup,impulseNs:1e-6,pickupGain:TINE_PICKUP_GAIN,strike,process,snapshot});
}
