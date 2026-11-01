import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';
import {createGroveStudyJob} from '../src/grove/render-job.js';
import {mixImpulseRecording} from '../src/touch/session.js';
import {exportGroveMovie} from '../src/grove/export.js';
const $=id=>document.getElementById(id);let controller,job,manifest,soundtrack,stem;
function save(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('wav').onclick=()=>save(soundtrack,'audio/wav',stem+'.wav');
$('manifest').onclick=()=>save(JSON.stringify(manifest,null,2),'application/json','grove-movie-smoke.json');
$('cancel').onclick=()=>{controller?.abort();job?.cancel();};
$('run').onclick=async()=>{
 controller=new AbortController();$('run').disabled=true;$('cancel').disabled=false;$('manifest').disabled=true;$('wav').disabled=true;manifest=null;
 try{
  const settings={grove:composeGrove({seed:3}),voice:DEFAULT_VOICE_CONFIG},session=createGroveVoiceSession(settings,48000);
  for(const [frame,body,position] of [[0,0,0],[21600,1,1],[43200,2,2]])session.strike({frame,body,position,velocity:.5});session.finish(96000);
  $('result').textContent='Preparing the three-position soundtrack…';job=createGroveStudyJob(settings,48000);const bank=await job.promise;job=null;
  const capture=session.snapshot(),result=await exportGroveMovie(capture,mixImpulseRecording(capture,bank),{position:[1,3.6,9.5],target:[0,2,0]},{signal:controller.signal,onProgress:text=>$('result').textContent=text});
  manifest=result.manifest;$('manifest').disabled=false;soundtrack=result.wav;stem=result.stem;$('wav').disabled=false;save(result.blob,'video/mp4','grove-movie-smoke.mp4');$('result').textContent=JSON.stringify({frames:manifest.frames,duration:manifest.duration,videoDuration:manifest.videoDuration,audioSamples:manifest.audioSamples,bytes:result.blob.size});
 }catch(error){$('result').textContent=error.name==='AbortError'?'Cancelled; no movie saved.':error.stack;}
 finally{job=null;$('run').disabled=false;$('cancel').disabled=true;}
};
