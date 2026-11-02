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
let world=null,scenes=[],busy=false,saving=false,quietWanted=false,operation=0,animation,demonstration=false;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const active=()=>!demonstration&&!busy&&!quietWanted&&['ready','playing'].includes(host.state);
function sync(){
 $('begin').disabled=busy||saving||['ready','playing','ending','preparing'].includes(host.state);$('begin').textContent=demonstration?'Your turn ↗':host.hasRecording?'Begin again ↗':'Begin ↗';
 $('demonstration').disabled=$('begin').disabled;
 $('passage-kind').textContent=demonstration?'AUTHORED DEMONSTRATION':'YOUR OWN FIRST TOUCH';
 $('keeping-title').textContent=demonstration?'The demonstration, kept.':'A passage, together.';
 $('gestures').textContent=demonstration?'Keep demonstration gestures ↓':'Keep gestures ↓';$('sound').textContent=demonstration?'Keep demonstration sound ↓':'Keep sound ↓';
 $('quiet').disabled=!busy&&!['ready','playing','suspended','preparing'].includes(host.state);
 for(let i=0;i<3;i++){$('strike-'+i).disabled=!active();$('hold-'+i).disabled=!active();$('hold-'+i).setAttribute('aria-pressed',String(held[i]));}
 $('keeping').hidden=!host.hasRecording;$('gestures').disabled=busy||saving;$('sound').disabled=busy||saving;
}
const host=createEnsembleHost({onChange:({state,error})=>{
 if(state==='error'){clearOwners();held.fill(false);status(error.message,true);}
 if(state==='ended'){quietWanted=false;clearOwners();held.fill(false);status(error?error.message+' Your previous passage is still available.':host.hasRecording?(demonstration?'The demonstration has settled. Your turn begins an empty passage.':'Quiet. Keep this passage, or begin again.'):'Quiet. Begin whenever you are ready.',!!error);}
 if(state==='suspended')status('Audio was interrupted. Quiet ends this passage; Begin starts afresh.');
 sync();
},onDecision:ack=>{
 const i=ack.part;
 if(!ack.accepted)$('decision-'+i).textContent=ack.reason==='headroom'?'Let this voice ring before another strike.':'Gesture not applied: '+ack.reason;
 else{if(demonstration){const names=['C','E♭','G'];status(ack.event.kind==='strike'?names[i]+(i===0?' begins.':' enters.'):ack.event.kind==='contact'?(ack.event.zone===null?'The hand lifts. Listen to what remains.':'A hand softens C; the other Groves continue.'):'The demonstration settles.');}if(ack.event.kind==='strike')$('decision-'+i).textContent='';if(ack.event.kind==='contact')held[i]=ack.event.zone!==null;if(ack.event.kind==='quiet')held[i]=false;}
}});
function clearOwners(){holdControls.forEach(control=>control.reset());}
function releaseAll(){holdControls.forEach(control=>control.release());}
async function begin(asDemonstration=false){
 const own=++operation;releaseAll();busy=true;quietWanted=false;held.fill(false);status('Preparing three voices…');sync();
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
$('quiet').onclick=()=>{releaseAll();quietWanted=true;if(busy){operation++;busy=false;}host.quiet();if(host.state==='idle'){quietWanted=false;status('Preparation cancelled. Begin whenever you are ready.');}sync();};
for(let i=0;i<3;i++){
 $('strike-'+i).onclick=()=>{if(active())host.send(i,{kind:'strike',body:0,position:1,velocity:.5});};
 holdControls.push(bindHoldControl($('hold-'+i),{enabled:active,onChange:down=>{
  const recipe=host.recipes?.[i];if(recipe)host.send(i,{kind:'contact',body:0,zone:down?recipe.zones.length-1:null,...(down?{strength:recipe.strengths.findIndex(s=>s.name==='firm')}:{})});
 }}));
}
try{const saved=localStorage.getItem('imagimusic-ensemble-listening-db');if(saved!==null){const db=Number(saved);if(Number.isFinite(db)&&db>=0&&db<=20){host.setListeningDb(db);$('listening-level').value=String(db);$('listening-value').textContent='+'+db+' dB';}}}catch{}
$('listening-level').oninput=()=>{const db=Number($('listening-level').value);host.setListeningDb(db);$('listening-value').textContent='+'+db+' dB';try{localStorage.setItem('imagimusic-ensemble-listening-db',String(db));}catch{}};
function download(bytes,type,name){const url=URL.createObjectURL(new Blob([bytes],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('gestures').onclick=()=>{try{download(canonicalEnsembleRecord(host.recording())+'\n','application/json',demonstration?'imagimusic-ensemble-demonstration.json':'imagimusic-ensemble.json');}catch(error){status(error.message,true);}};
$('sound').onclick=async()=>{saving=true;sync();const own=operation;status('Rebuilding the kept sound…');try{const pcm=await host.saveAudio();if(own===operation){download(stereoWav(pcm),'audio/wav',demonstration?'imagimusic-ensemble-demonstration.wav':'imagimusic-ensemble.wav');status('The ensemble sound is ready to keep.');}}catch(error){if(own===operation&&error.name!=='AbortError')status(error.message,true);}finally{if(own===operation){saving=false;sync();}}};
window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();$('quiet').click();return;}if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.target.matches('input,textarea,select,[contenteditable=true]'))return;const i=keys.indexOf(event.key.toLowerCase());if(i>=0&&active()){event.preventDefault();$('strike-'+i).click();}});
function park(){operation++;releaseAll();busy=saving=quietWanted=false;clearOwners();held.fill(false);host.park();status(host.hasRecording?'Your passage is kept here. Open its saved gestures to listen back.':'Quiet. Begin when you return.');sync();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});
window.addEventListener('pagehide',event=>{park();if(!event.persisted){cancelAnimationFrame(animation);holdControls.forEach(control=>control.dispose());host.dispose();scenes.forEach(scene=>scene.dispose());world?.dispose();}});
try{world=createGroveWorld($('world'));world.controls.enabled=false;scenes=groves.map((grove,i)=>{const scene=createGroveScene(grove);scene.root.scale.setScalar(.47);scene.root.position.set((i-1)*3.2,.1,0);world.scene.add(scene.root);return scene;});world.camera.position.set(0,3.7,10.8);world.camera.lookAt(0,1.4,0);}catch{$('world').hidden=true;$('picture-note').textContent='The 3D view is unavailable. Labelled controls and sound are still available.';}
function draw(){if(world&&!document.hidden){const frames=host.visual();scenes.forEach((scene,i)=>{const frame=frames[i],recipe=host.recipes?.[i],contacts=frame.contacts??[];applyGroveScene(scene,{...frame,...(reduced.matches?{envelope:[]}: {})},groves[i].bodies.map((_,b)=>contacts[b]?contacts[b].strength===1?1:.4:0),groves[i].bodies.map((_,b)=>contacts[b]?recipe?.zones[contacts[b].zone]:undefined));});world.render();}animation=requestAnimationFrame(draw);}
sync();draw();
