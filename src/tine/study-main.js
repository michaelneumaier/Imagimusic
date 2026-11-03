import {createTineStudyPlayer} from './study-player.js';
const audio=document.getElementById('player'),status=document.getElementById('status'),level=document.getElementById('listening-level'),reading=document.getElementById('listening-reading');
const player=createTineStudyPlayer({audio});let generation=0;
audio.addEventListener('play',()=>player.resume().catch(error=>{audio.pause();status.textContent=error.message;}));
level.addEventListener('input',()=>{player.setDb(Number(level.value));reading.textContent=`+${level.value} dB · shared by every ${reading.dataset.unit??'body'}`;});
for(const button of document.querySelectorAll('[data-audio]'))button.addEventListener('click',async()=>{
 const own=++generation;status.textContent='Selected: '+button.dataset.label;
 try{await player.play(button.dataset.file);}catch(error){if(own===generation)status.textContent='Playback did not start: '+error.message;}
});
function park(){generation++;player.park();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
