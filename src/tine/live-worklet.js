import {createTineLivePass} from './live-pass.js';
export const TINE_LIVE_PROCESSOR='imagimusic-tine-live';
class TineLiveProcessor extends AudioWorkletProcessor{
 constructor({processorOptions={}}={}){
  super();this.pass=createTineLivePass(processorOptions.geometry,{...processorOptions.options,sampleRate});
  this.seen=new Set();this.lastState='idle';this.finished=false;this.originAudioFrame=null;
  this.port.onmessage=({data})=>{
   try{
    if(!data||!Number.isInteger(data.id)||data.id<0||data.id>=32)throw Error('Command identity must be an integer within 0…31.');
    if(this.seen.has(data.id))throw Error('Duplicate command identity.');
    if(!['start','strike','quiet'].includes(data.type))throw Error('Unknown live tine command.');
    this.seen.add(data.id);
    const result=data.type==='strike'?this.pass.strike(data.strength):this.pass[data.type]();
    this.port.postMessage({type:'applied',id:data.id,command:data.type,...result,state:this.pass.state});
   }catch(error){this.port.postMessage({type:'refused',id:data?.id,message:error.message,state:this.pass.state,frame:this.pass.frame});}
  };
  this.port.postMessage({type:'ready',sampleRate:this.pass.sampleRate});
 }
 process(inputs,outputs){
  const channels=outputs[0];if(!channels?.length)return true;
  try{
   if(this.originAudioFrame===null&&this.pass.state!=='idle'){this.originAudioFrame=currentFrame;this.port.postMessage({type:'origin',audioFrame:this.originAudioFrame,sampleRate});}
   this.pass.process(channels[0]);for(let i=1;i<channels.length;i++)channels[i].set(channels[0]);
   if(this.pass.state!==this.lastState){this.lastState=this.pass.state;this.port.postMessage({type:'state',state:this.pass.state,frame:this.pass.frame});}
   if(this.pass.state==='ended'&&!this.finished){this.finished=true;this.port.postMessage({type:'finished',originAudioFrame:this.originAudioFrame,snapshot:this.pass.snapshot()});}
   return this.pass.state!=='ended';
  }catch(error){for(const channel of channels)channel.fill(0);this.port.postMessage({type:'error',message:error.message});return false;}
 }
}
registerProcessor(TINE_LIVE_PROCESSOR,TineLiveProcessor);
