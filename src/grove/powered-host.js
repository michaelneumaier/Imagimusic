import {createPoweredCapture} from './powered-capture.js';
import {restWorkerJob} from './contact-job.js';
import {visualFromState} from '../rest/engine.js';
const prepareDefault=(data,options)=>restWorkerJob(new URL('./powered-prepare-worker.js',import.meta.url),data,options);
const renderDefault=(data,options)=>restWorkerJob(new URL('./powered-render-worker.js',import.meta.url),data,options);
/** One bounded powered encounter per explicit Begin. No automatic restarts. */
export function createPoweredHost({createContext=()=>new AudioContext(),createNode=(context,options)=>new AudioWorkletNode(context,'imagimusic-powered-encounter',options),prepare=prepareDefault,render=renderDefault,onChange=()=>{},onDecision=()=>{}}={}){
 let context=null,node=null,recipe=null,driver=null,capture=null,snapshot=null,pcm=null,rendering=null,prepareAbort=null,renderAbort=null,token=0,serial=0,state='idle',failure=null,quietRequested=false,disposed=false,finishedTime=0,pendingContact=null,timing=null;
 const emit=()=>{if(!disposed)onChange({state,error:failure});};
 const setState=next=>{state=next;emit();};
 function detach(){if(node){node.onprocessorerror=null;node.port.onmessage=null;node.disconnect();node.port.close();node=null;}}
 function fail(error){if(disposed)return;failure=error;token++;prepareAbort?.abort();renderAbort?.abort();detach();setState('error');}
 function contextChanged(){if(!node||disposed)return;setState(context.state==='running'?(quietRequested?'ending':'playing'):'suspended');}
 async function begin(grove){
  if(disposed)throw new Error('Powered host is disposed');
  if(['preparing','playing','suspended','ending'].includes(state))return false;
  pendingContact=null;quietRequested=false;const own=++token;prepareAbort?.abort();const abort=new AbortController();prepareAbort=abort;failure=null;setState('preparing');
  try{
   if(!context){context=createContext();context.onstatechange=contextChanged;}
   const resume=context.resume(),module=context.audioWorklet.addModule(new URL('./powered-worklet.js',import.meta.url));
   const preparation=prepare({grove,sampleRate:context.sampleRate},{signal:abort.signal});
   const [,,prepared]=await Promise.all([resume,module,preparation]);
   if(disposed||own!==token||abort.signal.aborted)return false;
   if(context.state!=='running')throw new Error('Audio is interrupted. Begin again when audio is available.');
   const mountedFrame=Math.ceil(context.currentTime*context.sampleRate);
   const generation=`powered-${own}`,originFrame=Math.ceil((context.currentTime+.035)*context.sampleRate);
   const nextCapture=createPoweredCapture(prepared.recipe,{generation,driver:prepared.driver,fadeFrames:prepared.fadeFrames});
   const nextNode=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{...prepared,originFrame,generation,snapshots:true,events:pendingContact?[{...pendingContact,id:'contact-0'}]:[]}});
   detach();renderAbort?.abort();recipe=prepared.recipe;driver=prepared.driver;capture=nextCapture;node=nextNode;timing={sampleRate:context.sampleRate,mountedFrame,requestedOriginFrame:originFrame,actualOriginFrame:null,firstProcessFrame:null};snapshot=null;pcm=null;rendering=null;finishedTime=0;quietRequested=false;serial=pendingContact?1:0;pendingContact=null;prepareAbort=null;
   node.port.onmessage=({data})=>{
    if(disposed||own!==token||data.generation!==generation)return;
    try{
     capture.consume(data);
     if(data.type==='started'){timing.actualOriginFrame=data.originFrame;timing.firstProcessFrame=Number.isSafeInteger(data.firstProcessFrame)?data.firstProcessFrame:null;}
     if(data.type==='state')snapshot=data;
     if(data.type==='processed')onDecision(data);
     if(data.type==='finished'){finishedTime=(data.ended.frame+data.ended.fadeFrames)/recipe.sampleRate;detach();setState('ended');}
    }catch(error){fail(error);}
   };
   node.onprocessorerror=()=>fail(new Error('The powered audio processor stopped unexpectedly.'));
   node.connect(context.destination);setState('playing');return true;
  }catch(error){if(disposed||own!==token||abort.signal.aborted)return false;fail(error);throw error;}
 }
 // Requested frames are diagnostic; capture records acknowledged applied frames.
 function send(command){
  if(!['preparing','playing','suspended'].includes(state)||quietRequested)return false;
  if(command.kind!=='contact'||(command.zone!==null&&command.zone!==0&&command.zone!==1))throw new Error('Choose one of the two contact positions or lift.');
  // Retain intent only; its requested frame is diagnostic, never saved as application time.
  if(state==='preparing'){pendingContact=command.zone===null?null:{kind:'contact',zone:command.zone,frame:Math.ceil(context.currentTime*context.sampleRate)};return true;}
  if(!node)return false;
  node.port.postMessage({type:'events',events:[{id:`contact-${serial++}`,kind:'contact',zone:command.zone,frame:Math.ceil(context.currentTime*context.sampleRate)}]});return true;
 }
 function quiet(){
  // Retain intent only; its requested frame is diagnostic, never saved as application time.
  if(state==='preparing'){pendingContact=null;token++;prepareAbort?.abort();prepareAbort=null;setState(capture?.state==='complete'?'ended':'idle');return;}
  if(!node||quietRequested)return;
  node.port.postMessage({type:'events',events:[{id:`quiet-${serial++}`,kind:'quiet',frame:Math.ceil(context.currentTime*context.sampleRate)}]});quietRequested=true;contextChanged();
 }
 async function resume(){if(!node||context.state==='running')return;await context.resume();contextChanged();}
 function recording(){if(failure)throw failure;if(!capture)throw new Error('Begin an encounter first');return capture.snapshot();}
 async function saveAudio(){
  if(state!=='ended')throw new Error('Let the encounter finish before saving');
  if(pcm)return pcm;if(rendering)return rendering;
  const record=recording(),own=token,abort=new AbortController();renderAbort=abort;
  const pending=render({record,recipe},{signal:abort.signal}).then(result=>{if(disposed||own!==token)throw new DOMException('Encounter changed','AbortError');pcm=result.pcm;return pcm;}).finally(()=>{if(rendering===pending)rendering=null;});
  rendering=pending;return pending;
 }
 function visual(){
  if(!recipe)return {envelope:[],contacts:[],driverActive:false,time:0};
  if(['ended','error','disposed','preparing'].includes(state)||!snapshot)return {envelope:Array(recipe.bodies).fill(0),contacts:Array(recipe.bodies).fill(null),driverActive:false,time:state==='ended'?finishedTime:0};
  const relative=snapshot.frame-snapshot.originFrame,frame=Math.max(0,relative),v=visualFromState(recipe,snapshot.state,snapshot.key),fade=snapshot.ended?Math.max(0,1-(frame-snapshot.ended.frame)/snapshot.ended.fadeFrames):1;
  return {...v,envelope:v.envelope.map(x=>x*fade),time:frame/recipe.sampleRate,driverActive:relative>=0&&!snapshot.ended&&frame>=driver.startFrame&&frame<driver.startFrame+driver.forcedFrames};
 }
 /** Release audio for browser-cache parking while retaining only a finished encounter. */
 function park(){
  if(disposed)return;token++;prepareAbort?.abort();renderAbort?.abort();prepareAbort=renderAbort=null;rendering=null;pendingContact=null;detach();
  const old=context;context=null;if(old){old.onstatechange=null;Promise.resolve(old.close()).catch(()=>{});}
  failure=null;quietRequested=false;
  if(capture?.state!=='complete'){capture=recipe=driver=snapshot=pcm=timing=null;finishedTime=0;}
  setState(capture?'ended':'idle');
 }
 function dispose(){if(disposed)return;disposed=true;token++;prepareAbort?.abort();renderAbort?.abort();detach();context?.close();state='disposed';pcm=null;}
 return {begin,send,quiet,resume,park,recording,saveAudio,visual,dispose,get state(){return state;},get recipe(){return recipe;},get driver(){return driver;},get timing(){return timing?{...timing}:null;},get stats(){return capture?.stats??null;}};
}
