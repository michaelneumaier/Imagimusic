import {createContinuousReturnStudy} from './continuous-return-study.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineImpulse} from '../tine/impulse.js';

/** Accepted-event response, not a new admission authority. Modal checkpoints
 * bound per-picture work: binary search, four transitions and81spatial samples.
 * Signed states combine before magnitudes, preserving interference. The veil
 * is a displacement bound, not instantaneous screen-rate vibration or pressure.
 */
export function createContinuousReturnView(seed=42,{sampleRate=48000}={}){
 const plan=createContinuousReturnStudy(seed,{sampleRate}),model=createTineImpulse(requestForTineDesign(plan.design).geometry);
 const unit=model.strike({activation:plan.design.activation,impulseNs:1e-6}),positions=Array.from({length:81},(_,i)=>i/80),shapes=positions.map(u=>model.modes.map(m=>Math.abs(m.shape(u))));
 const checkpoints=[];let scores=0,guests=0,fadeStart=plan.frames-Math.round(.025*sampleRate);
 //1000x spatial magnification (100 drawing units per metre) keeps the full
 // admitted1mm-tine small-displacement bound within a held, bounded view.
 const magnification=1000,layout=Object.freeze({instances:Object.freeze([Object.freeze({id:0,bodyMm:80,position:Object.freeze([0,0,0])})]),camera:Object.freeze({target:Object.freeze([3,3.5,0]),direction:Object.freeze([5,8,18]),radius:14})});
 function propagate(previous,frame){
  const dt=(frame-(previous?.event.frame??frame))/sampleRate,q=[],v=[];
  for(let i=0;i<model.modes.length;i++){
   const m=model.modes[i],beforeQ=previous?.q[i]??0,beforeV=previous?.v[i]??0,decay=Math.exp(-m.gamma*dt),c=Math.cos(m.omegaD*dt),s=Math.sin(m.omegaD*dt)/m.omegaD;
   q.push(decay*((c+m.gamma*s)*beforeQ+s*beforeV));v.push(decay*(-m.omega*m.omega*s*beforeQ+(c-m.gamma*s)*beforeV));
  }
  return {q,v};
 }
 function accept(batch){
  if(!Array.isArray(batch)||batch.length+checkpoints.length>4096)throw Error('Invalid continuous visual history.');
  let scoreCount=scores,guestCount=guests,previous=checkpoints.at(-1);const next=[];
  for(const [offset,input] of batch.entries()){
   if(!input||input.index!==checkpoints.length+offset||!Number.isInteger(input.frame)||input.frame<(previous?.event.frame??0)||input.frame>fadeStart||!Number.isFinite(input.strength)||input.strength===0||Math.abs(input.strength)>.1||!['score','guest'].includes(input.origin))throw Error('Invalid continuous visual touch.');
   if(input.origin==='score'){
    const planned=plan.events[scoreCount++];if(!planned||planned.frame!==input.frame||planned.strength!==input.strength)throw Error('The visible score differs from its source.');
   }else{if(plan.events[scoreCount]?.frame<=input.frame)throw Error('A guest cannot precede a due score note.');guestCount++;}
   const state=propagate(previous,input.frame);for(let i=0;i<state.v.length;i++)state.v[i]+=input.strength*unit.initialVelocity[i];
   previous={...state,event:Object.freeze({frame:input.frame,strength:input.strength,index:input.index,origin:input.origin}),scores:scoreCount,guests:guestCount};next.push(previous);
  }
  checkpoints.push(...next);scores=scoreCount;guests=guestCount;
 }
 function end(frame){if(!Number.isInteger(frame)||frame<0||frame>fadeStart||frame<(checkpoints.at(-1)?.event.frame??0))throw Error('Invalid continuous visual ending.');fadeStart=frame;}
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>48)throw Error('Invalid continuous visual time.');
  const raw=seconds*sampleRate,nearest=Math.round(raw),frame=Math.abs(raw-nearest)<1e-7?nearest:raw;
  let lo=0,hi=checkpoints.length;while(lo<hi){const mid=(lo+hi)>>>1;if(checkpoints[mid].event.frame<=frame)lo=mid+1;else hi=mid;}
  const previous=checkpoints[lo-1],state=propagate(previous,frame),amplitudesM=model.modes.map((m,i)=>Math.hypot(state.q[i],(state.v[i]+m.gamma*state.q[i])/m.omegaD));
  const points=positions.map((u,i)=>({u,boundM:shapes[i].reduce((sum,shape,j)=>sum+shape*amplitudesM[j],0)}));
  const fadeFrames=Math.round(.025*sampleRate),endingOpacity=frame<fadeStart?1:Math.max(0,(fadeStart+fadeFrames-1-frame)/(fadeFrames-1)),last=previous?.event;
  const touchMarker=last&&frame-last.frame<Math.round(.12*sampleRate)&&endingOpacity>0?{activation:plan.design.activation,frame:last.frame,origin:last.origin}:null;
  return {seconds,frame,touches:lo,scoreTouches:previous?.scores??0,guestTouches:previous?.guests??0,amplitudesM,
   instances:[{...layout.instances[0],points:previous?points:null,touched:!!previous,touchMarker,endingOpacity,passId:previous?0:null,localSeconds:frame/sampleRate}],performers:[]};
 }
 return Object.freeze({plan,layout,magnification,accept,end,at,get accepted(){return checkpoints.map(c=>c.event);}});
}
