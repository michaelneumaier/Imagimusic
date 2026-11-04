import {createAudioRenderJob} from '../audio-render-job.js';
import {createTineStudyPlayer} from '../tine/study-player.js';
import {createContinuousListeningStage} from './continuous-return-session.js';
import {CONTINUOUS_TINE_RECORD_LIMIT} from './continuous-tine-record.js';
export function setupContinuousReturnReplay({elements,getSource,beforePlay,createPlayer=options=>createTineStudyPlayer({...options,createStage:createContinuousListeningStage}),createJob=text=>createAudioRenderJob(new URL('./continuous-return-audio-worker.js',import.meta.url),text),makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url)}){
 const {file,prepare,cancel,listen,quiet,audio,status,wav,json}=elements,player=createPlayer({audio});let version=0,job=null,busy=false,current=null;
 function update(){cancel.disabled=!busy;listen.disabled=busy||!current;quiet.disabled=audio.paused;}
 function stop(){version++;job?.cancel();job=null;busy=false;player.park();update();}
 async function open(read){
  beforePlay();stop();const own=version;busy=true;update();status.textContent='Reconstructing the kept performance…';
  try{
   const text=await read();if(own!==version)return;job=createJob(text);const artifact=await job.promise;if(own!==version)return;job=null;
   if(artifact?.kind!=='imagimusic-continuous-return-audio'||artifact.version!==1||!Number.isInteger(artifact.sampleRate)||artifact.sampleRate<8000||artifact.sampleRate>96000||!(artifact.wav instanceof ArrayBuffer)||!Number.isInteger(artifact.frames)||artifact.frames<1||artifact.frames>60*artifact.sampleRate||artifact.wav.byteLength!==58+artifact.frames*4||artifact.record?.kind!=='imagimusic-continuous-tine-record'||artifact.sampleRate!==artifact.record.sampleRate)throw Error('Invalid prepared continuous audio.');
   const urls=[];try{urls.push(makeURL(new Blob([artifact.wav],{type:'audio/wav'})));urls.push(makeURL(new Blob([JSON.stringify(artifact.record,null,2)+'\n'],{type:'application/json'})));}catch(error){urls.forEach(revokeURL);throw error;}
   const old=current;current={artifact,urls};audio.hidden=true;audio.removeAttribute('src');audio.load();
   wav.href=urls[0];json.href=urls[1];wav.hidden=false;json.hidden=false;old?.urls.forEach(revokeURL);
   status.textContent=`Ready, silently · ${(artifact.frames/artifact.sampleRate).toFixed(2)} seconds · ${artifact.record.events.length} touches. Choose Listen to replay.`;
  }catch(error){if(own===version&&error.name!=='AbortError')status.textContent=`Could not prepare this performance: ${error.message}`;}
  finally{if(own===version){busy=false;job=null;update();}}
 }
 file.addEventListener('change',()=>{const selected=file.files?.[0];file.value='';if(!selected)return;return open(async()=>{if(!Number.isSafeInteger(selected.size)||selected.size<1||selected.size>CONTINUOUS_TINE_RECORD_LIMIT)throw Error('Choose a performance JSON no larger than 512 KiB.');return selected.text();});});
 prepare.addEventListener('click',()=>open(()=>{const source=getSource();if(!source)throw Error('Complete a performance first, or open a saved JSON.');return JSON.stringify(source);}));
 cancel.addEventListener('click',()=>{stop();status.textContent='Preparation cancelled. The previous prepared performance is still available.';});
 listen.addEventListener('click',async()=>{
  if(busy||!current)return;beforePlay();const own=version;
  try{await player.prepare();if(own!==version)return;const played=await player.play(current.urls[0]);if(own!==version||!played)return;audio.hidden=false;status.textContent='Replaying the kept performance.';update();}catch(error){if(own===version){stop();status.textContent=`Replay could not start: ${error.message}`;}}
 });
 quiet.addEventListener('click',()=>{stop();status.textContent='Replay paused.';});
 audio.addEventListener('play',()=>{beforePlay();update();const own=version;player.resume().catch(()=>{if(own===version){stop();status.textContent='Replay was interrupted.';}});});
 for(const event of ['pause','ended'])audio.addEventListener(event,update);
 audio.addEventListener('error',()=>{stop();status.textContent='This browser could not play the float WAV. The download remains available.';});
 update();return {stop,setDb:value=>player.setDb(value),dispose(){stop();current?.urls.forEach(revokeURL);current=null;}};
}
