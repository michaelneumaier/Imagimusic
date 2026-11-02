import {Box3} from '../vendor/three/build/three.module.js';
import {createGroveWorld} from '../src/grove/world.js';
import {createGroveScene,applyGroveScene} from '../src/grove/scene.js';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
const $=id=>document.getElementById(id),world=createGroveWorld($('world'));world.controls.enabled=false;
let scene,remembered=true,animation;
function update(){
 const enabled=$('enabled').checked;
 applyGroveScene(scene,{strikes:[{body:0,age:.04,strikeU:DEFAULT_VOICE_CONFIG.positions[1],velocity:.5,remembered}]},[],[],{distinguishRemembered:enabled});
 $('remembered').setAttribute('aria-pressed',String(remembered));$('new').setAttribute('aria-pressed',String(!remembered));
 $('caption').textContent=(enabled?(remembered?'Remembered: outer ring only.':'Played now: ring with a dot.'):'Distinction off: the same outer ring for either source.')+' Frozen diagnostic, no audio.';
}
function rebuild(){if(scene){world.scene.remove(scene.root);scene.dispose();}scene=createGroveScene(retuneGroveCluster(composeGrove({seed:3}),Number($('grove').value)));scene.root.scale.setScalar(.47);world.scene.add(scene.root);world.setFocus(new Box3().setFromObject(scene.root).expandByScalar(.12));update();}
$('remembered').onclick=()=>{remembered=true;update();};$('new').onclick=()=>{remembered=false;update();};$('enabled').onchange=update;$('grove').onchange=rebuild;
function draw(){if(!document.hidden)world.render();animation=requestAnimationFrame(draw);}rebuild();draw();
window.addEventListener('pagehide',event=>{if(!event.persisted){cancelAnimationFrame(animation);scene.dispose();world.dispose();}});
