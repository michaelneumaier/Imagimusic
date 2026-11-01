import { DEFAULT_PATCH } from '../model.js';
import { InstrumentAudio } from '../audio.js';
import { BellowsAudio } from '../bellows-audio.js';
import { collectState, traceHash } from '../state.js';
import { FrameClock, WallClock } from '../clock.js';
import { createPerformance } from './performance.js';
import { createWorld } from './world.js';
import { createProjection, stageBindings, applyStage, CAPTIONS } from './projection.js';
const $=id=>document.getElementById(id);
const audio=new InstrumentAudio();let choir=null,world=null,playing=false,origin=0,cursor=0,request=0;
let performance=createPerformance(DEFAULT_PATCH),project=createProjection(performance.patch);
const study=new FrameClock(),live=new WallClock(()=>Math.max(0,audio.time-origin)),bindings=stageBindings();
for(const caption of CAPTIONS){const p=document.createElement('p');p.className='caption';const strong=document.createElement('strong');strong.textContent=caption.label.toUpperCase()+' · ';p.append(strong,document.createTextNode(caption.text));$('captions').append(p);}
function stop(){if(playing)study.seek(Math.min(performance.duration,live.time));request++;playing=false;audio.stop();choir?.stop();$('perform').textContent='▶ Play the passage';$('stage-state').textContent='SILENT STUDY · SEED '+performance.patch.seed;}
function schedule(){
  choir?.tick();if(!playing)return;
  const now=live.time;
  while(cursor<performance.events.length&&performance.events[cursor].voice.noteOn<now+.24){
    const {family,voice}=performance.events[cursor++],when=origin+voice.noteOn;
    if(when<audio.time-.08){stop();$('error').textContent='Playback paused after a browser delay. Play starts a fresh synchronized passage.';return;}
    if(family==='bellows')choir.noteOn(voice.noteHz,performance.patch,voice.velocity,when,origin+voice.noteOff,(performance.patch.seed+voice.id*997)>>>0);
    else audio.strike(voice.slot,performance.patch,voice.velocity,when,voice.position);
  }
  if(now>=performance.duration){study.seek(performance.duration);stop();}
}
$('perform').onclick=async()=>{
  if(playing){stop();return;}const token=++request;
  try{await audio.enable();if(token!==request)return;
    choir??=new BellowsAudio(audio.context,audio.master);audio.stop();choir.stop();
    performance=createPerformance(DEFAULT_PATCH,audio.context.sampleRate);project=createProjection(performance.patch);
    origin=audio.time+.1;cursor=0;playing=true;study.reset();$('seek').max=performance.duration;
    $('perform').textContent='Ⅱ Pause passage';$('stage-state').textContent='PLAYING · SEED '+performance.patch.seed;$('error').textContent='';schedule();
  }catch(error){stop();$('error').textContent=error.message;}
};
$('quiet').onclick=stop;
$('seek').max=performance.duration;
$('seek').oninput=()=>{stop();study.seek(Number($('seek').value));};
$('view').onchange=()=>world?.view($('view').value);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
setInterval(schedule,25);
try{
  world=createWorld($('world'));stop();
  function draw(){
    const t=playing?live.time:study.time,frame=project(collectState(t,performance.snapshots));
    const applied=applyStage(frame,bindings,world);world.render();
    $('time').textContent=t.toFixed(2)+' s';if(playing)$('seek').value=t;
    $('proof').textContent=`STATE ${traceHash(frame)} · ${applied.length} declared motion bindings · ${frame.voices.length} voices`;
    requestAnimationFrame(draw);
  }
  draw();
}catch(error){$('stage-state').textContent='3D PREVIEW UNAVAILABLE';$('error').textContent=error.message+' — The instrument laboratory remains available.';}
