import {createWorld} from '../src/stage/world.js';
import {createTensionerScene,tensionerSceneFrame,applyTensionerScene} from '../src/tensioner/scene.js';
const $=id=>document.getElementById(id),world=createWorld($('scene'));
for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;world.rail.visible=false;
const scene=createTensionerScene();world.scene.add(scene.root);
world.camera.position.set(5,3.5,8);world.controls.target.set(.3,.8,0);world.controls.update();
function draw(){
 const envelope=Number($('envelope').value),mode=$('fixture').value;
 const state={tension01:envelope,bandwidthEstimateHz:880+2640*envelope,amplitude:.19,...(mode==='slow'?{modulatorPhase01:.25}:{})};
 const frame=tensionerSceneFrame(state,{active:mode!=='silent'}),applied=applyTensionerScene(frame,scene);
 $('proof').textContent=applied.map(b=>b.id+' = '+b.value+(b.missing?' MISSING':'')).join('\n');
 world.render();requestAnimationFrame(draw);
}
draw();
