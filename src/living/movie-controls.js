import {createLivingRecord} from './record.js';
import {createAudioRenderJob} from '../audio-render-job.js';
import {exportLivingMovie} from './export.js';

/** Keeps the last successful film separate from the currently playable phrase. */
export function createLivingMovieControls({getSource,getOptions,canMake,onChange=()=>{}}){
 const $=id=>document.getElementById(id);let controller=null,job=null,urls=[];
 const refresh=()=>{$('make-film').disabled=!!controller||!canMake();$('cancel-film').disabled=!controller;};
 function cancel(){controller?.abort();job?.cancel();}
 $('cancel-film').addEventListener('click',cancel);
 $('make-film').addEventListener('click',async()=>{
  if($('make-film').disabled)return;
  let record;try{record=createLivingRecord(getSource(),getOptions());}catch(error){$('film-status').textContent=error.message;return;}
  controller=new AbortController();const signal=controller.signal;refresh();onChange();$('cancel-film').focus({preventScroll:true});
  try{
   $('film-status').textContent='Preparing your original phrase silently…';
   job=createAudioRenderJob(new URL('./arrangement-worker.js',import.meta.url),record.source);
   const pcm=await job.promise;job=null;
   const result=await exportLivingMovie(record,pcm,{signal,onProgress:text=>$('film-status').textContent=text});
   if(signal.aborted)throw new DOMException('Cancelled','AbortError');
   const artifacts=[['.mp4',result.blob,'Save film'],['.wav',new Blob([result.wav],{type:'audio/wav'}),'Save soundtrack'],['-recipe.json',new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),'Save recipe'],['-manifest.json',new Blob([JSON.stringify(result.manifest,null,2)],{type:'application/json'}),'Save film details']];
   const next=[];const links=[];
   try{for(const [suffix,blob,label] of artifacts){const url=URL.createObjectURL(blob);next.push(url);const a=document.createElement('a');a.href=url;a.download=result.stem+suffix;a.textContent=label;links.push(a);}}catch(error){next.forEach(URL.revokeObjectURL);throw error;}
   $('film-downloads').replaceChildren(...links);urls.forEach(URL.revokeObjectURL);urls=next;
   $('film-result').hidden=false;$('film-description').textContent=`Prepared film: ${record.source.events.length} original ${record.source.events.length===1?'touch':'touches'} · ${result.manifest.duration.toFixed(2)} seconds · ${record.cameraMotion?'camera journey':'wide still view'} · ${record.reveal?'response veils':'solid bodies'}. These downloads stay with this phrase until another film succeeds.`;
   $('film-status').textContent='Your film is ready. Save it below; nothing has played or been uploaded.';
  }catch(error){$('film-status').textContent=(error.name==='AbortError'?'Film preparation cancelled.':'The film could not be prepared. '+error.message)+' Your phrase and any previous film remain available.';}
  finally{job=null;controller=null;const focused=document.activeElement===$('cancel-film');refresh();onChange();if(focused)$('make-film').focus({preventScroll:true});}
 });
 return {get busy(){return !!controller;},refresh,cancel};
}
