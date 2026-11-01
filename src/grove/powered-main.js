import {composeGrove} from '../score/grove.js';
import {poweredNextInvitation} from '../score/grove-powered.js';
import {createResponseCauses,responseCausesForRecord} from './response-causes.js';
import {createPoweredHost} from './powered-host.js';
import {createPoweredGesture} from './powered-gesture.js';
import {createResponseTrace,advanceResponseTrace} from './response-trace.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
import {bindGrovePlaying,groveStrikeZone} from './interaction.js';
import {createGroveReplay} from './replay.js';
import {restWorkerJob} from './contact-job.js';
import {restReplayFrame} from './rest-replay-picture.js';
import {stereoWav} from '../loom/model.js';
const $=id=>document.getElementById(id),pads=[$('upper'),$('tip')];
let grove=composeGrove({seed:3}),world,scene,picking,picture=null,pictureAbort=null,replayMode=false,saving=false,revision=0,trace=null,traceMode=null,traceRecipe=null,traceReplayIndex=0,causes=null;
const status=text=>{$('status').textContent=text;};
const host=createPoweredHost({onChange:({state,error})=>{if(state==='playing'&&host.recipe!==traceRecipe){trace?.reset();traceRecipe=host.recipe;traceMode='live';causes=createResponseCauses({sampleRate:host.recipe.sampleRate,driver:host.driver});}sync();if(state==='idle')hands.clear();if(state==='ended'){hands.clear();const record=host.recording();if(traceMode==='live')causes=responseCausesForRecord(record);$('next-touch').textContent=poweredNextInvitation(record,host.recipe);status('Let that settle. Listen back, or begin again with a different touch.');}if(state==='suspended')status('Audio paused. Resume continues this encounter.');if(state==='error'){trace?.reset();traceMode=null;hands.clear();status(error.message);}},onDecision:ack=>{if(traceMode==='live'&&causes)causes.consume(ack);if(!ack.accepted&&ack.reason==='contact-limit')status('This encounter has enough gestures. Lift, listen, and begin another.');}});
const hands=createPoweredGesture({send:command=>host.send(command)});
const replay=createGroveReplay({onChange:({state})=>{sync();if(replayMode&&state==='ended')status('Your encounter has settled.');if(replayMode&&state==='suspended')status('Listening paused. Listen back starts your saved encounter again.');}});
function active(){return ['preparing','playing','suspended'].includes(host.state)&&!replayMode;}
function sync(){
 const state=host.state,ended=state==='ended',busy=['preparing','playing','suspended','ending'].includes(state);
 $('begin').disabled=busy&&state!=='suspended';$('begin').textContent=state==='preparing'?'Preparing…':state==='suspended'?'Resume ↗':ended?'Begin again ↗':'Begin ↗';$('seed').disabled=busy||saving;
 $('quiet').disabled=!busy&&!['preparing','playing','suspended'].includes(replay.state);pads.forEach(p=>p.disabled=!active());
 $('keeping').hidden=!ended;$('replay').disabled=!ended||replay.state==='preparing';$('save').disabled=!ended||saving;$('score').disabled=!ended;
}
function releaseAll(){hands.reset();picking?.reset();}
function stopReplay(){revision++;replayMode=false;pictureAbort?.abort();pictureAbort=null;replay.stop();}
function reveal(){if(world)$('world').parentElement.scrollIntoView({block:'start',behavior:'instant'});}
function showGrove(){trace?.reset();traceMode=null;traceRecipe=null;causes=null;if(world){if(scene){world.scene.remove(scene.root);scene.dispose();}scene=createGroveScene(grove,{bodyLabels:['TOUCH 01']});world.scene.add(scene.root);}$('identity').textContent=`GROVE ${grove.seed}`;}
$('begin').onclick=async()=>{try{if(host.state==='suspended'){await host.resume();return;}stopReplay();hands.clear();picture=null;status('Preparing… You can rest a hand now, or wait and listen.');reveal();if(await host.begin(grove))status('Rest a hand on the first body. Move it, then lift.');}catch(error){status(error.message);}sync();};
$('quiet').onclick=()=>{stopReplay();releaseAll();host.quiet();status(host.state==='ending'?'Letting the sound settle…':'Quiet.');sync();};
$('seed').onchange=()=>{stopReplay();hands.clear();picture=null;grove=composeGrove({seed:Number($('seed').value)});showGrove();status('Begin to hear this Grove. Your previous encounter remains available until then.');sync();};
for(const [zone,pad] of pads.entries()){
 pad.onpointerdown=e=>{if(e.button!==0||!active())return;e.preventDefault();pad.setPointerCapture(e.pointerId);hands.hold(`pad-${e.pointerId}`,zone);};
 const lift=e=>hands.release(`pad-${e.pointerId}`);pad.onpointerup=lift;pad.onpointercancel=lift;pad.onlostpointercapture=lift;
 pad.onclick=e=>{if(e.detail===0&&active()){const id=`toggle-${zone}`;hands.zone===zone?hands.reset():hands.hold(id,zone);}};
}
$('replay').onclick=async()=>{
 stopReplay();replayMode=true;reveal();const own=revision,abort=new AbortController();pictureAbort=abort;
 // Resume playback within this click, before waiting on either worker.
 const record=host.recording(),recipe=host.recipe;grove=record.grove;$('seed').value=grove.seed;showGrove();traceMode='replay';traceReplayIndex=0;causes=responseCausesForRecord(record);
 const prepared=Promise.all([host.saveAudio(),picture?Promise.resolve({picture}):restWorkerJob(new URL('./powered-picture-worker.js',import.meta.url),{record,recipe},{signal:abort.signal})]).then(([pcm,result])=>{if(own!==revision)throw new DOMException('Cancelled','AbortError');picture=result.picture;return pcm;});
 try{status('Preparing your encounter…');await replay.play(prepared);if(own===revision&&replay.state==='playing')status('Listening to your touch, exactly as timed.');}catch(error){if(error.name!=='AbortError')status(error.message);}sync();
};
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('save').onclick=async()=>{saving=true;sync();try{const record=host.recording(),pcm=await host.saveAudio();download(stereoWav(pcm),'audio/wav',`imagimusic-powered-${record.grove.seed}.wav`);status('Your sound is ready to keep.');}catch(error){status(error.message);}finally{saving=false;sync();}};
$('score').onclick=()=>{try{const record=host.recording();download(JSON.stringify(record,null,2),'application/json',`imagimusic-powered-${record.grove.seed}.json`);}catch(error){status(error.message);}};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();$('quiet').click();return;}if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;const zone=['j','k'].indexOf(e.key.toLowerCase());if(zone>=0&&active()){e.preventDefault();hands.hold(`key-${zone}`,zone);}});
window.addEventListener('keyup',e=>{const zone=['j','k'].indexOf(e.key.toLowerCase());if(zone>=0)hands.release(`key-${zone}`);});window.addEventListener('blur',releaseAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopReplay();releaseAll();host.quiet();}});
window.addEventListener('pagehide',()=>{stopReplay();replay.dispose();host.dispose();picking?.dispose();trace?.dispose();world?.dispose();});
try{world=createGroveWorld($('world'));trace=createResponseTrace();world.scene.add(trace.root);}catch{status('The 3D view is unavailable. The two touch pads still work.');$('world').hidden=true;$('trace-toggle').disabled=true;}showGrove();
if(world)picking=bindGrovePlaying({canvas:$('world'),controls:world.controls,getScene:()=>scene,camera:world.camera,canPlay:active,acceptHit:hit=>hit.body===0,start(body,key,hit){hands.hold(key,groveStrikeZone(hit.positionU,[.3,1]));},change(body,key,hit){hit?hands.hold(key,groveStrikeZone(hit.positionU,[.3,1])):hands.release(key);},finish(body,key){hands.release(key);}});
$('trace-toggle').onclick=()=>{if(!trace)return;const visible=!trace.root.visible;trace.setVisible(visible);$('trace-toggle').setAttribute('aria-pressed',String(visible));$('trace-toggle').textContent=visible?'Hide the trace':'Trace the response';$('trace-caption').hidden=$('trace-legend').hidden=$('cause-legend').hidden=!visible;};
function draw(){
 const frame=replayMode&&picture&&replay.state!=='preparing'?restReplayFrame(picture,replay.time()):host.visual(),contacts=frame.contacts??[],showSource=!!frame.driverActive&&(replayMode?replay.state==='playing':host.state==='playing'||host.state==='ending');
 if(trace&&frame.envelope?.length===3&&traceMode==='live'&&!replayMode&&['playing','ending','ended'].includes(host.state))trace.append(frame);
 if(trace&&traceMode==='replay'&&replayMode&&picture&&['playing','ended'].includes(replay.state)){traceReplayIndex=advanceResponseTrace(trace,picture,replay.time(),traceReplayIndex);}
 if(trace&&causes&&((traceMode==='live'&&!replayMode&&['playing','ending','ended'].includes(host.state))||(traceMode==='replay'&&replayMode&&['playing','ended'].includes(replay.state))))trace.setCauses(causes.at(frame.time));
 if(world){trace?.resize(world.camera);scene.bodies[0].label.scale.set(.3/world.camera.zoom,.075/world.camera.zoom,1);applyGroveScene(scene,frame,grove.bodies.map((_,i)=>contacts[i]?1:0),grove.bodies.map((_,i)=>contacts[i]?[.3,1][contacts[i].zone]:undefined));world.render();}
 pads.forEach((pad,z)=>pad.setAttribute('aria-pressed',String(contacts[0]?.zone===z)));
 $('source').dataset.active=String(showSource);$('source-label').textContent=showSource?'SOURCE ON':host.state==='idle'?'SOURCE WAITING':'SOURCE OFF';
 $('phase').textContent=replayMode?replay.state==='ended'?'SETTLED':'LISTENING BACK':host.state==='playing'?(showSource?'ENERGY ENTERING':'LISTEN TO THE RELEASE'):({idle:'BEFORE THE GESTURE',preparing:'PREPARING',suspended:'PAUSED',ending:'SETTLING',ended:'SETTLED',error:'AUDIO STOPPED'}[host.state]??'');requestAnimationFrame(draw);
}
sync();draw();
