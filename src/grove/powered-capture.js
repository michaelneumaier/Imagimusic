import {POWERED_RECORD_KIND,POWERED_RECORD_VERSION,validatePoweredRecord} from '../score/grove-powered.js';
/** Keep actual audio-thread history, never requested gesture timing. */
export function createPoweredCapture(recipe,{generation,driver,fadeFrames}={}){
 if(recipe.zones.length!==2||recipe.strengths.length!==1||recipe.strengths[0].name!=='c1'||recipe.strengths[0].c!==1)throw new Error('Powered encounter requires two zones and the single c1 contact coefficient');
 if(typeof generation!=='string'||!generation)throw new Error('Capture needs an encounter generation');
 if(!Number.isSafeInteger(fadeFrames)||fadeFrames<1||fadeFrames>recipe.sampleRate)throw new Error('Invalid capture fade');
 const planned=structuredClone(driver),metadata=structuredClone({version:POWERED_RECORD_VERSION,kind:POWERED_RECORD_KIND,grove:recipe.grove,voice:recipe.voice,sampleRate:recipe.sampleRate,outputGain:recipe.outputGain,zones:recipe.zones,strengths:recipe.strengths});
 const contacts=[],ids=new Set();let origin=null,held=null,ended=null,actual=null,lastOrder=-1,lastFrame=-1,complete=false,failure=null,rejected=0;
 const state=()=>failure?'error':complete?'complete':ended?'ending':origin===null?'waiting':'recording';
 function close(frame){if(held&&frame>held.start)contacts.push({...held,end:frame});held=null;}
 function process(ack){
  if(origin===null||complete||!Number.isSafeInteger(ack.appliedFrame)||ack.appliedFrame<origin||ack.appliedFrame<lastFrame||ack.relativeFrame!==ack.appliedFrame-origin||ack.order!==lastOrder+1||typeof ack.id!=='string'||ids.has(ack.id)||typeof ack.accepted!=='boolean')throw new Error('Invalid or missing powered acknowledgement');
  if(!Number.isSafeInteger(ack.requestedFrame)||ack.requestedFrame<0||ack.appliedFrame<ack.requestedFrame||ack.lateByFrames!==ack.appliedFrame-ack.requestedFrame||ack.event?.id!==ack.id||ack.event?.frame!==ack.requestedFrame)throw new Error('Powered acknowledgement differs from its request');
  ids.add(ack.id);lastFrame=ack.appliedFrame;lastOrder=ack.order;
  if(!ack.accepted){rejected++;return;}
  if(ended)throw new Error('Accepted contact after Quiet');
  const {event,relativeFrame:frame}=ack;
  if(event.kind==='contact'){
   if(event.zone!==null&&event.zone!==0&&event.zone!==1)throw new Error('Invalid recorded contact zone');
   close(frame);if(event.zone!==null)held={body:planned.body,zone:event.zone,strength:0,start:frame,order:ack.order};
  }else if(event.kind==='quiet'){close(frame);ended={frame,fadeFrames};}
  else throw new Error('Unknown powered capture command');
 }
 function consume(message){
  if(message?.generation!==generation)return {ignored:true};if(failure)throw failure;
  try{
   if(message.type==='queued'||message.type==='state')return {ignored:true};
   if(message.type==='error')throw new Error(`Powered audio failed: ${message.message}`);
   if(message.type==='started'){
    if(origin!==null||!Number.isSafeInteger(message.originFrame)||message.originFrame<0||message.frame!==message.originFrame)throw new Error('Invalid powered origin');origin=message.originFrame;
   }else if(message.type==='processed')process(message);
   else if(message.type==='finished'){
    if(complete||origin===null||!ended||message.originFrame!==origin||message.frame!==origin+ended.frame+fadeFrames||message.ended?.frame!==ended.frame||message.ended?.fadeFrames!==fadeFrames)throw new Error('Powered completion differs from Quiet');
    const expected={...planned,forcedFrames:Math.min(planned.forcedFrames,ended.frame)};
    if(!message.driver||Object.keys(message.driver).sort().join()!==Object.keys(expected).sort().join()||Object.keys(expected).some(k=>k==='rotation'?message.driver.rotation?.cos!==expected.rotation.cos||message.driver.rotation?.sin!==expected.rotation.sin:message.driver[k]!==expected[k]))throw new Error('Recorded source differs from the applied encounter');
    actual=structuredClone(message.driver);complete=true;
   }else throw new Error('Unknown powered capture message');
   return {ignored:false,state:state()};
  }catch(error){failure=error;throw error;}
 }
 function snapshot(){if(failure)throw failure;if(!complete)throw new Error('Let the encounter finish before saving');const record=structuredClone({...metadata,driver:actual,events:[],contacts,ended});validatePoweredRecord(record,recipe);return record;}
 return {consume,snapshot,get state(){return state();},get originFrame(){return origin;},get stats(){return {contacts:contacts.length,activeContact:held?.zone??null,rejected};}};
}
