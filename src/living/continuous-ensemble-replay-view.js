import {parseContinuousEnsembleRecord} from './continuous-ensemble-record.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';

/** Read-only response sampler for a capture already admitted by the replay
 * worker. Structural copying here is not a second physical-admission authority.
 * Origins remain descriptive labels, not proof of composition or authorship. */
export function createContinuousEnsembleReplayView(verifiedRecord){
 const record=parseContinuousEnsembleRecord(verifiedRecord),{sampleRate,fadeStart}=record.records[0],fadeFrames=Math.round(.025*sampleRate),frames=fadeStart+fadeFrames,duration=frames/sampleRate;
 const models=record.records.map(r=>createTineImpulse(requestForTineDesign(r.design).geometry));
 const positions=Array.from({length:81},(_,i)=>i/80),shapes=models.map(model=>positions.map(u=>model.modes.map(mode=>Math.abs(mode.shape(u)))));
 function propagate(body,previous,frame){
  const dt=(frame-(previous?.frame??frame))/sampleRate,q=[],v=[];
  models[body].modes.forEach((m,i)=>{
   const a=previous?.q[i]??0,b=previous?.v[i]??0,decay=Math.exp(-m.gamma*dt),c=Math.cos(m.omegaD*dt),s=Math.sin(m.omegaD*dt)/m.omegaD;
   q.push(decay*((c+m.gamma*s)*a+s*b));v.push(decay*(-m.omega*m.omega*s*a+(c-m.gamma*s)*b));
  });return {q,v};
 }
 const checkpoints=record.records.map((r,body)=>{
  const unit=models[body].strike({activation:r.design.activation,impulseNs:1e-6}),items=[];
  for(const event of r.events){
   const state=propagate(body,items.at(-1),event.frame);
   state.v.forEach((_,i)=>state.v[i]+=event.strength*unit.initialVelocity[i]);items.push({...state,frame:event.frame,event});
  }
  return items;
 });
 const locations=[[0,0,5],[-13,0,-5],[13,0,-5]],magnification=1000;
 const layout=Object.freeze({instances:Object.freeze(record.records.map((r,id)=>Object.freeze({id,bodyMm:r.design.lengthMm,bodyWidthMm:r.design.widthMm,position:Object.freeze(locations[id])}))),camera:Object.freeze({target:Object.freeze([3,3.5,0]),direction:Object.freeze([5,8,18]),radius:28})});
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>duration)throw Error('Invalid saved ensemble visual time.');
  const raw=seconds*sampleRate,nearest=Math.round(raw),frame=Math.abs(raw-nearest)<1e-7?nearest:raw;
  const endingOpacity=frame<fadeStart?1:Math.max(0,(frames-1-frame)/(fadeFrames-1));let touches=0;
  const instances=checkpoints.map((items,body)=>{
   let lo=0,hi=items.length;while(lo<hi){const mid=(lo+hi)>>>1;if(items[mid].frame<=frame)lo=mid+1;else hi=mid;}
   touches+=lo;const previous=items[lo-1],state=propagate(body,previous,frame),last=previous?.event;
   const amplitudesM=models[body].modes.map((m,i)=>Math.hypot(state.q[i],(state.v[i]+m.gamma*state.q[i])/m.omegaD));
   const points=previous?positions.map((u,i)=>({u,boundM:shapes[body][i].reduce((sum,shape,j)=>sum+shape*amplitudesM[j],0)})):null;
   const touchMarker=last&&frame-last.frame<Math.round(.12*sampleRate)&&endingOpacity>0?{activation:record.records[body].design.activation,frame:last.frame,origin:last.origin}:null;
   return {...layout.instances[body],points,amplitudesM,touches:lo,touched:!!previous,touchMarker,endingOpacity,passId:previous?body:null,localSeconds:frame/sampleRate};
  });
  return {seconds,frame,touches,instances,performers:[]};
 }
 return Object.freeze({record,duration,frames,sampleRate,layout,magnification,at});
}
