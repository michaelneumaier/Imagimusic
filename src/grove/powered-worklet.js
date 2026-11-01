import {createPoweredProcessor} from './powered-processor.js';
class PoweredEncounter extends AudioWorkletProcessor{
 constructor(options){
  super();const config=options.processorOptions??{};
  if(config.recipe?.sampleRate!==sampleRate)throw new Error('Powered recipe sample rate must match audio context');
  this.generation=config.generation;this.failed=false;this.snapshots=!!config.snapshots;this.nextSnapshot=0;
  this.config=config;this.pending=[...(config.events??[])];this.processor=null;
  this.port.onmessage=({data})=>{try{if(data.type!=='events')throw new Error('Unknown powered message');if(this.processor)this.processor.enqueue(data.events);else{if(!Array.isArray(data.events)||this.pending.length+data.events.length>4096)throw new Error('Encounter input capacity exceeded');this.pending.push(...data.events);}this.port.postMessage({type:'queued',generation:this.generation,ids:data.events.map(e=>e.id)});}catch(error){this.fail(error);}};
 }
 fail(error){if(this.failed)return;this.failed=true;this.port.postMessage({type:'error',generation:this.generation,frame:currentFrame,message:error.message});}
 process(inputs,outputs){
  const channels=outputs[0];if(this.failed){channels.forEach(c=>c.fill(0));return false;}
  try{
   if(!this.processor){this.firstProcessFrame=currentFrame;this.processor=createPoweredProcessor({...this.config,events:this.pending,originFrame:Math.max(currentFrame,this.config.originFrame??currentFrame)});this.pending=null;this.config=null;}
   const alive=this.processor.process(channels,currentFrame);
   for(const message of this.processor.drain())this.port.postMessage({...message,...(message.type==='started'?{firstProcessFrame:this.firstProcessFrame}:{}),generation:this.generation});
   if(alive&&this.snapshots&&currentFrame+channels[0].length>=this.nextSnapshot){const frame=currentFrame+channels[0].length;this.nextSnapshot=frame+1024;this.port.postMessage({type:'state',generation:this.generation,frame,...this.processor.snapshot()});}
   return alive;
  }catch(error){channels.forEach(c=>c.fill(0));this.fail(error);return false;}
 }
}
registerProcessor('imagimusic-powered-encounter',PoweredEncounter);
