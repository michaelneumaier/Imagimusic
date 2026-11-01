import {restInstrumentIdentity} from './rest-instrument-identity.js';
import {createRestImportSession} from './rest-import-session.js';
import {createGroveReplay} from './replay.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
import {restReplayFrame} from './rest-replay-picture.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id);
let world=null,sculpture=null,shown=null,played=null,operation=0;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const session=createRestImportSession({onChange:sync});
const replay=createGroveReplay({onChange:({state})=>{sync();if(state==='ended')status('Your passage has settled. You can listen again.');if(state==='suspended')status('Audio was interrupted. Listen restarts the passage.');}});
function sync(){
 const busy=session.state==='preparing',ready=!!session.result;
 $('cancel').hidden=!busy;$('listen').disabled=!ready||busy||replay.state==='preparing';$('save').disabled=!ready||busy;$('quiet').disabled=!['playing','preparing','suspended'].includes(replay.state);
}
function show(result){
 const identity=restInstrumentIdentity(result.record);
 shown=result;$('passage').hidden=false;$('name').textContent=result.name;$('identity').textContent=`${identity.label}${identity.defaultVoice?'':' · SAVED VOICE'} · REOPENED`;
 $('facts').textContent=`${result.picture.duration.toFixed(2)} seconds · ${result.record.events.length} strikes · ${result.record.contacts.length} resting contact${result.record.contacts.length===1?'':'s'}`;
 $('play').hidden=!identity.canOpenCurated;
 $('play').href=`rest.html?seed=${result.record.grove.seed}`;
 if(!world)try{world=createGroveWorld($('world'));}catch{$('world').hidden=true;$('phase').textContent='The 3D view is unavailable. Sound playback is still available.';}
 if(world){if(sculpture){world.scene.remove(sculpture.root);sculpture.dispose();}sculpture=createGroveScene(result.record.grove);world.scene.add(sculpture.root);}
 sync();
}
$('file').onchange=async()=>{
 const file=$('file').files[0];$('file').value='';if(!file)return;
 const own=++operation;replay.stop();status('Rebuilding your saved instrument and gestures…');
 try{const result=await session.open(file);if(own!==operation)return;show(result);status('Your passage is ready. Choose Listen when you are ready.');}
 catch(error){if(own===operation&&error.name!=='AbortError')status(`${error.message}${shown?' Your previous passage is still available.':''}`,true);}
};
$('cancel').onclick=()=>{operation++;session.cancel();status(shown?'Opening cancelled. Your previous passage is still available.':'Opening cancelled. Choose a gesture file when you are ready.');};
$('listen').onclick=async()=>{const result=session.result;if(!result||session.state==='preparing')return;const own=operation;played=result;try{await replay.play(result.pcm);if(own===operation&&replay.state==='playing')status('Listening to your saved passage.');}catch(error){if(own===operation)status(error.message,true);}};
$('quiet').onclick=()=>{replay.stop();status('Quiet. Your reopened passage is still here.');};
$('save').onclick=()=>{const result=session.result;if(!result)return;const url=URL.createObjectURL(new Blob([stereoWav(result.pcm)],{type:'audio/wav'})),a=document.createElement('a');a.href=url;a.download=`imagimusic-rest-${result.record.grove.seed}.wav`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(session.state==='preparing')$('cancel').click();replay.stop();status('Quiet. Nothing is playing.');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)replay.stop();});
window.addEventListener('pagehide',event=>{operation++;if(event.persisted){session.cancel();replay.park();return;}session.dispose();replay.dispose();sculpture?.dispose();world?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();status(session.result?'Your passage is here. Listen when you’re ready.':'Welcome back. Choose a gesture file when you’re ready.');}});
function draw(){
 if(shown&&world){const time=played===shown?replay.time():0,frame=restReplayFrame(shown.picture,time),contacts=frame.contacts??[];applyGroveScene(sculpture,frame,shown.record.grove.bodies.map((_,i)=>contacts[i]?contacts[i].strength===1?1:.4:0),shown.record.grove.bodies.map((_,i)=>contacts[i]?shown.record.zones[contacts[i].zone]:undefined));world.render();$('phase').textContent=`${replay.state==='playing'?'LISTENING':replay.state==='ended'?'SETTLED':replay.state==='suspended'?'PAUSED':'READY'} · ${time.toFixed(1)} / ${shown.picture.duration.toFixed(1)} s`;}
 requestAnimationFrame(draw);
}
sync();draw();
