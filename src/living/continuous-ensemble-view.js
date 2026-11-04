import {createContinuousEnsembleStudy} from './continuous-ensemble-study.js';
import {createMemoryEnsembleStudy} from './memory-ensemble-study.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';

/** A visual reading of acknowledged score events. Each body has its own state;
 * spatial relationships stage the musical exchange, not mechanical coupling.
 * Veils show magnified displacement bounds, not audio-frequency motion. */
export function createContinuousEnsembleView(seed=42,{sampleRate=48000,mode='fixed'}={}){
 if(!['fixed','memory'].includes(mode))throw Error('Choose a supported ensemble visual composition mode.');
 let plan=(mode==='memory'?createMemoryEnsembleStudy:createContinuousEnsembleStudy)(seed,{sampleRate}),memory=[],sealed=false;
 const models=plan.bodies.map(body=>createTineImpulse(requestForTineDesign(body).geometry));
 const units=models.map((model,i)=>model.strike({activation:plan.bodies[i].activation,impulseNs:1e-6}));
 const positions=Array.from({length:81},(_,i)=>i/80),shapes=models.map(model=>positions.map(u=>model.modes.map(mode=>Math.abs(mode.shape(u)))));
 const checkpoints=[[],[],[]],history=[];let scores=0,fadeStart=plan.frames-Math.round(.025*sampleRate);
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
  if(!Array.isArray(batch)||history.length+batch.length>3*4096)throw Error('Invalid ensemble visual history.');
  const next=[[],[],[]],events=[];let scoreCount=scores,previousFrame=history.at(-1)?.frame??0,candidatePlan=plan,candidateSealed=sealed;const candidateMemory=memory.slice();
  for(const input of batch){
   const body=input?.body;
   if(!input||!Number.isInteger(body)||body<0||body>2||!['score','guest'].includes(input.origin)||!Number.isInteger(input.frame)||input.frame<previousFrame||input.frame>fadeStart||!Number.isFinite(input.strength)||input.strength===0||Math.abs(input.strength)>.1||input.index!==checkpoints[body].length+next[body].length||input.index>=4096)throw Error('The visible ensemble differs from its accepted score.');
   if(mode==='memory'&&!candidateSealed&&input.frame>=6*sampleRate){candidatePlan=createMemoryEnsembleStudy(seed,{sampleRate,contributions:candidateMemory});candidateSealed=true;}
   const expected=candidatePlan.events[scoreCount];
   if(input.origin==='score'){
    if(!expected||input.body!==expected.body||input.frame!==expected.frame||input.strength!==expected.strength)throw Error('The visible ensemble differs from its accepted score.');scoreCount++;
   }else{
    if(expected?.frame<=input.frame)throw Error('A guest cannot precede a due ensemble score note.');
    if(mode==='memory'&&input.frame<6*sampleRate&&candidateMemory.length<3)candidateMemory.push({body,frame:input.frame,strength:input.strength,index:input.index,origin:'guest'});
   }
   previousFrame=input.frame;
   const previous=next[body].at(-1)??checkpoints[body].at(-1),state=propagate(body,previous,input.frame);
   state.v.forEach((_,i)=>state.v[i]+=input.strength*units[body].initialVelocity[i]);
   const event=Object.freeze({body,frame:input.frame,strength:input.strength,index:input.index,origin:input.origin});
   next[body].push({...state,event});events.push(event);
  }
  next.forEach((items,body)=>checkpoints[body].push(...items));history.push(...events);scores=scoreCount;plan=candidatePlan;memory=candidateMemory;sealed=candidateSealed;
 }
 function end(frame){
  if(!Number.isInteger(frame)||frame<0||frame>fadeStart||frame<(history.at(-1)?.frame??0))throw Error('Invalid ensemble visual ending.');
  if(mode==='memory'&&!sealed&&frame>=6*sampleRate){plan=createMemoryEnsembleStudy(seed,{sampleRate,contributions:memory});sealed=true;}
  fadeStart=frame;
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
   const touchMarker=last&&frame-last.frame<Math.round(.12*sampleRate)&&endingOpacity>0?{activation:plan.bodies[body].activation,frame:last.frame,origin:last.origin}:null;
   return {...layout.instances[body],points,amplitudesM,touches:lo,touched:!!previous,touchMarker,endingOpacity,passId:previous?body:null,localSeconds:frame/sampleRate};
  });
  return {seconds,frame,touches,instances,performers:[]};
 }
 return Object.freeze({get plan(){return plan;},layout,magnification,accept,end,at,get accepted(){return history.slice();}});
}
