import {canEncodeVideo,canEncodeAudio} from '../vendor/mediabunny/mediabunny.mjs';
import {DEFAULT_PATCH} from '../src/model.js';
import {readCameraSearch} from '../src/stage/camera-link.js';
import {readCompositionSearch} from '../src/stage/composition-link.js';
import {composeConversation} from '../src/score/conversation.js';
const $=id=>document.getElementById(id);
let manifest=null;
$('manifest').onclick=()=>{if(!manifest)return;const url=URL.createObjectURL(new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='imagimusic-export-smoke.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
try{$('codecs').textContent=JSON.stringify({avc:await canEncodeVideo('avc',{width:1280,height:720,frameRate:30}),aac:await canEncodeAudio('aac',{sampleRate:48000,numberOfChannels:1})});}catch(e){$('codecs').textContent=e.message;}
$('run').onclick=async()=>{
 $('run').disabled=true;$('manifest').disabled=true;manifest=null;
 try{const {exportMovie}=await import('../src/stage/export.js');const pose={position:[9,6.5,12],target:[0,1,0],mode:new URLSearchParams(location.search).has('camera')?readCameraSearch(location.search):'follow'};
  const composition=readCompositionSearch(location.search),score=new URLSearchParams(location.search).get('conversation')==='1'?composeConversation():null;
  const result=await exportMovie(DEFAULT_PATCH,pose,{composition,score,durationLimit:3,onProgress:text=>$('result').textContent=text});
  manifest=result.manifest;$('manifest').disabled=false;
  const url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download='imagimusic-export-smoke.mp4';a.click();
  $('result').textContent=JSON.stringify({camera:result.manifest.camera.mode,frames:result.manifest.frames,duration:result.manifest.duration,bytes:result.blob.size,firstHash:result.manifest.hashes[0],lastHash:result.manifest.hashes.at(-1)});
  setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){$('result').textContent=e.stack;}finally{$('run').disabled=false;}
};
