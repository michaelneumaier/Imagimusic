// Experimental ensemble processor (Fable, 2026-11-01): three Rest engines in ONE AudioWorklet processor on one frame origin, for Astra's
// experimental host. Semantics and mix are exactly those of the diagnostic fixture (tests/ensemble-diagnostic-worklet.js), which stays
// unchanged as the cross-check: the contact processor's validation, conservative energy admission, strike and contact limits, event queue and
// acknowledgement shape per part; a common origin (first effective accepted gesture in any part) with one auto-Quiet at REST_MAX_SECONDS for
// every part; a common ending (the first accepted Quiet in any part ends every part in the SAME frame through its own queue, with a
// '$ensemble-quiet' acknowledgement for parts without their own); fail-all with the affected part named when known. Mix: Float32(engine
// sample) × common fade → Float32 part; Float32 parts × 1/3 accumulated in Float64 → one Float32 rounding, written straight into the output
// (no per-block PCM buffer is allocated unless postAudio is on; acknowledgement and snapshot messages allocate when they are posted, and the
// per-part apply callbacks are cached in the constructor so the per-sample queue drain creates no closures). Optional state snapshots every 1024 frames for the picture, as the contact processor posts
// them. This is NOT a real-time performance claim; the output-side measurement gate stands before any playable claim.
import {REST_MAX_EVENTS,REST_MAX_CONTACTS,REST_MAX_SECONDS,REST_QUIET_FADE_SECONDS} from '../rest/limits.js';
import {createRestEngine,contactStateKey} from '../rest/engine.js';
import {createContactEventQueue} from './contact-events.js';
export const ENSEMBLE_PROCESSOR_NAME='imagimusic-grove-ensemble';
export const ENSEMBLE_SNAPSHOT_FRAMES=1024;
export const ENSEMBLE_MIX_ARITHMETIC='Float32(engine sample) × common fade → Float32 part (as renderRestRecord); Float32 parts × mixGain accumulated in Float64 → one Float32 rounding → output and capture';
class GroveEnsembleProcessor extends AudioWorkletProcessor{
 constructor(options){
  super();const {recipes,parts=[],generation='ensemble',mixGain=1/3,postAudio=false,snapshots=false}=options.processorOptions??{};
  if(!Array.isArray(recipes)||recipes.length!==3)throw new Error('Ensemble needs exactly three prepared recipes');
  if(mixGain!==1/3)throw new Error('Ensemble mix gain is fixed at 1/3');
  if(typeof postAudio!=='boolean'||typeof snapshots!=='boolean')throw new Error('postAudio and snapshots must be booleans');
  for(const recipe of recipes){
   if(recipe?.sampleRate!==sampleRate)throw new Error('Rest recipe sample rate must match the audio context');
   if(!Array.isArray(recipe.energyFactors)||recipe.energyFactors.length!==recipe.channels||!recipe.energyFactors.every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(recipe.admissionCeiling)||recipe.admissionCeiling<=0||recipe.admissionCeiling>.9)throw new Error('Rest recipe needs a conservative energy admission bound');
   if(recipe.channels!==recipes[0].channels)throw new Error('Ensemble parts must share the channel count');
  }
  this.generation=generation;this.mixGain=mixGain;this.postAudio=postAudio;this.snapshots=snapshots;this.nextSnapshot=0;this.stopped=false;this.finished=false;this.ending=null;this.origin=null;this.channels=recipes[0].channels;this.sum=new Float64Array(recipes[0].channels);
  this.parts=recipes.map((recipe,index)=>({index,recipe,engine:createRestEngine(recipe),queue:createContactEventQueue({capacity:1025,maxEvents:4097}),commands:new Map(),contacts:Array(recipe.bodies).fill(null),contactsChanged:false,sample:new Float64Array(recipe.channels),acks:[],strikes:0,contactStarts:0,accepted:0,refused:0,ended:null,applyAck:null}));
  for(const p of this.parts)p.applyAck=ack=>this.apply(p,ack);
  this.port.onmessage=({data})=>{let part;try{if(data.type!=='events')throw new Error('Unknown ensemble message');part=data.part;this.enqueue(data.part,data.events);this.port.postMessage({type:'queued',generation:this.generation,part:data.part,ids:data.events.map(e=>e.id)});}catch(error){this.fail(error,currentFrame,part);}};
  if(!Array.isArray(parts)||parts.length>3)throw new Error('Ensemble parts must be an array of at most three command lists');
  parts.forEach((events,part)=>this.enqueue(part,events??[]));
 }
 enqueue(part,events){
  const p=this.parts[part];if(!p)throw new Error('Invalid ensemble part');
  if(!Array.isArray(events))throw new Error('Rest events must be an array');
  for(const event of events){
   if(typeof event.id!=='string'||event.id.startsWith('$'))throw new Error('Reserved or invalid Rest event identity');
   const {body,kind}=event;if(kind!=='quiet'&&(!Number.isInteger(body)||body<0||body>=p.recipe.bodies))throw new Error('Invalid Rest event body');
   if(!Number.isSafeInteger(event.frame)||event.frame<0)throw new Error('Invalid Rest event frame');
   if(kind==='quiet'){if(!Number.isSafeInteger(event.fadeFrames)||event.fadeFrames<1||event.fadeFrames>sampleRate)throw new Error('Invalid Rest ending fade');}
   else if(kind==='strike'){if(!Number.isInteger(event.position)||!p.recipe.strikeVectors[event.position]||!Number.isFinite(event.velocity)||event.velocity<=0||event.velocity>1)throw new Error('Invalid Rest strike');}
   else if(kind==='contact'){if(event.zone!==null&&(!Number.isInteger(event.zone)||event.zone<0||event.zone>=p.recipe.zones.length||!Number.isInteger(event.strength)||event.strength<0||event.strength>=p.recipe.strengths.length))throw new Error('Invalid Rest contact');}
   else throw new Error('Unknown Rest event kind');
   if(p.queue.pending>=1024||p.queue.scheduled>=4096)throw new Error('Rest input capacity exceeded');
   p.queue.enqueue(event.id,event.frame);p.commands.set(event.id,{...event});
  }
 }
 schedule(p,command){p.queue.enqueue(command.id,command.frame);p.commands.set(command.id,command);}
 apply(p,ack){
  const event=p.commands.get(ack.id);p.commands.delete(ack.id);
  let decision={accepted:true};
  if(p.ended)decision={accepted:false,reason:'ended'};
  else if(event.kind==='quiet'){
   p.ended={frame:ack.appliedFrame,fadeFrames:event.fadeFrames};p.contacts.fill(null);p.contactsChanged=true;
   if(!this.ending)this.ending={frame:ack.appliedFrame,fadeFrames:event.fadeFrames};
   else if(this.ending.frame!==ack.appliedFrame||this.ending.fadeFrames!==event.fadeFrames)throw new Error('Ensemble parts ended at different frames');
  }
  else if(event.kind==='strike'&&p.strikes>=REST_MAX_EVENTS)decision={accepted:false,reason:'strike-limit'};
  else if(event.kind==='contact'&&event.zone!==null&&p.contactStarts>=REST_MAX_CONTACTS)decision={accepted:false,reason:'contact-limit'};
  else if(event.kind==='strike'){const bound=p.engine.candidateBound(event.position,event.body,event.velocity);if(!Number.isFinite(bound))throw new Error('Invalid Rest energy bound');decision={accepted:bound<=p.recipe.admissionCeiling,bound};if(decision.accepted){p.engine.strike(event.position,event.body,event.velocity);p.strikes++;}else decision.reason='headroom';}
  else{if(event.zone!==null)p.contactStarts++;p.contacts[event.body]=event.zone===null?null:{zone:event.zone,strength:event.strength};p.contactsChanged=true;}
  if(decision.accepted&&this.origin===null&&(event.kind==='strike'||(event.kind==='contact'&&event.zone!==null))){
   this.origin=ack.appliedFrame;const frame=this.origin+REST_MAX_SECONDS*sampleRate,fadeFrames=Math.max(1,Math.round(REST_QUIET_FADE_SECONDS*sampleRate));
   for(const other of this.parts)this.schedule(other,{id:'$ensemble-auto-quiet',kind:'quiet',frame,fadeFrames});
  }
  if(decision.accepted)p.accepted++;else p.refused++;
  p.acks.push({...ack,event,...decision});
 }
 fail(error,frame,part){if(this.stopped)return;this.stopped=true;const message={type:'error',generation:this.generation,frame,message:error.message};if(Number.isInteger(part))message.part=part;this.port.postMessage(message);}
 process(inputs,outputs){
  const channels=outputs[0];if(this.stopped||this.finished){for(const channel of channels)channel.fill(0);return false;}
  const n=channels[0].length,sum=this.sum;let i=0,current=null;
  try{
   for(;i<n;i++){
    const frame=currentFrame+i;if(this.ending&&frame>=this.ending.frame+this.ending.fadeFrames){for(const channel of channels)channel.fill(0,i);this.finished=true;this.finishedFrame=frame;break;}
    for(const p of this.parts){current=p;p.contactsChanged=false;p.queue.applyThrough(frame,p.applyAck);}
    if(this.ending&&this.ending.frame===frame)for(const p of this.parts)if(!p.ended){current=p;this.schedule(p,{id:'$ensemble-quiet',kind:'quiet',frame,fadeFrames:this.ending.fadeFrames});p.queue.applyThrough(frame,p.applyAck);if(!p.ended)throw new Error('Common ending was not applied to every part');}
    for(const p of this.parts)if(p.contactsChanged){current=p;p.engine.setContacts(contactStateKey(p.contacts));}
    const fade=this.ending?Math.max(0,Math.min(1,1-(frame-this.ending.frame)/this.ending.fadeFrames)):1;
    sum.fill(0);
    for(const p of this.parts){current=p;p.engine.read(p.sample);for(let ch=0;ch<this.channels;ch++){const part=Math.fround(Math.fround(p.sample[ch])*fade);if(!Number.isFinite(part))throw new Error('Non-finite Rest output');sum[ch]+=part*this.mixGain;}p.engine.step();}
    current=null;for(let ch=0;ch<channels.length;ch++)channels[ch][i]=Math.fround(sum[ch]);
   }
  }catch(error){for(const channel of channels)channel.fill(0);this.fail(error,currentFrame+i,current?.index);return false;}
  for(const p of this.parts)if(p.acks.length){this.port.postMessage({type:'processed',generation:this.generation,part:p.index,events:p.acks});p.acks=[];}
  if(this.postAudio){const length=this.finished?this.finishedFrame-currentFrame:n;if(length>0){const out=Array.from(channels,c=>c.slice(0,length));this.port.postMessage({type:'audio',generation:this.generation,frame:currentFrame,length,channels:out},out.map(c=>c.buffer));}}
  if(this.snapshots&&!this.stopped&&!this.finished&&currentFrame+n>=this.nextSnapshot){const frame=currentFrame+n;this.nextSnapshot=frame+ENSEMBLE_SNAPSHOT_FRAMES;this.port.postMessage({type:'state',generation:this.generation,frame,parts:this.parts.map(p=>({part:p.index,state:p.engine.state,key:p.engine.key})),ended:this.ending});}
  if(this.finished)this.port.postMessage({type:'finished',generation:this.generation,frame:this.finishedFrame,ended:{...this.ending},origin:this.origin,mixGain:this.mixGain,mixArithmetic:ENSEMBLE_MIX_ARITHMETIC,parts:this.parts.map(p=>({part:p.index,accepted:p.accepted,refused:p.refused,ended:p.ended}))});
  return !this.stopped&&!this.finished;
 }
}
registerProcessor(ENSEMBLE_PROCESSOR_NAME,GroveEnsembleProcessor);
