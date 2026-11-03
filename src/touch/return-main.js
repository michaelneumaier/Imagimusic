import {createTouchView} from './view-framing.js';
import {touchReturnKeepNames} from './keep-name.js';
import {touchConnectionHref} from './connection-link.js';
import {createTouchReturnSession} from './return-session.js';
import {rebuildTouchRecord} from './record.js';
import {createGroveReplay} from '../grove/replay.js';
import {createWorld} from '../stage/world.js';
import {loomSceneFrame,applyLoomScene} from '../loom/scene.js';
import {LOOM_JOURNEYS} from '../listen/journeys.js';
import {createInverseJobs} from '../inverse/jobs.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id);
let pictureView,focusView='both';
let shown=null,played=null,visual=null,world=null,generation=0,closed=false;
let comparison=null,comparisonBusy=false,comparisonGeneration=0;
const comparisonJobs=createInverseJobs({makeWorker:()=>new Worker(new URL('./comparison-worker.js',import.meta.url),{type:'module'})});
$('still-picture').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function describeView(){$('world').setAttribute('aria-label',focusView!=='both'?`Close view of the ${focusView} body. ${$('still-picture').checked?'Still picture.':visual?.visual(0).averaged?'Averaged modeled envelope.':'Modeled displacement envelope.'} Both bodies remain audible.`:$('still-picture').checked?'A still view of two bodies.':'Two bodies following the saved passage’s modeled vibration envelopes.');if($('world').hidden)return;$('view-note').textContent=$('still-picture').checked?'A still picture. Sound and playback timing are unchanged; vibration and striker animation are hidden.':shown?.record.settings.coupling===0?'Coupling is zero: each body responds independently. Width and glow reveal modeled envelopes.':visual?.visual(0).averaged?'Fast beating: width and glow show averaged modeled envelopes, not each beat. The bridge indicates connection, not energy flow.':'Width and glow reveal amplified vibration envelopes. The bridge indicates connection; it does not show energy moving between bodies.';}
$('still-picture').onchange=describeView;describeView();
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{
 focusView=button.dataset.view;describeView();
 for(const choice of document.querySelectorAll('[data-view]'))choice.setAttribute('aria-pressed',String(choice===button));
 $('focus-note').textContent=focusView==='both'?'Both bodies in view.':`Close view of the ${focusView} body. Both bodies remain audible; the saved passage is unchanged.`;
};
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const session=createTouchReturnSession({onChange:sync});
const replay=createGroveReplay({onChange:({state})=>{sync();if(state==='ended')status('The passage has settled. Listen again whenever you like.');if(state==='suspended')status('Audio was interrupted. Listen from start to return to the passage.');}});
function sync(){
 const opening=session.state==='preparing',busy=opening||comparisonBusy,ready=!!session.result;
 $('cancel').hidden=!opening;$('file').disabled=opening;
 $('target').disabled=busy;$('prepare-comparison').disabled=!ready||busy;
 $('cancel-comparison').hidden=!comparisonBusy;$('listen-comparison').disabled=!comparison||busy||replay.state==='preparing';
 $('listen').disabled=!ready||busy||replay.state==='preparing';$('save').disabled=$('save-gestures').disabled=!ready||busy;
 $('quiet').disabled=!['playing','preparing','suspended'].includes(replay.state);
}
function show(result){
 visual=rebuildTouchRecord(result.record).session;shown=result;played=null;
 $('passage').hidden=false;$('name').textContent=result.name;
 $('version').textContent=result.targetId?`COMPARISON · ${result.targetTitle}`:'THE ORIGINAL CONNECTION';
 $('save').textContent=result.targetId?`Keep ${result.targetTitle} WAV ↓`:'Keep original WAV ↓';
 $('save-gestures').textContent=result.targetId?`Keep ${result.targetTitle} gestures ↓`:'Keep original gestures ↓';
 $('keep-note').textContent=result.targetId?'The gesture file reopens this connection as a standalone passage. It does not include the original or comparison history; keep your original file separately.':'The gesture file keeps this passage for another visit. Open it here to return to its sound and picture.';
 const names=touchReturnKeepNames(result.name,{targetId:result.targetId});
 $('keep-filenames').textContent=names.sound+' · '+names.gestures;
 const record=result.record,s=record.settings;
 $('facts').textContent=`${record.events.length} ${record.events.length===1?'gesture':'gestures'} · ${result.duration.toFixed(2)} seconds · ${record.sampleRate.toLocaleString()} Hz · ${record.ended?'saved Quiet ending':'natural ending'}`;
 $('settings').textContent=`${s.frequency} Hz base tuning · ${s.detune} cents detuning · coupling ${s.coupling} · loss ${s.loss}/s. Fixed output gain ${record.outputGain}; model pickup scale ${result.pickupScale.toPrecision(6)}.`;
 $('play').hidden=$('play-note').hidden=false;$('play').href=touchConnectionHref(s);
 if(!world)try{
  world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;
  world.rail.visible=false;world.loom.root.position.set(0,0,1);world.loom.root.scale.setScalar(1);world.loom.root.visible=true;
  world.camera.position.set(0,3.6,10);world.controls.target.set(0,1.1,1);world.controls.update();pictureView=createTouchView(world);$('view-controls').hidden=false;
 }catch{$('world').hidden=true;$('view-note').textContent='The 3D view is unavailable here. The original sound can still be played.';}
 describeView();sync();
}
$('file').onchange=async()=>{
 const file=$('file').files?.[0];$('file').value='';if(!file)return;
 const own=++generation;cancelComparison();replay.stop();status('Rebuilding the original connection and gestures…');
 try{const result=await session.open(file);if(own!==generation)return;comparison=null;$('changes').textContent='';$('comparison-status').textContent='Preparation is silent.';$('listen-comparison').textContent='Listen to comparison ↗';
 for(const option of $('target').options){const target=LOOM_JOURNEYS.find(j=>j.id===option.value);option.disabled=Object.keys(result.record.settings).every(key=>target.settings[key]===result.record.settings[key]);}
 $('target').value=Array.from($('target').options).find(option=>!option.disabled).value;show(result);status('Your original passage is ready. Choose Listen when you are ready.');}
 catch(error){if(own===generation&&error.name!=='AbortError')status(error.message+(shown?' Your previous passage remains available.':''),true);}
};
$('cancel').onclick=()=>{if(session.state!=='preparing')return;generation++;session.cancel();status('Opening cancelled.'+(shown?' Your previous passage remains available.':''));};
async function listenTo(result){
 if(!result||session.state==='preparing'||comparisonBusy)return;const own=generation;replay.stop();show(result);played=result;
 try{await replay.play(result.pcm);if(own===generation&&replay.state==='playing')status(result.targetId?`Listening to the ${result.targetTitle} comparison.`:'Listening to your original passage.');}catch(error){if(own===generation)status(error.message,true);}
}
$('listen').onclick=()=>listenTo(session.result);
$('listen-comparison').onclick=()=>listenTo(comparison);
function cancelComparison(){comparisonGeneration++;comparisonJobs.cancel();comparisonBusy=false;sync();}
for(const journey of LOOM_JOURNEYS){const option=document.createElement('option');option.value=journey.id;option.textContent=journey.title;$('target').append(option);}
$('target').onchange=()=>{cancelComparison();$('comparison-status').textContent='Choose Prepare to try this connection. Any previous comparison remains available under its own name.';};
$('cancel-comparison').onclick=()=>{if(!comparisonBusy)return;cancelComparison();$('comparison-status').textContent='Comparison cancelled. Your prepared versions are unchanged.';};
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
$('save').onclick=()=>{const result=shown;if(!result||session.state==='preparing'||comparisonBusy)return;const url=URL.createObjectURL(new Blob([stereoWav(result.pcm)],{type:'audio/wav'})),link=document.createElement('a');link.href=url;link.download=touchReturnKeepNames(result.name,{targetId:result.targetId}).sound;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
$('save-gestures').onclick=()=>{const result=shown;if(!result||session.state==='preparing'||comparisonBusy)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result.record,null,2)+'\n'],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=touchReturnKeepNames(result.name,{targetId:result.targetId}).gestures;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();if(session.state==='preparing')$('cancel').click();if(comparisonBusy)$('cancel-comparison').click();replay.stop();status('Quiet.'+(shown?' Your passage is still here.':''));}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)replay.stop();});
window.addEventListener('pagehide',event=>{generation++;session.cancel();cancelComparison();if(event.persisted){replay.park();return;}closed=true;session.dispose();replay.dispose();world?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();status(shown?'Your passage is here. Listen when you are ready.':'Choose a saved Touch passage when you are ready.');}});
function draw(){
 if(closed)return;
 if(shown){const time=played===shown&&!['preparing','error'].includes(replay.state)?replay.time():0;
  if(world){pictureView.update({focus:focusView,width:$('world').clientWidth,height:$('world').clientHeight});world.loom.bodies.forEach((body,i)=>{body.body.parent.visible=focusView==='both'||i===(focusView==='left'?0:1);});world.loom.bridge.visible=shown.record.settings.coupling>0&&focusView==='both';const still=$('still-picture').checked;const frame=still?{time:0,envelope:[0,0],displacement:[0,0],averaged:false,strikes:[]}:visual.visual(time);applyLoomScene(loomSceneFrame(frame,shown.record.settings,{active:!still}),world.loom);world.render();}
  $('phase').textContent=`${replay.state==='playing'?'LISTENING':replay.state==='ended'?'SETTLED':replay.state==='suspended'?'INTERRUPTED':'READY'} · ${time.toFixed(1)} / ${shown.duration.toFixed(1)} s`;
 }
 requestAnimationFrame(draw);
}
sync();draw();
