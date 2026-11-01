import {createTouchSession,renderTouchRecording} from './session.js';
import {createLoomRenderJob} from '../loom/render-job.js';
function prepareBank(settings,sampleRate){
 const jobs=[0,1].map(body=>createLoomRenderJob({settings,body:null,score:[{time:0,body,velocity:1}],sampleRate}));
 return {promise:Promise.all(jobs.map(job=>job.promise)),cancel(){jobs.forEach(job=>job.cancel());}};
}
export function scheduleTouchImpulse(context,buffer,master,{when,velocity,onended=()=>{}}){
 const node=context.createBufferSource(),gain=context.createGain();node.buffer=buffer;gain.gain.value=velocity;node.connect(gain);gain.connect(master);
 node.onended=()=>{node.disconnect();gain.disconnect();onended(node);};node.start(when);return node;
}
export function scheduleTouchFade(context,master,when,fadeFrames){master.gain.setValueAtTime(1,when);master.gain.linearRampToValueAtTime(0,when+fadeFrames/context.sampleRate);}

/** Each scheduled buffer is one impulse; all share a fixed-gain output bus. */
export function createTouchTransport({createContext=()=>new AudioContext(),prepare=prepareBank,onChange=()=>{}}={}){
 let context,session,bank,buffers,master,origin=null,state='idle',token=0,job,settings;
 const sources=new Map();
 const emit=()=>onChange({state,recording:session?.snapshot()??null});
 function time(){if(origin===null)return 0;const raw=Math.max(0,context.currentTime-origin),end=session.snapshot().ended;return end?Math.min(raw,(end.frame+end.fadeFrames)/context.sampleRate):raw;}
 function quiet(){
  if(!context||!master||!session)return;
  if(origin!==null&&!session.snapshot().ended){
   const frame=Math.max(0,Math.ceil((context.currentTime-origin)*context.sampleRate));session.finish(frame);
   const when=origin+frame/context.sampleRate;
   scheduleTouchFade(context,master,when,session.snapshot().ended.fadeFrames);
   for(const node of sources.keys())node.stop(when+.03);
   state='ended';emit();
  }
 }
 function cancel(){token++;job?.cancel();job=null;quiet();}
 function fresh(){
  quiet();if(master&&![...sources.values()].includes(master))master.disconnect();session=createTouchSession(settings,context.sampleRate);origin=null;
  master=context.createGain();master.connect(context.destination);state='ready';emit();
 }
 async function enable(nextSettings){
  cancel();const own=token;settings=structuredClone(nextSettings);state='preparing';emit();
  try{
   context??=createContext();await context.resume();if(own!==token)return;
   job=prepare(settings,context.sampleRate);const result=await job.promise;if(own!==token)return;job=null;
   bank=result;buffers=bank.map(pcm=>{const buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((values,c)=>buffer.copyToChannel(values,c));return buffer;});fresh();
  }catch(error){if(own!==token)return;job=null;state='error';emit();throw error;}
 }
 function strike(body,velocity){
  if(!['ready','playing'].includes(state))return {accepted:false,reason:'not-ready'};
  if(context.state==='suspended')return {accepted:false,reason:'suspended'};
  const scheduled=Math.ceil((context.currentTime+.025)*context.sampleRate)/context.sampleRate;
  origin??=scheduled;
  const frame=Math.max(0,Math.round((scheduled-origin)*context.sampleRate)),result=session.strike({frame,body,velocity});
  if(!result.accepted)return result;
  const bus=master,node=scheduleTouchImpulse(context,buffers[body],bus,{when:origin+frame/context.sampleRate,velocity,onended(node){sources.delete(node);if((bus!==master||state==='ended')&&![...sources.values()].includes(bus))bus.disconnect();}});sources.set(node,bus);
  state='playing';emit();return result;
 }
 function newPassage(){if(!bank||state==='preparing')return;fresh();}
 function recording(){return session?.snapshot()??null;}
 function saveAudio(){if(!bank||!session)throw new Error('Prepare the instrument first');return renderTouchRecording(session.snapshot(),bank);}
 function dispose(){cancel();context?.close();}
 return {enable,strike,quiet,newPassage,time,recording,saveAudio,dispose,get state(){return state;},get session(){return session;}};
}
