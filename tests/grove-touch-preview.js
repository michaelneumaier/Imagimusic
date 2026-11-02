import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveSession} from '../src/grove/session.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';
import {createGroveWorld} from '../src/grove/world.js';
import {createGroveScene,applyGroveScene} from '../src/grove/scene.js';
const $=id=>document.getElementById(id);
let world,scene,session,time=0,before=false,playing=false,origin=0,animation;
function stop(){playing=false;$('play').textContent='Play picture';}
function show(){
 const frame=before?{envelope:[0,0,0],strikes:[]}:session.visual(time);
 const mapping=$('ring-mapping').value;
 applyGroveScene(scene,frame,[],[],{followRing:mapping==='amplified'});
 if(mapping==='gentle')for(const [i,body] of scene.bodies.entries()){const level=Math.max(0,frame.envelope[i]??0);body.halo.material.opacity=.15+.65*level/(level+.1);}
 $('time').value=String(time);$('time-label').value=time.toFixed(2);
 $('status').textContent=`Grove ${$('seed').value} · ${$('voice').selectedOptions[0].textContent} · body ${Number($('body').value)+1} · strength ${$('velocity').value} · ${before?'before touch':time.toFixed(2)+' s after touch'} · ${playing?'playing picture':'frozen'} · ${$('ring-mapping').selectedOptions[0].textContent} · silent.`;
 $('levels').textContent='Model envelope, bodies 1 / 2 / 3: '+frame.envelope.map(v=>v.toFixed(6)).join(' / ');
}
function choose(){
 stop();before=false;time=0;
 const grove=composeGrove({seed:Number($('seed').value)});
 const next=$('voice').value==='partials'?createGroveVoiceSession({grove,voice:DEFAULT_VOICE_CONFIG},48000):createGroveSession(grove,48000);
 const receipt=next.strike({frame:0,body:Number($('body').value),velocity:Number($('velocity').value),position:1});
 if(!receipt.accepted)throw new Error('Diagnostic gesture refused: '+receipt.reason);
 session=next;if(scene){world.scene.remove(scene.root);scene.dispose();}scene=createGroveScene(grove);world.scene.add(scene.root);show();
}
for(const id of ['seed','voice','body','velocity'])$(id).onchange=choose;
$('time').oninput=()=>{stop();before=false;time=Number($('time').value);show();};
$('rest').onclick=()=>{stop();before=true;show();};
$('restart').onclick=()=>{stop();before=false;time=0;show();};
$('ring-mapping').onchange=show;
$('play').onclick=()=>{if(playing){stop();show();return;}if(time>=4||before)time=0;before=false;origin=performance.now()-time*1000;playing=true;$('play').textContent='Pause picture';show();};
function draw(now){if(playing){time=Math.min(4,(now-origin)/1000);if(time>=4)stop();show();}if(!document.hidden)world.render();animation=requestAnimationFrame(draw);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(scene)show();}});
window.addEventListener('pagehide',event=>{stop();if(!event.persisted){cancelAnimationFrame(animation);scene?.dispose();world?.dispose();}});
try{world=createGroveWorld($('world'));world.controls.enabled=false;choose();animation=requestAnimationFrame(draw);}catch(error){$('status').textContent='Diagnostic unavailable: '+error.message;}
