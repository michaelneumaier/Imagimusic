import {createAudioRenderJob} from '../audio-render-job.js';
import {createTineStudyPlayer} from '../tine/study-player.js';
import {validateLivingPersonalSource} from './personal-journey-study.js';
import {personalOriginalWav} from './personal-original.js';

/** Optional sound-only original; never replaces the selected journey or its files. */
export function setupPersonalOriginalListening({getSource,beforePlay,onChange=()=>{},elements,
 createPlayer=createTineStudyPlayer,createJob=source=>createAudioRenderJob(new URL('../tine/live-render-worker.js',import.meta.url),source),
 makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),
}){
 const {audio,listen,quiet,status}=elements,player=createPlayer({audio});
 let version=0,job=null,busy=false,current=null;
 function notify(){quiet.disabled=!busy&&audio.paused;onChange();}
 function stop(){const wasActive=busy||!audio.paused;version++;job?.cancel();job=null;busy=false;player.stop();if(wasActive)status.textContent='Original paused.';notify();}
 function clear(){stop();audio.hidden=true;audio.removeAttribute('src');audio.load();if(current)revokeURL(current.url);current=null;status.textContent='Hear the opening phrase at the same level as the journey opening. The ensemble stays paused.';}
 listen.addEventListener('click',async()=>{
  beforePlay();stop();const own=version;busy=true;notify();status.textContent='Preparing the opening phrase…';
  try{
   const source=validateLivingPersonalSource(getSource()),key=JSON.stringify(source);
   await player.prepare();if(own!==version)return;
   if(current?.key!==key){
    job=createJob(source);const pcm=await job.promise;if(own!==version)return;job=null;
    const wav=personalOriginalWav(pcm,source),url=makeURL(new Blob([wav],{type:'audio/wav'}));
    if(current)revokeURL(current.url);current={key,url};
   }
   const played=await player.play(current.url);if(own!==version||!played)return;
   busy=false;audio.hidden=false;status.textContent='Playing the opening phrase only. The journey and its downloads remain available.';notify();
  }catch(error){if(own!==version)return;stop();status.textContent=`The original could not play: ${error.message}`;}
 });
 quiet.addEventListener('click',()=>{stop();status.textContent='Original paused.';});
 audio.addEventListener('play',()=>{beforePlay();notify();const own=version;player.resume().catch(()=>{if(own!==version)return;stop();status.textContent='Audio was interrupted. Choose Hear the opening phrase again.';});});
 for(const event of ['pause','ended'])audio.addEventListener(event,notify);
 audio.addEventListener('ended',()=>{status.textContent='The opening has settled. Listen to the journey when you are ready.';});
 audio.addEventListener('error',()=>{stop();status.textContent='The original recording could not load. Try again.';});
 return {stop,clear,park(){stop();player.park();},setDb:value=>player.setDb(value),get active(){return busy||!audio.paused;}};
}
