import {createTineImpulse} from '../tine/impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from '../tine/render.js';

/** Research kernel, not a saved live-pass version. One fixed body, no automatic
 * ending, and no retained event history. The owner supplies transport and logs.
 * Absolute impulse allowance decays at the slowest retained modal decay rate,
 * conservatively bounding every mode without relying on phase cancellation.
 * Admission leaves 1% numerical margin; this is not a fabrication/stress proof.
 */
export function createContinuousTineKernel(geometry,{sampleRate=48000,count=4,activation=.85,pickup=.85}={}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Invalid continuous sample rate.');
 if(!Number.isFinite(pickup)||pickup<0||pickup>1)throw Error('Invalid pickup position.');
 const model=createTineImpulse(geometry,{count}),unit=model.strike({activation,impulseNs:1e-6});
 if(model.modes.some(m=>m.frequencyHz>=.45*sampleRate))throw Error('A retained mode exceeds the sample-rate guard.');
 const weights=model.modes.map(m=>m.shape(pickup)),q=new Float64Array(count),v=new Float64Array(count);
 const slowestDecay=Math.min(...model.modes.map(m=>m.gamma));
 const transitions=model.modes.map(m=>{
  const decay=Math.exp(-m.gamma/sampleRate),c=Math.cos(m.omegaD/sampleRate),s=Math.sin(m.omegaD/sampleRate)/m.omegaD;
  return [decay*(c+m.gamma*s),decay*s,-decay*m.omega*m.omega*s,decay*(c-m.gamma*s)];
 });
 const unitOutputBound=TINE_PICKUP_GAIN*model.modes.reduce((sum,m,i)=>sum+Math.abs(weights[i]*unit.initialVelocity[i])*Math.hypot(1,m.gamma/m.omegaD),0);
 let frame=0,accepted=0,weightedStrength=0,budgetFrame=0;
 const decayedStrength=()=>weightedStrength*Math.exp(-slowestDecay*(frame-budgetFrame)/sampleRate);
 function bounds(strength=0){
  let displacement=0,output=0;
  model.modes.forEach((m,i)=>{
   const amplitude=Math.hypot(q[i],(v[i]+strength*unit.initialVelocity[i]+m.gamma*q[i])/m.omegaD);
   displacement+=amplitude;output+=TINE_PICKUP_GAIN*Math.abs(weights[i])*amplitude*Math.hypot(m.omegaD,m.gamma);
  });
  const total=decayedStrength()+Math.abs(strength);
  return {displacementBoundM:Math.max(displacement,total*unit.displacementBoundM),outputBound:Math.max(output,total*unitOutputBound)};
 }
 function strike(strength=.1){
  if(!Number.isFinite(strength)||strength===0||Math.abs(strength)>.1)throw Error('A nonzero continuous touch must be within ±0.1.');
  if(!Number.isSafeInteger(accepted+1))throw Error('Continuous event count exhausted.');
  const next=bounds(strength);
  if(next.displacementBoundM>.99*model.geometry.thicknessM*.1||next.outputBound>.99*TINE_OUTPUT_BOUND)throw Error('The ringing body has no reserved headroom for this touch yet.');
  for(let i=0;i<count;i++)v[i]+=strength*unit.initialVelocity[i];
  weightedStrength=decayedStrength()+Math.abs(strength);budgetFrame=frame;accepted++;
  return Object.freeze({frame,strength,index:accepted-1});
 }
 function process(output){
  if(!(output instanceof Float32Array)||output.length>16384||!Number.isSafeInteger(frame+output.length))throw Error('Use a Float32 block of at most16384samples within the safe frame clock.');
  for(let k=0;k<output.length;k++){
   let value=0;
   for(let i=0;i<count;i++){
    value+=weights[i]*v[i];
    const [a,b,c,d]=transitions[i],before=q[i];q[i]=a*before+b*v[i];v[i]=c*before+d*v[i];
   }
   output[k]=TINE_PICKUP_GAIN*value;
  }
  frame+=output.length;return output;
 }
 /** Conservative committed-window forecast, with an extra planning margin.
  * Decay the larger current analytic/state bound, then add absolute impulses.
  * Validates all input first; never advances or changes the ringing body.
  */
 function forecast(events){
  if(!Array.isArray(events)||events.length>65)throw Error('Forecast at most65touches.');
  let previous=frame;
  const planned=events.map(event=>{
   if(!event||!Number.isSafeInteger(event.frame)||event.frame<previous||event.frame-frame>8*sampleRate||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1)throw Error('Invalid ordered continuous forecast within8seconds.');
   previous=event.frame;return {frame:event.frame,strength:event.strength};
  });
  let {displacementBoundM,outputBound}=bounds(),at=frame;
  for(const event of planned){
   const decay=Math.exp(-slowestDecay*(event.frame-at)/sampleRate);at=event.frame;
   displacementBoundM=displacementBoundM*decay+Math.abs(event.strength)*unit.displacementBoundM;
   outputBound=outputBound*decay+Math.abs(event.strength)*unitOutputBound;
   if(displacementBoundM>.98*model.geometry.thicknessM*.1||outputBound>.98*TINE_OUTPUT_BOUND)return {admitted:false,frame:at,displacementBoundM,outputBound};
  }
  return {admitted:true,frame:at,displacementBoundM,outputBound};
 }
 function snapshot(){return {frame,accepted,weightedStrength:decayedStrength(),slowestDecay,...bounds(),modes:model.modes.map((m,i)=>({displacementM:q[i],velocityMPerS:v[i],energyJ:.5*m.massKg*v[i]*v[i]+.5*m.stiffnessNPerM*q[i]*q[i]}))};}
 return Object.freeze({sampleRate,count,geometry:model.geometry,strike,process,snapshot,forecast,get frame(){return frame;}});
}
