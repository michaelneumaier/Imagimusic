import {validateLivingJourneyRequest} from './journey-artifact.js';
import {createAudioRenderJob} from '../audio-render-job.js';

/** One pending film and one completed set of downloads, independent of playback. */
export function createLivingJourneyMovieSession({
 createJob=request=>createAudioRenderJob(new URL('./journey-worker.js',import.meta.url),request),
 exportMovie=async(...args)=>(await import('./journey-export.js')).exportLivingJourneyMovie(...args),
 makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),onChange=()=>{},
}={}){
 let controller=null,job=null,current=null;
 const release=result=>result?.links.forEach(link=>revokeURL(link.href));
 function cancel(){controller?.abort();job?.cancel();}
 async function prepare({request:value,reveal=true,expectedSha256=null},onProgress=()=>{}){
  if(controller)throw Error('A journey film is already being prepared.');
  const request=validateLivingJourneyRequest(value);
  if(typeof reveal!=='boolean'||(expectedSha256!==null&&(typeof expectedSha256!=='string'||!/^[a-f0-9]{64}$/.test(expectedSha256))))throw Error('Unsupported journey film options.');
  controller=new AbortController();const signal=controller.signal;
  const check=()=>{if(signal.aborted)throw new DOMException('Journey film cancelled.','AbortError');};
  const progress=text=>{if(!signal.aborted)onProgress(text);};
  try{
   onChange();check();progress('Preparing the journey soundtrack silently…');
   job=createJob(request);const artifact=await job.promise;job=null;check();
   if(expectedSha256!==null&&artifact.sha256!==expectedSha256)throw Error('This runtime did not reproduce the kept recording. Keep the original WAV; no replacement film was made.');
   const result=await exportMovie(request,artifact,{reveal,signal,onProgress:progress});check();
   const files=[['.mp4',result.blob,'Save film'],['.wav',new Blob([result.wav],{type:'audio/wav'}),'Save exact soundtrack'],['-score.json',new Blob([JSON.stringify(result.report,null,2)+'\n'],{type:'application/json'}),'Save score report'],['-film.json',new Blob([JSON.stringify(result.manifest,null,2)+'\n'],{type:'application/json'}),'Save film details']];
   const links=[];
   try{for(const [suffix,blob,label] of files)links.push({href:makeURL(blob),download:result.stem+suffix,label});check();}
   catch(error){links.forEach(link=>revokeURL(link.href));throw error;}
   const next={links,seed:request.seed,treatment:request.treatment,reveal,seconds:result.manifest.duration};
   release(current);current=next;return next;
  }finally{job=null;controller=null;onChange();}
 }
 return {prepare,cancel,get busy(){return !!controller;},get current(){return current;}};
}
