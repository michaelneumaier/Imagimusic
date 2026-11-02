import {Box3} from '../vendor/three/build/three.module.js';
import {createGroveWorld} from '../src/grove/world.js';
import {createGroveScene,applyGroveScene} from '../src/grove/scene.js';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
const $=id=>document.getElementById(id),world=createGroveWorld($('world'));
world.controls.enabled=false;
world.camera.position.set(0,3.7,10.8);world.camera.lookAt(0,1.4,0);
let scenes=[],animation;
function rebuild(){
 world.setFocus(null);
 for(const scene of scenes){world.scene.remove(scene.root);scene.dispose();}
 const seed=Number($('family').value),part=$('view').value===''?null:Number($('view').value);
 scenes=[48,51,55].map((note,i)=>{
  const scene=createGroveScene(retuneGroveCluster(composeGrove({seed}),note));
  scene.root.scale.setScalar(.47);scene.root.position.set((i-1)*3.2,.1,0);
  scene.root.visible=part===null||part===i;world.scene.add(scene.root);return scene;
 });
 $('world').classList.toggle('close',part!==null);
 if(part!==null){
  world.setFocus(new Box3().setFromObject(scenes[part].root).expandByScalar(.12));
  for(const {label,spec} of scenes[part].bodies){label.position.y=spec.position[1]+spec.scale[1]*1.3+.32;label.scale.set(.56,.28,1);label.material.sizeAttenuation=false;label.material.needsUpdate=true;}
 }
 if($('response').checked)for(const scene of scenes)applyGroveScene(scene,{envelope:[1e6,1e6,1e6],strikes:[0,1,2].map(body=>({body,age:.299,strikeU:1,velocity:1}))},[1,1,1],[0,0,0]);
 $('caption').textContent=`Family ${seed} · ${part===null?'Together':['C','E-flat','G'][part]} · ${$('response').checked?'maximum capped display response':'resting picture'}. Silent diagnostic.`;
}
for(const id of ['family','view','response'])$(id).onchange=rebuild;
function draw(){if(!document.hidden)world.render();animation=requestAnimationFrame(draw);}
rebuild();draw();
window.addEventListener('pagehide',event=>{if(!event.persisted){cancelAnimationFrame(animation);scenes.forEach(scene=>scene.dispose());world.dispose();}});
