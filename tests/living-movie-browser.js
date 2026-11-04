import {createLivingRecord} from '../src/living/record.js';
import {createTineDesign} from '../src/tine/address.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {exportLivingMovie} from '../src/living/export.js';
const $=id=>document.getElementById(id);let controller,urls=[];
const record=createLivingRecord({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:24000,strength:.1},{frame:55200,strength:.025},{frame:105600,strength:.05}],fadeStart:190800},{arrangementVersion:new URLSearchParams(location.search).get('arrangement')==='2'?2:1,presentationVersion:new URLSearchParams(location.search).get('presentation')==='3'?3:2});
$('make').onclick=async()=>{
 controller=new AbortController();$('make').disabled=true;$('cancel').disabled=false;
 try{
  const pcm=renderLivingArrangement(record.source,record.arrangementVersion),raw=new Uint8Array(pcm.frames*8),rawView=new DataView(raw.buffer);pcm.channels.forEach((c,ch)=>c.forEach((v,i)=>rawView.setFloat32((ch*pcm.frames+i)*4,v,true)));
  const result=await exportLivingMovie(record,pcm,{signal:controller.signal,onProgress:s=>{$('status').textContent=s;if($('abort-test').checked&&s.startsWith('Rendering frame 9 /'))controller.abort();}});
  $('preview').pause();$('preview').removeAttribute('src');urls.forEach(URL.revokeObjectURL);urls=[];$('files').replaceChildren();
  for(const [suffix,blob,label] of [['.f32',new Blob([raw]),'Save diagnostic Float32'],['.mp4',result.blob,'Save movie'],['.wav',new Blob([result.wav],{type:'audio/wav'}),'Save source WAV'],['.json',new Blob([JSON.stringify(result.manifest,null,2)],{type:'application/json'}),'Save manifest']]){
   const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=result.stem+suffix;a.textContent=label;$('files').append(a);
  }
  $('preview').src=urls[1];$('report').textContent=JSON.stringify({presentationVersion:result.manifest.presentationVersion,frames:result.manifest.frames,duration:result.manifest.duration,audioSamples:result.manifest.audioSamples,bytes:result.blob.size},null,2);$('status').textContent='Encoded. Preview remains paused; save files for independent inspection.';
 }catch(error){$('status').textContent=error.name==='AbortError'?'Cancelled. Previous result retained.':error.message;}
 finally{controller=null;$('make').disabled=false;$('cancel').disabled=true;}
};
$('cancel').onclick=()=>controller?.abort();
addEventListener('pagehide',()=>controller?.abort());
