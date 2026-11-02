import {Box3} from '../vendor/three/build/three.module.js';
import {createGroveWorld} from '../src/grove/world.js';
import {createGroveScene,applyGroveScene} from '../src/grove/scene.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
const $=id=>document.getElementById(id);
let world,scene,cases,current,time=0,playing=false,startTime=0,startWall=0,animation;
function stop(){playing=false;$('play').textContent='Play picture';}
function show(){
 const recorded=$('mode').value==='recorded',followRing=$('follow-ring').checked;
 const sample=recorded?(current.samples.findLast(sample=>sample.time<=time)??current.samples[0]):{envelope:Array(3).fill(Number($('mode').value)),strikes:[]};
 applyGroveScene(scene,sample,[],[],{followRing});
 $('time').value=String(time);$('time-label').value=time.toFixed(2)+' s';
 $('status').textContent=`Family ${current.seed} · ${recorded?'model frame '+sample.frame:'fixed envelope '+$('mode').value+' · '+$('tuning').selectedOptions[0].textContent} · ${followRing?'amplified halo opacity':'baseline halo opacity'} · ${playing?'picture playing':'frozen picture'}. Silent.`;
}
function choose(){
 stop();if(scene){world.scene.remove(scene.root);scene.dispose();}world.setFocus(null);
 current=cases.find(c=>c.seed===Number($('family').value));time=Math.min(time,current.duration);$('time').max=String(current.duration);
 const recorded=$('mode').value==='recorded';if(recorded)$('tuning').value='48';$('tuning').disabled=recorded;$('transport').hidden=!recorded;
 $('world').setAttribute('aria-label',`Close view of ${$('tuning').selectedOptions[0].textContent} Grove: ${recorded?'sampled response':'fixed envelope '+$('mode').value}`);
 scene=createGroveScene(retuneGroveCluster(current.grove,Number($('tuning').value)));scene.root.scale.setScalar(.47);scene.root.position.set(-3.2,.1,0);world.scene.add(scene.root);
 world.setFocus(new Box3().setFromObject(scene.root).expandByScalar(.12));
 for(const {label,spec} of scene.bodies){label.position.y=spec.position[1]+spec.scale[1]*1.3+.32;label.scale.set(.56,.28,1);label.material.sizeAttenuation=false;label.material.needsUpdate=true;}
 show();
}
$('family').onchange=choose;$('mode').onchange=choose;$('tuning').onchange=choose;$('follow-ring').onchange=()=>{if(scene)show();};
$('time').oninput=()=>{stop();time=Number($('time').value);show();};
$('restart').onclick=()=>{stop();time=0;show();};
$('play').onclick=()=>{if(playing){stop();show();return;}if(time>=current.duration)time=0;startTime=time;startWall=performance.now();playing=true;$('play').textContent='Pause picture';};
function draw(now){
 if(playing){time=Math.min(current.duration,startTime+(now-startWall)/1000);if(time>=current.duration)stop();show();}
 if(!document.hidden)world.render();animation=requestAnimationFrame(draw);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(scene)show();}});
window.addEventListener('pagehide',event=>{stop();if(!event.persisted){cancelAnimationFrame(animation);scene?.dispose();world?.dispose();}});
try{
 const response=await fetch('../renders/ensemble-family-response/samples.json');if(!response.ok)throw new Error('Prepare samples with node tools/sample-family-picture-response.mjs');
 ({cases}=await response.json());world=createGroveWorld($('world'));world.controls.enabled=false;world.camera.position.set(0,3.7,10.8);world.camera.lookAt(0,1.4,0);
 choose();for(const id of ['family','time','play','restart','mode','follow-ring'])$(id).disabled=false;animation=requestAnimationFrame(draw);
}catch(error){$('status').textContent='Diagnostic unavailable: '+error.message;}
