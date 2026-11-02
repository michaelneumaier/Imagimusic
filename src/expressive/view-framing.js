import {Vector3} from '../../vendor/three/build/three.module.js';
import {frameGroveView as fitPerspectiveBounds} from '../grove/view-framing.js';

/** Camera-only state. Bounds are fixed across the mechanism's full motion;
 * animation and playback time are deliberately absent from this interface.
 */
export function createExpressionView({camera,controls,boundsFor}){
 if(typeof boundsFor!=='function')throw new TypeError('Expression view needs a bounds provider.');
 const original={minDistance:controls.minDistance,maxDistance:controls.maxDistance,enabled:controls.enabled};
 let lastScene=null,lastKey='';
 return {update({scene,selected=0,close=false,width,height}){
  const count=scene.bodies.length;
  if(!Number.isInteger(selected)||selected<0||selected>=count)throw new RangeError('Selected voice is outside this scene.');
  if(![width,height].every(n=>Number.isFinite(n)&&n>0))return false;
  const key=[width,height,close,close?selected:0].join(':');
  if(scene===lastScene&&key===lastKey)return false;
  const bounds=close?boundsFor(count,selected).clone().expandByScalar(.12):null;
  camera.aspect=width/height;camera.zoom=close?1:Math.min(1,camera.aspect/1.5);camera.updateProjectionMatrix();
  if(close){
   const center=bounds.getCenter(new Vector3());
   fitPerspectiveBounds(camera,bounds,new Vector3(0,.8,6));
   controls.target.copy(center);controls.minDistance=.1;controls.maxDistance=camera.far;
   controls.enabled=false;
  }else{
   camera.position.set(1,4.6,Math.max(10,count*2.9));controls.target.set(0,1.3,0);
   Object.assign(controls,original);
  }
  controls.update();
  scene.bodies.forEach((body,i)=>{body.root.visible=!close||i===selected;});
  lastScene=scene;lastKey=key;return true;
 }};
}
