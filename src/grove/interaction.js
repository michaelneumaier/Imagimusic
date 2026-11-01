import * as T from '../../vendor/three/build/three.module.js';
/** Scene picking uses the currently drawn shells. Empty space retains camera controls. */
export function groveBodyAt(scene,camera,canvas,clientX,clientY){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
 const point=new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),ray=new T.Raycaster();
 scene.root.updateMatrixWorld(true);camera.updateMatrixWorld(true);ray.setFromCamera(point,camera);
 const shells=scene.bodies.map(b=>b.shell),hit=ray.intersectObjects(shells,false)[0];return hit?shells.indexOf(hit.object):null;
}
/** Captured gestures cannot orbit the camera; cancellation never strikes. */
export function bindGrovePlaying({canvas,controls,getScene,camera,canPlay,start,finish}){
 const pointers=new Map();let orbitActive=false;
 const orbitStart=()=>{orbitActive=true;},orbitEnd=()=>{orbitActive=false;};
 controls.addEventListener?.('start',orbitStart);controls.addEventListener?.('end',orbitEnd);
 function reset(){const pending=[...pointers];pointers.clear();for(const [id,body] of pending){finish(body,`scene-${id}`,true);if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}controls.enabled=true;canvas.style.cursor='';}
 function down(event){
  if(event.button!==0||!canPlay()||orbitActive)return;
  const body=groveBodyAt(getScene(),camera,canvas,event.clientX,event.clientY);if(body===null)return;
  event.preventDefault();event.stopImmediatePropagation();
  if([...pointers.values()].includes(body))return;
  pointers.set(event.pointerId,body);controls.enabled=false;canvas.setPointerCapture(event.pointerId);start(body,`scene-${event.pointerId}`);
 }
 function end(event,cancel=false){
  if(!pointers.has(event.pointerId))return;
  event.preventDefault();event.stopImmediatePropagation();const body=pointers.get(event.pointerId);pointers.delete(event.pointerId);
  finish(body,`scene-${event.pointerId}`,cancel);if(!pointers.size)controls.enabled=true;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
 }
 const cancel=e=>end(e,true),up=e=>end(e,false);
 const move=e=>{if(pointers.has(e.pointerId)){e.preventDefault();e.stopImmediatePropagation();return;}canvas.style.cursor=canPlay()&&groveBodyAt(getScene(),camera,canvas,e.clientX,e.clientY)!==null?'pointer':'';};
 for(const [type,handler] of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['pointermove',move]])canvas.addEventListener(type,handler,{capture:true});
 return {reset,dispose(){reset();controls.removeEventListener?.('start',orbitStart);controls.removeEventListener?.('end',orbitEnd);for(const [type,handler] of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['pointermove',move]])canvas.removeEventListener(type,handler,{capture:true});}};
}
