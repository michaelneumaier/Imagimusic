/** Finished-capture movie workflow. Rendering owns a snapshot; it never mutates playback. */
export function bindGroveMovieControls({getSource}){
 const $=id=>document.getElementById(id),urls=[];let ready=false,controller=null;
 const refresh=()=>{$('movie').disabled=!ready||!!controller;$('movie-cancel').hidden=!controller;};
 function clearResult(){const video=$('movie-preview');video.pause();video.removeAttribute('src');video.load();for(const url of urls)URL.revokeObjectURL(url);urls.length=0;$('movie-output').hidden=true;}
 function link(id,data,type,name){const url=URL.createObjectURL(new Blob([data],{type}));urls.push(url);const a=$(id);a.href=url;a.download=name;return url;}
 $('movie').onclick=async()=>{
  if(!ready||controller)return;
  const own=new AbortController();controller=own;refresh();$('movie-status').textContent='Preparing your film…';
  try{
   // Capture before the first await so later playing/configuration cannot alter this film.
   const {recording,pcm,camera}=getSource();
   const {exportGroveMovie}=await import('./export.js');
   const result=await exportGroveMovie(recording,pcm,camera,{signal:own.signal,onProgress:text=>{if(controller===own)$('movie-status').textContent=text;}});
   if(own.signal.aborted)return;clearResult();
   const url=link('movie-download',result.blob,'video/mp4',result.stem+'.mp4');link('movie-wav',result.wav,'audio/wav',result.stem+'.wav');link('movie-manifest',JSON.stringify(result.manifest,null,2),'application/json',result.stem+'-movie.json');
   $('movie-preview').src=url;$('movie-output').hidden=false;$('movie-caption').textContent=`Grove ${result.manifest.capture.grove.seed} · ${result.manifest.presentation.voice} · ${result.manifest.duration.toFixed(1)} seconds`;
   $('movie-status').textContent='Your film is ready. Preview it here, then save the files you want.';
  }catch(error){$('movie-status').textContent=error.name==='AbortError'?'Film cancelled. Your passage is still here.':`The film could not finish: ${error.message}`;}
  finally{if(controller===own)controller=null;refresh();}
 };
 $('movie-cancel').onclick=()=>{if(!controller)return;controller.abort();$('movie-status').textContent='Cancelling the film…';};
 return {setReady(value){ready=value;refresh();},cancel(){controller?.abort();},dispose(){controller?.abort();clearResult();}};
}
