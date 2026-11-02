import {Raycaster,Vector2} from '../../vendor/three/build/three.module.js';
/** Only the actual body surfaces and bridge tubes can be picked. Stable target
 * objects let deliberate down/up taps reject a changed candidate or endpoint.
 * No audio, selection or camera changes occur here. */
export function createInversePicker({canvas,camera,getScene}){
 const ray=new Raycaster(),point=new Vector2();let current=null,targets=[],byMesh=new Map();
 return event=>{
  const scene=getScene();if(!scene)return null;
  if(scene!==current){
   current=scene;targets=[];byMesh=new Map();
   scene.bodies.forEach(({shell,core},body)=>{const target=Object.freeze({kind:'body',body});for(const mesh of [shell,core]){targets.push(mesh);byMesh.set(mesh,target);}});
   scene.bridges.forEach(({curve,spec},index)=>{const target=Object.freeze({kind:'bridge',index,a:spec.a,b:spec.b,coupling:spec.coupling});targets.push(curve);byMesh.set(curve,target);});
  }
  const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  if(!Number.isFinite(x)||!Number.isFinite(y)||rect.width<=0||rect.height<=0||x<0||y<0||x>rect.width||y>rect.height)return null;
  scene.root.updateWorldMatrix(true,true);camera.updateMatrixWorld();
  point.set(x/rect.width*2-1,1-y/rect.height*2);ray.setFromCamera(point,camera);
  const hit=ray.intersectObjects(targets,false)[0];return hit?byMesh.get(hit.object):null;
 };
}
