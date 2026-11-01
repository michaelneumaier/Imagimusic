import {composeGrove,GROVE_SEEDS,describeGrove,composeGroveGreeting,greetingStrikes,greetingDuration,greetingBeatSeconds} from '../score/grove.js';
import {createImpulseTransport} from '../touch/transport.js';
import {holdVelocity} from '../touch/session.js';
import {stereoWav} from '../loom/model.js';
import {createGroveSession} from './session.js';
import {createGroveBankJob} from './render-job.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
const $=id=>document.getElementById(id),held=new Map(),keys=['a','s','d'];
let grove,world,sculpture,pads=[],greeting=null,mode='live',enterToken=0;
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
const transport=createImpulseTransport({createSession:createGroveSession,prepare:createGroveBankJob,onChange:({state,recording})=>{
 const open=['ready','playing'].includes(state),has=!!recording?.events.length;
 pads.forEach(p=>p.disabled=!open||mode==='greeting');$('begin').disabled=state==='preparing'||open;
 $('begin').textContent=state==='preparing'?'Opening the grove…':state==='suspended'?'Resume the grove ↗':open?'The grove is open':'Enter the grove ↗';
 $('greeting').disabled=!open||(has&&mode!=='greeting');$('greeting').textContent=mode==='greeting'?'Hear it again':'Hear its greeting';$('greeting').title=has&&mode!=='greeting'?'Choose New passage to hear the greeting again.':'';
 $('quiet').disabled=!has||state==='ended'||state==='preparing';$('new').disabled=!has||state==='preparing';$('new').textContent=mode==='greeting'?'Your turn ↗':'New passage';$('save').disabled=!has||state==='preparing';$('score').disabled=!has||state==='preparing';
 if(state==='ended')status('Quiet. Keep this passage, or begin another.');if(state==='suspended')status('Audio was interrupted. Resume keeps this passage.');
}});
function clearHolds(){held.clear();pads.forEach(p=>{p.setAttribute('aria-pressed','false');p.style.setProperty('--hold','0%');});}
function play(body,velocity){const result=transport.strike(body,velocity);if(!result.accepted){status(result.reason==='headroom'?'Give this ring a little space before the next touch.':result.reason==='capacity'?'This passage is full. Keep it, then begin another.':'Enter the grove to play.');return;}status('One touch joins the whole grove.');$('hint').textContent=`Body ${String(body+1).padStart(2,'0')} was touched. Listen across the connections. Choose New passage to hear the greeting again.`;}
function start(body,key){if(mode==='greeting'||!['ready','playing'].includes(transport.state)||held.has(body))return;held.set(body,{key,start:performance.now()});pads[body].setAttribute('aria-pressed','true');}
function finish(body,key,cancel=false){const hold=held.get(body);if(!hold||hold.key!==key)return;held.delete(body);pads[body].setAttribute('aria-pressed','false');pads[body].style.setProperty('--hold','0%');if(!cancel)play(body,holdVelocity(performance.now()-hold.start));}
function buildPads(){
 $('pads').replaceChildren();pads=grove.bodies.map((body,i)=>{const pad=document.createElement('button');pad.className='pad';pad.disabled=true;pad.setAttribute('aria-pressed','false');pad.setAttribute('aria-label',`Play body ${i+1}; hold for a stronger gesture`);const title=document.createElement('span'),hint=document.createElement('small');title.textContent=String(i+1).padStart(2,'0');hint.textContent=`HOLD & RELEASE · ${keys[i].toUpperCase()}`;pad.append(title,hint);
 pad.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();pad.setPointerCapture(e.pointerId);start(i,`p-${e.pointerId}`);};pad.onpointerup=e=>finish(i,`p-${e.pointerId}`);pad.onpointercancel=e=>finish(i,`p-${e.pointerId}`,true);pad.onlostpointercapture=e=>finish(i,`p-${e.pointerId}`,true);pad.onclick=e=>{if(e.detail===0&&mode!=='greeting')play(i,.5);};$('pads').append(pad);return pad;});
}
function rebuildScene(){if(!world)return;if(sculpture){world.scene.remove(sculpture.root);sculpture.dispose();}sculpture=createGroveScene(grove);world.scene.add(sculpture.root);}
function configure(){
 clearHolds();mode='live';grove=composeGrove({seed:Number($('seed').value)});greeting=composeGroveGreeting(grove);buildPads();rebuildScene();const d=describeGrove(grove);
 $('identity').textContent=`GROVE ${grove.seed} · ${grove.topology.toUpperCase()}`;$('model-detail').textContent=`Grove ${grove.seed}: ${grove.topology}, ${grove.bridges.length} connections. Its normal modes are ${d.normalFreqsHz.map(f=>f.toFixed(2)).join(', ')} Hz; the complete impulse response lasts ${d.ringSeconds.toFixed(2)} seconds, with a short final fade. Different bodies can carry different amounts of each mode. A farther body is not guaranteed to respond later or more quietly.`;
 const url=new URL(location.href);url.searchParams.set('seed',grove.seed);history.replaceState(null,'',url);$('hint').textContent='Hold a body’s pad for a stronger touch.';
}
async function enter(){
 clearHolds();const own=++enterToken;
 if(transport.state==='suspended'){try{await transport.resume();if(own===enterToken)status('The grove is open again. Your passage is still here.');}catch(error){if(own===enterToken)status(error.message,true);}return;}
 mode='live';status('Preparing this grove’s responses…');
 try{await transport.enable(grove);if(own!==enterToken)return;status('Touch any numbered pad, or hear the grove’s greeting.');if(world)$('world').parentElement.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(error){if(own===enterToken)status(error.message,true);}
}
$('begin').onclick=enter;$('seed').onchange=()=>{configure();enter();};
$('greeting').onclick=()=>{clearHolds();const previous=mode;try{const sr=transport.recording().sampleRate;mode='greeting';transport.playSequence(greetingStrikes(greeting).map(note=>({frame:Math.round(note.time*sr),body:note.body,velocity:note.velocity})));status('A short greeting, one body at a time. Choose Your turn when you want to play.');$('hint').textContent='The greeting is authored. The response of the connected bodies comes from the model.';}catch(error){mode=previous;status(error.message,true);}};
$('quiet').onclick=()=>{clearHolds();transport.quiet();};$('new').onclick=()=>{clearHolds();mode='live';transport.newPassage();status('Your turn. Touch one body and stay with what answers.');$('hint').textContent='Hold a body’s pad for a stronger touch.';};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){clearHolds();transport.quiet();return;}if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;const body=keys.indexOf(e.key.toLowerCase());if(body>=0){e.preventDefault();start(body,`k-${body}`);}});
window.addEventListener('keyup',e=>{const body=keys.indexOf(e.key.toLowerCase());if(body>=0){e.preventDefault();finish(body,`k-${body}`);}});window.addEventListener('blur',clearHolds);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearHolds();transport.quiet();}});window.addEventListener('pagehide',()=>transport.quiet());
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('save').onclick=()=>{try{download(stereoWav(transport.saveAudio()),'audio/wav',`imagimusic-grove-${grove.seed}.wav`);status('The complete passage was saved as sound.');}catch(error){status(error.message,true);}};$('score').onclick=()=>download(JSON.stringify(transport.recording(),null,2),'application/json',`imagimusic-grove-${grove.seed}.json`);
for(const seed of GROVE_SEEDS){const option=document.createElement('option');option.value=seed;option.textContent=`Grove ${seed}`;$('seed').append(option);}const initial=Number(new URLSearchParams(location.search).get('seed'));if(GROVE_SEEDS.includes(initial))$('seed').value=initial;
configure();try{world=createGroveWorld($('world'));rebuildScene();}catch(error){$('world').hidden=true;status('The 3D view is unavailable here; the pads can still play this grove.');}
function draw(){
 const time=transport.time(),frame=transport.session?.visual(time);if(world){applyGroveScene(sculpture,frame??{});world.render();}
 for(const [body,hold] of held)pads[body].style.setProperty('--hold',`${holdVelocity(performance.now()-hold.start)*100}%`);
 let phase=transport.state==='ended'?'QUIET':transport.state==='preparing'?'OPENING THE GROVE':transport.state==='idle'?'BEFORE THE GESTURE':transport.state==='suspended'?'PAUSED':'ROOM TO LISTEN';
 if(mode==='greeting'&&transport.state==='playing'){const section=greeting.sections.findLast(s=>greetingBeatSeconds(greeting,s.beats[0])<=time);phase=time>=greetingDuration(greeting,grove)?'THE GREETING HAS SETTLED':section?.id==='silence'?'LET THE RESPONSE FINISH':section?section.id.toUpperCase():'BEFORE THE GREETING';}
 $('phase').textContent=phase;requestAnimationFrame(draw);
}
draw();
