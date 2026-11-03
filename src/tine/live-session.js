import {createListeningLevel,listeningGain} from '../grove/listening-level.js';
import {requestForTineDesign,validateTineDesign} from './address.js';
const aborted=()=>Object.assign(Error('Playing pass cancelled.'),{name:'AbortError'});
export function createTineLiveSession({createContext=()=>new AudioContext(),createNode=(context,options)=>new AudioWorkletNode(context,'imagimusic-tine-live',options),createListeningStage=createListeningLevel,listeningDb=null,onChange=()=>{}}={}){
 let active=null,state='idle',touches=0,lastFinished=null;
 if(listeningDb!==null)listeningGain(listeningDb);
 function stageFor(s,db){
  const stage=createListeningStage(s.context,{db});
  try{stage.output.connect(s.context.destination);}catch(error){stage.dispose();throw error;}
  return stage;
 }
 function setListeningDb(db){
  listeningGain(db);
  if(active?.listening)active.listening.setDb(db);
  else if(active?.node){const s=active,next=stageFor(s,db);try{s.node.disconnect();s.node.connect(next.input);}catch(error){next.dispose();fail(s,error);throw error;}s.listening=next;}
  listeningDb=db;
 }
 const emit=extra=>onChange({state,touches,...extra});
 function release(s,error=aborted()){
  if(!s)return;clearTimeout(s.watchdog);clearTimeout(s.finishTimer);
  for(const pending of s.pending.values()){clearTimeout(pending.timer);pending.reject(error);}s.pending.clear();
  if(s.node){s.node.port.onmessage=null;s.node.onprocessorerror=null;s.node.disconnect();s.node.port.close();}
  s.listening?.dispose();
  s.context.onstatechange=null;Promise.resolve(s.context.close()).catch(()=>{});
  if(active===s)active=null;
 }
 function park(reason='interrupted'){const old=active;active=null;release(old);state=reason;emit();}
 function fail(s,error){if(active!==s)return;release(s,error);state='error';emit({message:error.message});}
 function wait(s,key,ms){const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>fail(s,Error('The audio processor did not answer. Start another pass.')),ms);s.pending.set(key,{resolve,reject,timer});});result.catch(()=>{});return result;}
 function command(s,type,strength){const id=s.nextId++,result=wait(s,id,2000);s.node.port.postMessage({id,type,strength});return result;}
 async function start(design){
  design=validateTineDesign(design);const request=requestForTineDesign(design);release(active);state='preparing';touches=0;lastFinished=null;emit();
  let s;
  try{
   const context=createContext();s={context,node:null,pending:new Map(),nextId:0,pendingTouches:0,watchdog:null};active=s;
   await context.resume();if(active!==s)throw aborted();
   if(context.state!=='running')throw Error('Audio is interrupted. Start another pass when it is available.');
   context.onstatechange=()=>{if(active===s&&context.state!=='running')park('interrupted');};
   await context.audioWorklet.addModule(new URL('./live-worklet.js',import.meta.url));if(active!==s)throw aborted();
   const ready=wait(s,'ready',5000);
   s.node=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{geometry:request.geometry,options:{count:4,activation:request.options.activation,pickup:request.options.pickup}}});
   s.node.onprocessorerror=()=>fail(s,Error('The audio processor stopped. Start another pass.'));
   s.node.port.onmessage=({data})=>{
    if(active!==s)return;
    if(data.type==='error'){fail(s,Error(data.message));return;}
    const key=data.type==='ready'?'ready':data.id,pending=s.pending.get(key);
    if(pending){clearTimeout(pending.timer);s.pending.delete(key);if(data.type==='refused')pending.reject(Error(data.message));else pending.resolve(data);}
    if(data.type==='applied'&&data.command==='strike'){touches++;emit({event:{frame:data.frame,strength:data.strength}});}
    if(data.type==='state'&&['playing','ringing','ending'].includes(data.state)&&!(state==='ending'&&data.state!=='ending')){state=data.state;emit();}
    if(data.type==='origin'){s.origin=data.audioFrame/data.sampleRate;emit({originAudioFrame:data.audioFrame,sampleRate:data.sampleRate});}
    if(data.type==='finished'&&!s.finishTimer){
     // Rendering can lead the output device. Let the final fade drain before closing.
     clearTimeout(s.watchdog);state='ending';emit();
     const latency=value=>Number.isFinite(value)&&value>=0?Math.min(value,.5):0;
     const drainMs=1000*(Math.max(.05,latency(s.context.baseLatency)+latency(s.context.outputLatency))+.025);
     s.finishTimer=setTimeout(()=>{if(active!==s)return;lastFinished={design,sampleRate:s.context.sampleRate,...data};release(s);state='ended';emit({finished:lastFinished});},drainMs);
    }
   };
   if(listeningDb!==null)s.listening=stageFor(s,listeningDb);
   s.node.connect(s.listening?.input??context.destination);await ready;if(active!==s)throw aborted();
   await command(s,'start');if(active!==s)throw aborted();state='playing';emit();
   s.watchdog=setTimeout(()=>fail(s,Error('The playing pass did not finish. Start another pass.')),11000);
  }catch(error){if(s&&active===s)fail(s,error);else if(!s){state='error';emit({message:error.message});}throw error;}
 }
 async function strike(){
  const s=active;if(!s||state!=='playing'||touches+s.pendingTouches>=8)throw Error('This pass is not accepting another touch.');
  s.pendingTouches++;
  try{return await command(s,'strike',.1);}finally{s.pendingTouches--;}
 }
 async function quiet(){
  const s=active;if(!s)return;
  if(state==='preparing'){park('cancelled');return;}
  if(state==='ending')return;
  if(s.context.state!=='running'){park('interrupted');return;}
  state='ending';emit();return command(s,'quiet');
 }
 return {start,strike,quiet,park,setListeningDb,dispose(){park('idle');},time(){return active&&active.origin!==undefined?Math.max(0,Math.min(8,active.context.currentTime-active.origin)):lastFinished?lastFinished.snapshot.frame/lastFinished.sampleRate:0;},get state(){return state;},get touches(){return touches;},get finished(){return lastFinished;}};
}
