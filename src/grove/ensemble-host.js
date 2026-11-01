import {REST_QUIET_FADE_SECONDS} from '../rest/limits.js';
import {DEFAULT_VOICE_CONFIG} from '../score/grove-voice.js';
import {visualFromState} from '../rest/engine.js';
import {createRestCapture} from './contact-capture.js';
import {ensemblePartsFromAcknowledgements} from './ensemble-capture.js';
import {ensembleRecordFromParts} from '../score/grove-ensemble-record.js';
import {restWorkerJob} from './contact-job.js';
const prepare=(data,options)=>restWorkerJob(new URL('./ensemble-prepare-worker.js',import.meta.url),data,options);
const render=(data,options)=>restWorkerJob(new URL('./ensemble-render-worker.js',import.meta.url),data,options);
/** Experimental shared-clock host. Computation equivalence is not realtime clearance. */
export function createEnsembleHost({createContext=()=>new AudioContext(),createNode=(context,options)=>new AudioWorkletNode(context,'imagimusic-grove-ensemble',options),prepareRecipes=prepare,renderRecord=render,onChange=()=>{},onDecision=()=>{}}={}){
 let context=null,node=null,recipes=null,captures=null,acks=null,controller=null,generation=0,sequence=0,state='idle',error=null,latest=null,record=null,pcm=null,rendering=null,origin=null;
 let strikes=[[],[],[]];
 const emit=()=>onChange({state,error,stats:captures?.map(c=>c.stats)??null,hasRecording:!!record});
 function detach(){if(!node)return;node.port.onmessage=null;node.onprocessorerror=null;node.disconnect();node.port.close();node=null;}
 function closeContext(){const old=context;context=null;if(old){old.onstatechange=null;Promise.resolve(old.close()).catch(()=>{});}}
 function fail(cause){generation++;rendering=null;error=cause;state='error';controller?.abort();detach();closeContext();record=pcm=null;latest=null;emit();}
 function consume(message,own){
  if(own!==generation||message?.generation!==String(own))return;
  try{
   if(message.type==='error')throw new Error('Ensemble audio failed'+(Number.isInteger(message.part)?' in voice '+(message.part+1):'')+': '+message.message);
   if(message.type==='state'){
    if(!Array.isArray(message.parts)||message.parts.length!==3||message.parts.some((p,i)=>p.part!==i)||!Number.isSafeInteger(message.frame))throw new Error('Invalid ensemble picture state');
    latest=message;return;
   }
   if(message.type==='queued')return;
   if(message.type==='processed'){
    const part=message.part;
    if(!Number.isInteger(part)||!captures[part]||!Array.isArray(message.events)||acks[part].length+message.events.length>4097)throw new Error('Invalid ensemble acknowledgements');
    captures[part].consume(message);acks[part].push(...structuredClone(message.events));
    for(const ack of message.events){
     if(ack.accepted){
      if(ack.event.kind==='strike'||(ack.event.kind==='contact'&&ack.event.zone!==null)){origin=origin===null?ack.appliedFrame:Math.min(origin,ack.appliedFrame);if(state==='ready')state='playing';}
      if(ack.event.kind==='strike')strikes[part].push({frame:ack.appliedFrame,body:ack.event.body,strikeU:recipes[part].positions[ack.event.position],velocity:ack.event.velocity});
      if(ack.event.kind==='quiet')state='ending';
     }
     onDecision({part,...ack});
    }
   }else if(message.type==='finished'){
    for(const capture of captures)capture.consume(message);
    if(origin!==null){const completed=ensemblePartsFromAcknowledgements(recipes,{generation:String(own),acknowledgements:acks,finished:message});record=ensembleRecordFromParts(completed.parts);}
    state='ended';latest=null;detach();
   }else throw new Error('Unknown ensemble message');
   emit();
  }catch(cause){fail(cause);}
 }
 function mount(next){
  recipes=next;captures=recipes.map(recipe=>createRestCapture(recipe,{generation:String(generation)}));acks=[[],[],[]];sequence=0;strikes=[[],[],[]];origin=null;latest=null;
  const own=generation;
  const mounted=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{recipes,generation:String(own),snapshots:true,postAudio:false}});
  node=mounted;node.port.onmessage=({data})=>consume(data,own);node.onprocessorerror=()=>{if(own===generation)fail(new Error('Ensemble audio processor failed'));};node.connect(context.destination);
  // Replace a completed passage only after the new node is successfully connected.
  record=pcm=rendering=null;state=context.state==='running'?'ready':'suspended';emit();
 }
 async function enable(groves,voice=DEFAULT_VOICE_CONFIG){
  if(state==='disposed')throw new Error('Ensemble is closed');
  const previous=record,previousPcm=pcm;generation++;const own=generation;controller?.abort();detach();controller=new AbortController();error=null;latest=null;state='preparing';emit();
  try{
   if(!context){context=createContext();context.onstatechange=()=>{if(!node||!['ready','playing','suspended'].includes(state))return;state=context.state==='running'?(origin===null?'ready':'playing'):'suspended';emit();};}
   const resumed=context.resume(),loaded=context.audioWorklet.addModule(new URL('./ensemble-worklet.js',import.meta.url));
   const prepared=prepareRecipes({groves,voice,sampleRate:context.sampleRate},{signal:controller.signal});
   const [,,next]=await Promise.all([resumed,loaded,prepared]);if(own!==generation)return;
   if(!Array.isArray(next.recipes)||next.recipes.length!==3||next.recipes.some(r=>r.sampleRate!==context.sampleRate))throw new Error('Preparation returned incompatible ensemble recipes');
   mount(next.recipes);
  }catch(cause){if(own!==generation)return;controller.abort();controller=new AbortController();detach();closeContext();captures=null;acks=null;rendering=null;error=cause;record=previous;pcm=previousPcm;state=previous?'ended':'error';emit();throw cause;}
 }
 function send(part,command){
  if(!Number.isInteger(part)||part<0||part>2)throw new Error('Choose an ensemble voice from 0 to 2');
  if(!command||typeof command!=='object')return {queued:false,reason:'invalid-command'};
  const recipe=recipes?.[part],kind=command.kind;
  if(recipe){
   const body=Number.isInteger(command.body)&&command.body>=0&&command.body<recipe.bodies;
   const valid=kind==='quiet'?Number.isSafeInteger(command.fadeFrames)&&command.fadeFrames>0&&command.fadeFrames<=recipe.sampleRate:
    kind==='strike'?body&&Number.isInteger(command.position)&&!!recipe.strikeVectors[command.position]&&Number.isFinite(command.velocity)&&command.velocity>0&&command.velocity<=1:
    kind==='contact'?body&&(command.zone===null||(Number.isInteger(command.zone)&&command.zone>=0&&command.zone<recipe.zones.length&&Number.isInteger(command.strength)&&command.strength>=0&&command.strength<recipe.strengths.length)):false;
   if(!valid)return {queued:false,reason:'invalid-command'};
  }
  const release=command.kind==='quiet'||(command.kind==='contact'&&command.zone===null);
  if(!node||(!['ready','playing'].includes(state)&&!(state==='suspended'&&release)))return {queued:false,reason:state};
  const event={...command,id:`gesture-${sequence++}`,frame:Math.ceil((context.currentTime+.035)*context.sampleRate)};
  node.port.postMessage({type:'events',part,events:[event]});return {queued:true,id:event.id};
 }
 function quiet(){
  if(state==='preparing'){park();return {queued:false,reason:'cancelled'};}
  if(!context)return {queued:false,reason:state};
  return send(0,{kind:'quiet',fadeFrames:Math.max(1,Math.round(context.sampleRate*REST_QUIET_FADE_SECONDS))});
 }
 function recording(){if(!record)throw new Error(state==='error'?error?.message:'Finish a passage containing a strike or hand gesture before saving');return structuredClone(record);}
 async function saveAudio(){
  if(pcm)return pcm;if(rendering)return rendering;const kept=recording(),own=generation;
  rendering=renderRecord({record:kept},{signal:controller?.signal}).then(result=>{if(own!==generation)throw new DOMException('Passage changed','AbortError');pcm=result.pcm;return pcm;}).finally(()=>{if(own===generation)rendering=null;});return rendering;
 }
 function visual(){
  if(!latest||!recipes)return [0,1,2].map(()=>({envelope:[],strikes:[],contacts:[]}));
  const frame=latest.frame,fade=latest.ended?Math.max(0,Math.min(1,1-(frame-latest.ended.frame)/latest.ended.fadeFrames)):1;
  return latest.parts.map((part,i)=>{const response=visualFromState(recipes[i],part.state,part.key);strikes[i]=strikes[i].filter(s=>frame-s.frame<recipes[i].sampleRate*.3);return {...response,envelope:response.envelope.map(v=>v*fade),strikes:strikes[i].filter(s=>frame>=s.frame).map(s=>({...s,age:(frame-s.frame)/recipes[i].sampleRate}))};});
 }
 function park(){
  if(state==='disposed')return;generation++;controller?.abort();controller=new AbortController();detach();closeContext();rendering=null;latest=null;strikes=[[],[],[]];captures=null;acks=null;state=record?'ended':'idle';emit();
 }
 function dispose(){park();controller?.abort();record=pcm=recipes=null;state='disposed';emit();}
 return {enable,send,quiet,recording,saveAudio,visual,park,dispose,get state(){return state;},get recipes(){return recipes;},get hasRecording(){return !!record;},get stats(){return captures?.map(c=>c.stats)??null;}};
}
