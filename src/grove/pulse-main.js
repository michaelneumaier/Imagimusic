import {bindListeningControl} from './listening-control.js';
import {composeGrove} from '../score/grove.js';
import {restWorkerJob} from './contact-job.js';
import {createRestHost} from './contact-host.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id),grove=composeGrove({seed:3}),keys=['a','s','d'];
let world,sculpture,phrase=null,opening=false,openingEnd=null,openingAccepted=0,busy=false,saving=false,generation=0,animation,preparing;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const active=()=>!!phrase&&!opening&&!busy&&['ready','playing'].includes(host.state);
function sync(){
 const state=host.state,ended=state==='ended',has=!!host.stats?.strikes;
 $('begin').disabled=busy||saving||['ready','playing','ending','preparing'].includes(state);
 $('begin').textContent=state==='suspended'?'Resume ↗':ended?'Hear it again ↗':'Hear the opening ↗';
 $('quiet').disabled=!busy&&!['ready','playing','suspended'].includes(state);
 for(let b=0;b<3;b++)$('body-'+b).disabled=!active();
 $('keeping').hidden=!(ended&&has);$('sound').disabled=saving;$('gestures').disabled=saving;
}
const host=createRestHost({listeningDb:18,
 onChange:({state,error})=>{
  sync();
  if(state==='error'){opening=false;status(error.message,true);$('phase').textContent='UNAVAILABLE';}
  else if(state==='ended'){opening=false;$('phase').textContent='QUIET';status('Quiet. Keep this passage, or hear the opening again.');}
  else if(state==='suspended'){status('Audio paused. Resume continues this passage.');$('phase').textContent='PAUSED';}
 },
 onDecision:ack=>{
  if(opening&&ack.event?.kind==='strike'){
   if(ack.accepted)openingAccepted++;
   if(ack.requestedFrame===openingEnd){
    opening=false;$('phase').textContent='THE BODIES ARE YOURS';
    status(openingAccepted===phrase.commands.length?'Answer whenever you like. Strike any body, or let the ring finish.':'Part of the opening was left out. You can still answer, or choose Quiet.');
    sync();
   }
  }else if(!ack.accepted&&ack.reason==='headroom')status('Let this ring breathe before another strike.');
 }
});
async function begin(){
 if($('begin').disabled)return;
 if(host.state==='suspended'){try{await host.resume();$('phase').textContent=opening?'LISTEN TO THE RETURN':'THE BODIES ARE YOURS';status(opening?'The opening continues.':'The bodies are yours. Answer whenever.');sync();}catch(e){status(e.message,true);}return;}
 const own=++generation;busy=true;opening=false;openingEnd=null;openingAccepted=0;phrase=null;sync();status('Opening the connected bodies…');$('phase').textContent='OPENING';
 try{
  if(host.state==='ended')await host.newPassage();else await host.enable(grove);
  if(own!==generation||host.state!=='ready')return;
  preparing=new AbortController();
  const result=await restWorkerJob(new URL('./pulse-prepare-worker.js',import.meta.url),{recipe:host.recipe},{signal:preparing.signal});
  if(own!==generation||host.state!=='ready')return;phrase=result.phrase;
  opening=true;const origin=host.schedule(phrase.commands);openingEnd=origin+phrase.endFrame;
  $('phase').textContent='LISTEN TO THE RETURN';status('Listen to the opening. Your space follows its return.');
  $('timing').textContent='Grove 3. Low-mode period: '+phrase.physicalPeriodSeconds.toFixed(2)+' s. Authored pulse unit: '+phrase.pulseUnitSeconds.toFixed(2)+' s. Reference answer delay: '+phrase.referenceDelaySeconds.toFixed(2)+' s.';
 }catch(e){if(own===generation){opening=false;host.quiet();status(e.message,true);}}
 finally{if(own===generation){busy=false;sync();}}
}
function strike(body){if(active())host.send({kind:'strike',body,position:phrase.position,velocity:.5});}
function quiet(){if(busy){generation++;preparing?.abort();busy=false;host.park();$('phase').textContent='BEFORE THE PHRASE';status('Opening cancelled. Ready when you are.');sync();return;}host.quiet();sync();}
$('begin').onclick=begin;$('quiet').onclick=quiet;
for(let body=0;body<3;body++)$('body-'+body).onclick=()=>strike(body);
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){quiet();return;}
 if(event.repeat||event.metaKey||event.ctrlKey||event.altKey||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
 const body=keys.indexOf(event.key.toLowerCase());if(body>=0&&active()){event.preventDefault();strike(body);}
});
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('gestures').onclick=()=>{try{download(JSON.stringify(host.recording(),null,2),'application/json','imagimusic-open-phrase-3.json');}catch(e){status(e.message,true);}};
$('sound').onclick=async()=>{
 const own=generation;saving=true;sync();
 try{const pcm=await host.saveAudio();if(own===generation)download(stereoWav(pcm),'audio/wav','imagimusic-open-phrase-3.wav');}
 catch(e){if(own===generation)status(e.message,true);}
 finally{if(own===generation){saving=false;sync();}}
};
try{world=createGroveWorld($('world'));sculpture=createGroveScene(grove,{bodyLabels:['01','02','03']});for(const body of sculpture.bodies)body.label.scale.set(.48,.12,1);world.scene.add(sculpture.root);}
catch(e){status('The picture is unavailable. The numbered buttons still play the instrument.',true);}
function draw(){if(world&&sculpture){applyGroveScene(sculpture,host.visual());world.render();}animation=requestAnimationFrame(draw);}
draw();sync();
document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});
window.addEventListener('pagehide',event=>{
 generation++;preparing?.abort();busy=saving=opening=false;openingEnd=null;
 if(event.persisted){host.park();return;}
 cancelAnimationFrame(animation);host.dispose();sculpture?.dispose();world?.dispose();
});
window.addEventListener('pageshow',event=>{if(event.persisted){sync();$('phase').textContent=host.state==='ended'?'QUIET':'BEFORE THE PHRASE';status(host.state==='ended'?'Your finished passage is still here.':'Ready when you are. Hear the opening to begin.');}});

bindListeningControl({input:$('listening-level'),output:$('listening-value'),targets:[host],defaultDb:18,storageKey:'imagimusic-rest-listening-db'});
