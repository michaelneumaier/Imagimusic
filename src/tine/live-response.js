import {validateTineLiveRecord} from './live-record.js';
import {requestForTineDesign} from './address.js';
import {createTineImpulse} from './impulse.js';
import {tineDisplacementWindow} from './displacement-window.js';
/** Inspect the mechanical state at an integer sample boundary. Impulses at that
 * boundary have already changed velocity; displacement is continuous. The audio
 * ending gain does not alter the mechanical state. No display-rate animation.
 */
export function createTineLiveResponse(value){
 const record=validateTineLiveRecord(value),{geometry}=requestForTineDesign(record.design),model=createTineImpulse(geometry);
 const unit=model.strike({activation:record.design.activation,impulseNs:1e-6});
 const endFrame=record.fadeStart+Math.round(.025*record.sampleRate);
 const positions=Array.from({length:81},(_,i)=>i/80),shapes=positions.map(u=>model.modes.map(m=>m.shape(u)));
 const pickupShapes=model.modes.map(m=>m.shape(record.design.pickup));
 function stateAt(frame){
  if(!Number.isInteger(frame)||frame<0||frame>endFrame)throw Error('Inspection frame must be within the completed pass.');
  return model.modes.map((mode,i)=>{
   let displacementM=0,velocityMPerS=0;
   for(const event of record.events){
    if(event.frame>frame)break;
    const age=(frame-event.frame)/record.sampleRate,phase=mode.omegaD*age,decay=Math.exp(-mode.gamma*age),v0=event.strength*unit.initialVelocity[i];
    displacementM+=decay*v0*Math.sin(phase)/mode.omegaD;
    velocityMPerS+=decay*v0*(Math.cos(phase)-mode.gamma/mode.omegaD*Math.sin(phase));
   }
   return {displacementM,velocityMPerS,energyJ:.5*mode.massKg*velocityMPerS**2+.5*mode.stiffnessNPerM*displacementM**2};
  });
 }
 function at(frame){
  const state=stateAt(frame);
  const point=weights=>state.reduce((sum,s,i)=>({displacementM:sum.displacementM+weights[i]*s.displacementM,velocityMPerS:sum.velocityMPerS+weights[i]*s.velocityMPerS}),{displacementM:0,velocityMPerS:0});
  return {frame,seconds:frame/record.sampleRate,lengthM:geometry.lengthM,modes:state,totalEnergyJ:state.reduce((sum,s)=>sum+s.energyJ,0),pickup:point(pickupShapes),points:positions.map((u,i)=>({u,xM:u*geometry.lengthM,...point(shapes[i])}))};
 }
 function window(startFrame,sampleCount){
  if(!Number.isInteger(sampleCount)||sampleCount<1||sampleCount>Math.round(.1*record.sampleRate))throw Error('Inspection window must contain 1 sample to 100 ms.');
  if(!Number.isInteger(startFrame)||startFrame<0||startFrame+sampleCount-1>endFrame)throw Error('Every inspected sample must be within the completed pass.');
  const samples=new Float64Array(sampleCount*4);
  for(let n=0;n<sampleCount;n++)stateAt(startFrame+n).forEach((m,i)=>{samples[n*4+i]=m.displacementM;});
  return tineDisplacementWindow(geometry,{samples,sampleRate:record.sampleRate,startFrame});
 }
 return Object.freeze({record,endFrame,at,window,frequenciesHz:Object.freeze(model.modes.map(m=>m.frequencyHz))});
}
