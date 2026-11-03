import {createResonanceSketch} from './model.js';
const position=u=>{if(!Number.isFinite(u)||u<0||u>1)throw Error('Position must be within 0…1.');return u;};
/** Authored peak-one shapes, not modes inferred from geometry or the recording. */
export function sketchShape(index,u){
 if(!Number.isInteger(index)||index<0||index>3)throw Error('Shape index must be within 0…3.');
 const phase=(index+1)*position(u);
 return Number.isInteger(phase)?0:Math.sin(Math.PI*phase);
}
/** A finite modal field with independently supplied frequencies and decays.
 * Spatial activation weights the existing displacement AND velocity initial
 * conditions. It is not a point-force impulse or a local string/beam model.
 */
export function createSpatialSketch(parameters){
 const source=createResonanceSketch(parameters);
 function weights(activation,pickup){position(activation);position(pickup);return source.modes.map((_,i)=>sketchShape(i,activation)*sketchShape(i,pickup));}
 function modalState(age,{activation=.3,strength=1}={}){
  position(activation);
  return source.modes.map((_,i)=>{const state=source.modeState(i,age,strength),shape=sketchShape(i,activation);return {displacement:state.displacement*shape,velocity:state.velocity*shape,envelope:state.envelope*Math.abs(shape),energy:state.energy*shape*shape};});
 }
 function pointState(age,{activation=.3,pickup=.7,strength=1}={}){
  position(pickup);const modes=modalState(age,{activation,strength});
  return modes.reduce((sum,state,i)=>{const shape=sketchShape(i,pickup);sum.displacement+=shape*state.displacement;sum.velocity+=shape*state.velocity;sum.envelopeBound+=Math.abs(shape)*state.envelope;return sum;},{displacement:0,velocity:0,envelopeBound:0});
 }
 function sample(age,options={}){return source.pickupGain*pointState(age,options).displacement;}
 function render({sampleRate=8000,seconds=4,activation=.3,pickup=.7,strength=1}={}){
  // Reuse the source renderer's admission/fade contract, including silent nodes.
  const admission=source.render({sampleRate,seconds,strength}),projection=weights(activation,pickup);
  const channel=new Float32Array(admission.frames);
  for(let frame=0;frame<channel.length;frame++){
   const age=frame/sampleRate,ending=frame<admission.frames-admission.fadeFrames?1:(admission.frames-1-frame)/(admission.fadeFrames-1);
   let value=0;for(let i=0;i<projection.length;i++)value+=projection[i]*source.modeState(i,age,strength).displacement;
   channel[frame]=value*source.pickupGain*ending;
  }
  return {sampleRate,frames:admission.frames,fadeFrames:admission.fadeFrames,channels:[channel],activation,pickup,strength,pickupGain:source.pickupGain,peakBound:source.singleActivationPeakBound*strength};
 }
 return Object.freeze({source,weights,modalState,pointState,sample,render,pickupGain:source.pickupGain});
}
