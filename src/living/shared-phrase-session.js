import {createListeningLevel,listeningGain} from '../grove/listening-level.js';
import {createLivingSharedPhrasePass} from './shared-phrase-pass.js';
import {validateSharedPhraseFinished} from './shared-phrase-result.js';
const aborted=()=>Object.assign(Error('Playing pass cancelled.'),{name:'AbortError'});
export function createLivingSharedPhraseSession({createContext=rate=>new AudioContext({sampleRate:rate}),createNode=(context,options)=>new AudioWorkletNode(context,'imagimusic-living-shared-phrase',options),createListeningStage=createListeningLevel,listeningDb=null,onChange=()=>{}}={}){
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
 function command(s,type,strength){const id=s.nextId++,result=wait(s,id,2000);s.pending.get(id).command=type;try{s.node.port.postMessage({id,type,strength});}catch(error){fail(s,error);}return result;}
 async function start(value,{guestLimit}={}){
  const admitted=createLivingSharedPhrasePass(value,{guestLimit}),source=admitted.source;guestLimit=admitted.guestLimit;release(active);state='preparing';touches=0;emit();
  let s;
  try{
   const context=createContext(source.sampleRate);s={context,node:null,pending:new Map(),nextId:0,pendingTouches:0,watchdog:null,guestLimit,history:[],originAudioFrame:null,quietFrame:null};active=s;
   await context.resume();if(active!==s)throw aborted();
   if(context.sampleRate!==source.sampleRate)throw Error('The audio context did not preserve the source sample rate.');
   if(context.state!=='running')throw Error('Audio is interrupted. Start another pass when it is available.');
   context.onstatechange=()=>{if(active===s&&context.state!=='running')park('interrupted');};
   await context.audioWorklet.addModule(new URL('./shared-phrase-worklet.js',import.meta.url));if(active!==s)throw aborted();
   const ready=wait(s,'ready',5000);
   s.node=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{source,guestLimit}});
   s.node.onprocessorerror=()=>fail(s,Error('The audio processor stopped. Start another pass.'));
   s.node.port.onmessage=({data})=>{
    if(active!==s)return;
    try{
    if(!data||typeof data.type!=='string')throw Error('Invalid shared audio message.');
    if(data.type==='ready'&&(data.sampleRate!==source.sampleRate||data.guestLimit!==guestLimit))throw Error('The processor prepared a different shared phrase.');
    if(data.type==='error'){fail(s,Error(data.message));return;}
    const key=data.type==='ready'?'ready':data.id,pending=s.pending.get(key);
    if(pending&&data.type!=='ready'&&data.type!=='refused'&&(data.type!=='applied'||data.command!==pending.command))throw Error('Unexpected shared command acknowledgment.');
    if(pending){clearTimeout(pending.timer);s.pending.delete(key);if(data.type==='refused')pending.reject(Error(data.message));else pending.resolve(data);}
    if(data.type==='applied'&&data.command==='strike'){touches++;emit({event:{frame:data.frame,strength:data.strength}});}
    if(data.type==='state'&&['playing','ringing','ending'].includes(data.state)&&!(state==='ending'&&data.state!=='ending')){state=data.state;emit();}
    if(data.type==='origin'){if(s.originAudioFrame!==null||data.sampleRate!==source.sampleRate||!Number.isSafeInteger(data.audioFrame)||data.audioFrame<0)throw Error('Invalid shared audio origin.');s.originAudioFrame=data.audioFrame;s.origin=data.audioFrame/data.sampleRate;emit({originAudioFrame:data.audioFrame,sampleRate:data.sampleRate});}
    if(data.type==='applied'&&data.command==='quiet')s.quietFrame=data.frame;
    if(data.type==='touches'){if(!Array.isArray(data.touches)||data.touches.length+s.history.length>8)throw Error('Invalid shared touch history.');
     let previous=s.history.at(-1)?.frame??0;
     for(const [offset,event] of data.touches.entries()){if(!event||event.index!==s.history.length+offset||!Number.isInteger(event.frame)||event.frame<previous||event.frame>Math.min(4*source.sampleRate,source.fadeStart)||!Number.isFinite(event.strength)||event.strength<=0||event.strength>.1||!['score','guest'].includes(event.origin)||s.originAudioFrame===null||event.audioFrame!==s.originAudioFrame+event.frame)throw Error('Invalid accepted shared touch.');previous=event.frame;}
     s.history.push(...structuredClone(data.touches));emit({events:structuredClone(data.touches)});}
    if(data.type==='finished'&&!s.finishTimer){
     // Rendering can lead the output device. Let the final fade drain before closing.
     let completed;
     try{completed=validateSharedPhraseFinished(source,guestLimit,data,s.history,s.originAudioFrame,s.quietFrame);}catch(error){fail(s,error);return;}
     clearTimeout(s.watchdog);state='ending';emit();
     const latency=value=>Number.isFinite(value)&&value>=0?Math.min(value,.5):0;
     const drainMs=1000*(Math.max(.05,latency(s.context.baseLatency)+latency(s.context.outputLatency))+.025);
     s.finishTimer=setTimeout(()=>{if(active!==s)return;lastFinished=completed;release(s);state='ended';emit({finished:structuredClone(lastFinished)});},drainMs);
    }
    }catch(error){fail(s,error);}
   };
   if(listeningDb!==null)s.listening=stageFor(s,listeningDb);
   s.node.connect(s.listening?.input??context.destination);await ready;if(active!==s)throw aborted();
   await command(s,'start');if(active!==s)throw aborted();if(!s.finishTimer){state='playing';emit();}
   if(!s.finishTimer)s.watchdog=setTimeout(()=>fail(s,Error('The playing pass did not finish. Start another pass.')),11000);
  }catch(error){if(s&&active===s)fail(s,error);else if(!s){state='error';emit({message:error.message});}throw error;}
 }
 async function strike(strength=.1){
  if(![.025,.05,.1].includes(strength))throw Error('Choose a soft, light or firm touch.');
  const s=active;if(!s||state!=='playing'||touches+s.pendingTouches>=s.guestLimit)throw Error('This pass is not accepting another touch.');
  s.pendingTouches++;
  try{return await command(s,'strike',strength);}finally{s.pendingTouches--;}
 }
 async function quiet(){
  const s=active;if(!s)return;
  if(state==='preparing'){park('cancelled');return;}
  if(state==='ending')return;
  if(s.context.state!=='running'){park('interrupted');return;}
  state='ending';emit();return command(s,'quiet');
 }
 return {start,strike,quiet,park,setListeningDb,dispose(){park('idle');},time(){return active?(active.origin!==undefined?Math.max(0,Math.min(8,active.context.currentTime-active.origin)):0):lastFinished?lastFinished.snapshot.frame/lastFinished.record.sampleRate:0;},get state(){return state;},get touches(){return touches;},get finished(){return lastFinished?structuredClone(lastFinished):null;}};
}
