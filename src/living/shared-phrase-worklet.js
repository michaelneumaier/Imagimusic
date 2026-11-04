import {createLivingSharedPhrasePass} from './shared-phrase-pass.js';
export const LIVING_SHARED_PHRASE_PROCESSOR='imagimusic-living-shared-phrase';

class SharedPhraseProcessor extends AudioWorkletProcessor{
 constructor({processorOptions={}}={}){
  super();
  // Retained frame times must never silently run at a different device rate.
  if(processorOptions.source?.sampleRate!==sampleRate)throw Error('The shared phrase must match the audio context sample rate.');
  this.pass=createLivingSharedPhrasePass(processorOptions.source,{guestLimit:processorOptions.guestLimit});
  this.seen=new Set();this.originAudioFrame=null;this.sentTouches=0;this.lastState='idle';this.finished=false;this.failed=false;
  this.port.onmessage=({data})=>{
   try{
    if(this.failed||this.finished)throw Error('This shared phrase has finished.');
    if(!data||!Number.isInteger(data.id)||data.id<0||data.id>=32)throw Error('Command identity must be an integer within0…31.');
    if(this.seen.has(data.id))throw Error('Duplicate command identity.');
    if(!['start','strike','quiet'].includes(data.type))throw Error('Unknown shared phrase command.');
    this.seen.add(data.id);
    const result=data.type==='strike'?this.pass.strike(data.strength):this.pass[data.type]();
    this.port.postMessage({type:'applied',id:data.id,command:data.type,...result,state:this.pass.state});
   }catch(error){this.port.postMessage({type:'refused',id:data?.id,message:error.message,state:this.pass.state,frame:this.pass.frame});}
   this.reportTouches();
  };
  this.port.postMessage({type:'ready',sampleRate,guestLimit:this.pass.guestLimit});
 }
 reportTouches(){
  if(this.originAudioFrame===null||this.pass.touchCount===this.sentTouches)return;
  const applied=this.pass.snapshot().applied;
  const touches=applied.slice(this.sentTouches).map((event,i)=>({...event,index:this.sentTouches+i,audioFrame:this.originAudioFrame+event.frame}));
  this.sentTouches=applied.length;this.port.postMessage({type:'touches',touches});
 }
 process(inputs,outputs){
  const channels=outputs[0];if(!channels?.length)return !this.finished&&!this.failed;
  if(this.failed||this.finished){for(const channel of channels)channel.fill(0);return false;}
  try{
   if(this.originAudioFrame===null&&this.pass.state!=='idle'){
    this.originAudioFrame=currentFrame;
    this.port.postMessage({type:'origin',audioFrame:this.originAudioFrame,sampleRate});
   }
   this.pass.process(channels[0]);for(let i=1;i<channels.length;i++)channels[i].set(channels[0]);
   this.reportTouches();
   if(this.pass.state!==this.lastState){this.lastState=this.pass.state;this.port.postMessage({type:'state',state:this.pass.state,frame:this.pass.frame});}
   if(this.pass.state==='ended'){
    this.finished=true;const snapshot=this.pass.snapshot();
    const record={...this.pass.source,events:snapshot.events,fadeStart:snapshot.fadeStart};
    this.port.postMessage({type:'finished',originAudioFrame:this.originAudioFrame,record,snapshot});
   }
   return !this.finished;
  }catch(error){this.failed=true;for(const channel of channels)channel.fill(0);this.port.postMessage({type:'error',message:error.message});return false;}
 }
}
registerProcessor(LIVING_SHARED_PHRASE_PROCESSOR,SharedPhraseProcessor);
