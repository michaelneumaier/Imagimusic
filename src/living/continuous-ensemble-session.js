import {createMemoryEnsembleStudy} from './memory-ensemble-study.js';
import {createMemoryEnsembleVerifyJob} from './memory-ensemble-verify-job.js';
import {createContinuousEnsembleStudy} from './continuous-ensemble-study.js';
import {createContinuousEnsembleVerifyJob} from './continuous-ensemble-verify-job.js';
import {createListeningLevel,listeningGain} from '../grove/listening-level.js';
const aborted=()=>Object.assign(Error('Continuous listening cancelled.'),{name:'AbortError'});
export function createContinuousEnsembleListeningStage(context,{db}){
 const level=createListeningLevel(context,{db}),input=context.createGain();input.gain.value=24/Math.sqrt(2);
 try{input.connect(level.input);}catch(error){input.disconnect();level.dispose();throw error;}
 return {input,output:level.output,setDb:level.setDb,dispose(){input.disconnect();level.dispose();}};
}
export function createContinuousEnsembleSession({createContext=rate=>new AudioContext({sampleRate:rate}),createNode=(context,options)=>new AudioWorkletNode(context,options.processorOptions.mode==='memory-ensemble'?'imagimusic-memory-ensemble':'imagimusic-continuous-ensemble',options),createListeningStage=createContinuousEnsembleListeningStage,createVerifyJob=null,listeningDb=0,onChange=()=>{}}={}){
 listeningGain(listeningDb);let active=null,state='idle',touches=0,guests=0,lastFinished=null,compositionMode='fixed';
 const emit=extra=>onChange({state,touches,guests,mode:compositionMode==='memory'?'memory-ensemble':'ensemble',...extra});
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
 function wait(s,key,ms,command=null,guest=null){
  const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>fail(s,Error('The continuous audio processor did not answer.')),ms);s.pending.set(key,{resolve,reject,timer,command,guest});});result.catch(()=>{});return result;
 }
 function command(s,type,body,strength){
  if(s.nextId>=8192)return Promise.reject(Error('Continuous command capacity exhausted.'));
  const guest=type==='strike'?{body,strength,status:'pending',frame:null,event:null}:null;if(guest)s.guestCommands.push(guest);
  const id=s.nextId++,result=wait(s,id,2000,type,guest);try{s.node.port.postMessage({id,type,...(guest?{body,strength}:{})});}catch(error){fail(s,error);}return result;
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
     if(data.kind!==s.plan.kind||data.version!==1)throw Error('The processor prepared a different composition mode.');
     if(data.seed!==s.plan.seed||data.sampleRate!==s.plan.sampleRate||data.frames!==s.plan.frames)throw Error('The processor prepared a different continuous study.');
    }else if(data.type==='applied'){
     if(data.command!==pending.command||!Number.isInteger(data.frame)||data.frame<0||data.frame>s.plan.frames)throw Error('Invalid continuous command acknowledgment.');
     if(data.command==='start'&&(data.frame!==0||data.state!=='playing'))throw Error('Invalid ensemble start acknowledgment.');
     if(data.command==='strike'){
      const guest=pending.guest;
      if(!guest||data.state!=='playing'||data.body!==guest.body||data.strength!==guest.strength||data.frame>=s.plan.frames-Math.round(.025*s.plan.sampleRate)||(guest.event&&guest.event.frame!==data.frame))throw Error('Invalid ensemble guest acknowledgment.');
      guest.status='accepted';guest.frame=data.frame;guests++;emit();
     }
     if(data.command==='quiet'){
      if(data.state!=='ending'||data.frame>s.plan.frames-Math.round(.025*s.plan.sampleRate)||data.frame<(s.history.at(-1)?.frame??0))throw Error('Invalid ensemble Quiet acknowledgment.');
      s.quietFrame=data.frame;emit({endingFrame:data.frame});
     }
    }
    if(data.type==='refused'&&pending.guest){if(pending.guest.event)throw Error('A refused guest was published as accepted.');pending.guest.status='refused';}
    clearTimeout(pending.timer);s.pending.delete(key);if(data.type==='refused')pending.reject(Error(data.message));else pending.resolve(data);return;
   }
   if(data.type==='origin'){
    if(s.originAudioFrame!==null||data.sampleRate!==s.plan.sampleRate||!Number.isSafeInteger(data.audioFrame)||data.audioFrame<0||!Number.isSafeInteger(data.audioFrame+s.plan.frames))throw Error('Invalid continuous audio origin.');
    s.originAudioFrame=data.audioFrame;emit({originAudioFrame:data.audioFrame,sampleRate:data.sampleRate});return;
   }
   if(data.type==='touches'){
    if(s.verifying||!Array.isArray(data.touches)||s.history.length+data.touches.length>3*4096)throw Error('Invalid ensemble touch history.');
    const indices=s.indices.slice(),matches=[],memory=s.memory.slice();let scoreIndex=s.scoreIndex,guestCursor=s.guestCursor,previous=s.history.at(-1)?.frame??0,plan=s.plan,sealed=s.sealed;
    for(const event of data.touches){
     const body=event?.body;
     if(!event||Object.keys(event).length!==6||!['frame','strength','index','origin','body','audioFrame'].every(key=>Object.hasOwn(event,key))||!Number.isInteger(body)||body<0||body>2||event.index!==indices[body]||indices[body]>=4096||!Number.isInteger(event.frame)||event.frame<previous||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1||s.originAudioFrame===null||event.audioFrame!==s.originAudioFrame+event.frame||event.frame>(s.quietFrame??s.plan.frames-Math.round(.025*s.plan.sampleRate)))throw Error('Invalid accepted ensemble touch.');
     if(s.mode==='memory'&&!sealed&&event.frame>=6*plan.sampleRate){plan=createMemoryEnsembleStudy(plan.seed,{sampleRate:plan.sampleRate,contributions:memory});sealed=true;}
     const expected=plan.events[scoreIndex];
     if(event.origin==='score'){
      if(!expected||event.body!==expected.body||event.frame!==expected.frame||event.strength!==expected.strength)throw Error('The accepted ensemble score changed.');scoreIndex++;
     }else if(event.origin==='guest'){
      if(expected?.frame<=event.frame)throw Error('A guest preceded a due ensemble score note.');
      while(s.guestCommands[guestCursor]?.status==='refused')guestCursor++;
      const guest=s.guestCommands[guestCursor++];
      if(!guest||guest.body!==body||guest.strength!==event.strength||(guest.frame!==null&&guest.frame!==event.frame))throw Error('A guest differs from its requested or acknowledged touch.');
      matches.push([guest,{body,frame:event.frame,strength:event.strength}]);
      if(s.mode==='memory'&&event.frame<6*plan.sampleRate&&memory.length<3)memory.push({body,frame:event.frame,strength:event.strength,index:event.index,origin:'guest'});
     }else throw Error('Invalid ensemble touch origin.');
     indices[body]++;previous=event.frame;
    }
    s.plan=plan;s.memory=memory;s.sealed=sealed;s.indices=indices;s.scoreIndex=scoreIndex;s.guestCursor=guestCursor;for(const [guest,event] of matches)guest.event=event;
    s.history.push(...structuredClone(data.touches));touches=s.history.length;emit({events:structuredClone(data.touches)});return;
   }
   if(data.type==='state'){
    const rank=['playing','ending','ended'].indexOf(data.state);
    if(s.verifying||rank<=s.stateRank||!Number.isInteger(data.frame)||data.frame<s.stateFrame||data.frame>s.plan.frames)throw Error('Invalid ensemble transport state.');
    s.stateRank=rank;s.stateFrame=data.frame;
    if(!s.verifying&&state!=='ending'){state=data.state==='ended'?'ending':data.state;emit();}return;
   }
   if(data.type==='finished'){
    if(s.verifying||s.guestCommands.some(guest=>guest.status==='pending'||(guest.status==='accepted'&&!guest.event)))throw Error('Incomplete guest acknowledgments or duplicate ensemble completion.');
    s.verifying=true;clearTimeout(s.watchdog);state='verifying';emit();
    s.verifyJob=(createVerifyJob??(s.mode==='memory'?createMemoryEnsembleVerifyJob:createContinuousEnsembleVerifyJob))({seed:s.plan.seed,sampleRate:s.plan.sampleRate,data,touches:s.history,originAudioFrame:s.originAudioFrame,quietFrame:s.quietFrame});
    s.verifyJob.promise.then(result=>{if(active!==s)return;s.verified=result;complete(s);},error=>fail(s,error));
    const latency=value=>Number.isFinite(value)&&value>=0?Math.min(value,.5):0;
    s.drainTimer=setTimeout(()=>{if(active!==s)return;closeAudio(s);s.drained=true;complete(s);},1000*(Math.max(.05,latency(s.context.baseLatency)+latency(s.context.outputLatency))+.025));return;
   }
   throw Error('Unexpected continuous audio message.');
  }catch(error){fail(s,error);}
 }
 async function start(seed=42,{sampleRate=48000,mode='fixed'}={}){
  if(!['fixed','memory'].includes(mode))throw Error('Choose a supported ensemble composition mode.');
  const plan=(mode==='memory'?createMemoryEnsembleStudy:createContinuousEnsembleStudy)(seed,{sampleRate});release(active);compositionMode=mode;state='preparing';touches=0;guests=0;emit();let s;
  try{
   const context=createContext(sampleRate);s={context,plan,mode,memory:[],sealed:false,indices:[0,0,0],scoreIndex:0,guestCursor:0,guestCommands:[],pendingGuests:0,stateRank:-1,stateFrame:0,pending:new Map(),nextId:0,history:[],originAudioFrame:null,quietFrame:null,audioClosed:false};active=s;
   await context.resume();if(active!==s)throw aborted();
   if(context.sampleRate!==sampleRate)throw Error('The audio context did not preserve the requested sample rate.');
   if(context.state!=='running')throw Error('Audio is interrupted.');
   context.onstatechange=()=>{if(active===s&&context.state!=='running')park('interrupted');};
   await context.audioWorklet.addModule(new URL(mode==='memory'?'./memory-ensemble-worklet.js':'./continuous-ensemble-worklet.js',import.meta.url));if(active!==s)throw aborted();
   const ready=wait(s,'ready',5000);
   s.node=createNode(context,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{seed,sampleRate,mode:mode==='memory'?'memory-ensemble':'ensemble'}});
   s.node.port.onmessage=({data})=>receive(s,data);s.node.onprocessorerror=()=>fail(s,Error('The continuous audio processor stopped.'));
   s.listening=createListeningStage(context,{db:listeningDb});s.listening.output.connect(context.destination);s.node.connect(s.listening.input);
   await ready;if(active!==s)throw aborted();await command(s,'start');if(active!==s)throw aborted();
   if(!s.verifying){state='playing';emit();s.watchdog=setTimeout(()=>fail(s,Error('The continuous performance did not finish.')),55000);}
  }catch(error){if(s&&active===s)fail(s,error);else if(!s){state='error';emit({message:error.message});}throw error;}
 }
 async function strike(body,strength=.05){
  if(!Number.isInteger(body)||body<0||body>2||![.025,.05,.1].includes(strength))throw Error('Choose a body and a soft, light or firm touch.');
  const s=active;if(!s||state!=='playing'||s.pendingGuests>=1||s.nextId>=8190)throw Error('This ensemble is not accepting another touch.');
  s.pendingGuests++;try{return await command(s,'strike',body,strength);}finally{s.pendingGuests--;}
 }
 async function quiet(){
  const s=active;if(!s)return;if(state==='preparing'){park('cancelled');return;}if(state!=='playing')return;
  if(s.context.state!=='running'){park('interrupted');return;}state='ending';emit();return command(s,'quiet');
 }
 function setListeningDb(db){listeningGain(db);if(active&&!active.audioClosed)active.listening?.setDb(db);listeningDb=db;}
 return {start,strike,quiet,park,setListeningDb,dispose(){park('idle');},time(){return active?(active.originAudioFrame===null?0:Math.max(0,Math.min(48,active.context.currentTime-active.originAudioFrame/active.plan.sampleRate))):lastFinished?lastFinished.snapshot[0].endFrame/lastFinished.records[0].sampleRate:0;},get state(){return state;},get touches(){return touches;},get guests(){return guests;},get finished(){return lastFinished?structuredClone(lastFinished):null;}};
}
