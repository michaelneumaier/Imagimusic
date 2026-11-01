/** Interval history for the current powered encounter. Consumers pass acknowledgements
 * only after capture has validated them; requested times never enter this history. */
export function createResponseCauses({sampleRate,driver}){
 if(!Number.isFinite(sampleRate)||sampleRate<=0||!Number.isSafeInteger(driver.startFrame)||driver.startFrame<0||!Number.isSafeInteger(driver.forcedFrames)||driver.forcedFrames<0)throw new Error('Invalid trace source');
 const sourceStart=driver.startFrame/sampleRate;let sourceEnd=(driver.startFrame+driver.forcedFrames)/sampleRate,lastFrame=-1,held=null,ended=false,starts=0;const contacts=[];
 function close(time){if(held){if(time>held.start)contacts.push({...held,end:time});held=null;}}
 function consume(ack){
  if(!ack.accepted)return;
  const frame=ack.relativeFrame;
  if(!Number.isSafeInteger(frame)||frame<0||frame<lastFrame||ended)throw new Error('Invalid trace acknowledgement order');
  const time=frame/sampleRate,event=ack.event;
  if(event.kind==='contact'){
   if(event.zone!==null&&event.zone!==0&&event.zone!==1)throw new Error('Invalid trace contact zone');
   if(event.zone!==null&&starts>=256)throw new Error('Trace contact limit exceeded');
   close(time);if(event.zone!==null){held={zone:event.zone,start:time};starts++;}
  }else if(event.kind==='quiet'){close(time);sourceEnd=Math.min(sourceEnd,time);ended=true;}
  else throw new Error('Unknown trace cause');
  lastFrame=frame;
 }
 function at(time){
  if(!Number.isFinite(time)||time<0)throw new Error('Invalid trace playhead');
  const all=held?[...contacts,{...held,end:time}]:contacts;
  return {source:{start:sourceStart,end:Math.max(sourceStart,Math.min(time,sourceEnd))},contacts:all.filter(c=>c.start<time).map(c=>({...c,end:Math.min(time,c.end)})).filter(c=>c.end>c.start)};
 }
 return {consume,at};
}
/** Saved contacts have exact sample endpoints; replay uses these, not UI sampling. */
export function responseCausesForRecord(record){
 const result=createResponseCauses({sampleRate:record.sampleRate,driver:record.driver}),commands=[];
 for(const contact of record.contacts){if(contact.body!==record.driver.body)throw new Error('Trace supports contacts on the driven body only');commands.push({frame:contact.start,zone:contact.zone,order:contact.order,kind:'contact',end:false});commands.push({frame:contact.end,zone:null,order:contact.order,kind:'contact',end:true});}
 commands.sort((a,b)=>a.frame-b.frame||Number(b.end)-Number(a.end)||a.order-b.order);
 for(const c of commands)result.consume({accepted:true,relativeFrame:c.frame,event:c});
 if(record.ended)result.consume({accepted:true,relativeFrame:record.ended.frame,event:{kind:'quiet'}});
 return result;
}
