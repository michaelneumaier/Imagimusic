import {readMidiStage,midiComposition} from '../midi/stage-transfer.js';
import {createImportedPerformance} from './imported-performance.js';
import {composeConversation} from '../score/conversation.js';
import {readCameraSearch,cameraURL} from './camera-link.js';
import {createScorePerformance,readScoreSearch,scoreURL} from './score-performance.js';
import {DEFAULT_TENSIONER} from '../fm.js';
import {prepareFMAudio} from './fm-audio.js';
import {readCompositionSearch,compositionURL,compositionPageURL} from './composition-link.js';
import {attachComposition,DEFAULT_COMPOSITION} from './composition.js';
import {prepareLoomAudio} from './loom-audio.js';
import { createStageFrames } from './frame.js';
import { mountInspector } from './inspector.js';
import { readStagePatch } from './exchange.js';
import { DEFAULT_PATCH, MATERIALS } from '../model.js';
import { InstrumentAudio } from '../audio.js';
import { BellowsAudio } from '../bellows-audio.js';
import { traceHash } from '../state.js';
import { FrameClock, WallClock } from '../clock.js';
import { createPerformance } from './performance.js';
import { createWorld } from './world.js';
import { applyStage, CAPTIONS } from './projection.js';
const $=id=>document.getElementById(id);
const audio=new InstrumentAudio();let choir=null,world=null,playing=false,origin=0,cursor=0,request=0;
let activePatch=structuredClone(DEFAULT_PATCH), importError='';
try{$('direction').value=readCameraSearch(location.search);}catch(error){importError=error.message+'. Using manual orbit.';}
if(new URLSearchParams(location.search).get('instrument')==='lab'){try{activePatch=readStagePatch(sessionStorage);}catch(error){importError=error.message+' Using the default instrument.';}}
let composition=structuredClone(DEFAULT_COMPOSITION);
try{composition=readCompositionSearch(location.search);}catch(error){importError+=(importError?' ':'')+error.message+'. Using the default ensemble.';}
let score=null;
try{score=readScoreSearch(location.search);}catch(error){importError+=(importError?' ':'')+error.message+'. Using the seeded passage.';}
let imported=null,importFailure=false;
const midiId=new URLSearchParams(location.search).get('midi');
if(midiId!==null){try{imported=readMidiStage(sessionStorage,midiId);composition=midiComposition(imported);activePatch=structuredClone(DEFAULT_PATCH);score=null;}catch(error){importFailure=true;importError=error.message;}}
const buildPerformance=(sampleRate=48000)=>imported?createImportedPerformance(activePatch,imported,composition,sampleRate):score?createScorePerformance(activePatch,score,composition,sampleRate):attachComposition(createPerformance(activePatch,sampleRate),composition);
let preparation=null,loomVoice=null,fmVoice=null;
let performance;
try{performance=buildPerformance();}
catch(error){
 if(!score&&!imported)throw error;
 if(imported){importFailure=true;imported=null;importError=error.message+' Return to the MIDI desk and use the mapping again.';}
 else importError+=(importError?' ':'')+error.message+'. Using the seeded passage.';
 score=null;performance=buildPerformance();
}
let frames=createStageFrames(performance);
const study=new FrameClock(),live=new WallClock(()=>Math.max(0,audio.time-origin)),bindings=frames.bindings;
const captions=composition.loom.enabled?[...CAPTIONS,{label:'modeled / interpreted',text:'Tension Loom is a pair of coupled resonators. Each sound channel follows one body’s modeled displacement. Width and glow amplify its response envelope; the bridge is a coupling indicator, not a measurement of energy flow.'}]:[...CAPTIONS];
if(composition.fm?.enabled)captions.push({label:'interpreted',text:'The FM tensioner enters at the time set by the score. Carriage travel follows modulation decay; halo width estimates occupied bandwidth. Slow modulation shows phase; fast modulation shows a static disc. The linkage does not simulate physical tension.'});
for(const caption of captions){const p=document.createElement('p');p.className='caption';const strong=document.createElement('strong');strong.textContent=caption.label.toUpperCase()+' · ';p.append(strong,document.createTextNode(caption.text));$('captions').append(p);}
function stop(){if(playing)study.seek(Math.min(performance.duration,live.time));request++;preparation?.abort();preparation=null;loomVoice?.stop();loomVoice=null;fmVoice?.stop();fmVoice=null;playing=false;audio.stop();choir?.stop();$('perform').textContent='▶ Play the passage';$('stage-state').textContent='SILENT STUDY · SEED '+performance.patch.seed;}
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
  if(playing||preparation){stop();return;}const token=++request;preparation=new AbortController();const signal=preparation.signal;
  $('perform').textContent='Cancel preparation';$('stage-state').textContent='PREPARING ENSEMBLE…';
  try{await audio.enable();if(token!==request)return;
    choir??=new BellowsAudio(audio.context,audio.master);audio.stop();choir.stop();
    performance=buildPerformance(audio.context.sampleRate);frames=createStageFrames(performance);
    const preparedLoom=await prepareLoomAudio(performance,audio.context,audio.master,{signal});
    if(token!==request){preparedLoom?.stop();return;}loomVoice=preparedLoom;
    const preparedFM=await prepareFMAudio(performance,audio.context,audio.master,{signal});
    if(token!==request){preparedFM?.stop();return;}fmVoice=preparedFM;preparation=null;
    origin=audio.time+.1;loomVoice?.start(origin);fmVoice?.start(origin);cursor=0;playing=true;study.reset();$('seek').max=performance.duration;
    $('perform').textContent='Ⅱ Pause passage';$('stage-state').textContent='PLAYING · SEED '+performance.patch.seed;$('error').textContent='';schedule();
  }catch(error){if(token!==request)return;stop();if(error.name!=='AbortError')$('error').textContent=error.message;}
};
$('quiet').onclick=stop;
if(imported){const option=document.createElement('option');option.value='imported';option.textContent='Imported MIDI';$('passage').append(option);}
$('passage').value=imported?'imported':score?'conversation':'seeded';
$('score-seed').value=performance.patch.seed;
$('score-tempo').value=performance.patch.tempo;$('score-tempo-value').textContent=performance.patch.tempo+' BPM';
$('character').value=score?.controls.character??'calm';$('density').value=score?.controls.density??.7;$('density-value').textContent=Math.round(Number($('density').value)*100)+'%';
$('character').disabled=!score;$('density').disabled=!score;$('score-tempo').disabled=!score;$('score-seed').disabled=!score;$('score-variation').disabled=!score;
function changeScore(){
 if($('passage').value!=='seeded'&&!$('score-seed').reportValidity())return;
 if($('passage').value==='imported')return;
 stop();const next=$('passage').value==='seeded'?null:composeConversation({seed:Number($('score-seed').value),tempo:Number($('score-tempo').value),density:Number($('density').value),character:$('character').value});
 const nextURL=new URL(scoreURL(location.href,next));nextURL.searchParams.delete('midi');location.href=nextURL.href;
}
$('passage').onchange=changeScore;$('character').onchange=changeScore;$('density').onchange=changeScore;$('score-tempo').onchange=changeScore;$('score-seed').onchange=changeScore;
$('score-variation').onclick=()=>{$('score-seed').value=(performance.patch.seed+1)>>>0;changeScore();};
$('density').oninput=()=>{$('density-value').textContent=Math.round(Number($('density').value)*100)+'%';};
$('score-tempo').oninput=()=>{$('score-tempo-value').textContent=$('score-tempo').value+' BPM';};
$('loom-enabled').checked=composition.loom.enabled;
$('loom-study').href=compositionPageURL(location.href,'loom.html',composition);
$('loom-enabled').onchange=()=>{stop();location.href=compositionURL(location.href,{...composition,loom:{...composition.loom,enabled:$('loom-enabled').checked}});};
$('fm-enabled').checked=!!composition.fm?.enabled;
$('fm-study').href=compositionPageURL(location.href,'tensioner.html',composition);
$('fm-enabled').onchange=()=>{stop();location.href=compositionURL(location.href,{...composition,version:2,fm:{settings:composition.fm?.settings??{...DEFAULT_TENSIONER},enabled:$('fm-enabled').checked}});};
$('seek').max=performance.duration;
$('seek').oninput=()=>{stop();study.seek(Number($('seek').value));};
function updateCameraMode(){const manual=$('direction').value==='manual';if(world)world.controls.enabled=manual;$('camera-hint').textContent=manual?'DRAG TO ORBIT · SCROLL TO EXPLORE':'SCORE CAMERA · SCRUB TO EXPLORE';}
// Browser form restoration may run after module initialization. The saved link
// remains authoritative when the page is shown, including back/forward restore.
window.addEventListener('pageshow',()=>{try{$('direction').value=readCameraSearch(location.search);}catch{$('direction').value='manual';}updateCameraMode();});
$('view').onchange=()=>{ $('direction').value='manual';history.replaceState(null,'',cameraURL(location.href,'manual'));updateCameraMode();if(world)world.view($('view').value);};
$('direction').onchange=()=>{history.replaceState(null,'',cameraURL(location.href,$('direction').value));updateCameraMode();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
setInterval(schedule,25);
try{
  world=createWorld($('world'));
  updateCameraMode();
  const color=MATERIALS[activePatch.material].color;
  for(const body of world.garden)for(const shell of body.layers){shell.material.color.setRGB(...color.map(c=>c/255));shell.material.emissive.copy(shell.material.color);}
  stop();$('error').textContent=importError;
  const inspector=mountInspector({world,canvas:$('world'),bindings,getPerformance:()=>performance,getPatch:()=>({...activePatch,loom:{...composition.loom.settings,score:performance.loom?.events},fm:composition.fm?.settings})});
  function draw(){
    const t=playing?live.time:study.time,frame=frames.sample(t,{mode:$('direction').value,position:world.camera.position.toArray(),target:world.controls.target.toArray()});
    const applied=applyStage(frame,frames.bindings,world);inspector.update(frame);world.render();
    $('score-readout').hidden=!frame.global.score;
    if(frame.global.score)$('score-readout').textContent=`${frame.global.score.id.toUpperCase()} · Bar ${frame.global.score.bar} · ${score.controls.character} · Density ${score.controls.density}`;
    $('fm-readout').hidden=!frame.stage.tensioner;
    if(frame.stage.tensioner)$('fm-readout').textContent=`FM carrier ${performance.fm.settings.carrierHz} Hz · Modulator ${performance.fm.core.modulatorHz.toFixed(2)} Hz · ${frame.stage.tensioner.positiveInstantaneousFrequency?'Positive instantaneous frequency':'Signed instantaneous frequency; digital FM'} · Entrance ${performance.fm.time.toFixed(2)} s`;
    $('time').textContent=t.toFixed(2)+' s';if(playing)$('seek').value=t;
    $('proof').textContent=`STATE ${traceHash(frame)} · ${applied.length} declared motion bindings · ${frame.voices.length} voices · ${frame.stage.performers.actors.length} Keepers · ${frame.stage.performers.unplanned.length} unassigned strikes · ${frame.stage.performers.actors.filter(a=>a.unreachable).length} unreachable arms`;
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
  for(const id of ['perform','seek','view','direction','movie','loom-enabled','fm-enabled','passage','character','density','score-tempo','score-seed','score-variation'])$(id).disabled=true;
  $('cancel-render').hidden=false;$('render-manifest').disabled=true;lastManifest=null;
  try{
    const {exportMovie}=await import('./export.js');
    const pose={position:world.camera.position.toArray(),target:world.controls.target.toArray(),mode:$('direction').value};
    const result=await exportMovie(structuredClone(activePatch),pose,{composition,score,imported,signal:renderAbort.signal,onProgress:message=>$('error').textContent=message});
    downloadArtifact(result.blob,`imagimusic-conservatory-${performance.patch.seed}.mp4`);
    lastManifest=result.manifest;$('render-manifest').disabled=false;
    $('error').textContent=`Movie ready · ${result.manifest.frames} frames · 720p / 30 fps · synthesized soundtrack`;
  }catch(error){$('error').textContent=error.message;}
  finally{renderAbort=null;for(const id of ['perform','seek','view','direction','movie','loom-enabled','fm-enabled','passage','character','density','score-tempo','score-seed','score-variation'])$(id).disabled=false;$('cancel-render').hidden=true;$('character').disabled=!score;$('density').disabled=!score;$('score-tempo').disabled=!score;$('score-seed').disabled=!score;$('score-variation').disabled=!score;lockImportedControls();}
};

function lockImportedControls(){
 if(imported||importFailure){$('loom-enabled').disabled=true;$('fm-enabled').disabled=true;}
 if(importFailure){$('perform').disabled=true;$('movie').disabled=true;$('stage-state').textContent='MIDI PASSAGE UNAVAILABLE';}
}
lockImportedControls();
if(imported){const note=document.createElement('p');note.textContent=`Imported MIDI: ${imported.source.name} · ${performance.mappingReport.onsets} entrances. Instrument assignments and timing come from the MIDI desk. This passage is stored only in this browser session. Return to the MIDI desk to change its mapping.`;const link=document.createElement('a');link.href='midi.html';link.textContent=' Open MIDI desk';note.append(link);$('captions').prepend(note);}
