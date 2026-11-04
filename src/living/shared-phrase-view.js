import {createLivingSharedPhrasePass} from './shared-phrase-pass.js';
import {validateTineLiveRecord} from '../tine/live-record.js';
import {createLivingResponse} from './response.js';

/** One physical response reconstructed from accepted events. No speculative
 * guest animation, screen-rate signed vibration or physical ending damping.
 */
export function createLivingSharedPhraseView(value,{guestLimit}={}){
 const admitted=createLivingSharedPhrasePass(value,{guestLimit}),source=admitted.source,rate=source.sampleRate;
 const response=createLivingResponse(source.design,rate),events=[];
 let scoreCount=0,guestCount=0,fadeStart=source.fadeStart;
 const layout=Object.freeze({instances:Object.freeze([Object.freeze({id:0,bodyMm:80,position:Object.freeze([0,0,0])})]),camera:Object.freeze({target:Object.freeze([3,3,0]),direction:Object.freeze([5,8,18]),radius:8})});
 function accept(batch){
  if(!Array.isArray(batch)||batch.length+events.length>8)throw Error('Invalid shared visual touch batch.');
  let scores=scoreCount,guests=guestCount,previous=events.at(-1)?.frame??0;
  const next=batch.map((event,i)=>{
   if(!event||event.index!==events.length+i||!Number.isInteger(event.frame)||event.frame<previous||event.frame>fadeStart||!Number.isFinite(event.strength)||event.strength<=0||event.strength>.1||!['score','guest'].includes(event.origin))throw Error('Invalid accepted shared visual touch.');
   if(event.origin==='score'){
    const planned=source.events[scores++];
    if(!planned||planned.frame!==event.frame||planned.strength!==event.strength)throw Error('The visual score touch differs from the original.');
   }else{
    if(source.events[scores]?.frame<=event.frame)throw Error('A guest cannot precede a due score touch.');
    if(++guests>admitted.guestLimit)throw Error('Visual guest touches exceed the reserved quota.');
   }
   previous=event.frame;return Object.freeze({frame:event.frame,strength:event.strength,origin:event.origin,index:event.index});
  });
  // Preflight the entire batch before mutating the displayed response.
  validateTineLiveRecord({...source,fadeStart,events:[...events,...next].map(({frame,strength})=>({frame,strength}))});
  for(const event of next){response.accept(event);events.push(event);}scoreCount=scores;guestCount=guests;
 }
 function end(frame){
  if(!Number.isInteger(frame)||frame<0||frame>fadeStart||frame<(events.at(-1)?.frame??0))throw Error('Invalid shared visual ending.');
  fadeStart=frame;
 }
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>8)throw Error('Shared visual time must be within the bounded pass.');
  const raw=seconds*rate,nearest=Math.round(raw),frame=Math.abs(raw-nearest)<1e-7?nearest:raw;
  const visible=events.filter(event=>event.frame<=frame),fadeFrames=Math.round(.025*rate),endFrame=fadeStart+fadeFrames;
  const endingOpacity=frame<fadeStart?1:Math.max(0,(endFrame-1-frame)/(fadeFrames-1));
  const touched=visible.length>0,last=visible.at(-1);
  const touchMarker=last&&frame-last.frame<Math.round(.12*rate)&&endingOpacity>0?{activation:source.design.activation,frame:last.frame,origin:last.origin}:null;
  return {seconds,frame,touches:visible.length,scoreTouches:visible.filter(e=>e.origin==='score').length,guestTouches:visible.filter(e=>e.origin==='guest').length,
   instances:[{...layout.instances[0],points:touched?response.at(frame/rate).points:null,touched,touchMarker,endingOpacity,passId:touched?0:null,localSeconds:frame/rate}],performers:[]};
 }
 return Object.freeze({source,layout,accept,end,at,get accepted(){return events.slice();}});
}
