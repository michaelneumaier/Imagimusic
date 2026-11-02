import {touchConnectionHref} from '../touch/connection-link.js';
import {mountStudyInspector} from '../study-inspector.js';
import {readCompositionSearch,compositionPageURL,compositionURL} from '../stage/composition-link.js';
import {createWorld} from '../stage/world.js';
import {loomSceneFrame,applyLoomScene,LOOM_BINDINGS} from './scene.js';
import {DEFAULT_LOOM,makeLoom,loomVisualEnvelope,stereoWav} from './model.js';
import {createLoomPerformance,loomPerformanceFrame} from './performance.js';
import {createLoomRenderJob} from './render-job.js';
const $=id=>document.getElementById(id);
let initialSettings={...DEFAULT_LOOM},initialComposition={version:1,loom:{enabled:false,settings:initialSettings}};
try{initialComposition=readCompositionSearch(location.search);initialSettings=initialComposition.loom.settings;}catch(error){$('status').textContent=error.message+'. Using the default Loom.';}
let settings=initialSettings,study=makeLoom(settings),context,source,gain,origin=0,playing=false,pcm=null,request=0,passage=null,renderJob=null,studyTime=0,studying=false;
const world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;
world.rail.visible=false;world.camera.position.set(6,4.5,9);world.controls.target.set(0,1.1,1);world.controls.update();
const loom=world.loom;loom.root.position.set(0,0,1);loom.root.scale.setScalar(1);loom.root.visible=true;
const inspector=mountStudyInspector({world,canvas:$('world'),bindings:LOOM_BINDINGS,getPatch:()=>({loom:{...settings,score:passage?.events??[{time:0,body:study.body,velocity:1}]}}),parts:[
 ...loom.bodies.flatMap((body,i)=>[{object:body.body,id:`loom/${i}/width`},{object:body.body,id:`loom/${i}/glow`},{object:body.striker,id:`loom/${i}/striker`}]),
 {object:loom.bridge,id:'loom/bridge/opacity'},
]});
function quiet(){studyTime=0;studying=false;request++;renderJob?.cancel();renderJob=null;if(source){const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(1,now);gain.gain.linearRampToValueAtTime(0,now+.025);source.stop(now+.03);source=null;}playing=false;$('status').textContent='Settled. Choose a strike or conversation.';}
async function strike(body){
 quiet();const token=request;pcm=null;$('save').disabled=true;$('status').textContent='Preparing the coupled response…';
 try{
  context??=new AudioContext();await context.resume();if(token!==request)return;
  passage=body===null?createLoomPerformance(settings):null;
  study=makeLoom(settings,body??0);$('seek').max=passage?.duration??study.duration;
  const job=createLoomRenderJob({settings:{...settings},body,sampleRate:context.sampleRate});renderJob=job;
  const prepared=await job.promise;if(token!==request)return;renderJob=null;pcm=prepared;
  const buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((samples,c)=>buffer.copyToChannel(samples,c));
  gain=context.createGain();gain.connect(context.destination);source=context.createBufferSource();source.buffer=buffer;source.connect(gain);
  const node=source,output=gain;node.onended=()=>{node.disconnect();output.disconnect();if(source===node){playing=false;source=null;}};
  origin=context.currentTime+.025;source.start(origin);playing=true;$('save').disabled=false;$('status').textContent='Left and right channels pick up the corresponding bodies. Quiet ends playback; the WAV contains the complete performance.';
 }catch(error){if(token!==request)return;quiet();$('status').textContent=error.message;}
}
$('conversation').onclick=()=>strike(null);$('left').onclick=()=>strike(0);$('right').onclick=()=>strike(1);$('quiet').onclick=quiet;
for(const key of ['frequency','coupling','detune','loss']){
 $(key).value=settings[key];
 const suffix=key==='frequency'?' Hz':key==='detune'?' cents':key==='loss'?' /s':'';
 $(key+'-value').textContent=settings[key]+suffix;
 $(key).oninput=()=>{quiet();settings[key]=Number($(key).value);study=makeLoom(settings);$('seek').max=study.duration;passage=null;pcm=null;$('save').disabled=true;$(key+'-value').textContent=$(key).value+suffix;history.replaceState(null,'',compositionURL(location.href,{...initialComposition,loom:{...initialComposition.loom,settings}}));};
}
$('touch').onclick=()=>{quiet();location.href=touchConnectionHref(settings);};
$('ensemble').onclick=()=>{quiet();location.href=compositionPageURL(location.href,'stage.html',{...initialComposition,loom:{enabled:true,settings}});};
$('save').onclick=()=>{if(!pcm)return;const url=URL.createObjectURL(new Blob([stereoWav(pcm)],{type:'audio/wav'})),a=document.createElement('a');a.href=url;a.download=`imagimusic-loom-${passage?'conversation':study.body===0?'left':'right'}.wav`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
$('seek').max=study.duration;
$('seek').oninput=()=>{const time=Number($('seek').value);quiet();studyTime=time;studying=true;$('status').textContent='Silent study. The picture samples the selected performance at this exact time.';};
document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});
function draw(){
 const t=playing?Math.max(0,context.currentTime-origin):studyTime,frame=passage?loomPerformanceFrame(passage,t):{time:t,envelope:loomVisualEnvelope(study,t).values,averaged:loomVisualEnvelope(study,t).averaged,strikes:t>=0&&t<.28?[{id:'single',body:study.body,age:t}]:[]};
 const sceneFrame=loomSceneFrame(frame,settings,{active:playing||studying});applyLoomScene(sceneFrame,loom);inspector.update(sceneFrame);
 $('seek').value=t;$('seek-value').textContent=t.toFixed(2)+' s';
 $('state').textContent=renderJob?'PREPARING AUDIO…':playing?`${passage?'CONVERSATION':study.body===0?'STRIKE LEFT':'STRIKE RIGHT'} · ${t.toFixed(2)} s`:studying?`SILENT STUDY · ${t.toFixed(2)} s`:'READY · STRIKE EITHER BODY';
 $('readout').textContent=`Normal modes ${study.system.normalFreqsHz.map(f=>f.toFixed(2)).join(' / ')} Hz · Coupling spring ${study.system.kc.toFixed(1)} N/m${frame.averaged?' · Exchange too fast to draw; mean level shown (mode split > 8 Hz)':''}`;
 world.render();requestAnimationFrame(draw);
}
draw();
