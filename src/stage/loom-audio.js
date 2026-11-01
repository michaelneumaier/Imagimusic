import {createLoomRenderJob} from '../loom/render-job.js';
import {LOOM_MIX_GAIN} from './composition.js';

/** Prepare the coupled subsystem once, then start it on the ensemble's AudioContext origin. */
export async function prepareLoomAudio(performance,context,master,{signal,createJob=createLoomRenderJob}={}){
 if(!performance.loom)return null;
 const aborted=()=>new DOMException('Loom preparation cancelled','AbortError');
 if(signal?.aborted)throw aborted();
 const loom=performance.loom;
 const job=createJob({body:null,settings:loom.settings,score:loom.events.map(({time,body,velocity})=>({time,body,velocity})),sampleRate:context.sampleRate});
 const cancel=()=>job.cancel();signal?.addEventListener('abort',cancel,{once:true});
 let pcm;
 try{pcm=await job.promise;if(signal?.aborted)throw aborted();}
 finally{signal?.removeEventListener('abort',cancel);}
 const buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);
 pcm.channels.forEach((samples,channel)=>buffer.copyToChannel(samples,channel));
 let source=null,gain=null,started=false,stopped=false;
 return {
  start(origin){
   if(started||stopped)throw new Error('Loom playback can only start once');
   if(!Number.isFinite(origin)||origin<0)throw new Error('Invalid Loom playback origin');
   started=true;gain=context.createGain();gain.gain.value=LOOM_MIX_GAIN;gain.connect(master);
   source=context.createBufferSource();source.buffer=buffer;source.connect(gain);
   source.onended=()=>{source.disconnect();gain.disconnect();stopped=true;};source.start(origin);
  },
  stop(){
   if(stopped)return;stopped=true;if(!source)return;
   const time=context.currentTime;gain.gain.cancelScheduledValues(time);gain.gain.setValueAtTime(LOOM_MIX_GAIN,time);gain.gain.linearRampToValueAtTime(0,time+.025);source.stop(time+.03);
  },
 };
}
