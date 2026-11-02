import {createInverseInstrument, INVERSE_SINGLE_STRIKE_PEAK_BOUND} from './instrument.js';
export const INVERSE_MAX_STRIKES=8;
export const INVERSE_MAX_LISTENING_LEVEL=4;
export const INVERSE_LEVEL_RAMP_SECONDS=.03;
export const INVERSE_GESTURE_LEAD_SECONDS=.03;
export const INVERSE_MAX_GESTURE_SECONDS=8;
/** Caller resumes its AudioContext through an explicit user gesture. Preparing
 * or mounting a candidate never resumes the context or schedules a sound. */
export function createInverseTransport(context){
 let mounted=null,disposed=false;
 const active=new Set(),output=context.createGain();output.gain.value=1;output.connect(context.destination);
 let listeningLevel=1,ramp={from:1,to:1,start:0,end:0};
 const levelAt=time=>time>=ramp.end?ramp.to:time<=ramp.start?ramp.from:ramp.from+(ramp.to-ramp.from)*(time-ramp.start)/(ramp.end-ramp.start);
 const retire=entry=>{if(!active.delete(entry))return;entry.node.onended=null;entry.node.disconnect();};
 const prune=()=>{const now=context.currentTime;for(const entry of active)if(now>=entry.end)retire(entry);return now;};
 const live=()=>{if(disposed)throw new Error('Instrument transport is disposed.');};
 const ready=()=>{live();if(!mounted)throw new Error('Prepare an instrument first.');if(context.state!=='running')throw new Error('Start listening before striking.');};
 const schedule=(events,lead)=>{
  const entries=[];
  try{
   for(const event of events){
    const node=context.createBufferSource(),entry={node,body:event.body,offset:event.at};entries.push(entry);
    node.buffer=mounted.buffers[event.body];node.connect(output);
   }
   const origin=context.currentTime+lead;
   for(const entry of entries){entry.start=origin+entry.offset;entry.end=entry.start+mounted.instrument.duration;entry.node.onended=()=>retire(entry);active.add(entry);entry.node.start(entry.start);}
   return origin;
  }catch(error){
   for(const entry of entries){active.delete(entry);entry.node.onended=null;try{entry.node.stop();}catch{}try{entry.node.disconnect();}catch{}}
   throw error;
  }
 };
 return {
  get listeningLevel(){return listeningLevel;},
  setListeningLevel(level){
   live();if(!Number.isFinite(level)||level<0||level>INVERSE_MAX_LISTENING_LEVEL)throw new RangeError('Listening level must be within 0..4.');
   const now=prune(),instant=![...active].some(entry=>entry.start<=now)||context.state!=='running',from=instant?level:levelAt(now);
   output.gain.cancelScheduledValues(now);output.gain.setValueAtTime(from,now);
   if(!instant)output.gain.linearRampToValueAtTime(level,now+INVERSE_LEVEL_RAMP_SECONDS);
   ramp={from,to:level,start:now,end:instant?now:now+INVERSE_LEVEL_RAMP_SECONDS};listeningLevel=level;
  },
  mount(prepared){
   live();prune();if(active.size)throw new Error('Let the instrument finish or choose Quiet before changing it.');
   const instrument=createInverseInstrument(prepared.grove,{sampleRate:context.sampleRate});
   if(prepared.kind!==instrument.kind||prepared.sampleRate!==context.sampleRate||prepared.frames!==instrument.frames||!Array.isArray(prepared.strikes)||prepared.strikes.length!==3)throw new Error('Candidate preparation does not match this audio context.');
   const buffers=prepared.strikes.map((strike,body)=>{
    if(strike.body!==body||strike.frames!==instrument.frames||strike.sampleRate!==context.sampleRate||strike.channels?.length!==2)throw new Error('Invalid prepared strike.');
    const buffer=context.createBuffer(2,instrument.frames,context.sampleRate);
    strike.channels.forEach((channel,index)=>{
     if(!(channel instanceof Float32Array)||channel.length!==instrument.frames)throw new Error('Invalid prepared channel.');
     for(const sample of channel)if(!Number.isFinite(sample)||Math.abs(sample)>INVERSE_SINGLE_STRIKE_PEAK_BOUND*(1+1e-6))throw new Error('Prepared samples exceed the output bound.');
     buffer.copyToChannel(channel,index);
    });
    return buffer;
   });
   mounted={instrument,buffers};return instrument;
  },
  strike(body){
   live();if(!Number.isInteger(body)||body<0||body>2)throw new RangeError('Strike body must be 0, 1 or 2.');
   ready();prune();if(active.size>=INVERSE_MAX_STRIKES)return false;
   schedule([{body,at:0}],0);return true;
  },
  playGesture(events){
   ready();
   if(!Array.isArray(events)||!events.length||events.length>INVERSE_MAX_STRIKES)throw new RangeError('A gesture must contain 1..8 touches.');
   const checked=[];
   for(let i=0;i<events.length;i++){
    const event=events[i];
    if(!event||!Number.isInteger(event.body)||event.body<0||event.body>2||!Number.isFinite(event.at)||event.at<0||event.at>INVERSE_MAX_GESTURE_SECONDS||(i&&event.at<checked[i-1].at))throw new RangeError('Gesture touches must name bodies 0..2 with ordered times within 0..8 seconds.');
    checked.push({body:event.body,at:event.at});
   }
   prune();if(active.size)throw new Error('The shared gesture starts from quiet. Choose Quiet first.');
   return schedule(checked,INVERSE_GESTURE_LEAD_SECONDS);
  },
  snapshot(){
   live();const now=prune(),sounding=[...active].filter(entry=>entry.start<=now);
   return {time:now,active:sounding.length,pending:active.size-sounding.length,strikes:sounding.map(entry=>({body:entry.body,age:now-entry.start,...mounted.instrument.frame(entry.body,now-entry.start)}))};
  },
  quiet(){for(const entry of [...active]){try{entry.node.stop();}finally{retire(entry);}}},
  dispose(){if(disposed)return;this.quiet();mounted=null;output.disconnect();disposed=true;}
 };
}
