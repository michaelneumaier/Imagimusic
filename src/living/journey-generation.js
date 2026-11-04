import {createAudioRenderJob} from '../audio-render-job.js';

/** Owns one visit-local generated artifact and one cancellable preparation. */
export function createLivingJourneyGeneration({createJob=request=>createAudioRenderJob(new URL('./journey-worker.js',import.meta.url),request),makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),digest=bytes=>crypto.subtle.digest('SHA-256',bytes)}={}){
 let version=0,job=null,current=null;
 function cancel(){version++;job?.cancel();job=null;}
 function release(value){if(value){revokeURL(value.audioURL);revokeURL(value.reportURL);}}
 function clear(){cancel();release(current);current=null;}
 async function prepare(request,plan){
  cancel();const own=version,key=JSON.stringify({request,plan});
  if(current?.key===key)return current;
  const fresh=()=>{if(own!==version)throw new DOMException('Journey generation cancelled.','AbortError');};
  try{
   job=createJob(request);const artifact=await job.promise;fresh();job=null;
   if(artifact?.kind!=='imagimusic-living-journey-artifact'||artifact.version!==1||artifact.seed!==request.seed||artifact.treatment!==request.treatment||artifact.previewGain!==8||artifact.sampleRate!==plan.sampleRate||artifact.frames!==plan.frames||JSON.stringify(artifact.plan)!==JSON.stringify(plan)||!(artifact.wav instanceof ArrayBuffer)||artifact.wav.byteLength!==44+plan.frames*4||artifact.wav.byteLength>64*1024*1024)throw Error('Generated audio does not match the selected journey.');
   const hash=Array.from(new Uint8Array(await digest(artifact.wav)),v=>v.toString(16).padStart(2,'0')).join('');fresh();
   if(hash!==artifact.sha256)throw Error('Generated audio failed its identity check.');
   const {wav,...report}=artifact;
   const audioURL=makeURL(new Blob([wav],{type:'audio/wav'}));let reportURL;
   try{reportURL=makeURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));}catch(error){revokeURL(audioURL);throw error;}
   const next={key,audioURL,reportURL,seed:artifact.seed,treatment:artifact.treatment};release(current);current=next;return next;
  }finally{if(own===version)job=null;}
 }
 return {prepare,cancel,clear};
}
