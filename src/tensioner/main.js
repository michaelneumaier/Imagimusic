import {mountStudyInspector} from '../study-inspector.js';
import {createWorld} from '../stage/world.js';
import {encodeWav} from '../model.js';
import {createTensionerScene,tensionerSceneFrame,applyTensionerScene,TENSIONER_BINDINGS} from './scene.js';
import {createTensionerRenderJob} from './render-job.js';
const $=id=>document.getElementById(id),keys=['carrierHz','ratio','index','indexDecayS','ampDecayS'];
for(const key of [...keys,'preset','seek'])$(key).disabled=true;
const world=createWorld($('world'));
for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;world.rail.visible=false;
const scene=createTensionerScene();world.scene.add(scene.root);
world.camera.position.set(5,3.5,8);world.controls.target.set(.3,.8,0);world.controls.update();
let api,model,settings,context,source,gain,job,pcm,origin=0,token=0,playing=false,studying=false,studyTime=0,endS=0;
const inspector=mountStudyInspector({world,canvas:$('world'),bindings:TENSIONER_BINDINGS,getPatch:()=>({fm:settings??{}}),parts:[
 {object:scene.carriage,id:'fm/pull'},{object:scene.rod,id:'fm/pull'},
 {object:scene.halo,id:'fm/width'},{object:scene.carrier,id:'fm/glow'},
 {object:scene.wheel,id:'fm/angle'},{object:scene.arm,id:'fm/slow'},{object:scene.disc,id:'fm/fast'},
]});
function quiet(){
 token++;job?.cancel();job=null;
 if(source){const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(1,now);gain.gain.linearRampToValueAtTime(0,now+.025);source.stop(now+.03);source=null;}
 playing=false;studying=false;studyTime=0;$('play').textContent='Play tone';
}
function refresh(){
 quiet();pcm=null;$('save').disabled=true;
 for(const key of keys)$(key+'-value').textContent=$(key).value+(key==='carrierHz'?' Hz':key.endsWith('DecayS')?' s':'');
 try{
  const candidate={...api.DEFAULT_TENSIONER,...Object.fromEntries(keys.map(key=>[key,Number($(key).value)]))};
  const next=api.validateTensioner(candidate,context?.sampleRate??48000);
  settings=candidate;model=api.tensionerCore(next);endS=api.tensionerEnd(model,context?.sampleRate??48000).endS;$('seek').max=endS;$('play').disabled=false;
  $('status').textContent='Play uses these settings for the complete tone. Changing a control settles the previous sound.';
 }catch(error){$('play').disabled=true;$('status').textContent='Cannot play these settings: '+error.message;}
}
$('play').onclick=async()=>{
 if(job||playing){quiet();return;}const request=++token;
 try{
  context??=new AudioContext();await context.resume();if(request!==token)return;
  model=api.tensionerCore(api.validateTensioner(settings,context.sampleRate));endS=api.tensionerEnd(model,context.sampleRate).endS;$('seek').max=endS;pcm=null;$('save').disabled=true;
  $('play').textContent='Cancel preparation';$('status').textContent='Preparing the FM tone…';
  job=createTensionerRenderJob({settings,sampleRate:context.sampleRate});
  const prepared=await job.promise;if(request!==token)return;job=null;pcm=prepared;
  const buffer=context.createBuffer(1,pcm.samples.length,pcm.sampleRate);buffer.copyToChannel(pcm.samples,0);
  gain=context.createGain();gain.connect(context.destination);source=context.createBufferSource();source.buffer=buffer;source.connect(gain);
  const node=source,output=gain;node.onended=()=>{node.disconnect();output.disconnect();if(source===node){source=null;playing=false;$('play').textContent='Play tone';$('status').textContent='Tone finished. Replay or change a control to explore another voice.';}};
  origin=context.currentTime+.03;source.start(origin);playing=true;studying=false;
  $('play').textContent='Stop tone';$('save').disabled=false;$('status').textContent='Playing the model’s rendered tone. The picture follows its audio clock.';
 }catch(error){if(request!==token)return;quiet();if(error.name!=='AbortError')$('status').textContent=error.message;}
};
$('quiet').onclick=()=>{quiet();$('status').textContent='Settled.';};
$('seek').oninput=()=>{const time=Number($('seek').value);quiet();studyTime=time;studying=true;$('status').textContent='Silent study at the selected time.';};
$('save').onclick=()=>{
 if(!pcm)return;
 const url=URL.createObjectURL(new Blob([encodeWav(pcm.samples,pcm.sampleRate)],{type:'audio/wav'})),a=document.createElement('a');
 a.href=url;a.download='imagimusic-fm-tensioner.wav';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
};
$('preset').onchange=()=>{
 const preset={metal:{ratio:2,index:3,indexDecayS:.8},slow:{ratio:.01,index:3,indexDecayS:4},bell:{ratio:3.5,index:1.2,indexDecayS:.8}}[$('preset').value];
 for(const key of keys)$(key).value=({carrierHz:220,ampDecayS:1.5,...preset})[key];refresh();
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});
function draw(){
 const t=playing?Math.max(0,context.currentTime-origin):studyTime;
 const state=model?api.tensionerState(t,model,endS):{amplitude:0,tension01:0,bandwidthEstimateHz:0};
 const frame=tensionerSceneFrame(state,{active:playing||studying}),applied=applyTensionerScene(frame,scene);inspector.update(frame);
 $('state').textContent=job?'PREPARING AUDIO':playing?'PLAYING · LINEAR FM':studying?'SILENT STUDY':'READY';
 $('seek').value=t;$('time').textContent=t.toFixed(2)+' s';
 if(model)$('readout').textContent=`Carrier ${settings.carrierHz} Hz · Modulator ${(settings.carrierHz*settings.ratio).toFixed(2)} Hz · Deviation ±${state.deviationHz.toFixed(2)} Hz · Estimated occupied bandwidth ${state.bandwidthEstimateHz.toFixed(1)} Hz · ${state.positiveInstantaneousFrequency?'Positive instantaneous frequency':'Signed instantaneous frequency; digital FM'}`;
 $('proof').textContent=applied.length+' declared motion bindings';world.render();requestAnimationFrame(draw);
}
draw();
try{api=await import('../fm.js');for(const key of keys)$(key).oninput=refresh;refresh();for(const key of [...keys,'preset','seek'])$(key).disabled=false;}
catch(error){$('play').disabled=true;$('status').textContent='Sound model unavailable: '+error.message;}
