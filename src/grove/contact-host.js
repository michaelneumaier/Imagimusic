import {REST_QUIET_FADE_SECONDS} from '../rest/limits.js';
import {DEFAULT_VOICE_CONFIG} from '../score/grove-voice.js';
import {visualFromState} from '../rest/engine.js';
import {createRestCapture} from './contact-capture.js';
import {restWorkerJob} from './contact-job.js';
const prepare=(data,options)=>restWorkerJob(new URL('./contact-prepare-worker.js',import.meta.url),data,options);
const render=(data,options)=>restWorkerJob(new URL('./contact-render-worker.js',import.meta.url),data,options);
/** Live shared-engine host. Only processed acknowledgements become recorded gestures. */
export function createRestHost({createContext=()=>new AudioContext(),createNode=(context,options)=>new AudioWorkletNode(context,'imagimusic-grove-contact',options),prepareRecipe=prepare,renderRecord=render,onChange=()=>{},onDecision=()=>{}}={}){
 let context,node,recipe,capture,abort,token=0,sequence=0,state='idle',failure=null,latest=null,ending=null,pcm=null,rendering=null;
 let strikes=[];
 const emit=()=>onChange({state,error:failure,stats:capture?.stats??null});
 function detach(){if(node){node.port.onmessage=null;node.onprocessorerror=null;node.disconnect();node.port.close();node=null;}}
 function fail(error){failure=error;state='error';detach();abort?.abort();emit();}
 function consume(message,own){
  if(own!==token)return;
  try{
   if(message.generation!==String(own))return;
   if(message.type==='state'){latest=message;return;}
   capture.consume(message);
   if(message.type==='processed')for(const ack of message.events){
    if(ack.accepted&&ack.event.kind==='strike'){strikes.push({frame:ack.appliedFrame,body:ack.event.body,strikeU:recipe.positions[ack.event.position],velocity:ack.event.velocity});if(state==='ready')state='playing';}
    if(ack.accepted&&ack.event.kind==='quiet'){ending={frame:ack.appliedFrame,fadeFrames:ack.event.fadeFrames};state='ending';}
    onDecision(ack);
   }
   if(message.type==='finished'){state='ended';latest=null;detach();}
   if(message.type!=='queued')emit();
  }catch(error){fail(error);}
 }
 function mount(){
  const own=token;capture=createRestCapture(recipe,{generation:String(own)});sequence=0;latest=ending=pcm=rendering=null;strikes=[];
  node=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{recipe,generation:String(own),snapshots:true}});
  node.port.onmessage=({data})=>consume(data,own);node.onprocessorerror=()=>{if(own===token)fail(new Error('Rest audio processor failed'));};node.connect(context.destination);state=context.state==='running'?'ready':'suspended';emit();
 }
 async function enable(grove,voice=DEFAULT_VOICE_CONFIG){
  token++;const own=token;abort?.abort();detach();abort=new AbortController();failure=null;recipe=capture=null;latest=null;state='preparing';emit();
  try{
   if(!context){context=createContext();context.onstatechange=()=>{if(!node||['error','ended','preparing'].includes(state))return;if(context.state!=='running')state='suspended';else if(state==='suspended')state=ending?'ending':capture.stats.strikes?'playing':'ready';emit();};}
   // Resume is invoked synchronously within the user's gesture, before worker awaits.
   const resumed=context.resume();const loaded=context.audioWorklet.addModule(new URL('./contact-worklet.js',import.meta.url));
   const prepared=prepareRecipe({grove,voice,sampleRate:context.sampleRate},{signal:abort.signal});
   const [, ,result]=await Promise.all([resumed,loaded,prepared]);if(own!==token)return;recipe=result.recipe;mount();
  }catch(error){if(own!==token)return;fail(error);throw error;}
 }
 function send(command){
  const release=command.kind==='quiet'||(command.kind==='contact'&&command.zone===null);
  if(!node||(!['ready','playing'].includes(state)&&!(state==='suspended'&&release)))return {queued:false,reason:state};
  const event={...command,id:`gesture-${sequence++}`,frame:Math.ceil(context.currentTime*context.sampleRate)};node.port.postMessage({type:'events',events:[event]});return {queued:true,id:event.id};
 }
 function schedule(commands){
  if(state!=='ready'||sequence!==0||capture.stats.strikes||capture.stats.activeContacts)throw new Error('Begin a fresh passage for the invitation');
  if(!Array.isArray(commands)||!commands.length||commands.some(c=>!Number.isSafeInteger(c.frame)||c.frame<0))throw new Error('Invalid invitation timing');
  const origin=Math.ceil((context.currentTime+.1)*context.sampleRate),events=commands.map(command=>({...command,id:`gesture-${sequence++}`,frame:origin+command.frame}));node.port.postMessage({type:'events',events});return origin;
 }
 function quiet(){if(!context)return {queued:false,reason:state};return send({kind:'quiet',fadeFrames:Math.max(1,Math.round(context.sampleRate*REST_QUIET_FADE_SECONDS))});}
 async function resume(){if(!context)throw new Error('Enter the grove first');await context.resume();if(context.state!=='running')throw new Error('Audio remains interrupted');}
 function newPassage(){if(!recipe||state!=='ended')throw new Error('Finish this passage before beginning another');token++;detach();abort?.abort();abort=new AbortController();failure=null;mount();}
 function recording(){if(state==='error')throw failure;return capture?.snapshot()??null;}
 async function saveAudio(){
  if(pcm)return pcm;if(rendering)return rendering;const record=recording();if(!record)throw new Error('No finished passage');const own=token;
  rendering=renderRecord({recipe,record},{signal:abort.signal}).then(result=>{if(own!==token)throw new DOMException('Passage changed','AbortError');pcm=result.pcm;return pcm;}).finally(()=>{if(own===token)rendering=null;});return rendering;
 }
 function visual(){
  if(!latest||!recipe||state==='ended')return {envelope:[],strikes:[],contacts:[]};
  const frame=latest.frame,visual=visualFromState(recipe,latest.state,latest.key),fade=latest.ended?Math.max(0,Math.min(1,1-(frame-latest.ended.frame)/latest.ended.fadeFrames)):1;
  // Picture uses the timestamped audio state, without inventing intervening motion.
  return {...visual,envelope:visual.envelope.map(value=>value*fade),time:capture.originFrame===null?0:(frame-capture.originFrame)/recipe.sampleRate,strikes:strikes.filter(s=>frame>=s.frame&&frame-s.frame<recipe.sampleRate*.3).map(s=>({...s,age:(frame-s.frame)/recipe.sampleRate}))};
 }
 function dispose(){token++;abort?.abort();detach();if(context){context.onstatechange=null;context.close();context=null;}state='disposed';}
 return {enable,send,schedule,quiet,resume,newPassage,recording,saveAudio,visual,dispose,get state(){return state;},get recipe(){return recipe;},get stats(){return capture?.stats??null;}};
}
