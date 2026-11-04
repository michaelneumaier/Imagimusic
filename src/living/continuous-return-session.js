import {createContinuousReturnStudy} from './continuous-return-study.js';
import {createContinuousReturnVerifyJob} from './continuous-return-verify-job.js';
import {createListeningLevel,listeningGain} from '../grove/listening-level.js';
const aborted=()=>Object.assign(Error('Continuous listening cancelled.'),{name:'AbortError'});
export function createContinuousListeningStage(context,{db}){
 const level=createListeningLevel(context,{db}),input=context.createGain();input.gain.value=8/Math.sqrt(2);
 try{input.connect(level.input);}catch(error){input.disconnect();level.dispose();throw error;}
 return {input,output:level.output,setDb:level.setDb,dispose(){input.disconnect();level.dispose();}};
}
export function createContinuousReturnSession({createContext=rate=>new AudioContext({sampleRate:rate}),createNode=(context,options)=>new AudioWorkletNode(context,'imagimusic-continuous-return',options),createListeningStage=createContinuousListeningStage,createVerifyJob=createContinuousReturnVerifyJob,listeningDb=0,onChange=()=>{}}={}){
 listeningGain(listeningDb);let active=null,state='idle',touches=0,lastFinished=null;
 const emit=extra=>onChange({state,touches,...extra});
 function closeAudio(s){
  if(s.audioClosed)return;s.audioClosed=true;s.context.onstatechange=null;
  if(s.node){s.node.port.onmessage=null;s.node.onprocessorerror=null;s.node.disconnect();s.node.port.close();}
  s.listening?.dispose();Promise.resolve(s.context.close()).catch(()=>{});
 }
 function release(s,error=aborted()){
  if(!s)return;clearTimeout(s.watchdog);clearTimeout(s.drainTimer);s.verifyJob?.cancel();
  for(const pending of s.pending.values()){clearTimeout(pending.timer);pending.reject(error);}s.pending.clear();closeAudio(s);if(active===s)active=null;
 }
 function park(reason='interrupted'){const s=active;active=null;release(s);state=reason;emit();}
 function fail(s,error){if(active!==s)return;release(s,error);state='error';emit({message:error.message});}
 function wait(s,key,ms,command=null,strength=null){
  const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>fail(s,Error('The continuous audio processor did not answer.')),ms);s.pending.set(key,{resolve,reject,timer,command,strength});});result.catch(()=>{});return result;
 }
 function command(s,type,strength){
  if(s.nextId>=8192)return Promise.reject(Error('Continuous command capacity exhausted.'));
  const id=s.nextId++,result=wait(s,id,2000,type,strength);try{s.node.port.postMessage({id,type,strength});}catch(error){fail(s,error);}return result;
 }
 function complete(s){
  if(active!==s||!s.drained||!s.verified)return;
  lastFinished=structuredClone(s.verified);release(s);state='ended';emit({finished:structuredClone(lastFinished)});
 }
 function receive(s,data){
  if(active!==s)return;
  try{
   if(!data||typeof data.type!=='string')throw Error('Invalid continuous audio message.');
   if(data.type==='error')throw Error(data.message);
   if(['ready','applied','refused'].includes(data.type)){
    const key=data.type==='ready'?'ready':data.id,pending=s.pending.get(key);
    if(!pending)throw Error('Unexpected continuous acknowledgment.');
    if(data.type==='ready'){
     if(data.seed!==s.plan.seed||data.sampleRate!==s.plan.sampleRate||data.frames!==s.plan.frames)throw Error('The processor prepared a different continuous study.');
    }else if(data.type==='applied'){
     if(data.command!==pending.command||!Number.isInteger(data.frame)||data.frame<0||data.frame>s.plan.frames)throw Error('Invalid continuous command acknowledgment.');
     if(data.command==='strike'){touches++;emit({event:{frame:data.frame,strength:pending.strength}});}
     if(data.command==='quiet'){s.quietFrame=data.frame;emit({endingFrame:data.frame});}
    }
    clearTimeout(pending.timer);s.pending.delete(key);if(data.type==='refused')pending.reject(Error(data.message));else pending.resolve(data);return;
   }
   if(data.type==='origin'){
    if(s.originAudioFrame!==null||data.sampleRate!==s.plan.sampleRate||!Number.isSafeInteger(data.audioFrame)||data.audioFrame<0||!Number.isSafeInteger(data.audioFrame+s.plan.frames))throw Error('Invalid continuous audio origin.');
    s.originAudioFrame=data.audioFrame;emit({originAudioFrame:data.audioFrame,sampleRate:data.sampleRate});return;
   }
   if(data.type==='touches'){
    if(s.verifying||!Array.isArray(data.touches)||s.history.length+data.touches.length>4096)throw Error('Invalid continuous touch history.');
    let previous=s.history.at(-1)?.frame??0;
    for(const [offset,event] of data.touches.entries()){
     if(!event||Object.keys(event).length!==5||event.index!==s.history.length+offset||!Number.isInteger(event.frame)||event.frame<previous||event.frame>s.plan.frames-Math.round(.025*s.plan.sampleRate)||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1||!['score','guest'].includes(event.origin)||s.originAudioFrame===null||event.audioFrame!==s.originAudioFrame+event.frame)throw Error('Invalid accepted continuous touch.');previous=event.frame;
    }
    s.history.push(...structuredClone(data.touches));emit({events:structuredClone(data.touches)});return;
   }
   if(data.type==='state'){
    if(!['playing','ending','ended'].includes(data.state))throw Error('Invalid continuous transport state.');
    if(!s.verifying&&state!=='ending'){state=data.state==='ended'?'ending':data.state;emit();}return;
   }
   if(data.type==='finished'){
    if(s.verifying||s.history.filter(e=>e.origin==='guest').length!==touches)throw Error('Invalid continuous completion or guest acknowledgments.');
    s.verifying=true;clearTimeout(s.watchdog);state='verifying';emit();
    s.verifyJob=createVerifyJob({seed:s.plan.seed,sampleRate:s.plan.sampleRate,data,touches:s.history,originAudioFrame:s.originAudioFrame,quietFrame:s.quietFrame});
    s.verifyJob.promise.then(result=>{if(active!==s)return;s.verified=result;complete(s);},error=>fail(s,error));
    const latency=value=>Number.isFinite(value)&&value>=0?Math.min(value,.5):0;
    s.drainTimer=setTimeout(()=>{if(active!==s)return;closeAudio(s);s.drained=true;complete(s);},1000*(Math.max(.05,latency(s.context.baseLatency)+latency(s.context.outputLatency))+.025));return;
   }
   throw Error('Unexpected continuous audio message.');
  }catch(error){fail(s,error);}
 }
 async function start(seed=42,{sampleRate=48000}={}){
  const plan=createContinuousReturnStudy(seed,{sampleRate});release(active);state='preparing';touches=0;emit();let s;
  try{
   const context=createContext(sampleRate);s={context,plan,pending:new Map(),nextId:0,pendingTouches:0,history:[],originAudioFrame:null,quietFrame:null,audioClosed:false};active=s;
   await context.resume();if(active!==s)throw aborted();
   if(context.sampleRate!==sampleRate)throw Error('The audio context did not preserve the requested sample rate.');
   if(context.state!=='running')throw Error('Audio is interrupted.');
   context.onstatechange=()=>{if(active===s&&context.state!=='running')park('interrupted');};
   await context.audioWorklet.addModule(new URL('./continuous-return-worklet.js',import.meta.url));if(active!==s)throw aborted();
   const ready=wait(s,'ready',5000);
   s.node=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{seed,sampleRate}});
   s.node.port.onmessage=({data})=>receive(s,data);s.node.onprocessorerror=()=>fail(s,Error('The continuous audio processor stopped.'));
   s.listening=createListeningStage(context,{db:listeningDb});s.listening.output.connect(context.destination);s.node.connect(s.listening.input);
   await ready;if(active!==s)throw aborted();await command(s,'start');if(active!==s)throw aborted();
   if(!s.verifying){state='playing';emit();s.watchdog=setTimeout(()=>fail(s,Error('The continuous performance did not finish.')),55000);}
  }catch(error){if(s&&active===s)fail(s,error);else if(!s){state='error';emit({message:error.message});}throw error;}
 }
 async function strike(strength=.1){
  if(![.025,.05,.1].includes(strength))throw Error('Choose a soft, light or firm touch.');
  const s=active;if(!s||state!=='playing'||s.pendingTouches>=1||s.nextId>=8190)throw Error('This performance is not accepting another touch.');
  s.pendingTouches++;try{return await command(s,'strike',strength);}finally{s.pendingTouches--;}
 }
 async function quiet(){
  const s=active;if(!s)return;if(state==='preparing'){park('cancelled');return;}if(state!=='playing')return;
  if(s.context.state!=='running'){park('interrupted');return;}state='ending';emit();return command(s,'quiet');
 }
 function setListeningDb(db){listeningGain(db);if(active&&!active.audioClosed)active.listening?.setDb(db);listeningDb=db;}
 return {start,strike,quiet,park,setListeningDb,dispose(){park('idle');},time(){return active?(active.originAudioFrame===null?0:Math.max(0,Math.min(48,active.context.currentTime-active.originAudioFrame/active.plan.sampleRate))):lastFinished?lastFinished.snapshot.endFrame/lastFinished.record.sampleRate:0;},get state(){return state;},get touches(){return touches;},get finished(){return lastFinished?structuredClone(lastFinished):null;}};
}
