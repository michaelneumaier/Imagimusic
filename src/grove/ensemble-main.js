import {createEnsembleReturnSession} from './ensemble-return-session.js';
import {restWorkerJob} from './contact-job.js';
import {createGroveReplay} from './replay.js';
import {bindListeningControl} from './listening-control.js';
import {composeEnsemblePhrase} from '../score/grove-ensemble.js';
import {bindHoldControl} from './hold-control.js';
import {composeGrove} from '../score/grove.js';
import {retuneGroveCluster} from '../score/grove-tuning.js';
import {canonicalEnsembleRecord} from '../score/grove-ensemble-record.js';
import {createEnsembleHost} from './ensemble-host.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id),groves=[48,51,55].map(note=>retuneGroveCluster(composeGrove({seed:3}),note)),keys=['a','s','d'],holdControls=[],held=[false,false,false],reduced=matchMedia('(prefers-reduced-motion: reduce)');
let world=null,scenes=[],busy=false,saving=false,quietWanted=false,operation=0,animation,demonstration=false,listeningBack=false,listeningReturn=false,returnSession=null;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const active=()=>!demonstration&&!busy&&!quietWanted&&['ready','playing'].includes(host.state);
const replayActive=()=>['preparing','playing','suspended'].includes(replay.state);
const returnPreparing=()=>returnSession?.state==='preparing';
const returnStatus=text=>{$('return-status').textContent=text;};
function cancelReturn(){if(returnPreparing()){returnSession.cancel();returnStatus('Preparation cancelled. The original passage stays here.');}}
function sync(){
 $('begin').disabled=busy||saving||['ready','playing','ending','preparing'].includes(host.state);$('begin').textContent=demonstration?'Your turn ↗':host.hasRecording?'Begin again ↗':'Begin ↗';
 $('demonstration').disabled=$('begin').disabled;
 $('passage-kind').textContent=demonstration?'AUTHORED DEMONSTRATION':'YOUR OWN FIRST TOUCH';
 $('keeping-title').textContent=demonstration?'The demonstration, kept.':'A passage, together.';
 $('gestures').textContent=demonstration?'Keep demonstration gestures ↓':'Keep gestures ↓';$('sound').textContent=demonstration?'Keep demonstration sound ↓':'Keep sound ↓';
 $('quiet').disabled=!busy&&!returnPreparing()&&!replayActive()&&!['ready','playing','suspended','preparing'].includes(host.state);
 $('listen-back').disabled=!host.hasRecording||busy||saving||returnPreparing()||replay.state==='preparing';$('listen-back').textContent=demonstration?'Hear the demonstration again ↗':'Listen back ↗';
 for(let i=0;i<3;i++){$('strike-'+i).disabled=!active();$('hold-'+i).disabled=!active();$('hold-'+i).setAttribute('aria-pressed',String(held[i]));}
 $('keeping').hidden=!host.hasRecording;$('gestures').disabled=busy||saving;$('sound').disabled=busy||saving||returnPreparing()||replayActive();
 const result=returnSession?.result,locked=busy||saving||returnPreparing();
 $('return-prepare').disabled=!host.hasRecording||locked||replayActive();
 $('return-cancel').hidden=!returnPreparing();$('return-result').hidden=!result;
 $('return-listen').disabled=!result||locked||replay.state==='preparing';
 $('return-gestures').disabled=!result||locked;$('return-sound').disabled=!result||locked||replayActive();
 $('return-origin').textContent=returnSession?.origin==='demonstration'?'Derived from the authored demonstration. The original demonstration remains available above.':'Derived from this finished passage. Its original remains available above.';

}
const host=createEnsembleHost({onChange:({state,error})=>{
 if(!host.hasRecording&&['ready','suspended'].includes(state)){
  if(returnSession?.hasSource)returnSession.clearSource();
  $('return-details').open=false;returnStatus('Preparation makes a separate variation. Nothing plays automatically.');
 }
 if(state==='error'){clearOwners();held.fill(false);status(error.message,true);}
 if(state==='ended'){quietWanted=false;clearOwners();held.fill(false);status(error?error.message+' Your previous passage is still available.':host.hasRecording?(demonstration?'The demonstration has settled. Your turn begins an empty passage.':'Quiet. Keep this passage, or begin again.'):'Quiet. Begin whenever you are ready.',!!error);}
 if(state==='suspended')status('Audio was interrupted. Quiet ends this passage; Begin starts afresh.');
 sync();
},onDecision:ack=>{
 const i=ack.part;
 if(!ack.accepted)$('decision-'+i).textContent=ack.reason==='headroom'?'Let this voice ring before another strike.':'Gesture not applied: '+ack.reason;
 else{if(demonstration){const names=['C','E♭','G'];status(ack.event.kind==='strike'?names[i]+(i===0?' begins.':' enters.'):ack.event.kind==='contact'?(ack.event.zone===null?'The hand lifts. Listen to what remains.':'A hand softens C; the other Groves continue.'):'The demonstration settles.');}if(ack.event.kind==='strike')$('decision-'+i).textContent='';if(ack.event.kind==='contact')held[i]=ack.event.zone!==null;if(ack.event.kind==='quiet')held[i]=false;}
}});
const replay=createGroveReplay({listeningDb:20,onChange:({state})=>{
 if(listeningBack){
  if(state==='preparing')status('Preparing the kept sound to listen back…');
  if(state==='playing')status(listeningReturn?(returnSession.origin==='demonstration'?'Listening to a derived return of the demonstration. The picture stays still.':'Listening to the derived return. The picture stays still.'):demonstration?'Listening to the authored demonstration. The picture stays still.':'Listening to your passage. The picture stays still.');
  if(state==='suspended')status(listeningReturn?'Listening was interrupted. Listen to the return restarts the variation.':'Listening was interrupted. Listen back restarts the passage.');
  if(state==='ended'){const wasReturn=listeningReturn;listeningBack=listeningReturn=false;status(wasReturn?'The return has settled. The original passage is still here.':'The passage has settled. Listen again, keep it, or begin afresh.');}
 }
 sync();
}});
function stopListening(){listeningBack=listeningReturn=false;replay.stop();}
$('listen-back').onclick=async()=>{
 if(!host.hasRecording||busy||saving)return;
 const own=++operation;stopListening();host.park();listeningBack=true;
 try{await replay.play(host.saveAudio());}
 catch(error){if(own===operation){listeningBack=false;status('Listening unavailable: '+error.message,true);sync();}}
};
returnSession=createEnsembleReturnSession({prepare:(record,options)=>restWorkerJob(new URL('./ensemble-return-worker.js',import.meta.url),{record},options),onChange:sync});
$('return-prepare').onclick=async()=>{
 if(!host.hasRecording||busy||saving||returnPreparing()||replayActive())return;
 try{
  if(!returnSession.hasSource)returnSession.setSource(host.recording(),{origin:demonstration?'demonstration':'personal'});
  returnStatus('Preparing a separate return… The original passage stays here. You can cancel.');
  await returnSession.prepare();
  returnStatus('The return is ready. Choose Listen to the return when you are ready.');
 }catch(error){if(error.name!=='AbortError')returnStatus('Return unavailable: '+error.message+' The original passage stays here.');}
};
$('return-cancel').onclick=cancelReturn;
$('return-listen').onclick=async()=>{
 if(!returnSession.result||busy||saving||returnPreparing())return;
 const own=++operation;stopListening();host.park();listeningBack=listeningReturn=true;
 try{await replay.play(returnSession.result.pcm);}
 catch(error){if(own===operation){listeningBack=listeningReturn=false;status('Listening unavailable: '+error.message,true);sync();}}
};
const returnFilename=extension=>'imagimusic-ensemble-'+(returnSession.origin==='demonstration'?'demonstration-':'')+'return.'+extension;
$('return-gestures').onclick=()=>{if(returnSession.result&&!busy&&!returnPreparing())download(returnSession.result.text,'application/json',returnFilename('json'));};
$('return-sound').onclick=()=>{if(returnSession.result&&!busy&&!returnPreparing())download(stereoWav(returnSession.result.pcm),'audio/wav',returnFilename('wav'));};
function clearOwners(){holdControls.forEach(control=>control.reset());}
function releaseAll(){holdControls.forEach(control=>control.release());}
async function begin(asDemonstration=false){
 const own=++operation;cancelReturn();stopListening();releaseAll();busy=true;quietWanted=false;held.fill(false);status('Preparing three voices…');sync();
 try{await host.enable(groves);if(own===operation&&host.state==='ready'){
   demonstration=asDemonstration;
   if(demonstration){
    const phrase=composeEnsemblePhrase(host.recipes,{together:false,velocity:.5});
    const steps=phrase.parts.flatMap(part=>part.commands.filter(command=>command.kind!=='quiet'||part.index===0).map(command=>({part:part.index,time:command.frame/phrase.sampleRate,command}))).sort((a,b)=>a.time-b.time);
    const result=host.scheduleOpening(steps);if(!result.queued)throw new Error('Demonstration could not start: '+result.reason);
    status('A short authored demonstration. Quiet can end it at any time.');
   }else status('The voices are yours. Play one, or take your time.');
  }}
 catch(error){if(own===operation)status(error.message+(host.hasRecording?' Your previous passage is still available.':''),true);}
 finally{if(own===operation){busy=false;sync();}}
}
$('begin').onclick=()=>begin(false);
$('demonstration').onclick=()=>begin(true);
$('quiet').onclick=()=>{if(returnPreparing()){cancelReturn();status('Return preparation cancelled. The original passage is unchanged.');sync();return;}if(replayActive()){const wasReturn=listeningReturn;operation++;stopListening();host.park();status(wasReturn?'Listening stopped. The original and its return are unchanged.':demonstration?'Listening stopped. The demonstration is unchanged.':'Listening stopped. Your passage is unchanged.');sync();return;}releaseAll();quietWanted=true;if(busy){operation++;busy=false;}host.quiet();if(host.state==='idle'){quietWanted=false;status('Preparation cancelled. Begin whenever you are ready.');}sync();};
for(let i=0;i<3;i++){
 $('strike-'+i).onclick=()=>{if(active())host.send(i,{kind:'strike',body:0,position:1,velocity:.5});};
 holdControls.push(bindHoldControl($('hold-'+i),{enabled:active,onChange:down=>{
  const recipe=host.recipes?.[i];if(recipe)host.send(i,{kind:'contact',body:0,zone:down?recipe.zones.length-1:null,...(down?{strength:recipe.strengths.findIndex(s=>s.name==='firm')}:{})});
 }}));
}
bindListeningControl({input:$('listening-level'),output:$('listening-value'),targets:[host,replay],defaultDb:20,storageKey:'imagimusic-ensemble-listening-db'});
function download(bytes,type,name){const url=URL.createObjectURL(new Blob([bytes],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('gestures').onclick=()=>{try{download(canonicalEnsembleRecord(host.recording())+'\n','application/json',demonstration?'imagimusic-ensemble-demonstration.json':'imagimusic-ensemble.json');}catch(error){status(error.message,true);}};
$('sound').onclick=async()=>{saving=true;sync();const own=operation;status('Rebuilding the kept sound…');try{const pcm=await host.saveAudio();if(own===operation){download(stereoWav(pcm),'audio/wav',demonstration?'imagimusic-ensemble-demonstration.wav':'imagimusic-ensemble.wav');status('The ensemble sound is ready to keep.');}}catch(error){if(own===operation&&error.name!=='AbortError')status(error.message,true);}finally{if(own===operation){saving=false;sync();}}};
window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();$('quiet').click();return;}if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.target.matches('input,textarea,select,[contenteditable=true]'))return;const i=keys.indexOf(event.key.toLowerCase());if(i>=0&&active()){event.preventDefault();$('strike-'+i).click();}});
function park(){operation++;cancelReturn();listeningBack=listeningReturn=false;replay.park();releaseAll();busy=saving=quietWanted=false;clearOwners();held.fill(false);host.park();status(host.hasRecording?(demonstration?'The demonstration is kept here. Listen again when you return.':'Your passage is kept here. Listen back when you return.'):'Quiet. Begin when you return.');sync();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});
window.addEventListener('pagehide',event=>{park();if(!event.persisted){cancelAnimationFrame(animation);holdControls.forEach(control=>control.dispose());host.dispose();replay.dispose();returnSession.dispose();scenes.forEach(scene=>scene.dispose());world?.dispose();}});
try{world=createGroveWorld($('world'));world.controls.enabled=false;scenes=groves.map((grove,i)=>{const scene=createGroveScene(grove);scene.root.scale.setScalar(.47);scene.root.position.set((i-1)*3.2,.1,0);world.scene.add(scene.root);return scene;});world.camera.position.set(0,3.7,10.8);world.camera.lookAt(0,1.4,0);}catch{$('world').hidden=true;$('picture-note').textContent='The 3D view is unavailable. Labelled controls and sound are still available.';}
function draw(){if(world&&!document.hidden){const frames=host.visual();scenes.forEach((scene,i)=>{const frame=frames[i],recipe=host.recipes?.[i],contacts=frame.contacts??[];applyGroveScene(scene,{...frame,...(reduced.matches?{envelope:[]}: {})},groves[i].bodies.map((_,b)=>contacts[b]?contacts[b].strength===1?1:.4:0),groves[i].bodies.map((_,b)=>contacts[b]?recipe?.zones[contacts[b].zone]:undefined));});world.render();}animation=requestAnimationFrame(draw);}
sync();draw();
