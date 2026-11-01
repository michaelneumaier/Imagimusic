import {canEncodeVideo,canEncodeAudio} from '../vendor/mediabunny/mediabunny.mjs';
import {DEFAULT_PATCH} from '../src/model.js';
const $=id=>document.getElementById(id);
try{$('codecs').textContent=JSON.stringify({avc:await canEncodeVideo('avc',{width:1280,height:720,frameRate:30}),aac:await canEncodeAudio('aac',{sampleRate:48000,numberOfChannels:1})});}catch(e){$('codecs').textContent=e.message;}
$('run').onclick=async()=>{
 $('run').disabled=true;
 try{const {exportMovie}=await import('../src/stage/export.js');const pose={position:[9,6.5,12],target:[0,1,0]};
  const result=await exportMovie(DEFAULT_PATCH,pose,{durationLimit:3,onProgress:text=>$('result').textContent=text});
  const url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download='imagimusic-export-smoke.mp4';a.click();
  $('result').textContent=JSON.stringify({frames:result.manifest.frames,duration:result.manifest.duration,bytes:result.blob.size,firstHash:result.manifest.hashes[0],lastHash:result.manifest.hashes.at(-1)});
  setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){$('result').textContent=e.stack;}finally{$('run').disabled=false;}
};
