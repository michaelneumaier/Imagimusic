import {createAudioRenderJob} from '../audio-render-job.js';
import {validateLivingPersonalJourneyRequest} from './personal-journey-artifact.js';

/** Owns one visit-local generated artifact and one cancellable preparation. */
export function createLivingJourneyGeneration({createJob=request=>createAudioRenderJob(new URL('./journey-worker.js',import.meta.url),request),makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),digest=bytes=>crypto.subtle.digest('SHA-256',bytes)}={}){
 let version=0,job=null,current=null;
 function cancel(){version++;job?.cancel();job=null;}
 function release(value){if(value){revokeURL(value.audioURL);revokeURL(value.reportURL);}}
 function clear(){cancel();release(current);current=null;}
 async function prepare(request,plan,expectedSha256=null){
  const personal=request?.kind==='imagimusic-living-personal-journey-request';
  if(personal)request=validateLivingPersonalJourneyRequest(request);
  cancel();const own=version,key=JSON.stringify({request,plan,expectedSha256});
  if(expectedSha256!==null&&(typeof expectedSha256!=='string'||!/^[a-f0-9]{64}$/.test(expectedSha256)))throw Error('Invalid kept journey audio identity.');
  if(current?.key===key)return current;
  const fresh=()=>{if(own!==version)throw new DOMException('Journey generation cancelled.','AbortError');};
  try{
   job=createJob(request);const artifact=await job.promise;fresh();job=null;
   const identityMatches=personal?artifact?.kind==='imagimusic-living-personal-journey-artifact'&&JSON.stringify(artifact.source)===JSON.stringify(request.source):artifact?.kind==='imagimusic-living-journey-artifact'&&artifact.seed===request.seed&&artifact.treatment===request.treatment;
   if(!identityMatches||artifact.version!==1||artifact.previewGain!==8||artifact.sampleRate!==plan.sampleRate||artifact.frames!==plan.frames||JSON.stringify(artifact.plan)!==JSON.stringify(plan)||!(artifact.wav instanceof ArrayBuffer)||artifact.wav.byteLength!==44+plan.frames*4||artifact.wav.byteLength>64*1024*1024)throw Error('Generated audio does not match the selected journey.');
   const hash=Array.from(new Uint8Array(await digest(artifact.wav)),v=>v.toString(16).padStart(2,'0')).join('');fresh();
   if(hash!==artifact.sha256)throw Error('Generated audio failed its identity check.');
   if(expectedSha256!==null&&hash!==expectedSha256)throw Error('This runtime did not reproduce the kept audio exactly. Use the kept WAV to hear that recording.');
   const {wav,...report}=artifact;
   const audioURL=makeURL(new Blob([wav],{type:'audio/wav'}));let reportURL;
   try{reportURL=makeURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));}catch(error){revokeURL(audioURL);throw error;}
   const next={key,audioURL,reportURL,...(personal?{source:artifact.source}:{seed:artifact.seed,treatment:artifact.treatment})};release(current);current=next;return next;
  }finally{if(own===version)job=null;}
 }
 return {prepare,cancel,clear};
}
