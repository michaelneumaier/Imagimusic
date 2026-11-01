import {composeGrove,GROVE_SEEDS} from '../score/grove.js';
import {composeRestInvitation,createRestExploration} from '../score/grove-rest.js';
import {createRestComparisonSession} from './rest-comparison-session.js';
import {createRestHost} from './contact-host.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
import {bindGrovePlaying,groveStrikeZone} from './interaction.js';
import {bindGroveMovieControls} from './movie-controls.js';
import {createGroveReplay} from './replay.js';
import {restWorkerJob} from './contact-job.js';
import {restReplayFrame} from './rest-replay-picture.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id),strikeKeys=['a','s','d'],restKeys=['j','k','l'],hands=new Map();
let grove=composeGrove({seed:3}),world,sculpture,picking,invitation=null,saving=false,buttons=[],viewToken=0,replayMode=false,picture=null,pictureAbort=null,playToken=0,exploring=false,exploration=null,comparisonView=null,shownGrove=null;
const status=(text,error=false)=>{$('status').textContent=text;$('status').dataset.error=String(error);};
const replay=createGroveReplay({onChange:({state})=>{if(!replayMode)return;sync();if(state==='ended')status(comparisonView?`Comparison on Grove ${comparisonView.targetSeed} has settled. Your original passage is still here.`:'Your passage has settled. Listen again, keep it, or begin another.');if(state==='suspended')status('Listening was interrupted. Listen back restarts your saved passage.');}});
const comparison=createRestComparisonSession({onChange:()=>syncComparison()});
function stopReplay({pauseFilms=true}={}){if(pauseFilms){$('movie-preview').pause();$('compare-movie-preview').pause();}playToken++;const wasPreparing=comparison.state==='preparing';comparison.cancel();if(wasPreparing)comparisonStatus('Preparation cancelled. Your original passage is still here.');comparisonView=null;showGrove(grove);replayMode=false;pictureAbort?.abort();pictureAbort=null;replay.stop();sync();}
const movie=bindGroveMovieControls({onPreviewPlay:()=>{stopReplay({pauseFilms:false});$('compare-movie-preview').pause();status('Playing your saved original film.');},getSource:()=>{stopReplay();return {recording:host.recording(),pcm:host.saveAudio(),camera:{position:world.camera.position.toArray(),target:world.controls.target.toArray()}};}});
const comparisonMovie=bindGroveMovieControls({prefix:'compare-',onPreviewPlay:()=>{stopReplay({pauseFilms:false});$('movie-preview').pause();status('Playing the comparison film shown below.');},getSource:()=>{const result=comparison.result;if(!result?.available)throw new Error('Prepare a playable comparison first.');stopReplay();return {recording:result.record,pcm:result.pcm,camera:{position:world.camera.position.toArray(),target:world.controls.target.toArray()},filenamePrefix:`comparison-${result.sourceSeed}-to-${result.targetSeed}-`,captionPrefix:`Comparison from Grove ${result.sourceSeed} · `};}});
function comparisonStatus(text,error=false){$('compare-status').textContent=text;$('compare-status').dataset.error=String(error);}
function syncComparison(){
 const result=comparison.result,busy=comparison.state==='preparing',finished=host.state==='ended'&&!!host.stats?.strikes;
 $('compare-seed').disabled=!finished;$('compare-play').disabled=!finished||!$('compare-seed').value||busy;$('compare-cancel').hidden=!busy;
 $('compare-result').hidden=!result;
 for(const id of ['compare-again','compare-save','compare-score'])$(id).disabled=!result?.available;
 if(result)$('compare-caption').textContent=`Comparison: Grove ${result.sourceSeed} → Grove ${result.targetSeed}. ${result.note}`;
 comparisonMovie.setReady(!!result?.available&&!!world&&!busy);
}
function clearComparison(){comparison.clear();comparisonMovie.clear();comparisonStatus('Your original passage stays here.');}
function showGrove(next){
 if(shownGrove===next)return;shownGrove=next;
 if(world){if(sculpture){world.scene.remove(sculpture.root);sculpture.dispose();}sculpture=createGroveScene(next);world.scene.add(sculpture.root);}
 $('identity').textContent=`GROVE ${next.seed}${next!==grove?' · COMPARISON':''}`;
}
const host=createRestHost({onChange:({state,error})=>{sync();if(state==='error'){clearExploration();status(error.message,true);}else if(state==='ended'){hands.clear();status(invitation?'Your turn: strike once, rest on that body, then try its neighbor.':'Quiet. Keep this passage, or begin your own.');}else if(state==='suspended')status('Audio paused. Resume keeps this passage; hands and Quiet can still be released.');},onDecision:ack=>{advanceExploration(ack);if(!ack.accepted&&ack.reason!=='ended')status(ack.reason==='headroom'?'Let this ring breathe before another strike.':'This passage is full of gestures. Choose Quiet, keep it, and begin another.');}});
function clearExploration(){exploring=false;exploration=null;syncExploration();}
function syncExploration(){
 const active=open(),fresh=active&&!host.stats?.strikes&&!host.stats?.activeContacts;
 if(!exploring)$('explore-prompt').textContent=fresh?'Try a gesture with one body and its neighbor, or play freely.':host.state==='preparing'?'Opening the instrument…':host.state==='idle'?'Enter Rest to try an optional gesture with a body and its neighbor.':'Begin a fresh passage to follow a gesture, or keep exploring freely.';
 $('explore').disabled=!fresh||exploring;$('explore-stop').hidden=!exploring;$('explore').parentElement.parentElement.dataset.active=String(exploring);
}
function advanceExploration(ack){
 if(!exploring||invitation||!ack.accepted)return;
 if(ack.event.kind==='quiet'){clearExploration();return;}
 if(!exploration){if(ack.event.kind!=='strike')return;exploration=createRestExploration(host.recipe,{body:ack.event.body});}
 const before=exploration.state.step,next=exploration.acknowledge(ack);
 if(before!==next.step)$('explore-prompt').textContent=next.prompt;
}
function filmsPlaying(){return ['movie-preview','compare-movie-preview'].some(id=>!$(id).paused&&!$(id).ended);}
function open(){return !invitation&&['ready','playing'].includes(host.state);}
function sync(){
 const state=host.state,active=['ready','playing'].includes(state),ended=state==='ended',has=!!host.stats?.strikes;
 $('begin').disabled=active||state==='preparing'||state==='ending';$('begin').textContent=state==='preparing'?'Opening Rest…':state==='suspended'?'Resume Rest ↗':ended?'Begin another ↗':active?'Rest is open':'Enter Rest ↗';
 $('invite').disabled=!active||!!invitation||has||!!host.stats?.activeContacts;$('quiet').disabled=filmsPlaying()?false:replayMode?!['preparing','playing','suspended'].includes(replay.state):!['ready','playing','suspended'].includes(state);$('replay').disabled=!ended||!has||replay.state==='preparing';$('new').disabled=!ended;$('save').disabled=!ended||!has||saving;$('score').disabled=!ended||!has;$('seed').disabled=state==='preparing';
 syncComparison();syncExploration();movie.setReady(ended&&has&&!!world);
 for(const {strike,rest} of buttons){strike.disabled=!open();rest.disabled=!open();}
}
function strike(body,position=Number($('position').value)){if(!open())return;host.send({kind:'strike',body,position,velocity:.55});status('Listen for the others.');}
function hand(body,key,zone=Number($('position').value)){
 if(!open()||hands.has(body))return;const result=host.send({kind:'contact',body,zone,strength:Number($('strength').value)});if(result.queued)hands.set(body,key);
}
function lift(body,key){if(hands.get(body)!==key)return;hands.delete(body);host.send({kind:'contact',body,zone:null});}
function releaseAll(){for(const [body,key] of hands)lift(body,key);picking?.reset();}
function build(){
 $('pads').replaceChildren();buttons=grove.bodies.map((_,body)=>{const box=document.createElement('article');box.className='rest-body';const title=document.createElement('h2');title.textContent=String(body+1).padStart(2,'0');const strikeButton=document.createElement('button'),rest=document.createElement('button'),hint=document.createElement('small');strikeButton.textContent='Strike';strikeButton.setAttribute('aria-label',`Strike body ${body+1}`);rest.textContent='Rest a hand';rest.setAttribute('aria-label',`Rest a hand on body ${body+1}; hold or toggle with keyboard`);rest.setAttribute('aria-pressed','false');hint.textContent=`${strikeKeys[body].toUpperCase()} · ${restKeys[body].toUpperCase()}`;
 strikeButton.onclick=()=>strike(body);rest.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();rest.setPointerCapture(e.pointerId);hand(body,`pad-${e.pointerId}`);};rest.onpointerup=e=>lift(body,`pad-${e.pointerId}`);rest.onpointercancel=e=>lift(body,`pad-${e.pointerId}`);rest.onlostpointercapture=e=>lift(body,`pad-${e.pointerId}`);rest.onclick=e=>{if(e.detail===0){const key=`toggle-${body}`;hands.has(body)?lift(body,hands.get(body)):hand(body,key);}};
 box.append(title,strikeButton,rest,hint);$('pads').append(box);return {strike:strikeButton,rest};});
 showGrove(grove);$('compare-seed').replaceChildren(new Option('Choose a Grove',''),...GROVE_SEEDS.filter(seed=>seed!==grove.seed).map(seed=>new Option(`Grove ${seed}`,String(seed))));sync();
}
function revealInstrument(){if(world)$('world').parentElement.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
async function enter(){try{if(host.state==='suspended'){await host.resume();status('Rest is open again.');return;}if(host.state==='ended'){newPassage();return;}invitation=null;clearExploration();status('Preparing the connected bodies…');await host.enable(grove);if(host.state==='ready'){status('Strike once. Rest a hand while it rings, then lift.');revealInstrument();}}catch(error){status(error.message,true);}}
function newPassage(){stopReplay();movie.clear();clearComparison();picture=null;releaseAll();viewToken++;invitation=null;clearExploration();host.newPassage();status('Your turn. Strike once, rest on that body, then try its neighbor.');sync();revealInstrument();}
$('explore').onclick=()=>{if($('explore').disabled)return;exploring=true;exploration=null;$('explore-prompt').textContent='Strike any body once. Listen to its ring.';syncExploration();$('explore-prompt').parentElement.scrollIntoView({block:'nearest'});};$('explore-stop').onclick=clearExploration;
$('begin').onclick=enter;$('new').onclick=newPassage;$('quiet').onclick=()=>{if(replayMode||filmsPlaying()){stopReplay();status('Quiet. Your saved passage is still here.');return;}releaseAll();host.quiet();status(host.state==='suspended'?'Quiet is waiting for Resume.':'Letting this passage settle…');};
$('invite').onclick=()=>{try{clearExploration();releaseAll();invitation=composeRestInvitation(host.recipe);host.schedule(invitation.commands);revealInstrument();status('First a free ring. Then a hand, a neighbor, and all three together.');sync();}catch(error){invitation=null;status(error.message,true);}};
$('seed').onchange=()=>{stopReplay();movie.clear();clearComparison();picture=null;releaseAll();viewToken++;invitation=null;clearExploration();grove=composeGrove({seed:Number($('seed').value)});build();status('Preparing this grove…');host.enable(grove).then(()=>status('Strike once. Rest a hand while it rings, then lift.')).catch(error=>status(error.message,true));const url=new URL(location.href);url.searchParams.set('seed',grove.seed);history.replaceState(null,'',url);};
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('score').onclick=()=>{try{download(JSON.stringify(host.recording(),null,2),'application/json',`imagimusic-rest-${grove.seed}.json`);}catch(error){status(error.message,true);}};
$('save').onclick=async()=>{const own=viewToken,seed=grove.seed;saving=true;sync();status('Rebuilding your passage for the sound file…');try{const pcm=await host.saveAudio();if(own!==viewToken)return;download(stereoWav(pcm),'audio/wav',`imagimusic-rest-${seed}.wav`);status('Your passage is saved as sound.');}catch(error){if(own===viewToken)status(error.message,true);}finally{saving=false;sync();}};
$('replay').onclick=async()=>{
 stopReplay();replayMode=true;const own=++playToken;pictureAbort=new AbortController();status('Preparing your passage to listen back…');
 try{const prepared=picture?Promise.resolve(picture):restWorkerJob(new URL('./contact-picture-worker.js',import.meta.url),{record:host.recording(),recipe:host.recipe},{signal:pictureAbort.signal}).then(result=>{if(own===playToken)picture=result.picture;return result.picture;});
 await replay.play(Promise.all([host.saveAudio(),prepared]).then(([pcm])=>pcm));if(own===playToken&&replay.state==='playing')status('Listening back to your saved passage.');
 }catch(error){if(own===playToken){replayMode=false;status(error.message,true);}}finally{if(own===playToken)sync();}
};
async function playComparison(existing=null){
 stopReplay();replayMode=true;const own=++playToken;
 comparisonStatus(existing?`Listening to the comparison on Grove ${existing.targetSeed}.`:'Preparing another Grove for your passage…');status('Preparing a comparison. Your original passage is kept.');
 try{
  const prepared=existing?Promise.resolve(existing):comparison.prepare(host.recording(),Number($('compare-seed').value));
  await replay.play(prepared.then(result=>{
   if(own!==playToken)throw new DOMException('Comparison cancelled.','AbortError');
   if(!result.available)throw new Error(result.note);
   comparisonView=result;showGrove(result.record.grove);comparisonStatus(`Grove ${result.targetSeed}: ${result.note}`);return result.pcm;
  }));
  if(own===playToken&&replay.state==='playing'){status(`Listening to the comparison on Grove ${comparisonView.targetSeed}.`);revealInstrument();}
 }catch(error){if(own===playToken){stopReplay();comparisonStatus(error.message,error.name!=='AbortError');status('Your original passage is still here.');}}
 finally{sync();}
}
$('compare-seed').onchange=syncComparison;
$('compare-play').onclick=()=>{if(!$('compare-play').disabled)playComparison();};
$('compare-again').onclick=()=>{if(comparison.result?.available)playComparison(comparison.result);};
$('compare-cancel').onclick=()=>{stopReplay();comparisonStatus('Preparation cancelled. Your original passage and previous comparison are still here.');status('Quiet. Your original passage is still here.');};
const comparisonStem=result=>`imagimusic-rest-comparison-${result.sourceSeed}-to-${result.targetSeed}`;
$('compare-save').onclick=()=>{const result=comparison.result;if(result?.available)download(stereoWav(result.pcm),'audio/wav',comparisonStem(result)+'.wav');};
$('compare-score').onclick=()=>{const result=comparison.result;if(result?.available)download(JSON.stringify(result.record,null,2),'application/json',comparisonStem(result)+'.json');};
for(const id of ['movie-preview','compare-movie-preview'])for(const event of ['pause','ended'])$(id).addEventListener(event,()=>sync());
window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();$('quiet').click();return;}if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;const key=e.key.toLowerCase(),s=strikeKeys.indexOf(key),r=restKeys.indexOf(key);if(s>=0){e.preventDefault();strike(s);}if(r>=0){e.preventDefault();hand(r,`key-${r}`);}});
window.addEventListener('keyup',e=>{const body=restKeys.indexOf(e.key.toLowerCase());if(body>=0)lift(body,`key-${body}`);});window.addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopReplay();releaseAll();host.quiet();}});window.addEventListener('pagehide',()=>{viewToken++;movie.dispose();comparisonMovie.dispose();stopReplay();comparison.dispose();replay.dispose();picking?.dispose();host.dispose();});
const initial=Number(new URLSearchParams(location.search).get('seed'));if([3,7,11].includes(initial)){$('seed').value=initial;grove=composeGrove({seed:initial});}
try{world=createGroveWorld($('world'));}catch{status('The 3D view is unavailable; the body controls still work.');$('world').hidden=true;}build();
if(world)picking=bindGrovePlaying({canvas:$('world'),controls:world.controls,getScene:()=>sculpture,camera:world.camera,canPlay:open,start(body,key,hit){const zone=groveStrikeZone(hit.positionU,host.recipe.positions);if($('gesture').value==='strike')strike(body,zone);else hand(body,key,zone);},finish:lift});
function draw(){const activePicture=comparisonView?.picture??picture,zones=comparisonView?.record.zones??host.recipe?.zones;const frame=replayMode&&activePicture&&replay.state!=='preparing'?restReplayFrame(activePicture,replay.time()):host.visual(),contacts=frame.contacts??[];if(world){applyGroveScene(sculpture,frame,(shownGrove??grove).bodies.map((_,i)=>contacts[i]?contacts[i].strength===1?1:.4:0),(shownGrove??grove).bodies.map((_,i)=>contacts[i]?zones[contacts[i].zone]:undefined));world.render();}buttons.forEach(({rest},i)=>rest.setAttribute('aria-pressed',String(!!contacts[i])));
 let phase=host.state==='ended'?'QUIET':host.state==='preparing'?'OPENING REST':host.state==='suspended'?'PAUSED':host.state==='idle'?'BEFORE THE GESTURE':'ROOM TO LISTEN';if(invitation&&host.state==='playing'){const beat=(frame.time??0)*invitation.tempo/60,part=invitation.sections.findLast(s=>beat>=s.beats[0]);phase={ring:'LET IT RING',rest:'A HAND ON THE FIRST BODY',across:'A HAND ON ITS NEIGHBOR',together:'THREE VOICES, A LIGHT HAND',quiet:'QUIET'}[part?.id]??phase;}if(replayMode)phase=replay.state==='ended'?'YOUR PASSAGE HAS SETTLED':replay.state==='preparing'?'PREPARING YOUR PASSAGE':'LISTENING BACK';if(comparisonView)phase=`GROVE ${comparisonView.targetSeed} · ${replay.state==='ended'?'COMPARISON SETTLED':'COMPARISON'}`;$('phase').textContent=phase;requestAnimationFrame(draw);}
draw();
