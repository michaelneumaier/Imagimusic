import {createPoweredEngine,createForceSequence,contactStateKey} from '../rest/powered-engine.js';
import {createContactEventQueue} from './contact-events.js';
/** One source-only encounter. Absolute transport frames are acknowledged; the
 * driver and saved ending use frames relative to origin. No model preparation. */
export function createPoweredProcessor({recipe,driver,originFrame=0,quietFrame,fadeFrames,events=[]}){
 if(recipe.zones.length!==2||recipe.strengths.length!==1||recipe.strengths[0].name!=='c1'||recipe.strengths[0].c!==1)throw new Error('Powered encounter requires two zones and the single c1 contact coefficient');
 const sr=recipe.sampleRate;
 for(const [name,v] of Object.entries({originFrame,quietFrame,fadeFrames}))if(!Number.isSafeInteger(v)||v<(name==='originFrame'?0:1))throw new Error(`Invalid ${name}`);
 if(driver.startFrame!==0||!Number.isSafeInteger(driver.forcedFrames)||driver.forcedFrames<1||driver.forcedFrames>quietFrame||!Number.isFinite(driver.amplitude)||driver.amplitude<0||!Number.isFinite(driver.frequencyHz)||driver.frequencyHz<=0||driver.frequencyHz>=sr/2)throw new Error('Invalid encounter driver');
 if(driver.body!==recipe.driver.body||driver.position!==recipe.driver.position)throw new Error('Driver direction differs from recipe');
 const engine=createPoweredEngine(recipe),force=createForceSequence(driver),sample=new Float64Array(2),queue=createContactEventQueue({capacity:1025,maxEvents:4097}),commands=new Map(),contacts=Array(recipe.bodies).fill(null),messages=[];
 let ending=null,finished=false,started=false,starts=0,lastEnd=-1,zone=null;
 const free=contactStateKey(contacts),keys=recipe.zones.map((_,z)=>{const list=contacts.slice();list[driver.body]={zone:z,strength:0};return contactStateKey(list);});
 function setContact(next){zone=next;engine.setContacts(next===null?free:keys[next]);}
 function put(event){queue.enqueue(event.id,event.frame);commands.set(event.id,{...event});}
 put({id:'$powered-auto-quiet',kind:'quiet',frame:originFrame+quietFrame});
 function enqueue(list){
  if(!Array.isArray(list))throw new Error('Commands must be an array');
  for(const event of list){
   if(!event||typeof event.id!=='string'||event.id.startsWith('$powered-'))throw new Error('Invalid or reserved command identity');
   if(event.kind!=='quiet'&&(event.kind!=='contact'||(event.zone!==null&&event.zone!==0&&event.zone!==1)))throw new Error('Only two contact zones, lift and Quiet are accepted');
   if(queue.pending>=1024||queue.scheduled>=4096)throw new Error('Encounter input capacity exceeded');
   put(event);
  }
 }
 enqueue(events);
 function apply(ack){
  const event=commands.get(ack.id);commands.delete(ack.id);let accepted=true,reason;
  if(ending){accepted=false;reason='ended';}
  else if(event.kind==='quiet'){ending={frame:ack.appliedFrame-originFrame,fadeFrames};setContact(null);}
  else if(event.zone!==null&&starts>=256){accepted=false;reason='contact-limit';}
  else{if(event.zone!==null)starts++;setContact(event.zone);}
  messages.push({type:'processed',...ack,event,accepted,...(reason?{reason}:{}),relativeFrame:ack.appliedFrame-originFrame});
 }
 function process(channels,startFrame){
  if(channels.length!==2||channels[0].length!==channels[1].length)throw new Error('Stereo block required');
  if(!Number.isSafeInteger(startFrame)||startFrame<0||startFrame<lastEnd)throw new Error('Audio clock cannot move backwards');
  if(lastEnd>=0&&startFrame!==lastEnd)throw new Error('Audio blocks must be contiguous');
  if(lastEnd<0&&startFrame>originFrame)throw new Error('Encounter origin precedes its first audio block');
  lastEnd=startFrame+channels[0].length;
  for(const ch of channels)ch.fill(0);
  for(let i=0;i<channels[0].length;i++){
   const absolute=startFrame+i,relative=absolute-originFrame;
   if(finished||relative<0)continue;
   if(!started){started=true;messages.push({type:'started',frame:absolute,originFrame});}
   if(ending&&relative>=ending.frame+fadeFrames){finished=true;messages.push({type:'finished',frame:absolute,originFrame,ended:{...ending},driver:{...driver,forcedFrames:Math.min(driver.forcedFrames,ending.frame)}});continue;}
   queue.applyThrough(absolute,apply);
   const fade=ending?Math.max(0,1-(relative-ending.frame)/fadeFrames):1;
   engine.read(sample);
   for(let ch=0;ch<2;ch++){const value=Math.fround(sample[ch]);if(!Number.isFinite(value))throw new Error('Non-finite powered output');channels[ch][i]=value*fade;}
   engine.step(ending?0:force.next());
  }
  return !finished;
 }
 return {enqueue,process,drain(){return messages.splice(0);},get finished(){return finished;},snapshot(){return {state:engine.state,key:engine.key,zone,originFrame,ended:ending?{...ending}:null};}};
}
