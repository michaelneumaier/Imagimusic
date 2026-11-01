import {validateRestRecord,REST_RECORD_KIND,REST_RECORD_VERSION} from '../score/grove-rest.js';
/** Record only audio-thread decisions. Requested times and queue receipts are
 * diagnostics; the saved passage uses actual frames and application order. */
export function createRestCapture(recipe,{generation}={}){
 if(typeof generation!=='string'||!generation)throw new Error('Capture needs a passage generation');
 const metadata=structuredClone({version:REST_RECORD_VERSION,kind:REST_RECORD_KIND,grove:recipe.grove,voice:recipe.voice,sampleRate:recipe.sampleRate,outputGain:recipe.outputGain,zones:recipe.zones,strengths:recipe.strengths.map(s=>({name:s.name,c:s.c}))});
 const events=[],contacts=[],active=new Map(),ids=new Set();let origin=null,lastOrder=-1,lastFrame=-1,ended=null,complete=false,failure=null,rejected=0;
 function close(body,frame){const contact=active.get(body);if(!contact)return;if(frame>contact.start)contacts.push({...contact,end:frame});active.delete(body);}
 function process(ack){
  if(!Number.isSafeInteger(ack.appliedFrame)||ack.appliedFrame<0||ack.appliedFrame<lastFrame||ack.order!==lastOrder+1||typeof ack.id!=='string'||ids.has(ack.id)||typeof ack.accepted!=='boolean')throw new Error('Invalid or missing Rest acknowledgement');
  if(!Number.isSafeInteger(ack.requestedFrame)||ack.requestedFrame<0||ack.appliedFrame<ack.requestedFrame||ack.lateByFrames!==ack.appliedFrame-ack.requestedFrame||ack.event?.id!==ack.id||ack.event?.frame!==ack.requestedFrame)throw new Error('Rest acknowledgement does not match its request');
  ids.add(ack.id);lastOrder=ack.order;lastFrame=ack.appliedFrame;
  if(!ack.accepted){rejected++;return;}
  if(ended)throw new Error('Accepted gesture after the recorded ending');
  const event=ack.event;
  if(!['strike','contact','quiet'].includes(event.kind))throw new Error('Unknown recorded Rest event');
  // A redundant release before any gesture does not start the passage clock.
  if(event.kind==='contact'&&event.zone===null&&!active.has(event.body))return;
  origin??=ack.appliedFrame;const frame=ack.appliedFrame-origin;
  if(event.kind==='strike')events.push({frame,order:ack.order,body:event.body,position:event.position,velocity:event.velocity});
  else if(event.kind==='contact'){
   close(event.body,frame);if(event.zone!==null)active.set(event.body,{body:event.body,zone:event.zone,strength:event.strength,start:frame,order:ack.order});
  }else{
   for(const body of active.keys())close(body,frame);
   ended={frame,fadeFrames:event.fadeFrames};
  }
 }
 function consume(message){
  if(message?.generation!==generation)return {ignored:true};
  if(failure)throw failure;
  try{
   if(message.type==='queued')return {ignored:true};
   if(message.type==='error')throw new Error(`Rest audio failed: ${message.message}`);
   if(message.type==='processed'){
    if(complete||!Array.isArray(message.events))throw new Error('Unexpected Rest acknowledgements');
    for(const ack of message.events)process(ack);
   }else if(message.type==='finished'){
    if(complete||!ended||message.frame!==origin+ended.frame+ended.fadeFrames||message.ended?.frame!==origin+ended.frame||message.ended?.fadeFrames!==ended.fadeFrames)throw new Error('Rest completion does not match Quiet');
    complete=true;
   }else throw new Error('Unknown Rest capture message');
   return {ignored:false,state:state()};
  }catch(error){failure=error;throw error;}
 }
 function state(){return failure?'error':complete?'complete':ended?'ending':origin===null?'empty':'recording';}
 function snapshot({allowSilent=false}={}){
  if(typeof allowSilent!=='boolean')throw new Error('allowSilent must be boolean');
  if(failure)throw failure;if(!complete)throw new Error('Finish the passage with Quiet before saving');if(!events.length&&!allowSilent)throw new Error('Play a strike before saving');
  const record=structuredClone({...metadata,events,contacts:contacts.slice().sort((a,b)=>a.start-b.start||a.order-b.order),ended});validateRestRecord(record,recipe);return record;
 }
 return {consume,snapshot,get state(){return state();},get originFrame(){return origin;},get stats(){return {strikes:events.length,contacts:contacts.length,activeContacts:active.size,rejected};}};
}
