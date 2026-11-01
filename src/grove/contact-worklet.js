import {createRestEngine,contactStateKey} from '../rest/engine.js';
import {createContactEventQueue} from './contact-events.js';
/** Shared-model processor. Not connected to the playable route until equivalence
 * and capture admission are established. No matrix preparation on the audio thread. */
class GroveContactProcessor extends AudioWorkletProcessor{
 constructor(options){
  super();const {recipe,events=[],generation='offline'}=options.processorOptions??{};
  if(recipe?.sampleRate!==sampleRate)throw new Error('Rest recipe sample rate must match the audio context');
  this.recipe=recipe;this.generation=generation;this.engine=createRestEngine(recipe);this.queue=createContactEventQueue();this.commands=new Map();this.contacts=Array(recipe.bodies).fill(null);this.sample=new Float64Array(recipe.channels);this.stopped=false;this.acks=[];
  this.apply=ack=>{const event=this.commands.get(ack.id);this.commands.delete(ack.id);
   if(event.kind==='strike')this.engine.strike(event.position,event.body,event.velocity);
   else{this.contacts[event.body]=event.zone===null?null:{zone:event.zone,strength:event.strength};this.contactsChanged=true;}
   this.acks.push({...ack,event});
  };
  this.port.onmessage=({data})=>{try{if(data.type!=='events')throw new Error('Unknown Rest worklet message');this.enqueue(data.events);this.port.postMessage({type:'queued',generation:this.generation,ids:data.events.map(event=>event.id)});}catch(error){this.fail(error,currentFrame);}};
  this.enqueue(events);
 }
 enqueue(events){
  if(!Array.isArray(events))throw new Error('Rest events must be an array');
  for(const event of events){
   const {body,kind}=event;if(!Number.isInteger(body)||body<0||body>=this.recipe.bodies)throw new Error('Invalid Rest event body');
   if(kind==='strike'){if(!Number.isInteger(event.position)||!this.recipe.strikeVectors[event.position]||!Number.isFinite(event.velocity)||event.velocity<=0||event.velocity>1)throw new Error('Invalid Rest strike');}
   else if(kind==='contact'){if(event.zone!==null&&(!Number.isInteger(event.zone)||event.zone<0||event.zone>=this.recipe.zones.length||!Number.isInteger(event.strength)||event.strength<0||event.strength>=this.recipe.strengths.length))throw new Error('Invalid Rest contact');}
   else throw new Error('Unknown Rest event kind');
   this.queue.enqueue(event.id,event.frame);this.commands.set(event.id,{...event});
  }
 }
 fail(error,frame){if(this.stopped)return;this.stopped=true;this.port.postMessage({type:'error',generation:this.generation,frame,message:error.message});}
 process(inputs,outputs){
  const channels=outputs[0];if(this.stopped){for(const channel of channels)channel.fill(0);return false;}
  let i=0;
  try{
   for(;i<channels[0].length;i++){
    this.contactsChanged=false;this.queue.applyThrough(currentFrame+i,this.apply);if(this.contactsChanged)this.engine.setContacts(contactStateKey(this.contacts));
    this.engine.read(this.sample);for(let ch=0;ch<channels.length;ch++){const value=this.sample[ch];if(!Number.isFinite(value))throw new Error('Non-finite Rest output');channels[ch][i]=value;}this.engine.step();
   }
  }catch(error){for(const channel of channels)channel.fill(0,i);this.fail(error,currentFrame+i);}
  if(this.acks.length){this.port.postMessage({type:'applied',generation:this.generation,events:this.acks});this.acks=[];}
  return !this.stopped;
 }
}
registerProcessor('imagimusic-grove-contact',GroveContactProcessor);
