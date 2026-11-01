import * as T from '../../vendor/three/build/three.module.js';
import { createRouteOverlay } from './route-overlay.js';
import { explainBinding } from '../bindings.js';

export function mountInspector({world,canvas,bindings,getPatch}) {
  const select=document.getElementById('inspect-binding'),heading=document.getElementById('inspect-title'),note=document.getElementById('inspect-note'),value=document.getElementById('inspect-value'),inputs=document.getElementById('inspect-inputs');
  const route=createRouteOverlay(world),routeNote=document.getElementById('inspect-route');
  let current=null,lastFrame=null,down=null;
  function showRoute(){routeNote.textContent=route.select(current,getPatch(),lastFrame);}
  document.getElementById('inspect-clear').onclick=()=>{route.clear();routeNote.textContent='Route hidden. Select a part to trace its connections.';};
  const ray=new T.Raycaster(),point=new T.Vector2();
  world.garden.forEach((body,i)=>{body.root.userData.bindingTarget=`garden/slot${i}`;body.layers.forEach((shell,n)=>shell.userData.bindingParam=`mode${n}`);body.striker.userData.bindingParam='striker';});
  world.choir.forEach((body,i)=>{body.root.userData.bindingTarget=`bellows/slot${i}`;body.chamber.userData.bindingParam='aperture';body.bellows.userData.bindingParam='fill';body.horn.userData.bindingParam='level';body.pendulum.userData.bindingParam='swing';body.fastArc.userData.bindingParam='fast';});
  world.tine.root.userData.bindingTarget='tine/slot8';world.tine.beam.userData.bindingParam='deflection';world.tine.striker.userData.bindingParam='reach';
  function choose(target,param){
    const choices=bindings.filter(b=>b.target===target);if(!choices.length)return;
    select.replaceChildren();for(const binding of choices){const option=document.createElement('option');option.value=binding.id;option.textContent=binding.param;select.append(option);}
    current=choices.find(b=>b.param===param)??choices[0];select.value=current.id;select.disabled=false;heading.textContent=target.replace('/slot',' · voice ');showRoute();render();
  }
  function choosePerformer(id){
    const pump=id.startsWith('bellows/');
    current={id:'performer/'+id,target:'performers',param:'gesture',field:`stage.performers.actors[id=${id}]`,inputs:pump?['bellows.adsr.a','bellows.adsr.d','bellows.adsr.s','bellows.adsr.r']:['tempo','seed','strikePosition'],label:'interpreted',note:pump?'Crosshead follows the sounding chamber envelope, including release and stealing. It does not measure air pressure.':'Hand follows a planned strike. Event identity and phase below explain this gesture; forces are not simulated.'};
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
    value.textContent=current.target==='performers'&&detail.value?`Gesture: ${detail.value.phase} · Event: ${detail.value.eventId??'none active'} · Contact: ${format(detail.value.contact)}`:`${detail.field} → ${detail.param}: ${result}`;
    inputs.textContent=detail.inputs.map(input=>input.path+' = '+format(input.value)).join('\n');
  }
  return {update(frame){lastFrame=frame;render();route.update(frame);}};
}
