import {createContinuousEnsembleStudy} from './continuous-ensemble-study.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';

/** A visual reading of acknowledged score events. Each body has its own state;
 * spatial relationships stage the musical exchange, not mechanical coupling.
 * Veils show magnified displacement bounds, not audio-frequency motion. */
export function createContinuousEnsembleView(seed=42,{sampleRate=48000}={}){
 const plan=createContinuousEnsembleStudy(seed,{sampleRate}),models=plan.bodies.map(body=>createTineImpulse(requestForTineDesign(body).geometry));
 const units=models.map((model,i)=>model.strike({activation:plan.bodies[i].activation,impulseNs:1e-6}));
 const positions=Array.from({length:81},(_,i)=>i/80),shapes=models.map(model=>positions.map(u=>model.modes.map(mode=>Math.abs(mode.shape(u)))));
 const checkpoints=[[],[],[]],history=[];let fadeStart=plan.frames-Math.round(.025*sampleRate);
 const locations=[[0,0,5],[-13,0,-5],[13,0,-5]],magnification=1000;
 const layout=Object.freeze({instances:Object.freeze(plan.bodies.map((body,id)=>Object.freeze({id,bodyMm:body.lengthMm,position:Object.freeze(locations[id])}))),camera:Object.freeze({target:Object.freeze([3,3.5,0]),direction:Object.freeze([5,8,18]),radius:24})});
 function propagate(body,previous,frame){
  const dt=(frame-(previous?.event.frame??frame))/sampleRate,q=[],v=[];
  models[body].modes.forEach((m,i)=>{
   const a=previous?.q[i]??0,b=previous?.v[i]??0,decay=Math.exp(-m.gamma*dt),c=Math.cos(m.omegaD*dt),s=Math.sin(m.omegaD*dt)/m.omegaD;
   q.push(decay*((c+m.gamma*s)*a+s*b));v.push(decay*(-m.omega*m.omega*s*a+(c-m.gamma*s)*b));
  });return {q,v};
 }
 function accept(batch){
  if(!Array.isArray(batch)||history.length+batch.length>plan.events.length)throw Error('Invalid ensemble visual history.');
  const next=[[],[],[]],events=[];
  for(const [offset,input] of batch.entries()){
   const expected=plan.events[history.length+offset],body=expected.body;
   if(!input||input.origin!=='score'||input.body!==body||input.frame!==expected.frame||input.strength!==expected.strength||input.index!==checkpoints[body].length+next[body].length||input.frame>fadeStart)throw Error('The visible ensemble differs from its accepted score.');
   const previous=next[body].at(-1)??checkpoints[body].at(-1),state=propagate(body,previous,input.frame);
   state.v.forEach((_,i)=>state.v[i]+=input.strength*units[body].initialVelocity[i]);
   const event=Object.freeze({body,frame:input.frame,strength:input.strength,index:input.index,origin:'score'});
   next[body].push({...state,event});events.push(event);
  }
  next.forEach((items,body)=>checkpoints[body].push(...items));history.push(...events);
 }
 function end(frame){
  if(!Number.isInteger(frame)||frame<0||frame>fadeStart||frame<(history.at(-1)?.frame??0))throw Error('Invalid ensemble visual ending.');fadeStart=frame;
 }
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>48)throw Error('Invalid ensemble visual time.');
  const raw=seconds*sampleRate,nearest=Math.round(raw),frame=Math.abs(raw-nearest)<1e-7?nearest:raw,fadeFrames=Math.round(.025*sampleRate);
  const endingOpacity=frame<fadeStart?1:Math.max(0,(fadeStart+fadeFrames-1-frame)/(fadeFrames-1));let touches=0;
  const instances=checkpoints.map((items,body)=>{
   let lo=0,hi=items.length;while(lo<hi){const mid=(lo+hi)>>>1;if(items[mid].event.frame<=frame)lo=mid+1;else hi=mid;}
   touches+=lo;const previous=items[lo-1],state=propagate(body,previous,frame),last=previous?.event;
   const amplitudesM=models[body].modes.map((m,i)=>Math.hypot(state.q[i],(state.v[i]+m.gamma*state.q[i])/m.omegaD));
   const points=previous?positions.map((u,i)=>({u,boundM:shapes[body][i].reduce((sum,shape,j)=>sum+shape*amplitudesM[j],0)})):null;
   const touchMarker=last&&frame-last.frame<Math.round(.12*sampleRate)&&endingOpacity>0?{activation:plan.bodies[body].activation,frame:last.frame,origin:'score'}:null;
   return {...layout.instances[body],points,amplitudesM,touches:lo,touched:!!previous,touchMarker,endingOpacity,passId:previous?body:null,localSeconds:frame/sampleRate};
  });
  return {seconds,frame,touches,instances,performers:[]};
 }
 return Object.freeze({plan,layout,magnification,accept,end,at,get accepted(){return history.slice();}});
}
