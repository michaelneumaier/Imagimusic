import {composeGrove,GROVE_SEEDS,describeGrove} from '../score/grove.js';
import {createImpulseTransport} from '../touch/transport.js';
import {holdVelocity} from '../touch/session.js';
import {stereoWav} from '../loom/model.js';
import {DEFAULT_VOICE_CONFIG,createGroveVoice} from '../score/grove-voice.js';
import {createGroveVoiceSession} from './voice-session.js';
import {createGroveSession} from './session.js';
import {createGroveStudyJob} from './render-job.js';
import {createGroveReplay} from './replay.js';
import {bindGroveMovieControls} from './movie-controls.js';
import {createGroveGreetingPlan,groveGreetingFrames} from './greeting.js';
import {bindGrovePlaying,groveStrikeZone} from './interaction.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
const $=id=>document.getElementById(id),held=new Map(),keys=['a','s','d'];
let grove,world,sculpture,scenePlaying,pads=[],greeting=null,mode='live',enterToken=0;
const replay=createGroveReplay({onChange:({state})=>{if(mode==='replay'){$('replay').textContent=state==='playing'?'Listen again ↗':'Listen back ↗';syncQuiet();if(state==='suspended')status('Listening was interrupted. Listen again restarts this passage.');if(state==='ended')status('Your passage has settled. Listen again, keep it, or begin another.');}}});
function filmPlaying(){const video=$('movie-preview');return !video.paused&&!video.ended;}
function syncQuiet(){$('quiet').disabled=!(filmPlaying()||(mode==='replay'?['playing','preparing','suspended'].includes(replay.state):['playing','suspended'].includes(transport.state)));}
function stopReplay({pauseFilm=true}={}){if(pauseFilm)$('movie-preview').pause();replay.stop();if(mode==='replay')mode='live';syncQuiet();}
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
const rich=()=>$('voice').value==='partials';
const movie=bindGroveMovieControls({onPreviewPlay:()=>{stopReplay({pauseFilm:false});status('Playing your saved film.');},getSource:()=>{stopReplay();return {recording:transport.recording(),pcm:transport.saveAudio(),camera:{position:world.camera.position.toArray(),target:world.controls.target.toArray()}};}});
const transport=createImpulseTransport({createSession:(settings,sr)=>settings.voice?createGroveVoiceSession(settings,sr):createGroveSession(settings.grove,sr),prepare:createGroveStudyJob,onChange:({state,recording})=>{
 const open=['ready','playing'].includes(state),has=!!recording?.events.length;movie.setReady(state==='ended'&&has&&!!world);
 pads.forEach(p=>p.disabled=!open||mode==='greeting');$('begin').disabled=state==='preparing'||open;
 $('begin').textContent=state==='preparing'?'Opening the grove…':state==='suspended'?'Resume the grove ↗':state==='ended'?'Begin another ↗':open?'The grove is open':'Enter the grove ↗';
 $('greeting').disabled=!open||(has&&mode!=='greeting');$('greeting').textContent=mode==='greeting'?'Hear it again':'Hear its greeting';$('greeting').title=has&&mode!=='greeting'?'Choose New passage to hear the greeting again.':'';
 $('replay').disabled=!has||state!=='ended';syncQuiet();$('new').disabled=!has||state==='preparing';$('new').textContent=mode==='greeting'?'Your turn ↗':'New passage';$('save').disabled=!has||state==='preparing';$('score').disabled=!has||state==='preparing';
 const finished=state==='ended'&&has,hadFocus=$('passage-actions').contains(document.activeElement);$('passage-actions').hidden=!finished;$('after-quiet').hidden=finished;if(!finished&&hadFocus)pads.find(p=>!p.disabled)?.focus();
 if(state==='ended')status('Quiet. Keep this passage, or begin another.');if(state==='suspended'){clearHolds();status('Audio was interrupted. Resume keeps this passage.');}
}});
function clearHolds(){scenePlaying?.reset();held.clear();pads.forEach(p=>{p.setAttribute('aria-pressed','false');p.style.setProperty('--hold','0%');});}
function play(body,velocity,position=Number($('position').value)){const result=transport.strike(body,velocity,rich()?{position}:{});if(!result.accepted){status(result.reason==='headroom'?'Give this ring a little space before the next touch.':result.reason==='capacity'?'This passage is full. Keep it, then begin another.':'Enter the grove to play.');return;}status('One touch joins the whole grove.');$('hint').textContent=`Body ${String(body+1).padStart(2,'0')} was touched. Listen across the connections.`;}
function start(body,key,hit={}){if(mode==='greeting'||!['ready','playing'].includes(transport.state)||held.has(body))return;held.set(body,{key,start:performance.now(),position:rich()&&hit.positionU!==undefined?groveStrikeZone(hit.positionU,DEFAULT_VOICE_CONFIG.positions):Number($('position').value)});pads[body].setAttribute('aria-pressed','true');}
function finish(body,key,cancel=false){const hold=held.get(body);if(!hold||hold.key!==key)return;held.delete(body);pads[body].setAttribute('aria-pressed','false');pads[body].style.setProperty('--hold','0%');if(!cancel)play(body,holdVelocity(performance.now()-hold.start),hold.position);}
function buildPads(){
 $('pads').replaceChildren();pads=grove.bodies.map((body,i)=>{const pad=document.createElement('button');pad.className='pad';pad.disabled=true;pad.setAttribute('aria-pressed','false');pad.setAttribute('aria-label',`Play body ${i+1}; hold for a stronger gesture`);const title=document.createElement('span'),hint=document.createElement('small');title.textContent=String(i+1).padStart(2,'0');hint.textContent=`HOLD & RELEASE · ${keys[i].toUpperCase()}`;pad.append(title,hint);
 pad.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();pad.setPointerCapture(e.pointerId);start(i,`p-${e.pointerId}`);};pad.onpointerup=e=>finish(i,`p-${e.pointerId}`);pad.onpointercancel=e=>finish(i,`p-${e.pointerId}`,true);pad.onlostpointercapture=e=>finish(i,`p-${e.pointerId}`,true);pad.onclick=e=>{if(e.detail===0&&mode!=='greeting')play(i,.5);};$('pads').append(pad);return pad;});
}
function rebuildScene(){if(!world)return;if(sculpture){world.scene.remove(sculpture.root);sculpture.dispose();}sculpture=createGroveScene(grove);world.scene.add(sculpture.root);}
function configure(){
 stopReplay();movie.clear();clearHolds();mode='live';grove=composeGrove({seed:Number($('seed').value)});greeting=createGroveGreetingPlan(grove,rich()?DEFAULT_VOICE_CONFIG:null);buildPads();rebuildScene();const d=describeGrove(grove);
 $('identity').textContent=`GROVE ${grove.seed} · ${grove.topology.toUpperCase()}`;$('model-detail').textContent=`Grove ${grove.seed}: ${grove.topology}, ${grove.bridges.length} connections. Its normal modes are ${d.normalFreqsHz.map(f=>f.toFixed(2)).join(', ')} Hz; the complete impulse response lasts ${d.ringSeconds.toFixed(2)} seconds, with a short final fade. Different bodies can carry different amounts of each mode. A farther body is not guaranteed to respond later or more quietly.`;
 if(rich()){const v=createGroveVoice(grove);$('model-detail').textContent=`Grove ${grove.seed}: ${grove.topology}, ${grove.bridges.length} connections; ${v.normalFreqsHz.length} coupled modes. The displayed low band contains ${v.lowBandIndex.map(i=>v.normalFreqsHz[i].toFixed(2)).join(', ')} Hz. Response length ${v.ring.toFixed(2)} seconds. A farther body is not guaranteed to respond later or more quietly.`;}
 $('model-core').textContent=rich()?'The optional voice models three bodies with three beam-family partials each, coupled through attachment-point springs. It has nine normal modes with assigned decay rates. The stereo sound mixes displacement pickups by horizontal layout; there is no acoustic radiation or room simulation. Camera movement changes only the view.':'Three lumped masses and springs generate the sound. All gestures join that same linear system. It has three normal modes, one shared damping rate, and no acoustic radiation or room simulation. The sound is a stereo mixture of displacement pickups, placed across the stereo field by the bodies’ horizontal layout. Camera movement changes only the view.';
 $('position-wrap').hidden=!rich();$('voice-detail').hidden=!rich();$('voice-note').textContent=rich()?'Three resonances per body. Explore how strike position colors the attack.':'One resonance in each connected body.';
 const url=new URL(location.href);url.searchParams.set('seed',grove.seed);url.searchParams.set('voice',$('voice').value);history.replaceState(null,'',url);$('hint').textContent='Hold a body or its numbered pad, then release. A longer hold gives a stronger touch.';
}
async function enter(){
 stopReplay();clearHolds();const own=++enterToken;
 if(transport.state==='suspended'){try{await transport.resume();if(own===enterToken)status('The grove is open again. Your passage is still here.');}catch(error){if(own===enterToken)status(error.message,true);}return;}
 mode='live';status('Preparing this grove’s responses…');
 try{await transport.enable({grove,voice:rich()?DEFAULT_VOICE_CONFIG:null});if(own!==enterToken)return;status('Touch a body or its numbered pad, or hear the grove’s greeting.');if(world)$('world').parentElement.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(error){if(own===enterToken)status(error.message,true);}
}
$('begin').onclick=()=>transport.state==='ended'?newPassage():enter();$('voice').onchange=()=>{configure();enter();};$('seed').onchange=()=>{configure();enter();};
$('greeting').onclick=()=>{clearHolds();const previous=mode;try{const sr=transport.recording().sampleRate;mode='greeting';transport.playSequence(groveGreetingFrames(greeting,sr));status(rich()?'One body, three places. Then the others answer. Choose Quiet, then Your turn when you want to play.':'A short greeting, one body at a time. Choose Quiet, then Your turn when you want to play.');$('hint').textContent='The greeting is authored. The response of the connected bodies comes from the model.';}catch(error){mode=previous;status(error.message,true);}};
$('replay').onclick=async()=>{stopReplay();clearHolds();mode='replay';status('Listening back to your finished passage…');try{await replay.play(transport.saveAudio());}catch(error){status(error.message,true);}};
$('quiet').onclick=()=>{clearHolds();if(mode==='replay'||filmPlaying()){stopReplay();status('Quiet. Your original passage is still here.');}else transport.quiet();};function newPassage(){stopReplay();movie.clear();clearHolds();mode='live';transport.newPassage();status(transport.state==='suspended'?'Your new passage is ready. Resume audio to play.':'Your turn. Touch one body and stay with what answers.');$('hint').textContent='Hold a body or its numbered pad, then release. A longer hold gives a stronger touch.';}
$('new').onclick=newPassage;
for(const event of ['pause','ended'])$('movie-preview').addEventListener(event,syncQuiet);
window.addEventListener('keydown',e=>{if(e.key==='Escape'){$('quiet').click();return;}if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;const body=keys.indexOf(e.key.toLowerCase());if(body>=0){e.preventDefault();start(body,`k-${body}`);}});
window.addEventListener('keyup',e=>{const body=keys.indexOf(e.key.toLowerCase());if(body>=0){e.preventDefault();finish(body,`k-${body}`);}});window.addEventListener('blur',clearHolds);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopReplay();clearHolds();transport.quiet();}});window.addEventListener('pagehide',event=>{enterToken++;stopReplay();clearHolds();transport.quiet();if(event.persisted){movie.cancel();return;}movie.dispose();replay.dispose();transport.dispose();scenePlaying?.dispose();sculpture?.dispose();world?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){syncQuiet();status(transport.state==='ended'?'Your passage is here. Listen back, keep it, or begin another.':'Welcome back. Enter the grove or continue when you’re ready.');}});
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('save').onclick=()=>{try{download(stereoWav(transport.saveAudio()),'audio/wav',`imagimusic-grove-${grove.seed}${rich()?'-partials':''}.wav`);status('The complete passage was saved as sound.');}catch(error){status(error.message,true);}};$('score').onclick=()=>download(JSON.stringify(transport.recording(),null,2),'application/json',`imagimusic-grove-${grove.seed}${rich()?'-partials':''}.json`);
for(const seed of GROVE_SEEDS){const option=document.createElement('option');option.value=seed;option.textContent=`Grove ${seed}`;$('seed').append(option);}const initial=Number(new URLSearchParams(location.search).get('seed'));if(GROVE_SEEDS.includes(initial))$('seed').value=initial;
if(new URLSearchParams(location.search).get('voice')==='partials')$('voice').value='partials';
configure();try{world=createGroveWorld($('world'));rebuildScene();scenePlaying=bindGrovePlaying({canvas:$('world'),controls:world.controls,getScene:()=>sculpture,camera:world.camera,canPlay:()=>mode!=='greeting'&&['ready','playing'].includes(transport.state),start,finish});}catch(error){$('world').hidden=true;status('The 3D view is unavailable here; the pads can still play this grove.');}
function draw(){
 const time=mode==='replay'?replay.time():transport.time(),frame=transport.session?.visual(time);if(world){applyGroveScene(sculpture,frame??{},pads.map((_,i)=>held.has(i)?holdVelocity(performance.now()-held.get(i).start):0),rich()?pads.map((_,i)=>DEFAULT_VOICE_CONFIG.positions[held.get(i)?.position??1]):[]);world.render();}
 for(const [body,hold] of held)pads[body].style.setProperty('--hold',`${holdVelocity(performance.now()-hold.start)*100}%`);
 let phase=transport.state==='ended'?'QUIET':transport.state==='preparing'?'OPENING THE GROVE':transport.state==='idle'?'BEFORE THE GESTURE':transport.state==='suspended'?'PAUSED':'ROOM TO LISTEN';
 if(mode==='greeting'&&transport.state==='playing'){const section=greeting.sections.findLast(s=>s.start<=time);phase=time>=greeting.duration?'THE GREETING HAS SETTLED':section?.id==='silence'?'LET THE RESPONSE FINISH':section?section.id.toUpperCase():'BEFORE THE GREETING';}
 if(mode==='replay')phase=replay.state==='ended'?'YOUR PASSAGE HAS SETTLED':'LISTENING BACK';$('phase').textContent=phase;requestAnimationFrame(draw);
}
draw();
