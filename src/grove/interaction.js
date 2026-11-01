import * as T from '../../vendor/three/build/three.module.js';
/** Scene picking uses the currently drawn shells. Empty space retains camera controls. */
export function groveHitAt(scene,camera,canvas,clientX,clientY){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
 const point=new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),ray=new T.Raycaster();
 scene.root.updateMatrixWorld(true);camera.updateMatrixWorld(true);ray.setFromCamera(point,camera);
 const shells=scene.bodies.map(b=>b.shell),hit=ray.intersectObjects(shells,false)[0];if(!hit)return null;const shell=hit.object; if(!shell.geometry.boundingBox)shell.geometry.computeBoundingBox();const bounds=shell.geometry.boundingBox,local=shell.worldToLocal(hit.point.clone()),height=bounds.max.y-bounds.min.y;
 return {body:shells.indexOf(shell),positionU:height?Math.max(0,Math.min(1,(bounds.max.y-local.y)/height)):.5};
}
export const groveBodyAt=(...args)=>groveHitAt(...args)?.body??null;
/** Three explicit control zones, not a claim about the shell's acoustic geometry. */
export function groveStrikeZone(u,positions=[.3,.6,1]){if(!Number.isFinite(u)||u<0||u>1||!positions.length||positions.some(p=>!Number.isFinite(p)||p<0||p>1))throw new Error('Invalid strike position');return positions.reduce((best,p,i)=>Math.abs(p-u)<Math.abs(positions[best]-u)?i:best,0);}
/** Captured gestures cannot orbit the camera; cancellation never strikes.
 * Optional change reports movement on the originally captured shell (null off-shell),
 * allowing sustained contacts to move/lift without beginning a new excitation. */
export function bindGrovePlaying({canvas,controls,getScene,camera,canPlay,start,finish,acceptHit=()=>true,change=null}){
 const pointers=new Map();let orbitActive=false;
 const orbitStart=()=>{orbitActive=true;},orbitEnd=()=>{orbitActive=false;};
 controls.addEventListener?.('start',orbitStart);controls.addEventListener?.('end',orbitEnd);
 function reset(){const pending=[...pointers];pointers.clear();for(const [id,body] of pending){finish(body,`scene-${id}`,true);if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}controls.enabled=true;canvas.style.cursor='';}
 function down(event){
  if(event.button!==0||!canPlay()||orbitActive)return;
  const hit=groveHitAt(getScene(),camera,canvas,event.clientX,event.clientY);if(!hit||!acceptHit(hit))return;const {body}=hit;
  event.preventDefault();event.stopImmediatePropagation();
  if([...pointers.values()].includes(body))return;
  pointers.set(event.pointerId,body);controls.enabled=false;canvas.setPointerCapture(event.pointerId);start(body,`scene-${event.pointerId}`,{positionU:hit.positionU});
 }
 function end(event,cancel=false){
  if(!pointers.has(event.pointerId))return;
  event.preventDefault();event.stopImmediatePropagation();const body=pointers.get(event.pointerId);pointers.delete(event.pointerId);
  finish(body,`scene-${event.pointerId}`,cancel);if(!pointers.size)controls.enabled=true;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
 }
 const cancel=e=>end(e,true),up=e=>end(e,false);
 const move=e=>{if(pointers.has(e.pointerId)){if(change&&!canPlay()){end(e,true);return;}e.preventDefault();e.stopImmediatePropagation();if(change){const body=pointers.get(e.pointerId),hit=groveHitAt(getScene(),camera,canvas,e.clientX,e.clientY);change(body,`scene-${e.pointerId}`,hit?.body===body?hit:null);}return;}const hit=canPlay()?groveHitAt(getScene(),camera,canvas,e.clientX,e.clientY):null;canvas.style.cursor=hit&&acceptHit(hit)?'pointer':'';};
 for(const [type,handler] of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['pointermove',move]])canvas.addEventListener(type,handler,{capture:true});
 return {reset,dispose(){reset();controls.removeEventListener?.('start',orbitStart);controls.removeEventListener?.('end',orbitEnd);for(const [type,handler] of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['pointermove',move]])canvas.removeEventListener(type,handler,{capture:true});}};
}
