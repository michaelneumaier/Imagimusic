import {Matrix4,Vector3} from '../../vendor/three/build/three.module.js';

/** Fit an intact instrument's padded world-space bounds, without moving it.
 * Called after viewport aspect and camera zoom have been updated.
 */
export function frameGroveView(camera,bounds,direction=new Vector3(0,2.3,10.8)){
 if(bounds.isEmpty()||![...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite))throw new Error('View needs finite nonempty bounds');
 if(!direction.toArray().every(Number.isFinite)||direction.lengthSq()===0)throw new Error('View needs a finite direction');
 const vertical=Math.tan(camera.fov*Math.PI/360)/camera.zoom,horizontal=vertical*camera.aspect;
 if(!(vertical>0&&horizontal>0&&Number.isFinite(vertical+horizontal)))throw new Error('View needs a valid perspective camera');
 const center=bounds.getCenter(new Vector3()),back=direction.clone().normalize();
 const basis=new Matrix4().lookAt(back,new Vector3(),camera.up);
 const right=new Vector3().setFromMatrixColumn(basis,0),up=new Vector3().setFromMatrixColumn(basis,1);
 const corners=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new Vector3(x,y,z).sub(center));
 // Each corner must fit both side planes at its own depth, not just at centre.
 const distance=Math.max(...corners.map(p=>p.dot(back)+Math.max(Math.abs(p.dot(right))/horizontal,Math.abs(p.dot(up))/vertical,camera.near*1.01)));
 if(corners.some(p=>distance-p.dot(back)>=camera.far))throw new Error('View lies outside camera depth range');
 camera.position.copy(center).addScaledVector(back,distance);
 camera.lookAt(center);camera.updateMatrixWorld();
 return distance;
}
