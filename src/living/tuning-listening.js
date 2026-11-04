import {createTineStudyPlayer} from '../tine/study-player.js';

/** Optional prepared comparison. Its audio does not drive the journey scene. */
export function setupLivingTuningListening({beforePlay,createPlayer=createTineStudyPlayer}){
 const $=id=>document.getElementById(id),audio=$('tuning-audio');
 const player=createPlayer({audio});
 let version=0;
 function stop(){version++;player.stop();}
 function choose(){
  stop();audio.hidden=true;audio.removeAttribute('src');audio.load();
  const stem=`renders/living-tuning-study/tuning-${$('tuning-seed').value}-${$('tuning-family').value}`;
  $('tuning-download').href=stem+'.wav';$('tuning-report').href=stem+'.json';
  $('tuning-status').textContent='Ready. This sound-only comparison does not animate the journey above.';
 }
 $('tuning-listen').addEventListener('click',async()=>{
  beforePlay();stop();const own=version;
  $('tuning-status').textContent='Opening the selected body comparison…';
  try{
   const played=await player.play($('tuning-download').href);
   if(own!==version||!played)return;
   audio.hidden=false;$('tuning-status').textContent='Playing the same score through the selected body family.';
  }catch(error){if(own!==version)return;stop();$('tuning-status').textContent='Audio could not start. Try again, or prepare the local comparison files using the command below.';}
 });
 $('tuning-quiet').addEventListener('click',()=>{stop();$('tuning-status').textContent='Paused. The recording remains available below.';});
 for(const id of ['tuning-seed','tuning-family'])$(id).addEventListener('change',choose);
 audio.addEventListener('play',()=>{beforePlay();player.resume().catch(()=>{stop();$('tuning-status').textContent='Audio was interrupted. Choose Listen to try again.';});});
 audio.addEventListener('ended',()=>{$('tuning-status').textContent='The phrase has returned home.';});
 audio.addEventListener('error',()=>{$('tuning-status').textContent='The recording could not load. See the local preparation command below.';});
 function park(){stop();player.park();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});
 window.addEventListener('pagehide',park);
 choose();
 return {stop,setDb:value=>player.setDb(value)};
}
