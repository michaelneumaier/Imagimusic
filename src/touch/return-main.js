import {createTouchReturnSession} from './return-session.js';
import {rebuildTouchRecord} from './record.js';
import {createGroveReplay} from '../grove/replay.js';
import {createWorld} from '../stage/world.js';
import {loomSceneFrame,applyLoomScene} from '../loom/scene.js';
import {LOOM_JOURNEYS} from '../listen/journeys.js';
import {createInverseJobs} from '../inverse/jobs.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id);
let shown=null,played=null,visual=null,world=null,generation=0,closed=false;
let comparison=null,comparisonBusy=false,comparisonGeneration=0;
const comparisonJobs=createInverseJobs({makeWorker:()=>new Worker(new URL('./comparison-worker.js',import.meta.url),{type:'module'})});
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const session=createTouchReturnSession({onChange:sync});
const replay=createGroveReplay({onChange:({state})=>{sync();if(state==='ended')status('The passage has settled. Listen again whenever you like.');if(state==='suspended')status('Audio was interrupted. Listen from start to return to the passage.');}});
function sync(){
 const opening=session.state==='preparing',busy=opening||comparisonBusy,ready=!!session.result;
 $('cancel').hidden=!opening;$('file').disabled=opening;
 $('target').disabled=busy;$('prepare-comparison').disabled=!ready||busy;
 $('cancel-comparison').hidden=!comparisonBusy;$('listen-comparison').disabled=!comparison||busy||replay.state==='preparing';
 $('listen').disabled=!ready||busy||replay.state==='preparing';$('save').disabled=!ready||busy;
 $('quiet').disabled=!['playing','preparing','suspended'].includes(replay.state);
}
function show(result){
 visual=rebuildTouchRecord(result.record).session;shown=result;played=null;
 $('passage').hidden=false;$('name').textContent=result.name;
 $('version').textContent=result.targetId?`COMPARISON · ${result.targetTitle}`:'THE ORIGINAL CONNECTION';
 $('save').textContent=result.targetId?`Keep ${result.targetTitle} WAV ↓`:'Keep original WAV ↓';
 const record=result.record,s=record.settings;
 $('facts').textContent=`${record.events.length} ${record.events.length===1?'gesture':'gestures'} · ${result.duration.toFixed(2)} seconds · ${record.sampleRate.toLocaleString()} Hz · ${record.ended?'saved Quiet ending':'natural ending'}`;
 $('settings').textContent=`${s.frequency} Hz base tuning · ${s.detune} cents detuning · coupling ${s.coupling} · loss ${s.loss}/s. Fixed output gain ${record.outputGain}; model pickup scale ${result.pickupScale.toPrecision(6)}.`;
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
 const own=++generation;cancelComparison();replay.stop();status('Rebuilding the original connection and gestures…');
 try{const result=await session.open(file);if(own!==generation)return;comparison=null;$('changes').textContent='';$('comparison-status').textContent='Preparation is silent.';$('listen-comparison').textContent='Listen to comparison ↗';
 for(const option of $('target').options){const target=LOOM_JOURNEYS.find(j=>j.id===option.value);option.disabled=Object.keys(result.record.settings).every(key=>target.settings[key]===result.record.settings[key]);}
 $('target').value=Array.from($('target').options).find(option=>!option.disabled).value;show(result);status('Your original passage is ready. Choose Listen when you are ready.');}
 catch(error){if(own===generation&&error.name!=='AbortError')status(error.message+(shown?' Your previous passage remains available.':''),true);}
};
$('cancel').onclick=()=>{generation++;session.cancel();status('Opening cancelled.'+(shown?' Your previous passage remains available.':''));};
async function listenTo(result){
 if(!result||session.state==='preparing'||comparisonBusy)return;const own=generation;replay.stop();show(result);played=result;
 try{await replay.play(result.pcm);if(own===generation&&replay.state==='playing')status(result.targetId?`Listening to the ${result.targetTitle} comparison.`:'Listening to your original passage.');}catch(error){if(own===generation)status(error.message,true);}
}
$('listen').onclick=()=>listenTo(session.result);
$('listen-comparison').onclick=()=>listenTo(comparison);
function cancelComparison(){comparisonGeneration++;comparisonJobs.cancel();comparisonBusy=false;sync();}
for(const journey of LOOM_JOURNEYS){const option=document.createElement('option');option.value=journey.id;option.textContent=journey.title;$('target').append(option);}
$('target').onchange=()=>{cancelComparison();$('comparison-status').textContent='Choose Prepare to try this connection. Any previous comparison remains available under its own name.';};
$('cancel-comparison').onclick=()=>{cancelComparison();$('comparison-status').textContent='Comparison cancelled. Your prepared versions are unchanged.';};
$('prepare-comparison').onclick=async()=>{
 const original=session.result;if(!original||session.state==='preparing'||comparisonBusy)return;
 cancelComparison();const own=comparisonGeneration;comparisonBusy=true;replay.stop();sync();$('comparison-status').textContent='Preparing the same gestures in another connection…';
 try{const result=await comparisonJobs.run({record:original.record,targetId:$('target').value});if(own!==comparisonGeneration)return;
  comparison={...result,name:original.name};comparisonBusy=false;show(comparison);
  $('listen-comparison').textContent=`Listen to ${comparison.targetTitle} ↗`;
  $('changes').textContent=comparison.changes.map(change=>`${change.parameter}: ${change.from} → ${change.to}`).join(' · ')+`. Model pickup scale: ${comparison.sourcePickupScale.toPrecision(6)} → ${comparison.pickupScale.toPrecision(6)}.`;
  $('comparison-status').textContent=`${comparison.targetTitle} is ready. Nothing has played. Choose either version to listen.`;status('Showing the comparison. Your original remains available.');
 }catch(error){if(own===comparisonGeneration&&error.name!=='AbortError')$('comparison-status').textContent=error.message+' Your prepared versions remain available.';}
 finally{if(own===comparisonGeneration){comparisonBusy=false;sync();}}
};
$('quiet').onclick=()=>{replay.stop();status('Quiet. The saved passage is unchanged.');};
$('save').onclick=()=>{const result=shown;if(!result||session.state==='preparing'||comparisonBusy)return;const url=URL.createObjectURL(new Blob([stereoWav(result.pcm)],{type:'audio/wav'})),link=document.createElement('a');link.href=url;link.download=result.targetId?`imagimusic-touch-${result.targetId}-comparison.wav`:'imagimusic-touch-return.wav';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();if(session.state==='preparing')$('cancel').click();if(comparisonBusy)$('cancel-comparison').click();replay.stop();status('Quiet.'+(shown?' Your passage is still here.':''));}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)replay.stop();});
window.addEventListener('pagehide',event=>{generation++;session.cancel();cancelComparison();if(event.persisted){replay.park();return;}closed=true;session.dispose();replay.dispose();world?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();status(shown?'Your passage is here. Listen when you are ready.':'Choose a saved Touch passage when you are ready.');}});
function draw(){
 if(closed)return;
 if(shown){const time=played===shown&&!['preparing','error'].includes(replay.state)?replay.time():0;
  if(world){const zoom=Math.min(1,$('world').clientWidth/Math.max(1,$('world').clientHeight)/1.5);if(world.camera.zoom!==zoom){world.camera.zoom=zoom;world.camera.updateProjectionMatrix();}applyLoomScene(loomSceneFrame(visual.visual(time),shown.record.settings),world.loom);world.render();}
  $('phase').textContent=`${replay.state==='playing'?'LISTENING':replay.state==='ended'?'SETTLED':replay.state==='suspended'?'INTERRUPTED':'READY'} · ${time.toFixed(1)} / ${shown.duration.toFixed(1)} s`;
 }
 requestAnimationFrame(draw);
}
sync();draw();
