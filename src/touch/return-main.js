import {createTouchReturnSession} from './return-session.js';
import {rebuildTouchRecord} from './record.js';
import {createGroveReplay} from '../grove/replay.js';
import {createWorld} from '../stage/world.js';
import {loomSceneFrame,applyLoomScene} from '../loom/scene.js';
import {LOOM_JOURNEYS} from '../listen/journeys.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id);
let shown=null,played=null,visual=null,world=null,generation=0,closed=false;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const session=createTouchReturnSession({onChange:sync});
const replay=createGroveReplay({onChange:({state})=>{sync();if(state==='ended')status('The passage has settled. Listen again whenever you like.');if(state==='suspended')status('Audio was interrupted. Listen from start to return to the passage.');}});
function sync(){
 const busy=session.state==='preparing',ready=!!session.result;
 $('cancel').hidden=!busy;$('file').disabled=busy;
 $('listen').disabled=!ready||busy||replay.state==='preparing';$('save').disabled=!ready||busy;
 $('quiet').disabled=!['playing','preparing','suspended'].includes(replay.state);
}
function show(result){
 visual=rebuildTouchRecord(result.record).session;shown=result;played=null;
 $('passage').hidden=false;$('name').textContent=result.name;
 const record=result.record,s=record.settings;
 $('facts').textContent=`${record.events.length} ${record.events.length===1?'gesture':'gestures'} · ${result.duration.toFixed(2)} seconds · ${record.sampleRate.toLocaleString()} Hz · ${record.ended?'saved Quiet ending':'natural ending'}`;
 $('settings').textContent=`${s.frequency} Hz base tuning · ${s.detune} cents detuning · coupling ${s.coupling} · loss ${s.loss}/s. Original fixed output gain ${record.outputGain}.`;
 const match=LOOM_JOURNEYS.find(journey=>Object.keys(s).every(key=>journey.settings[key]===s[key]));
 $('play').hidden=$('play-note').hidden=!match;if(match)$('play').href=`touch.html?bridge=${encodeURIComponent(match.id)}`;
 if(!world)try{
  world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;
  world.rail.visible=false;world.loom.root.position.set(0,0,1);world.loom.root.scale.setScalar(1);world.loom.root.visible=true;
  world.camera.position.set(0,3.6,10);world.controls.target.set(0,1.1,1);world.controls.update();
 }catch{$('world').hidden=true;$('view-note').textContent='The 3D view is unavailable here. The original sound can still be played.';}
 sync();
}
$('file').onchange=async()=>{
 const file=$('file').files?.[0];$('file').value='';if(!file)return;
 const own=++generation;replay.stop();status('Rebuilding the original connection and gestures…');
 try{const result=await session.open(file);if(own!==generation)return;show(result);status('Your original passage is ready. Choose Listen when you are ready.');}
 catch(error){if(own===generation&&error.name!=='AbortError')status(error.message+(shown?' Your previous passage remains available.':''),true);}
};
$('cancel').onclick=()=>{generation++;session.cancel();status('Opening cancelled.'+(shown?' Your previous passage remains available.':''));};
$('listen').onclick=async()=>{const result=session.result;if(!result||session.state==='preparing')return;const own=generation;played=result;try{await replay.play(result.pcm);if(own===generation&&replay.state==='playing')status('Listening to your original passage.');}catch(error){if(own===generation)status(error.message,true);}};
$('quiet').onclick=()=>{replay.stop();status('Quiet. The saved passage is unchanged.');};
$('save').onclick=()=>{const result=session.result;if(!result||session.state==='preparing')return;const url=URL.createObjectURL(new Blob([stereoWav(result.pcm)],{type:'audio/wav'})),link=document.createElement('a');link.href=url;link.download='imagimusic-touch-return.wav';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();if(session.state==='preparing')$('cancel').click();replay.stop();status('Quiet.'+(shown?' Your passage is still here.':''));}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)replay.stop();});
window.addEventListener('pagehide',event=>{generation++;session.cancel();if(event.persisted){replay.park();return;}closed=true;session.dispose();replay.dispose();world?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();status(shown?'Your passage is here. Listen when you are ready.':'Choose a saved Touch passage when you are ready.');}});
function draw(){
 if(closed)return;
 if(shown){const time=played===shown?replay.time():0;
  if(world){const zoom=Math.min(1,$('world').clientWidth/Math.max(1,$('world').clientHeight)/1.5);if(world.camera.zoom!==zoom){world.camera.zoom=zoom;world.camera.updateProjectionMatrix();}applyLoomScene(loomSceneFrame(visual.visual(time),shown.record.settings),world.loom);world.render();}
  $('phase').textContent=`${replay.state==='playing'?'LISTENING':replay.state==='ended'?'SETTLED':replay.state==='suspended'?'INTERRUPTED':'READY'} · ${time.toFixed(1)} / ${shown.duration.toFixed(1)} s`;
 }
 requestAnimationFrame(draw);
}
sync();draw();
