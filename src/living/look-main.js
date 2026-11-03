import {LIVING_LOOKS} from './looks.js';
import {createLivingGreeting} from './greeting.js';
import {createLivingRecord} from './record.js';
import {createLivingMoviePlan} from './movie-plan.js';
import {createLivingScene} from './scene.js';
const $=id=>document.getElementById(id),audio=$('audio'),plan=createLivingMoviePlan(createLivingRecord(createLivingGreeting()));
let scene,look='original',seconds=1,raf=0,lastPaint=-Infinity,url=null,saveVersion=0,statusKey='';
function draw(){
 if(!scene)return;const frame=plan.sample(seconds);scene.arrangementFrame(frame,$('reveal').checked,true);
 $('moment').value=seconds;$('time').textContent=seconds.toFixed(1)+' seconds';const key=look+':'+frame.part;if(key!==statusKey){statusKey=key;$('status').textContent=`${LIVING_LOOKS[look].name} · ${frame.part==='answer'?'three voices':frame.part==='return'?'return':'one body'}`;}
 $('scene').setAttribute('aria-label',`${LIVING_LOOKS[look].name}: ${frame.part==='answer'?'three independent steel blades':'one steel blade'} at ${seconds.toFixed(1)} seconds. ${$('reveal').checked?'Magnified response veils shown.':'Solid bodies only.'}`);
}
function tick(stamp){raf=0;if(audio.paused)return;if(stamp-lastPaint>=1000/30){seconds=audio.currentTime;draw();lastPaint=stamp;}raf=requestAnimationFrame(tick);}
function pause(){audio.pause();cancelAnimationFrame(raf);raf=0;}
function seek(t){pause();seconds=Math.max(0,Math.min(plan.manifest.duration,t));if(audio.readyState)audio.currentTime=seconds;draw();}
try{scene=createLivingScene($('scene'),{width:1280,height:720});draw();$('save').disabled=false;}catch(error){$('status').textContent='The visual workshop could not open: '+error.message;}
$('description').textContent=LIVING_LOOKS[look].description;
for(const b of document.querySelectorAll('[data-look]'))b.addEventListener('click',()=>{look=b.dataset.look;scene?.setLook(look);$('description').textContent=LIVING_LOOKS[look].description;for(const c of document.querySelectorAll('[data-look]'))c.setAttribute('aria-pressed',String(c===b));draw();});
for(const b of document.querySelectorAll('[data-time]'))b.addEventListener('click',()=>seek(Number(b.dataset.time)));
$('moment').addEventListener('input',()=>seek(Number($('moment').value)));
$('reveal').addEventListener('change',draw);
audio.addEventListener('loadedmetadata',()=>{audio.currentTime=seconds;});
audio.addEventListener('play',()=>{if(!raf)raf=requestAnimationFrame(tick);});
audio.addEventListener('pause',()=>{cancelAnimationFrame(raf);raf=0;seconds=audio.currentTime;draw();});
audio.addEventListener('seeked',()=>{seconds=audio.currentTime;draw();});
audio.addEventListener('error',()=>{$('status').textContent='The example audio could not load. Still inspection remains available; regenerate the local arrangement study if needed.';});
$('save').addEventListener('click',()=>{const playing=!audio.paused;pause();if(playing)seconds=audio.currentTime;draw();const own=++saveVersion,name=`living-${look}-${seconds.toFixed(1)}s.png`;$('scene').toBlob(blob=>{if(own!==saveVersion)return;if(!blob){$('status').textContent='The still could not be captured.';return;}if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);$('download').href=url;$('download').download=name;$('download').textContent='Save '+name;$('download').hidden=false;},'image/png');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);

if(audio.readyState)audio.currentTime=seconds;
