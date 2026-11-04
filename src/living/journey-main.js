import {createLivingJourneyStudy} from './journey-study.js';
import {createLivingConnectedJourneyStudy} from './connected-journey-study.js';
import {createTineStudyPlayer} from '../tine/study-player.js';

const $=id=>document.getElementById(id),audio=$('audio'),player=createTineStudyPlayer({audio});
let plan,url,rows=[],generation=0,starting=false;
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function update(){
 const frame=Math.round(audio.currentTime*plan.sampleRate);
 const active=plan.sections.filter(s=>frame>=s.startFrame&&frame<s.endFrame);
 rows.forEach((row,i)=>row.classList.toggle('active',frame>=plan.sections[i].startFrame&&frame<plan.sections[i].endFrame));
 $('quiet').disabled=audio.paused&&!starting;
 if(!starting)$('status').textContent=audio.error?'Audio unavailable. See the local rendering instructions below.':audio.ended?'The journey has settled.':`${audio.paused?'Paused':'Playing'} · ${clock(audio.currentTime)} · ${active.map(s=>s.name).join(' / ')||'a moment of space'}`;
}
function stop(){generation++;starting=false;player.stop();update();}
function choose(){
 generation++;starting=false;player.stop();audio.hidden=true;audio.removeAttribute('src');audio.load();
 const connected=document.querySelector('[name=shape]:checked').value==='connected',seed=Number($('seed').value);
 plan=(connected?createLivingConnectedJourneyStudy:createLivingJourneyStudy)(seed);
 url=`renders/living-journey-study/journey-${seed}${connected?'-connected':''}.wav`;
 $('download').href=url;$('report').href=url.replace(/\.wav$/,'.json');
 $('duration').textContent=clock(plan.frames/plan.sampleRate);
 $('description').textContent=connected?'One opening, five connected exchanges, one return. Each middle exchange begins while the previous sound is still ringing.':'Seven self-contained chapters. Each presents the phrase, develops it across the bodies, and returns to its own opening.';
 rows=plan.sections.map(s=>{const li=document.createElement('li'),name=document.createElement('span'),time=document.createElement('small');name.textContent=s.name;time.textContent=`${clock(s.startFrame/plan.sampleRate)}–${clock(s.endFrame/plan.sampleRate)}`;li.append(name,time);return li;});
 $('chapters').replaceChildren(...rows);$('quiet').disabled=true;$('status').textContent='Ready when you are. Playback starts only when you choose Listen.';
}
$('listen').addEventListener('click',async()=>{
 const own=++generation;starting=true;$('quiet').disabled=false;$('status').textContent='Preparing the journey…';
 try{const playing=await player.play(url);if(own!==generation||!playing)return;starting=false;audio.hidden=false;update();}
 catch(error){if(own!==generation)return;starting=false;player.stop();$('quiet').disabled=true;$('status').textContent='Playback could not start. Check the local rendering instructions below, then try Listen again.';}
});
$('quiet').addEventListener('click',stop);
$('seed').addEventListener('change',choose);
for(const input of document.querySelectorAll('[name=shape]'))input.addEventListener('change',choose);
$('level').addEventListener('input',()=>{player.setDb(Number($('level').value));$('level-value').textContent=`+${$('level').value} dB`;});
audio.addEventListener('play',()=>player.resume().catch(()=>{stop();$('status').textContent='Audio was interrupted. Choose Listen to try again.';}));
for(const event of ['timeupdate','pause','playing','ended','seeked','error'])audio.addEventListener(event,()=>{if(plan)update();});
function park(){generation++;starting=false;player.park();if(plan)update();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
choose();
