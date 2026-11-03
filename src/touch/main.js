import {createTouchView} from './view-framing.js';
import {touchKeepNames} from './keep-name.js';
import {compositionPageURL} from '../stage/composition-link.js';
import {touchConnectionHref,readTouchConnection} from './connection-link.js';
import {createTouchTransport} from './transport.js';
import {holdVelocity} from './session.js';
import {getLoomJourney} from '../listen/journeys.js';
import {answerPeak,stillnessBound,meeting} from '../score/call-answer.js';
import {createWorld} from '../stage/world.js';
import {loomSceneFrame,applyLoomScene} from '../loom/scene.js';
import {stereoWav,makeLoom,MAX_VISIBLE_BEAT_HZ} from '../loom/model.js';
const $=id=>document.getElementById(id),pads=[$('left'),$('right')],held=new Map();
let customConnection=null;
const selectedConnection=()=>$('bridge').value==='custom'?customConnection:getLoomJourney($('bridge').value);
let visualAveraged=false;
const restingHint=()=>settings.coupling===0?'These bodies ring independently; coupling is zero.':'Both bodies belong to the same ringing system.';
let pictureView,focusView='both';
let world,settings,stillAt=0,lastPhase='',lastGesture=null,connectionPending=false;
$('still-picture').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function describeView(){const still=$('still-picture').checked;$('world').setAttribute('aria-label',focusView!=='both'?`Close view of the ${focusView} body. ${still?'Still picture.':visualAveraged?'Averaged modeled envelope.':'Modeled displacement envelope.'} Both bodies remain audible.`:still?'A still view of two bodies.':visualAveraged?'Two bodies showing averaged modeled vibration envelopes.':'Two bodies whose width and glow follow modeled vibration envelopes.');$('view-note').textContent=still?'A still view. Sound, gestures and pad feedback are unchanged.':visualAveraged?'Fast beating: width and glow show averaged envelopes, not each beat. Sound is unchanged.':'Width and glow follow the modeled response.';}
$('still-picture').onchange=describeView;describeView();
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{
 focusView=button.dataset.view;describeView();
 for(const choice of document.querySelectorAll('[data-view]'))choice.setAttribute('aria-pressed',String(choice===button));
 $('focus-note').textContent=focusView==='both'?'Both bodies in view.':`Close view of the ${focusView} body. Both bodies remain audible and playable.`;
};
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
function controls({state,recording}){
 const playable=!connectionPending&&['ready','playing'].includes(state),has=!!recording?.events.length;
 pads.forEach(pad=>pad.disabled=!playable);$('begin').disabled=state==='preparing'||playable;
 $('begin').textContent=state==='preparing'?'Preparing the connection…':connectionPending?`Enter ${selectedConnection().title} ↗`:state==='suspended'?'Resume the instrument ↗':playable?'The instrument is open':'Enter the instrument ↗';
 $('quiet').disabled=!has||state==='ended'||state==='preparing';$('new').disabled=connectionPending||!has||state==='preparing';$('bridge').disabled=state==='preparing';$('save').disabled=!has||state==='preparing';$('score').disabled=!has||state==='preparing';
 $('count').textContent=has?`${recording.events.length} ${recording.events.length===1?'gesture':'gestures'} held here`:'Nothing played yet';
 if(state==='suspended')status('Audio was interrupted. Resume to keep playing this passage.');
 if(state==='ended')status('Quiet. Keep this passage, or begin a new one.');
}
const transport=createTouchTransport({onChange:controls});
const refreshControls=()=>controls({state:transport.state,recording:transport.recording()});
function configure(){
 const journey=selectedConnection();settings=journey.settings;
 $('inside-loom').href=compositionPageURL(location.href,'loom.html',{version:1,loom:{enabled:true,settings}});
 const listening=new URL('listen.html',location.href);if(!journey.custom)listening.searchParams.set('study',journey.id);
 const origin=new URLSearchParams(location.search),at=Number(origin.get('listenAt'));
 if(!journey.custom&&origin.get('fromStudy')===journey.id&&Number.isFinite(at)&&at>0)listening.searchParams.set('at',String(at));
 for(const link of document.querySelectorAll('[data-listen-connection]')){link.href=listening.href;if(!link.classList.contains('brand'))link.textContent=journey.custom?'Explore listening studies ↗':listening.searchParams.has('at')?'Return to your listening place ↗':'Listen to this connection ↗';}
 const frequencies=makeLoom(settings).system.normalFreqsHz,uncoupled=settings.coupling===0;
 visualAveraged=frequencies[1]-frequencies[0]>MAX_VISIBLE_BEAT_HZ;describeView();
 $('response-heading').textContent=uncoupled?'TWO BODIES, INDEPENDENT RESPONSES':'ONE GESTURE, A SHARED RESPONSE';
 $('listen-invitation').textContent=uncoupled?'Hear each on its own.':'Listen for the other.';
 $('connection-caption').textContent=uncoupled?'NO CONNECTION BETWEEN BODIES':'THE CONNECTION CARRIES THE RESPONSE';
 $('hint').textContent=restingHint();
 $('model-response').textContent=(uncoupled?'Coupling is zero. A touch excites only its own mass-and-spring resonator; no response passes to the other body.':visualAveraged?'A gesture excites the coupled mass-and-spring system. Both bodies respond immediately. Fast beating is averaged in the picture, so individual envelope swells are not shown.':'A gesture excites one body in a coupled mass-and-spring model. Both respond immediately; the other body’s first swell comes later.')+' No answering notes are added. Width and glow amplify displacement envelopes; the picture does not show audio-rate vibration or energy flow. The camera stays still unless you move it.';
 let reading='';if(!uncoupled&&!visualAveraged){const peak=answerPeak(settings,0);reading=peak.swellSeconds===null?' No distinct first envelope maximum was found on the 2 ms grid.':` A unit left touch gives the other body its first drawn envelope maximum at ${peak.swellSeconds.toFixed(3)} seconds, about ${(peak.ratio*100).toFixed(0)}% of the struck body’s first peak (2 ms measurement grid). This is a swell, not sound arriving after a delay.`;}
 $('model-detail').textContent=`This connection uses ${settings.frequency} Hz base tuning, ${settings.detune} cents detuning, coupling ${settings.coupling}, and loss ${settings.loss}/s.`+reading;
 const url=new URL(location.href),route=new URL(touchConnectionHref(settings),location.href);url.searchParams.delete('bridge');url.searchParams.delete('connection');for(const [key,value] of route.searchParams)url.searchParams.set(key,value);history.replaceState(null,'',url);stillAt=0;lastGesture=null;
}
async function enter(){clearHolds();if(transport.state==='suspended'&&!connectionPending){try{await transport.resume();status('The connection is open again. Your passage is still here.');}catch(error){status(error.message,true);}return;}status('Preparing the two responses…');try{const replacesPassage=!!transport.recording()?.events.length;await transport.enable(selectedConnection().settings);configure();if(replacesPassage){$('passage-name').value='';describeKeepNames();}connectionPending=false;refreshControls();stillAt=0;lastGesture=null;$('hint').textContent=restingHint();status(settings.coupling===0?'Touch either pad, then release. Each body rings independently.':'Touch either pad, then release. The other body is already connected.');if(world)$('world').parentElement.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(error){status(error.message,true);}}
$('begin').onclick=enter;$('bridge').onchange=()=>{
 clearHolds();
 if(!transport.session){configure();status('Connection selected. Enter the instrument when you are ready.');return;}
 connectionPending=true;transport.quiet();refreshControls();
 const kept=transport.recording()?.events.length?'Your current passage is still available to keep.':'The current connection is quiet.';
 status(`Next: ${selectedConnection().title}. ${kept} Enter the new connection when you are ready.`);
};
function clearHolds(){held.clear();pads.forEach(pad=>{pad.setAttribute('aria-pressed','false');pad.style.setProperty('--hold','0%');});}
function begin(body,key){if(connectionPending||!['ready','playing'].includes(transport.state)||held.has(body))return;held.set(body,{key,start:performance.now()});pads[body].setAttribute('aria-pressed','true');}
function finish(body,key,cancel=false){const hold=held.get(body);if(!hold||hold.key!==key)return;held.delete(body);pads[body].setAttribute('aria-pressed','false');pads[body].style.setProperty('--hold','0%');if(!cancel)play(body,holdVelocity(performance.now()-hold.start));}
function play(body,velocity){
 if(connectionPending)return;
 const before=transport.recording(),result=transport.strike(body,velocity);
 if(!result.accepted){status(result.reason==='headroom'?'Let this ring settle a little before adding another gesture.':result.reason==='capacity'?'This passage is full. Keep it, then begin a new one.':'Enter the instrument to play again.');return;}
 const record=transport.recording(),score=record.events.map(e=>({time:e.frame/record.sampleRate,body:e.body,velocity:e.velocity}));
 const note=score.at(-1);lastGesture=note;stillAt=stillnessBound(settings,score,note.time).stillAt??Infinity;
 const response=meeting(settings,before.events.map(e=>({time:e.frame/before.sampleRate,body:e.body,velocity:e.velocity})),note);
 const side=body?'right':'left',other=body?'left':'right';
 $('hint').textContent=response.relation==='first'?(settings.coupling===0?`The ${side} body rings independently.`:`Listen for the ${other} body to respond.`):response.relation==='softens'?`The ${side} body softens after this touch.`:response.relation==='grows'?`The ${side} body grows after this touch.`:'This touch meets the ring already here.';
 status('A gesture joins the passage. Keep listening, or touch again.');
}
for(const [body,pad] of pads.entries()){
 pad.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();pad.setPointerCapture(event.pointerId);begin(body,`pointer-${event.pointerId}`);};
 pad.onpointerup=event=>finish(body,`pointer-${event.pointerId}`);pad.onpointercancel=event=>finish(body,`pointer-${event.pointerId}`,true);pad.onlostpointercapture=event=>finish(body,`pointer-${event.pointerId}`,true);
 pad.onclick=event=>{if(event.detail===0)play(body,.5);};
}
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){clearHolds();transport.quiet();return;}
 if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea'))return;
 const body={f:0,j:1}[event.key.toLowerCase()];if(body===undefined)return;event.preventDefault();begin(body,`key-${body}`);
});
window.addEventListener('keyup',event=>{const body={f:0,j:1}[event.key.toLowerCase()];if(body!==undefined){event.preventDefault();finish(body,`key-${body}`);}});
window.addEventListener('blur',clearHolds);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearHolds();transport.quiet();}});window.addEventListener('pagehide',()=>transport.quiet());
$('quiet').onclick=()=>{clearHolds();transport.quiet();};$('new').onclick=()=>{clearHolds();transport.newPassage();$('passage-name').value='';describeKeepNames();stillAt=0;lastGesture=null;status('A new passage. Touch either body.');$('hint').textContent=restingHint();};
function keepNames(){return touchKeepNames($('passage-name').value);}
function describeKeepNames(){const names=keepNames();$('keep-filenames').textContent=names.sound+' · '+names.gestures;}
$('passage-name').oninput=describeKeepNames;describeKeepNames();
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('save').onclick=()=>{try{download(stereoWav(transport.saveAudio()),'audio/wav',keepNames().sound);status('Sound download requested. Keep the gestures too if you want to reopen the picture.');}catch(error){status(error.message,true);}};
$('score').onclick=()=>{download(JSON.stringify(transport.recording(),null,2),'application/json',keepNames().gestures);status('Gesture download requested. Open this JSON in Return to saved Touch gestures to revisit the passage.');};
let routeError=null;
try{const requested=readTouchConnection(location.search);if(requested.custom){customConnection=requested;const option=document.createElement('option');option.value='custom';option.textContent=requested.title;$('bridge').append(option);}$('bridge').value=requested.id;}catch(error){routeError=error;$('bridge').value='close-kin';}
configure();
if(routeError)status(`Could not open the linked connection: ${routeError.message} Close kin is selected instead. Choose a connection and enter when ready.`,true);
else if(customConnection)status('Your custom connection is selected. Enter to begin a new passage; no saved gestures were carried over.');
try{world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;world.rail.visible=false;world.loom.root.position.set(0,0,1);world.loom.root.scale.setScalar(1);world.loom.root.visible=true;world.camera.position.set(0,3.6,10);world.controls.target.set(0,1.1,1);world.controls.update();pictureView=createTouchView(world);$('view-controls').hidden=false;}catch(error){$('world').hidden=true;status('The 3D view is unavailable; the pads can still play the connection.');}
function draw(){
 const t=transport.time();if(world){pictureView.update({focus:focusView,width:$('world').clientWidth,height:$('world').clientHeight});world.loom.bodies.forEach((body,i)=>{body.body.parent.visible=focusView==='both'||i===(focusView==='left'?0:1);});world.loom.bridge.visible=settings.coupling>0&&focusView==='both';const still=$('still-picture').checked;const resting={time:0,envelope:[0,0],displacement:[0,0],averaged:false,strikes:[]};const frame=still?resting:transport.session?.visual(t)??resting;applyLoomScene(loomSceneFrame(frame,settings,{active:!still}),world.loom);world.render();}
 for(const [body,hold] of held)pads[body].style.setProperty('--hold',`${holdVelocity(performance.now()-hold.start)*100}%`);
 const phase=transport.state==='ended'?'QUIET':lastGesture&&t<stillAt?(settings.coupling===0?'LISTEN TO THE TOUCHED BODY':'LISTEN ACROSS THE CONNECTION'):transport.state==='preparing'?'PREPARING':transport.state==='idle'?'READY WHEN YOU ARE':'STILL';if(phase!==lastPhase){$('phase').textContent=phase;lastPhase=phase;}
 requestAnimationFrame(draw);
}
draw();
