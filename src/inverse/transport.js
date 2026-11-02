import {createInverseInstrument, INVERSE_SINGLE_STRIKE_PEAK_BOUND} from './instrument.js';
export const INVERSE_MAX_STRIKES=8;
export const INVERSE_MAX_LISTENING_LEVEL=4;
export const INVERSE_LEVEL_RAMP_SECONDS=.03;
/** Caller resumes its AudioContext through an explicit user gesture. Preparing
 * or mounting a candidate never resumes the context or schedules a sound. */
export function createInverseTransport(context){
 let mounted=null,disposed=false;
 const active=new Set(),output=context.createGain();output.gain.value=1;output.connect(context.destination);
 let listeningLevel=1,ramp={from:1,to:1,start:0,end:0};
 const levelAt=time=>time>=ramp.end?ramp.to:time<=ramp.start?ramp.from:ramp.from+(ramp.to-ramp.from)*(time-ramp.start)/(ramp.end-ramp.start);
 const retire=entry=>{if(!active.delete(entry))return;entry.node.onended=null;entry.node.disconnect();};
 const prune=()=>{for(const entry of active)if(context.currentTime>=entry.end)retire(entry);};
 const live=()=>{if(disposed)throw new Error('Instrument transport is disposed.');};
 return {
  get listeningLevel(){return listeningLevel;},
  setListeningLevel(level){
   live();if(!Number.isFinite(level)||level<0||level>INVERSE_MAX_LISTENING_LEVEL)throw new RangeError('Listening level must be within 0..4.');
   prune();const now=context.currentTime,instant=!active.size||context.state!=='running',from=instant?level:levelAt(now);
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
   if(!mounted)throw new Error('Prepare an instrument first.');
   if(context.state!=='running')throw new Error('Start listening before striking.');
   prune();if(active.size>=INVERSE_MAX_STRIKES)return false;
   const node=context.createBufferSource(),start=context.currentTime;
   node.buffer=mounted.buffers[body];node.connect(output);
   const entry={node,body,start,end:start+mounted.instrument.duration};
   node.onended=()=>retire(entry);active.add(entry);
   try{node.start(start);}catch(error){retire(entry);throw error;}
   return true;
  },
  snapshot(){
   live();prune();const now=context.currentTime;
   return {time:now,active:active.size,strikes:[...active].map(entry=>({body:entry.body,age:Math.max(0,now-entry.start),...mounted.instrument.frame(entry.body,Math.max(0,now-entry.start))}))};
  },
  quiet(){for(const entry of [...active]){try{entry.node.stop();}finally{retire(entry);}}},
  dispose(){if(disposed)return;this.quiet();mounted=null;output.disconnect();disposed=true;}
 };
}
