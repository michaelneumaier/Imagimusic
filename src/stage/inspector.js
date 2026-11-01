import {inspectScoreEvents} from './score-inspection.js';
import * as T from '../../vendor/three/build/three.module.js';
import { createRouteOverlay } from './route-overlay.js';
import { explainBinding } from '../bindings.js';

export function mountInspector({world,canvas,bindings,getPatch,getPerformance=()=>null}) {
  const select=document.getElementById('inspect-binding'),heading=document.getElementById('inspect-title'),note=document.getElementById('inspect-note'),value=document.getElementById('inspect-value'),inputs=document.getElementById('inspect-inputs');
  const route=createRouteOverlay(world),routeNote=document.getElementById('inspect-route');
  let current=null,lastFrame=null,down=null;
  function showRoute(){routeNote.textContent=route.select(current,getPatch(),lastFrame);}
  document.getElementById('inspect-clear').onclick=()=>{route.clear();routeNote.textContent='Route hidden. Select a part to trace its connections.';};
  const ray=new T.Raycaster(),point=new T.Vector2();
  world.garden.forEach((body,i)=>{body.root.userData.bindingTarget=`garden/slot${i}`;body.damper.userData.bindingParam='damper';body.layers.forEach((shell,n)=>shell.userData.bindingParam=`mode${n}`);body.striker.userData.bindingParam='striker';});
  world.choir.forEach((body,i)=>{body.root.userData.bindingTarget=`bellows/slot${i}`;body.chamber.userData.bindingParam='aperture';body.bellows.userData.bindingParam='fill';body.horn.userData.bindingParam='level';body.pendulum.userData.bindingParam='swing';body.fastArc.userData.bindingParam='fast';});
  world.tine.root.userData.bindingTarget='tine/slot8';world.tine.damper.userData.bindingParam='damper';world.tine.beam.userData.bindingParam='deflection';world.tine.striker.userData.bindingParam='reach';
  world.loom.bodies.forEach((body,i)=>{body.body.userData.bindingTarget=`loom/slot${i}`;body.body.userData.bindingParam='width';body.striker.userData.bindingTarget=`loom/slot${i}`;body.striker.userData.bindingParam='striker';});
  world.loom.bridge.userData.bindingTarget='loom/bridge';world.loom.bridge.userData.bindingParam='opacity';
  for(const [object,target,param] of [[world.fm.carriage,'fm/tensioner','pull'],[world.fm.rod,'fm/tensioner','pull'],[world.fm.halo,'fm/carrier','width'],[world.fm.carrier,'fm/carrier','glow'],[world.fm.wheel,'fm/wheel','angle']]){object.userData.bindingTarget=target;object.userData.bindingParam=param;}
  function choose(target,param){
    const choices=bindings.filter(b=>b.target===target);if(!choices.length)return;
    select.replaceChildren();for(const binding of choices){const option=document.createElement('option');option.value=binding.id;option.textContent=binding.param;select.append(option);}
    current=choices.find(b=>b.param===param)??choices[0];select.value=current.id;select.disabled=false;heading.textContent=target.replace('/slot',' · voice ');showRoute();render();
  }
  function choosePerformer(id){
    current=bindings.find(binding=>binding.target===`performer/${id}`);if(!current)return;
    select.replaceChildren();const option=document.createElement('option');option.textContent='Event and articulation';select.append(option);select.disabled=true;heading.textContent='Keeper · '+id;route.clear();routeNote.textContent='This performer is linked to the event shown below.';render();
  }
  canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  canvas.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const rect=canvas.getBoundingClientRect();point.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(point,world.camera);
    for(const hit of ray.intersectObjects(world.scene.children,true)){
      let target=null,param=null,performer=null,visible=true;
      for(let node=hit.object;node;node=node.parent){visible&&=node.visible;performer??=node.userData.performerId;param??=node.userData.bindingParam;target??=node.userData.bindingTarget;}
      if(visible&&performer){choosePerformer(performer);break;}
      if(visible&&target){choose(target,param);break;}
    }
  });
  select.onchange=()=>{current=bindings.find(b=>b.id===select.value);showRoute();render();};
  function format(v){if(v===undefined||v===null)return 'not active';if(typeof v==='number')return Number(v.toFixed(4)).toString();return JSON.stringify(v);}
  function render(){
    if(!current||!lastFrame)return;
    const detail=explainBinding(current,lastFrame,getPatch());
    note.textContent=`${detail.label.toUpperCase()} · ${detail.note}`;
    const result=Array.isArray(detail.value)&&detail.value.length>8?`[${detail.value.length} sampled deflections]`:format(detail.value);
    value.textContent=current.target.startsWith('performer/')&&detail.value?`Gesture: ${detail.value.phase} · Event: ${detail.value.eventId??'none active'} · Contact: ${format(detail.value.contact)}${detail.value.unreachable?' · Unreachable: arm folded; original mallet remains':''}`:`${detail.field} → ${detail.param}: ${result}`;
    const passage=getPerformance(),events=passage?inspectScoreEvents(passage,current.target,lastFrame.t,detail.value):[];
    inputs.textContent=[...detail.inputs.map(input=>input.path+' = '+format(input.value)),...events.map(event=>'Score event: '+JSON.stringify(event))].join('\n');
  }
  return {update(frame){lastFrame=frame;render();route.update(frame);}};
}
