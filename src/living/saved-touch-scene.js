import * as T from '../../vendor/three/build/three.module.js';

/** A separate artistic cue layer, not a collision mechanism. Geometry is shared
 * and actors are bounded to the three saved bodies, never one object per event. */
export function createSavedTouchCues(layout){
 if(!Array.isArray(layout?.instances)||layout.instances.length!==3||layout.instances.some((x,i)=>x.id!==i||!Array.isArray(x.position)||x.position.length!==3||!x.position.every(Number.isFinite)))throw Error('Invalid saved cue layout.');
 const objects=new T.Group();objects.name='saved-touch-cues';
 const rodGeometry=new T.CylinderGeometry(.018,.018,1,12),headGeometry=new T.SphereGeometry(1,20,12),bearingGeometry=new T.SphereGeometry(.045,16,10),geometries=[rodGeometry,headGeometry,bearingGeometry];
 const materials=[],rigs=layout.instances.map(instance=>{
  const root=new T.Group();root.position.fromArray(instance.position);objects.add(root);root.visible=false;
  const material=new T.MeshStandardMaterial({color:0xe1bd7d,roughness:.35,metalness:.55,transparent:true,opacity:0,depthWrite:false});materials.push(material);
  const pivot=new T.Group();root.add(pivot);const bearing=new T.Mesh(bearingGeometry,material);pivot.add(bearing);
  const arm=new T.Group();pivot.add(arm);const rod=new T.Mesh(rodGeometry,material);rod.rotation.z=-Math.PI/2;arm.add(rod);
  const head=new T.Mesh(headGeometry,material);head.name=`saved-cue-head-${instance.id}`;arm.add(head);
  return {root,pivot,arm,rod,head,material};
 });
 let disposed=false;
 function update(poses=[]){
  if(disposed)throw Error('Saved cue layer is disposed.');
  const seen=new Set();
  if(!Array.isArray(poses)||poses.length>3)throw Error('Invalid saved cue poses.');
  for(const p of poses){
   if(!p||!Number.isInteger(p.body)||p.body<0||p.body>2||seen.has(p.body)||!Number.isFinite(p.armLength)||p.armLength<=0||p.armLength>5||!Number.isFinite(p.angle)||Math.abs(p.angle)>Math.PI||!Array.isArray(p.pivot)||p.pivot.length!==3||!p.pivot.every(Number.isFinite)||!Number.isFinite(p.headRadius)||p.headRadius<=0||p.headRadius>.1||!Number.isFinite(p.opacity)||p.opacity<0||p.opacity>1)throw Error('Invalid saved cue pose.');
   seen.add(p.body);
  }
  rigs.forEach(r=>r.root.visible=false);
  for(const p of poses){const r=rigs[p.body];r.root.visible=p.opacity>0;r.pivot.position.fromArray(p.pivot);r.arm.rotation.z=p.angle;r.rod.scale.y=p.armLength;r.rod.position.x=p.armLength/2;r.head.position.x=p.armLength;r.head.scale.setScalar(p.headRadius);r.material.opacity=p.opacity;}
 }
 function dispose(){if(disposed)return;disposed=true;objects.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 return {objects,update,dispose};
}
