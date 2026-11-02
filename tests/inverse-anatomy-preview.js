import {composeGrove,groveSystem} from '../src/score/grove.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';
import {createInverseScene} from '../src/inverse/scene.js';
import {createInversePicker} from '../src/inverse/picking.js';
import {bindBodyTap} from '../src/grove/body-tap.js';
import {createGroveWorld} from '../src/grove/world.js';
const button=document.querySelector('#prepare'),status=document.querySelector('#status'),selector=document.querySelector('#state'),views=[];
const framing=document.querySelector('#framing');
const jobs=createInverseJobs(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const resize=new ResizeObserver(()=>render());
button.onclick=async()=>{
 button.disabled=true;status.textContent='Finding the actual fitted candidates…';
 try{
  const source=composeGrove({seed:3});source.bodies.forEach(b=>b.mass=.02);const system=groveSystem(source);
  const target={version:1,kind:'three-resonance',normalFrequenciesHz:system.normalFreqsHz.map(f=>Number(f.toFixed(6))),decaySeconds:Number(system.decayS.toFixed(8)),provenance:'Known equal-mass seed 3, rounded workshop target'};
  const report=await jobs.run({kind:'search',target,options:{baseMidi:48,seed:19,budget:{restarts:6,iterations:300,maxEvaluations:60000}}});
  for(const candidate of report.candidates){
   if(!candidate.grove)continue;
   const article=document.createElement('article'),title=document.createElement('h2'),canvas=document.createElement('canvas'),caption=document.createElement('p');
   title.textContent=candidate.topology;canvas.setAttribute('aria-label',candidate.topology+' artistic three-mass anatomy');caption.className='small';caption.textContent=`Maximum resonance error ${candidate.residual.maxAbsCents.toFixed(4)} cents. The camera holds its full-response bounds.`;
   article.append(title,canvas,caption);document.querySelector('#views').append(article);
   const world=createGroveWorld(canvas),scene=createInverseScene(candidate.grove),instrument=createInverseInstrument(candidate.grove,{sampleRate:8000});
   world.controls.enabled=false;world.scene.add(scene.root);world.setFocus(chosenBounds(scene));const pick=createInversePicker({canvas,camera:world.camera,getScene:()=>scene});
   const tap=bindBodyTap(canvas,{pick,enabled:()=>!document.hidden,onTap:target=>{
    if(target.kind==='bridge'){
     scene.setBridgeHighlight(scene.bridges[target.index].spec);
     status.textContent=`${candidate.topology}: connection ${target.a+1}–${target.b+1}, coupling ${target.coupling}. Inspected only; no strike or audio.`;
    }else{
     scene.setBridgeHighlight(null);status.textContent=`${candidate.topology}: body ${target.body+1} selected by a deliberate tap. Silent diagnostic; no strike or audio.`;
    }
    render();
   }});
   views.push({world,scene,instrument,caption,canvas,tap,baseCaption:caption.textContent});resize.observe(canvas);
  }
  update();status.textContent=`${views.length} candidates ready. Silent fixed-time inspection.`;
 }catch(error){status.textContent=error.message;button.disabled=false;}
};
function update(){
 for(const {scene,instrument} of views){
  const state=selector.value,age=state==='early'?.15:.65;
  const strikes=state==='rest'?[]:state==='limit'?[{body:0,age:.1,envelope:[1,1,1]}]:[{body:0,age,...instrument.frame(0,age)}];
  scene.update({strikes},{reducedMotion:reduced.matches});
 }
 render();
}
function chosenBounds(scene){
 const [kind,a,b]=framing.value.split(':');
 if(kind==='body')return scene.focusBounds.bodies[Number(a)];
 if(kind==='bridge')return scene.focusBounds.bridges.find(edge=>edge.a===Number(a)&&edge.b===Number(b)).bounds;
 return kind==='playing'?scene.playingBounds:scene.bounds;
}
framing.onchange=()=>{views.forEach(({world,scene})=>world.setFocus(chosenBounds(scene)));render();};
selector.onchange=update;reduced.addEventListener('change',update);
function render(){try{views.forEach(v=>{v.world.render();v.caption.textContent=v.baseCaption+` Current render: ${v.canvas.width}×${v.canvas.height}, ${v.world.renderer.info.render.calls} draw calls.`;});}catch(error){status.textContent='Picture error: '+error.message;}}
addEventListener('pageshow',render);
addEventListener('pagehide',()=>{jobs.cancel();views.forEach(v=>v.tap.cancel());});
