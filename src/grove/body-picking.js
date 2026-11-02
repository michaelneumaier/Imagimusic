import {Raycaster,Vector2} from '../../vendor/three/build/three.module.js';
/** Only physical body meshes of the selected Grove participate, never visual cues.
 * Stable identities let the input adapter compare down and up across fresh raycasts.
 */
export function createBodyPicker({canvas,camera,scenes,selectedPart}){
 const ray=new Raycaster(),point=new Vector2();
 const targets=scenes.map((scene,part)=>scene.bodies.map(({shell,core},body)=>({part,body,meshes:[shell,core]})));
 return event=>{
  const part=selectedPart();
  if(part===null||!targets[part])return null;
  const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  if(rect.width<=0||rect.height<=0||x<0||y<0||x>rect.width||y>rect.height)return null;
  scenes[part].root.updateWorldMatrix(true,true);camera.updateMatrixWorld();
  point.set(x/rect.width*2-1,1-y/rect.height*2);ray.setFromCamera(point,camera);
  const bodies=targets[part],hit=ray.intersectObjects(bodies.flatMap(target=>target.meshes),false)[0];
  return hit?bodies.find(target=>target.meshes.includes(hit.object)):null;
 };
}
