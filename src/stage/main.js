import { createDirector } from './director.js';
import { mountInspector } from './inspector.js';
import { readStagePatch } from './exchange.js';
import { DEFAULT_PATCH, MATERIALS } from '../model.js';
import { InstrumentAudio } from '../audio.js';
import { BellowsAudio } from '../bellows-audio.js';
import { collectState, traceHash } from '../state.js';
import { FrameClock, WallClock } from '../clock.js';
import { createPerformance } from './performance.js';
import { createWorld } from './world.js';
import { createProjection, stageBindings, applyStage, CAPTIONS } from './projection.js';
const $=id=>document.getElementById(id);
const audio=new InstrumentAudio();let choir=null,world=null,playing=false,origin=0,cursor=0,request=0;
let activePatch=structuredClone(DEFAULT_PATCH), importError='';
if(new URLSearchParams(location.search).get('instrument')==='lab'){try{activePatch=readStagePatch(sessionStorage);}catch(error){importError=error.message+' Using the default instrument.';}}
let performance=createPerformance(activePatch),project=createProjection(performance.patch,{performance});
let direct=createDirector(performance);
const study=new FrameClock(),live=new WallClock(()=>Math.max(0,audio.time-origin)),bindings=stageBindings({camera:true,performers:true});
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
    performance=createPerformance(activePatch,audio.context.sampleRate);project=createProjection(performance.patch,{performance});direct=createDirector(performance);
    origin=audio.time+.1;cursor=0;playing=true;study.reset();$('seek').max=performance.duration;
    $('perform').textContent='Ⅱ Pause passage';$('stage-state').textContent='PLAYING · SEED '+performance.patch.seed;$('error').textContent='';schedule();
  }catch(error){stop();$('error').textContent=error.message;}
};
$('quiet').onclick=stop;
$('seek').max=performance.duration;
$('seek').oninput=()=>{stop();study.seek(Number($('seek').value));};
$('view').onchange=()=>{ $('direction').value='manual'; if(world){world.controls.enabled=true;world.view($('view').value);$('camera-hint').textContent='DRAG TO ORBIT · SCROLL TO EXPLORE';} };
$('direction').onchange=()=>{const manual=$('direction').value==='manual';if(world)world.controls.enabled=manual;$('camera-hint').textContent=manual?'DRAG TO ORBIT · SCROLL TO EXPLORE':'SCORE CAMERA · SCRUB TO EXPLORE';};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
setInterval(schedule,25);
try{
  world=createWorld($('world'));
  const color=MATERIALS[activePatch.material].color;
  for(const body of world.garden)for(const shell of body.layers){shell.material.color.setRGB(...color.map(c=>c/255));shell.material.emissive.copy(shell.material.color);}
  stop();$('error').textContent=importError;
  const inspector=mountInspector({world,canvas:$('world'),bindings,getPatch:()=>activePatch});
  function draw(){
    const t=playing?live.time:study.time,frame=project(collectState(t,performance.snapshots));
    frame.stage.camera=direct(t,$('direction').value,{position:world.camera.position.toArray(),target:world.controls.target.toArray()});
    const applied=applyStage(frame,bindings,world);inspector.update(frame);world.render();
    $('time').textContent=t.toFixed(2)+' s';if(playing)$('seek').value=t;
    $('proof').textContent=`STATE ${traceHash(frame)} · ${applied.length} declared motion bindings · ${frame.voices.length} voices · ${frame.stage.performers.actors.length} Keepers · ${frame.stage.performers.unplanned.length} unassigned strikes`;
    requestAnimationFrame(draw);
  }
  draw();
}catch(error){$('stage-state').textContent='3D PREVIEW UNAVAILABLE';$('error').textContent=error.message+' — The instrument laboratory remains available.';}

let renderAbort=null,lastManifest=null;
function downloadArtifact(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('cancel-render').onclick=()=>{renderAbort?.abort();$('error').textContent='Cancelling · finishing any active soundtrack step…';};
$('render-manifest').onclick=()=>{if(lastManifest)downloadArtifact(new Blob([JSON.stringify(lastManifest,null,2)],{type:'application/json'}),`imagimusic-render-${lastManifest.instrument.seed}.json`);};
$('movie').onclick=async()=>{
  if(renderAbort||!world)return;stop();renderAbort=new AbortController();
  for(const id of ['perform','seek','view','direction','movie'])$(id).disabled=true;
  $('cancel-render').hidden=false;$('render-manifest').disabled=true;lastManifest=null;
  try{
    const {exportMovie}=await import('./export.js');
    const pose={position:world.camera.position.toArray(),target:world.controls.target.toArray(),mode:$('direction').value};
    const result=await exportMovie(structuredClone(activePatch),pose,{signal:renderAbort.signal,onProgress:message=>$('error').textContent=message});
    downloadArtifact(result.blob,`imagimusic-conservatory-${activePatch.seed}.mp4`);
    lastManifest=result.manifest;$('render-manifest').disabled=false;
    $('error').textContent=`Movie ready · ${result.manifest.frames} frames · 720p / 30 fps · synthesized soundtrack`;
  }catch(error){$('error').textContent=error.message;}
  finally{renderAbort=null;for(const id of ['perform','seek','view','direction','movie'])$(id).disabled=false;$('cancel-render').hidden=true;}
};
