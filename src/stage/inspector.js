import * as T from '../../vendor/three/build/three.module.js';
import { explainBinding, resolveField } from '../bindings.js';

export function mountInspector({world,canvas,bindings,getPatch}) {
  const select=document.getElementById('inspect-binding'),heading=document.getElementById('inspect-title'),note=document.getElementById('inspect-note'),value=document.getElementById('inspect-value'),inputs=document.getElementById('inspect-inputs');
  let current=null,lastFrame=null,down=null;
  const ray=new T.Raycaster(),point=new T.Vector2();
  world.garden.forEach((body,i)=>{body.root.userData.bindingTarget=`garden/slot${i}`;body.layers.forEach((shell,n)=>shell.userData.bindingParam=`mode${n}`);body.striker.userData.bindingParam='striker';});
  world.choir.forEach((body,i)=>{body.root.userData.bindingTarget=`bellows/slot${i}`;body.chamber.userData.bindingParam='aperture';body.bellows.userData.bindingParam='fill';body.horn.userData.bindingParam='level';body.pendulum.userData.bindingParam='swing';body.fastArc.userData.bindingParam='fast';});
  world.tine.root.userData.bindingTarget='tine/slot8';world.tine.beam.userData.bindingParam='deflection';
  function choose(target,param){
    const choices=bindings.filter(b=>b.target===target);if(!choices.length)return;
    select.replaceChildren();for(const binding of choices){const option=document.createElement('option');option.value=binding.id;option.textContent=binding.param;select.append(option);}
    current=choices.find(b=>b.param===param)??choices[0];select.value=current.id;select.disabled=false;heading.textContent=target.replace('/slot',' · voice ');render();
  }
  canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  canvas.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const rect=canvas.getBoundingClientRect();point.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(point,world.camera);
    for(const hit of ray.intersectObjects(world.scene.children,true)){
      let target=null,param=null;
      for(let node=hit.object;node;node=node.parent){param??=node.userData.bindingParam;target??=node.userData.bindingTarget;}
      if(target){choose(target,param);break;}
    }
  });
  select.onchange=()=>{current=bindings.find(b=>b.id===select.value);render();};
  function format(v){if(v===undefined||v===null)return 'not active';if(typeof v==='number')return Number(v.toFixed(4)).toString();return JSON.stringify(v);}
  function render(){
    if(!current||!lastFrame)return;
    const detail=explainBinding(current,lastFrame,getPatch());
    note.textContent=`${detail.label.toUpperCase()} · ${detail.note}`;
    const result=Array.isArray(detail.value)&&detail.value.length>8?`[${detail.value.length} sampled deflections]`:format(detail.value);
    value.textContent=`${detail.field} → ${detail.param}: ${result}`;
    const [family,slotName]=current.target.split('/'),slot=Number(slotName.slice(4));
    const voices=lastFrame.voices.filter(v=>v.family===family&&v.slot===slot&&v.age>=0);
    inputs.textContent=current.inputs.map(path=>{
      const input=path.startsWith('voice.')?[...new Set(voices.map(v=>resolveField(v,path.slice(6))))]:resolveField(getPatch(),path);
      return path+' = '+format(input);
    }).join('\n');
  }
  return {update(frame){lastFrame=frame;render();}};
}
