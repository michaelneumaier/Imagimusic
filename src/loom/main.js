import * as T from '../../vendor/three/build/three.module.js';
import {createWorld} from '../stage/world.js';
import {mesh} from '../stage/bodies.js';
import {DEFAULT_LOOM,makeLoom,loomVisualEnvelope,renderLoom,stereoWav} from './model.js';
import {createLoomPerformance,loomPerformanceFrame,renderLoomPerformance} from './performance.js';
const $=id=>document.getElementById(id);
let settings={...DEFAULT_LOOM},study=makeLoom(settings),context,source,gain,origin=0,playing=false,pcm=null,request=0,passage=null;
const world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;
world.rail.visible=false;world.camera.position.set(6,4.5,9);world.controls.target.set(0,1.1,1);world.controls.update();
const root=new T.Group();root.position.z=1;world.scene.add(root);
const brass=new T.MeshStandardMaterial({color:0xb89c65,metalness:.7,roughness:.3});
const bodies=[-2,2].map((x,i)=>{
 const group=new T.Group();group.position.x=x;root.add(group);
 mesh(new T.CylinderGeometry(.7,.8,.12,40),brass,group,[0,.06,0]);
 const material=new T.MeshPhysicalMaterial({color:i?0xb8d69a:0x83cabb,metalness:.25,roughness:.2,transparent:true,opacity:.8,emissive:i?0xb8d69a:0x83cabb,emissiveIntensity:0});
 const body=mesh(new T.SphereGeometry(.6,40,24),material,group,[0,1.35,0]);body.scale.y=1.7;
 mesh(new T.TorusGeometry(.63,.035,10,48),brass,group,[0,1.35,0]);
 const striker=mesh(new T.SphereGeometry(.1,16,12),brass,group,[0,2.7,0]);
 return {body,striker};
});
const points=Array.from({length:161},(_,i)=>{const u=i/160;return new T.Vector3(-1.4+2.8*u,1.35+.11*Math.sin(u*Math.PI*24),.11*Math.cos(u*Math.PI*24));});
const bridge=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xc7b27d,transparent:true,opacity:.65}));root.add(bridge);
function quiet(){request++;if(source){const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(1,now);gain.gain.linearRampToValueAtTime(0,now+.025);source.stop(now+.03);source=null;}playing=false;}
async function strike(body){
 quiet();const token=request;$('status').textContent='Preparing the coupled response…';
 try{
  context??=new AudioContext();await context.resume();if(token!==request)return;
  passage=body===null?createLoomPerformance(settings):null;
  study=makeLoom(settings,body??0);pcm=passage?renderLoomPerformance(passage,context.sampleRate):renderLoom(study,context.sampleRate);
  const buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((samples,c)=>buffer.copyToChannel(samples,c));
  gain=context.createGain();gain.connect(context.destination);source=context.createBufferSource();source.buffer=buffer;source.connect(gain);
  const node=source,output=gain;node.onended=()=>{node.disconnect();output.disconnect();if(source===node){playing=false;source=null;}};
  origin=context.currentTime+.025;source.start(origin);playing=true;$('save').disabled=false;$('status').textContent='Left and right channels pick up the corresponding bodies. Quiet ends playback; the WAV contains the complete performance.';
 }catch(error){quiet();$('status').textContent=error.message;}
}
$('conversation').onclick=()=>strike(null);$('left').onclick=()=>strike(0);$('right').onclick=()=>strike(1);$('quiet').onclick=quiet;
for(const key of ['coupling','detune','loss'])$(key).oninput=()=>{quiet();settings[key]=Number($(key).value);study=makeLoom(settings);passage=null;pcm=null;$('save').disabled=true;$(key+'-value').textContent=$(key).value+(key==='detune'?' cents':key==='loss'?' /s':'');};
$('save').onclick=()=>{if(!pcm)return;const url=URL.createObjectURL(new Blob([stereoWav(pcm)],{type:'audio/wav'})),a=document.createElement('a');a.href=url;a.download=`imagimusic-loom-${passage?'conversation':study.body===0?'left':'right'}.wav`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});
function draw(){
 const t=playing?Math.max(0,context.currentTime-origin):0,frame=passage?loomPerformanceFrame(passage,t):null,visual=frame?{values:frame.envelope,averaged:frame.averaged}:loomVisualEnvelope(study,t),envelopes=playing?visual.values:[0,0];
 bodies.forEach(({body,striker},i)=>{body.scale.x=.8+envelopes[i]*3;body.material.emissiveIntensity=envelopes[i]*5;const hit=frame?.strikes.find(e=>e.body===i),age=frame?hit?.age:i===study.body?t:undefined;
  const reach=age===undefined?0:age<0?Math.max(0,1+age/.18)**2:Math.max(0,1-age/.28)**2;
  striker.position.y=playing?2.7-.23*reach:2.7;});
 bridge.material.opacity=settings.coupling===0?.08:.25+Math.min(.7,envelopes.reduce((a,b)=>a+b,0)*2);
 $('state').textContent=playing?`${passage?'CONVERSATION':study.body===0?'STRIKE LEFT':'STRIKE RIGHT'} · ${t.toFixed(2)} s`:'READY · STRIKE EITHER BODY';
 $('readout').textContent=`Normal modes ${study.system.normalFreqsHz.map(f=>f.toFixed(2)).join(' / ')} Hz · Coupling spring ${study.system.kc.toFixed(1)} N/m${visual.averaged?' · Exchange too fast to draw; mean level shown (mode split > 8 Hz)':''}`;
 world.render();requestAnimationFrame(draw);
}
draw();
