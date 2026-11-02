import {createTouchTransport} from './transport.js';
import {holdVelocity} from './session.js';
import {getLoomJourney} from '../listen/journeys.js';
import {answerPeak,stillnessBound,meeting} from '../score/call-answer.js';
import {createWorld} from '../stage/world.js';
import {loomSceneFrame,applyLoomScene} from '../loom/scene.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id),pads=[$('left'),$('right')],held=new Map();
let world,settings,stillAt=0,lastPhase='',lastGesture=null,connectionPending=false;
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
function controls({state,recording}){
 const playable=!connectionPending&&['ready','playing'].includes(state),has=!!recording?.events.length;
 pads.forEach(pad=>pad.disabled=!playable);$('begin').disabled=state==='preparing'||playable;
 $('begin').textContent=state==='preparing'?'Preparing the connection…':connectionPending?`Enter ${getLoomJourney($('bridge').value).title} ↗`:state==='suspended'?'Resume the instrument ↗':playable?'The instrument is open':'Enter the instrument ↗';
 $('quiet').disabled=!has||state==='ended'||state==='preparing';$('new').disabled=connectionPending||!has||state==='preparing';$('bridge').disabled=state==='preparing';$('save').disabled=!has||state==='preparing';$('score').disabled=!has||state==='preparing';
 $('count').textContent=has?`${recording.events.length} ${recording.events.length===1?'gesture':'gestures'} held here`:'Nothing played yet';
 if(state==='suspended')status('Audio was interrupted. Resume to keep playing this passage.');
 if(state==='ended')status('Quiet. Keep this passage, or begin a new one.');
}
const transport=createTouchTransport({onChange:controls});
const refreshControls=()=>controls({state:transport.state,recording:transport.recording()});
function configure(){
 const journey=getLoomJourney($('bridge').value);settings=journey.settings;
 const listening=new URL('listen.html',location.href);listening.searchParams.set('study',journey.id);
 const origin=new URLSearchParams(location.search),at=Number(origin.get('listenAt'));
 if(origin.get('fromStudy')===journey.id&&Number.isFinite(at)&&at>0)listening.searchParams.set('at',String(at));
 for(const link of document.querySelectorAll('[data-listen-connection]')){link.href=listening.href;if(!link.classList.contains('brand'))link.textContent=listening.searchParams.has('at')?'Return to your listening place ↗':'Listen to this connection ↗';}
 const peaks=[0,1].map(body=>answerPeak(settings,body));
 $('model-detail').textContent=`This connection uses ${settings.frequency} Hz base tuning, ${settings.detune} cents detuning, coupling ${settings.coupling}, and loss ${settings.loss}/s. A unit left touch gives the other body its first drawn envelope maximum at ${peaks[0].swellSeconds?.toFixed(3)??'no distinct'} seconds, about ${(peaks[0].ratio*100).toFixed(0)}% of the struck body’s first peak (2 ms measurement grid). This is a swell, not sound arriving after a delay.`;
 const url=new URL(location.href);url.searchParams.set('bridge',$('bridge').value);history.replaceState(null,'',url);stillAt=0;lastGesture=null;
}
async function enter(){clearHolds();if(transport.state==='suspended'&&!connectionPending){try{await transport.resume();status('The connection is open again. Your passage is still here.');}catch(error){status(error.message,true);}return;}status('Preparing the two responses…');try{await transport.enable(getLoomJourney($('bridge').value).settings);configure();connectionPending=false;refreshControls();stillAt=0;lastGesture=null;$('hint').textContent='Both bodies belong to the same ringing system.';status('Touch either pad, then release. The other body is already connected.');if(world)$('world').parentElement.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(error){status(error.message,true);}}
$('begin').onclick=enter;$('bridge').onchange=()=>{
 clearHolds();
 if(!transport.session){configure();status('Connection selected. Enter the instrument when you are ready.');return;}
 connectionPending=true;transport.quiet();refreshControls();
 const kept=transport.recording()?.events.length?'Your current passage is still available to keep.':'The current connection is quiet.';
 status(`Next: ${getLoomJourney($('bridge').value).title}. ${kept} Enter the new connection when you are ready.`);
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
 $('hint').textContent=response.relation==='first'?`Listen for the ${other} body to respond.`:response.relation==='softens'?`The ${side} body softens with this touch.`:response.relation==='grows'?`The ${side} body grows with this touch.`:'This touch meets the ring already here.';
 status('A gesture joins the connection. Keep listening, or touch again.');
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
$('quiet').onclick=()=>{clearHolds();transport.quiet();};$('new').onclick=()=>{clearHolds();transport.newPassage();stillAt=0;lastGesture=null;status('A new passage. Touch either body.');$('hint').textContent='Both bodies belong to the same ringing system.';};
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('save').onclick=()=>{try{download(stereoWav(transport.saveAudio()),'audio/wav','imagimusic-touch.wav');status('The complete passage was saved as sound.');}catch(error){status(error.message,true);}};
$('score').onclick=()=>download(JSON.stringify(transport.recording(),null,2),'application/json','imagimusic-touch.json');
const requested=new URLSearchParams(location.search).get('bridge');if(['close-kin','distant-cousins','tight-weave'].includes(requested))$('bridge').value=requested;configure();
try{world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;world.rail.visible=false;world.loom.root.position.set(0,0,1);world.loom.root.scale.setScalar(1);world.loom.root.visible=true;world.camera.position.set(0,3.6,10);world.controls.target.set(0,1.1,1);world.controls.update();}catch(error){$('world').hidden=true;status('The 3D view is unavailable; the pads can still play the connection.');}
function draw(){
 const t=transport.time();if(world){const zoom=Math.min(1,$('world').clientWidth/Math.max(1,$('world').clientHeight)/1.5);if(world.camera.zoom!==zoom){world.camera.zoom=zoom;world.camera.updateProjectionMatrix();}const frame=transport.session?.visual(t)??{time:0,envelope:[0,0],displacement:[0,0],averaged:false,strikes:[]};applyLoomScene(loomSceneFrame(frame,settings,{active:true}),world.loom);world.render();}
 for(const [body,hold] of held)pads[body].style.setProperty('--hold',`${holdVelocity(performance.now()-hold.start)*100}%`);
 const phase=transport.state==='ended'?'QUIET':lastGesture&&t<stillAt?'LISTEN ACROSS THE CONNECTION':transport.state==='preparing'?'PREPARING':transport.state==='idle'?'READY WHEN YOU ARE':'STILL';if(phase!==lastPhase){$('phase').textContent=phase;lastPhase=phase;}
 requestAnimationFrame(draw);
}
draw();
