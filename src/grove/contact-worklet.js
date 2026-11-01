import {REST_MAX_EVENTS,REST_MAX_CONTACTS,REST_MAX_SECONDS,REST_QUIET_FADE_SECONDS} from '../rest/limits.js';
import {createRestEngine,contactStateKey} from '../rest/engine.js';
import {createContactEventQueue} from './contact-events.js';
/** Shared-model processor. Not connected to the playable route until equivalence
 * and capture admission are established. No matrix preparation on the audio thread. */
class GroveContactProcessor extends AudioWorkletProcessor{
 constructor(options){
  super();const {recipe,events=[],generation='offline'}=options.processorOptions??{};
  if(recipe?.sampleRate!==sampleRate)throw new Error('Rest recipe sample rate must match the audio context');
  if(!Array.isArray(recipe.energyFactors)||recipe.energyFactors.length!==recipe.channels||!recipe.energyFactors.every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(recipe.admissionCeiling)||recipe.admissionCeiling<=0||recipe.admissionCeiling>.9)throw new Error('Rest recipe needs a conservative energy admission bound');
  this.snapshots=options.processorOptions?.snapshots===true;this.nextSnapshot=0;this.recipe=recipe;this.generation=generation;this.engine=createRestEngine(recipe);this.queue=createContactEventQueue({capacity:1025,maxEvents:4097});this.commands=new Map();this.contacts=Array(recipe.bodies).fill(null);this.sample=new Float64Array(recipe.channels);this.stopped=false;this.finished=false;this.ending=null;this.acks=[];this.origin=null;this.strikes=0;this.contactStarts=0;
  this.apply=ack=>{const event=this.commands.get(ack.id);this.commands.delete(ack.id);
   let decision={accepted:true};
   if(this.ending)decision={accepted:false,reason:'ended'};
   else if(event.kind==='quiet'){this.ending={frame:ack.appliedFrame,fadeFrames:event.fadeFrames};this.contacts.fill(null);this.contactsChanged=true;}
   else if(event.kind==='strike'&&this.strikes>=REST_MAX_EVENTS)decision={accepted:false,reason:'strike-limit'};
   else if(event.kind==='contact'&&event.zone!==null&&this.contactStarts>=REST_MAX_CONTACTS)decision={accepted:false,reason:'contact-limit'};
   else if(event.kind==='strike'){const bound=this.engine.candidateBound(event.position,event.body,event.velocity);if(!Number.isFinite(bound))throw new Error('Invalid Rest energy bound');decision={accepted:bound<=this.recipe.admissionCeiling,bound};if(decision.accepted){this.engine.strike(event.position,event.body,event.velocity);this.strikes++;}else decision.reason='headroom';}
   else{if(event.zone!==null)this.contactStarts++;this.contacts[event.body]=event.zone===null?null:{zone:event.zone,strength:event.strength};this.contactsChanged=true;}
   if(decision.accepted&&this.origin===null&&(event.kind==='strike'||(event.kind==='contact'&&event.zone!==null))){
    this.origin=ack.appliedFrame;const end={id:'$rest-auto-quiet',kind:'quiet',frame:this.origin+REST_MAX_SECONDS*sampleRate,fadeFrames:Math.max(1,Math.round(REST_QUIET_FADE_SECONDS*sampleRate))};this.queue.enqueue(end.id,end.frame);this.commands.set(end.id,end);
   }
   this.acks.push({...ack,event,...decision});
  };
  this.port.onmessage=({data})=>{try{if(data.type!=='events')throw new Error('Unknown Rest worklet message');this.enqueue(data.events);this.port.postMessage({type:'queued',generation:this.generation,ids:data.events.map(event=>event.id)});}catch(error){this.fail(error,currentFrame);}};
  this.enqueue(events);
 }
 enqueue(events){
  if(!Array.isArray(events))throw new Error('Rest events must be an array');
  for(const event of events){
   if(typeof event.id==='string'&&event.id.startsWith('$rest-'))throw new Error('Reserved Rest event identity');
   const {body,kind}=event;if(kind!=='quiet'&&(!Number.isInteger(body)||body<0||body>=this.recipe.bodies))throw new Error('Invalid Rest event body');
   if(kind==='quiet'){if(!Number.isSafeInteger(event.fadeFrames)||event.fadeFrames<1||event.fadeFrames>sampleRate)throw new Error('Invalid Rest ending fade');}
   else if(kind==='strike'){if(!Number.isInteger(event.position)||!this.recipe.strikeVectors[event.position]||!Number.isFinite(event.velocity)||event.velocity<=0||event.velocity>1)throw new Error('Invalid Rest strike');}
   else if(kind==='contact'){if(event.zone!==null&&(!Number.isInteger(event.zone)||event.zone<0||event.zone>=this.recipe.zones.length||!Number.isInteger(event.strength)||event.strength<0||event.strength>=this.recipe.strengths.length))throw new Error('Invalid Rest contact');}
   else throw new Error('Unknown Rest event kind');
   if(this.queue.pending>=1024||this.queue.scheduled>=4096)throw new Error('Rest input capacity exceeded');
   this.queue.enqueue(event.id,event.frame);this.commands.set(event.id,{...event});
  }
 }
 fail(error,frame){if(this.stopped)return;this.stopped=true;this.port.postMessage({type:'error',generation:this.generation,frame,message:error.message});}
 process(inputs,outputs){
  const channels=outputs[0];if(this.stopped||this.finished){for(const channel of channels)channel.fill(0);return false;}
  let i=0;
  try{
   for(;i<channels[0].length;i++){
    const frame=currentFrame+i;if(this.ending&&frame>=this.ending.frame+this.ending.fadeFrames){for(const channel of channels)channel.fill(0,i);this.finished=true;this.finishedFrame=frame;break;}
    this.contactsChanged=false;this.queue.applyThrough(currentFrame+i,this.apply);if(this.contactsChanged)this.engine.setContacts(contactStateKey(this.contacts));
    const fade=this.ending?Math.max(0,Math.min(1,1-(frame-this.ending.frame)/this.ending.fadeFrames)):1;
    this.engine.read(this.sample);for(let ch=0;ch<channels.length;ch++){const value=Math.fround(this.sample[ch]);if(!Number.isFinite(value))throw new Error('Non-finite Rest output');channels[ch][i]=value*fade;}this.engine.step();
   }
  }catch(error){for(const channel of channels)channel.fill(0,i);this.fail(error,currentFrame+i);}
  if(this.acks.length){this.port.postMessage({type:'processed',generation:this.generation,events:this.acks});this.acks=[];}
  if(this.snapshots&&!this.stopped&&!this.finished&&currentFrame+channels[0].length>=this.nextSnapshot){const frame=currentFrame+channels[0].length;this.nextSnapshot=frame+1024;this.port.postMessage({type:'state',generation:this.generation,frame,state:this.engine.state,key:this.engine.key,ended:this.ending});}
  if(this.finished)this.port.postMessage({type:'finished',generation:this.generation,frame:this.finishedFrame,ended:{...this.ending}});
  return !this.stopped&&!this.finished;
 }
}
registerProcessor('imagimusic-grove-contact',GroveContactProcessor);
