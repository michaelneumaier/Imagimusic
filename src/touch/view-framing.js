import {Box3,Vector3} from '../../vendor/three/build/three.module.js';
import {frameGroveView} from '../grove/view-framing.js';
import {TOUCH_GAIN,TOUCH_HEADROOM} from './session.js';

// Fixed full-response bounds avoid camera pumping as the envelope changes.
// Loom sphere radius .6, width .8 + 3*envelope; Touch admits envelope <= headroom/gain.
export function touchBodyBounds(body){
 if(body!==0&&body!==1)throw new RangeError('Choose left or right body.');
 const x=body?2:-2,half=.6*(.8+3*TOUCH_HEADROOM/TOUCH_GAIN)+.12;
 return new Box3(new Vector3(x-half,-.12,.08),new Vector3(x+half,2.92,1.92));
}
export function createTouchView({camera,controls}){
 let key='',saved=null;
 return {update({focus='both',width,height}){
  if(!['both','left','right'].includes(focus))throw new RangeError('Unknown Touch view.');
  if(![width,height].every(value=>Number.isFinite(value)&&value>0))return false;
  const next=[focus,width,height].join(':');if(next===key)return false;
  const close=focus!=='both';
  if(close&&!saved)saved={position:camera.position.clone(),target:controls.target.clone(),enabled:controls.enabled,minDistance:controls.minDistance,maxDistance:controls.maxDistance};
  camera.aspect=width/height;camera.zoom=close?1:Math.min(1,camera.aspect/1.5);camera.updateProjectionMatrix();
  if(close){
   const bounds=touchBodyBounds(focus==='left'?0:1);
   frameGroveView(camera,bounds,new Vector3(0,.65,6));
   controls.target.copy(bounds.getCenter(new Vector3()));controls.enabled=false;controls.minDistance=.1;controls.maxDistance=camera.far;
  }else if(saved){
   camera.position.copy(saved.position);controls.target.copy(saved.target);
   controls.enabled=saved.enabled;controls.minDistance=saved.minDistance;controls.maxDistance=saved.maxDistance;saved=null;
  }
  controls.update();key=next;return true;
 }};
}
