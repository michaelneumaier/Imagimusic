import {Box3,Vector3} from '../../vendor/three/build/three.module.js';
import {createGroveScene,applyGroveScene} from '../grove/scene.js';
import {inverseFocusBounds} from './focus-bounds.js';
import {inversePicture,INVERSE_MAX_WIDENING} from './picture.js';
/** Grove forms are an artistic embedding of this distinct three-mass model.
 * No partial bands, hand controls, altered springs or added audio modes. */
export function createInverseScene(grove){
 const scene=createGroveScene(grove,{bodyLabels:['01','02','03']});
 function update(snapshot,options){
  const picture=inversePicture(snapshot,options);
  applyGroveScene(scene,{envelope:[0,0,0],strikes:picture.strikes});
  scene.bodies.forEach((body,i)=>{
   const mapped=picture.bodies[i];body.form.scale.set(body.spec.scale[0]*mapped.width,body.spec.scale[1],body.spec.scale[2]*mapped.width);
   body.halo.material.opacity=mapped.haloOpacity;body.shell.material.emissiveIntensity=mapped.shellEmission;body.core.material.emissiveIntensity=mapped.coreEmission;
  });
  return picture;
 }
 // Fixed bounds contain the full widening range, support and connections. Add
 // the largest touch ring independently because it exists for only 0.3 seconds.
 scene.bodies.forEach(body=>body.form.scale.set(body.spec.scale[0]*(1+INVERSE_MAX_WIDENING),body.spec.scale[1],body.spec.scale[2]*(1+INVERSE_MAX_WIDENING)));
 scene.root.updateMatrixWorld(true);
 const focusBounds=inverseFocusBounds(scene);
 const bounds=new Box3().setFromObject(scene.root),playingBounds=new Box3();
 for(const body of scene.bodies){
  playingBounds.union(new Box3().setFromObject(body.form));
  playingBounds.union(new Box3().setFromObject(body.halo));
  playingBounds.union(new Box3().setFromObject(body.label));
 }
 for(const bridge of scene.bridges)playingBounds.union(new Box3().setFromObject(bridge.curve));
 for(const body of scene.bodies){
  const center=body.anchor.getWorldPosition(new Vector3()),radius=.67*1.35;
  for(const box of [bounds,playingBounds]){
   box.expandByPoint(center.clone().add(new Vector3(-radius,-.03,-radius)));
   box.expandByPoint(center.clone().add(new Vector3(radius,.03,radius)));
  }
 }
 bounds.expandByScalar(.35);playingBounds.expandByScalar(.35);update({strikes:[]});
 return {...scene,bounds,playingBounds,focusBounds,update};
}
