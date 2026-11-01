import {restInstrumentIdentity} from './rest-instrument-identity.js';
import {createRestImportSession} from './rest-import-session.js';
import {restWorkerJob} from './contact-job.js';
import {createGroveReplay} from './replay.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id);
let operation=0;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const session=createRestImportSession({prepare:(data,options)=>restWorkerJob(new URL('./ensemble-import-worker.js',import.meta.url),data,options),onChange:sync});
const replay=createGroveReplay({onChange:({state})=>{sync();if(state==='ended')status('The ensemble has settled. You can listen again.');if(state==='suspended')status('Audio was interrupted. Listen restarts the ensemble.');}});
function sync(){const busy=session.state==='preparing',ready=!!session.result;$('cancel').hidden=!busy;$('listen').disabled=!ready||busy||replay.state==='preparing';$('save').disabled=!ready||busy;$('quiet').disabled=!['playing','preparing','suspended'].includes(replay.state);}
function show(result){
 $('passage').hidden=false;$('name').textContent=result.name;
 $('facts').textContent=`${result.duration.toFixed(2)} seconds · ${result.record.sampleRate/1000} kHz · Three independent Groves`;
 $('parts').replaceChildren(...result.record.parts.map(part=>{const li=document.createElement('li'),identity=restInstrumentIdentity(part.record),midi=part.record.grove.cluster.baseMidi,note=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'][midi%12]+(Math.floor(midi/12)-1);li.textContent=`Voice ${part.index+1} · ${note} · ${identity.label}${identity.defaultVoice?'':' · SAVED VOICE'}:  ${part.record.events.length} strike${part.record.events.length===1?'':'s'}, ${part.record.contacts.length} resting contact${part.record.contacts.length===1?'':'s'}${part.silent?' · silent':''}`;return li;}));
 sync();$('name').focus();
}
$('file').onchange=async()=>{const file=$('file').files[0];$('file').value='';if(!file)return;const own=++operation;replay.stop();status('Rebuilding the three instruments and their shared passage…');try{const result=await session.open(file);if(own!==operation)return;show(result);status('Your ensemble is ready. Choose Listen when you are ready.');}catch(error){if(own===operation&&error.name!=='AbortError')status(`${error.message}${session.result?' Your previous ensemble is still available.':''}`,true);}};
$('cancel').onclick=()=>{operation++;session.cancel();status(session.result?'Opening cancelled. Your previous ensemble is still available.':'Opening cancelled.');};
$('listen').onclick=async()=>{if(!session.result||session.state==='preparing')return;const own=operation;try{await replay.play(session.result.pcm);if(own===operation&&replay.state==='playing')status('Listening to your saved ensemble.');}catch(error){if(own===operation)status(error.message,true);}};
$('quiet').onclick=()=>{replay.stop();status('Quiet. Your ensemble is still here.');};
$('save').onclick=()=>{if(!session.result||session.state==='preparing')return;const url=URL.createObjectURL(new Blob([stereoWav(session.result.pcm)],{type:'audio/wav'})),a=document.createElement('a');a.href=url;a.download='imagimusic-ensemble.wav';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
window.addEventListener('keydown',event=>{if(event.key!=='Escape')return;event.preventDefault();if(session.state==='preparing')$('cancel').click();replay.stop();status('Quiet. Nothing is playing.');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){operation++;session.cancel();replay.park();status('Quiet. Listen when you return.');}});
window.addEventListener('pagehide',event=>{operation++;if(event.persisted){session.cancel();replay.park();}else{session.dispose();replay.dispose();}});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();status(session.result?'Your ensemble is here. Listen when you are ready.':'Choose a saved ensemble.');}});
sync();
