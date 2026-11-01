import {readRestFile} from './read-rest-file.js';
import {writeRestPlayHandoff} from './rest-play-handoff.js';
import {createRestImportSession} from './rest-import-session.js';
import {restWorkerJob} from './contact-job.js';
import {createGroveReplay} from './replay.js';
import {createStructureDiagram} from './structure-diagram.js';
const $=id=>document.getElementById(id);let operation=0,playOperation=0,selected=null;
const status=text=>{$('status').textContent=text;};
const preparedExample={};
async function readSource(source,{signal}){
 if(source!==preparedExample)return readRestFile(source,{signal});
 const response=await fetch(new URL('../../assets/examples/rest-pair-gesture.json',import.meta.url),{signal});
 if(!response.ok)throw new Error('The prepared gesture could not be opened. Try again, or choose your own file.');
 const file=new File([await response.blob()],'Prepared gesture.json',{type:'application/json'});
 return readRestFile(file,{signal});
}
const session=createRestImportSession({read:readSource,prepare:(data,options)=>restWorkerJob(new URL('./rest-adaptation-worker.js',import.meta.url),data,options),onChange:sync});
const replay=createGroveReplay({onChange:({state})=>{sync();if(state==='ended')status(`${selected} has settled. Your original and comparison are here.`);if(state==='suspended')status('Audio paused. Choose a version to restart it.');}});
function sync(){const busy=session.state==='preparing',ready=!!session.result;for(const id of ['original','changed','keep','play-changed'])$(id).disabled=busy||!ready;$('cancel').hidden=!busy;$('example').disabled=busy;$('quiet').disabled=!['preparing','playing','suspended'].includes(replay.state);}
function stop(){playOperation++;replay.stop();}
function show(result){
 $('comparison').hidden=false;$('name').textContent=result.name;
 const r=result.original.record;$('facts').textContent=`${((r.ended.frame+r.ended.fadeFrames)/r.sampleRate).toFixed(2)} seconds · ${r.events.length} strike${r.events.length===1?'':'s'} · ${r.contacts.length} resting contact${r.contacts.length===1?'':'s'} · one structural change`;
 $('structures').replaceChildren();
 for(const [key,label] of [['original','Original'],['changed','Changed']]){const figure=document.createElement('figure'),caption=document.createElement('figcaption');figure.style.margin='20px 0';caption.textContent=label;figure.append(caption,createStructureDiagram(result[key].record.grove,r.grove,label));$('structures').append(figure);}
 sync();
}
async function open(source){const own=++operation;stop();status('Preparing your original and one changed structure…');try{const result=await session.open(source);if(own!==operation)return;result.preparedExample=source===preparedExample;show(result);status('Both versions are ready. Choose one when you’re ready.');}catch(error){if(own===operation)status(`${error.message}${session.result?' Your previous comparison is still here.':''}`);}};
$('file').onchange=()=>{const file=$('file').files[0];$('file').value='';if(file)open(file);};
$('example').onclick=()=>open(preparedExample);
$('cancel').onclick=()=>{operation++;session.cancel();status(session.result?'Preparation cancelled. Your previous comparison is still here.':'Preparation cancelled. Your file is unchanged.');};
for(const [key,label] of [['original','Original'],['changed','Changed']])$(key).onclick=async()=>{if(session.state==='preparing'||!session.result)return;const own=++playOperation;selected=label;try{await replay.play(session.result[key].pcm);if(own===playOperation&&replay.state==='playing')status(`Listening: ${label}.`);}catch(error){if(own===playOperation)status(error.message);}};
$('quiet').onclick=()=>{stop();status('Quiet. Both versions remain available.');};
$('play-changed').onclick=()=>{if(!session.result||session.state==='preparing')return;try{const href=writeRestPlayHandoff(sessionStorage,session.result,crypto.randomUUID());stop();location.assign(href);}catch(error){status(error.message);}};
$('keep').onclick=()=>{if(!session.result||session.state==='preparing')return;const record=session.result.changed.record,url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`imagimusic-${session.result.preparedExample?'prepared-':''}variant-${record.grove.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('The changed gestures are ready to keep. Your original file is unchanged.');};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(session.state==='preparing')$('cancel').click();stop();status('Quiet. Your file is unchanged.');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();status('Quiet. Choose a version when you return.');}});
window.addEventListener('pagehide',event=>{operation++;stop();if(event.persisted){session.cancel();replay.park();return;}session.dispose();replay.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();status(session.result?'Your comparison is here. Choose a version when you’re ready.':'Welcome back. Choose saved Rest gestures when you’re ready.');}});
sync();
