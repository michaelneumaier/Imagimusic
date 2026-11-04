import {createContinuousReturnPerformance} from './continuous-return-study.js';
export const CONTINUOUS_RETURN_PROCESSOR='imagimusic-continuous-return';

class ContinuousReturnProcessor extends AudioWorkletProcessor{
 constructor({processorOptions={}}={}){
  super();
  if(processorOptions.sampleRate!==sampleRate)throw Error('The continuous study must match the audio context sample rate.');
  this.performance=createContinuousReturnPerformance(processorOptions.seed,{sampleRate});
  this.lastId=-1;this.originAudioFrame=null;this.pending=[];this.terminal=false;this.failed=false;this.lastState='idle';
  this.port.onmessage=({data})=>{
   try{
    if(this.terminal||this.failed)throw Error('This continuous performance has finished.');
    if(!data||!Number.isInteger(data.id)||data.id<=this.lastId||data.id<0||data.id>=8192)throw Error('Command identities must increase within 0…8191.');
    if(!['start','strike','quiet','cancel'].includes(data.type))throw Error('Unknown continuous performance command.');
    this.lastId=data.id;
    const frame=this.performance.frame;let events=[];
    if(data.type==='start')this.performance.start();
    if(data.type==='strike'){
     const result=this.performance.tryGuest(data.strength);events=result.events;this.publish(events);
     if(!result.admitted)throw Error(result.reason);
    }
    if(data.type==='quiet'){
     if(this.performance.state!=='playing')throw Error('Only a playing performance can end quietly.');
     events=this.performance.quiet();this.publish(events);
    }
    if(data.type==='cancel'){this.performance.cancel();this.pending=[];this.terminal=true;}
    this.port.postMessage({type:'applied',id:data.id,command:data.type,frame,state:this.performance.state});
    if(data.type==='cancel')this.port.postMessage({type:'cancelled',frame});
   }catch(error){this.port.postMessage({type:'refused',id:data?.id,message:error.message,state:this.performance.state,frame:this.performance.frame});}
  };
  this.port.postMessage({type:'ready',sampleRate,seed:this.performance.plan.seed,frames:this.performance.plan.frames});
 }
 publish(events){
  this.pending.push(...events);
  if(this.originAudioFrame===null||this.pending.length===0)return;
  const touches=this.pending.map(event=>({...event,audioFrame:this.originAudioFrame+event.frame}));this.pending=[];
  this.port.postMessage({type:'touches',touches});
 }
 process(inputs,outputs){
  const channels=outputs[0];
  if(!channels?.length)return !this.terminal&&!this.failed;
  if(this.terminal||this.failed){for(const channel of channels)channel.fill(0);return false;}
  try{
   if(this.originAudioFrame===null&&this.performance.state!=='idle'){
    this.originAudioFrame=currentFrame;
    this.port.postMessage({type:'origin',audioFrame:this.originAudioFrame,sampleRate});
   }
   const events=this.performance.process(channels[0]);for(let i=1;i<channels.length;i++)channels[i].set(channels[0]);this.publish(events);
   if(this.performance.state!==this.lastState){this.lastState=this.performance.state;this.port.postMessage({type:'state',state:this.lastState,frame:this.performance.frame});}
   if(this.performance.state==='ended'){
    this.terminal=true;this.port.postMessage({type:'finished',originAudioFrame:this.originAudioFrame,seed:this.performance.plan.seed,record:this.performance.record(),snapshot:this.performance.snapshot()});
   }
   return !this.terminal;
  }catch(error){
   this.failed=true;this.pending=[];for(const channel of channels)channel.fill(0);this.port.postMessage({type:'error',message:error.message});return false;
  }
 }
}
registerProcessor(CONTINUOUS_RETURN_PROCESSOR,ContinuousReturnProcessor);
