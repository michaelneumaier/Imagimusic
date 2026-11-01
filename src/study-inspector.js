import * as T from '../vendor/three/build/three.module.js';
import {explainBinding} from './bindings.js';

/** Small study inspector: the selected binding explains the exact frame used to draw. */
export function mountStudyInspector({world,canvas,bindings,parts,getPatch}){
 const $=id=>document.getElementById(id),select=$('inspect-binding');
 const byId=new Map(bindings.map(b=>[b.id,b])),partById=new Map(),objectBindings=new Map();
 for(const {object,id} of parts){if(!objectBindings.has(object))objectBindings.set(object,id);if(!partById.has(id))partById.set(id,object);}
 select.replaceChildren();
 for(const binding of bindings){const option=document.createElement('option');option.value=binding.id;option.textContent=binding.target+' · '+binding.param;select.append(option);}
 let current=bindings[0],frame=null,outline=null,down=null;
 const ray=new T.Raycaster(),point=new T.Vector2();
 function clear(){if(outline){world.scene.remove(outline);outline.geometry.dispose();outline.material.dispose();outline=null;}}
 function choose(id){
  const binding=byId.get(id);if(!binding)return;
  current=binding;select.value=id;clear();
  const object=partById.get(id);
  if(object){outline=new T.BoxHelper(object,0xe9db95);outline.material.depthTest=false;outline.renderOrder=20;outline.raycast=()=>{};world.scene.add(outline);}
  render();
 }
 const format=value=>typeof value==='number'?Number(value.toFixed(5)).toString():JSON.stringify(value);
 function render(){
  if(!frame)return;
  const detail=explainBinding(current,frame,getPatch());
  $('inspect-title').textContent=current.target+' · '+current.param;
  $('inspect-note').textContent=detail.note;
  $('inspect-value').textContent=detail.field+' = '+format(detail.raw)+' → '+detail.param+' = '+format(detail.value);
  $('inspect-inputs').textContent=detail.inputs.map(input=>input.path+' = '+format(input.value)).join('\n');
  if(outline){let visible=true;for(let node=partById.get(current.id);node;node=node.parent)visible&&=node.visible;outline.visible=visible;outline.update();}
 }
 const pointerDown=e=>down=[e.clientX,e.clientY];
 const pointerUp=e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;down=null;
  const rect=canvas.getBoundingClientRect();point.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(point,world.camera);
  for(const hit of ray.intersectObjects([...objectBindings.keys()],true)){
   let id=null,visible=true;
   for(let node=hit.object;node;node=node.parent){id??=objectBindings.get(node);visible&&=node.visible;}
   if(visible&&id){choose(id);break;}
  }
 };
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
 select.onchange=()=>choose(select.value);$('inspect-clear').onclick=clear;
 return {update(next){frame=next;render();},dispose(){clear();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);select.onchange=null;$('inspect-clear').onclick=null;}};
}
