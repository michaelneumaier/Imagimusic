import {createTensionerRenderJob} from '../tensioner/render-job.js';
import {FM_MIX_GAIN} from './composition.js';

/** Prepare the featured tone once, then start it on the ensemble's AudioContext origin. */
export async function prepareFMAudio(performance,context,master,{signal,createJob=createTensionerRenderJob}={}){
 if(!performance.fm)return null;
 const aborted=()=>new DOMException('FM preparation cancelled','AbortError');
 if(signal?.aborted)throw aborted();
 const fm=performance.fm;
 if(!Number.isFinite(fm.time)||fm.time<0)throw new Error('Invalid FM entrance');
 const job=createJob({settings:fm.settings,sampleRate:context.sampleRate});
 const cancel=()=>job.cancel();signal?.addEventListener('abort',cancel,{once:true});
 let pcm;
 try{pcm=await job.promise;if(signal?.aborted)throw aborted();}
 finally{signal?.removeEventListener('abort',cancel);}
 const buffer=context.createBuffer(1,pcm.samples.length,pcm.sampleRate);
 buffer.copyToChannel(pcm.samples,0);
 let source=null,gain=null,started=false,stopped=false;
 return {
  start(origin){
   if(started||stopped)throw new Error('FM playback can only start once');
   if(!Number.isFinite(origin)||origin<0)throw new Error('Invalid FM playback origin');
   started=true;gain=context.createGain();gain.gain.value=FM_MIX_GAIN;gain.connect(master);
   source=context.createBufferSource();source.buffer=buffer;source.connect(gain);
   source.onended=()=>{source.disconnect();gain.disconnect();stopped=true;};source.start(origin+fm.time);
  },
  stop(){
   if(stopped)return;stopped=true;if(!source)return;
   const time=context.currentTime;gain.gain.cancelScheduledValues(time);gain.gain.setValueAtTime(FM_MIX_GAIN,time);gain.gain.linearRampToValueAtTime(0,time+.025);source.stop(time+.03);
  },
 };
}
