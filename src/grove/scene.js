import * as T from '../../vendor/three/build/three.module.js';
import {groveAnatomy} from './anatomy.js';
const colors=[0xa4d0b8,0xd8b5d8,0x9fc7dc,0xe0c18f,0xbebee1];
const metal=()=>new T.MeshStandardMaterial({color:0xbfa67d,metalness:.72,roughness:.3});
function add(parent,geometry,material,position=[0,0,0]){const mesh=new T.Mesh(geometry,material);mesh.position.fromArray(position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function tube(parent,points,radius,material){return add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),64,radius,8,false),material);}
export function createGroveScene(grove,{vectors=[]}={}){
 const anatomy=groveAnatomy(grove),root=new T.Group(),brass=metal();
 const width=1.15*Math.max(2.2,...anatomy.bodies.map(b=>Math.abs(b.position[0])+1));
 const depth=1.15*Math.max(1.15,...anatomy.bodies.map(b=>Math.abs(b.position[2])+.7));
 const crown=add(root,new T.TorusGeometry(1,.025,10,100),brass,[0,4.15,0]);crown.rotation.x=Math.PI/2;crown.scale.set(width,depth,1);
 // A common support is visual structure, not another vibrating degree of freedom.
 for(const sign of [-1,1])tube(root,[[sign*width,0,0],[sign*(width+.2),1.7,0],[sign*width,4.15,0]],.035,brass);
 const bodies=anatomy.bodies.map((spec,i)=>{
  const anchor=new T.Group();anchor.position.fromArray(spec.position);root.add(anchor);const form=new T.Group();anchor.add(form);form.scale.fromArray(spec.scale);
  const skin=new T.MeshPhysicalMaterial({color:colors[i%colors.length],metalness:.22,roughness:.21,transparent:true,opacity:.58,side:T.DoubleSide,clearcoat:1,emissive:colors[i%colors.length],emissiveIntensity:.025});
  const profile=Array.from({length:25},(_,j)=>{const u=j/24;return new T.Vector2(.045+Math.sin(Math.PI*u)**.7*(.7+.15*Math.cos(4*Math.PI*u)),(u-.5)*2.6);});
  const shell=add(form,new T.LatheGeometry(profile,48),skin);
  const core=add(form,new T.IcosahedronGeometry(.28,1),new T.MeshStandardMaterial({color:0xefdfb5,metalness:.6,roughness:.3,emissive:colors[i%colors.length],emissiveIntensity:.1}));
  const top=spec.position[1]+spec.scale[1]*1.3;
  const crossDepth=depth*Math.sqrt(1-(spec.position[0]/width)**2);
  tube(root,[[spec.position[0],4.15,-crossDepth],[spec.position[0],4.15,0],[spec.position[0],4.15,crossDepth]],.012,brass);
  tube(root,[[spec.position[0],top,spec.position[2]],[spec.position[0],(top+4.15)/2,spec.position[2]],[spec.position[0],4.15,spec.position[2]]],.008,brass);
  const collar=add(form,new T.TorusGeometry(.76,.018,8,48),brass);collar.rotation.x=Math.PI/2;
  const bands=vectors.map((v,j)=>{
   const weight=(v[i]??0)**2,arc=Math.max(.04,Math.PI*2*weight),material=new T.MeshBasicMaterial({color:colors[j%colors.length],transparent:true,opacity:.45});
   const band=add(form,new T.TorusGeometry(.85,.012,6,48,arc),material,[0,(j-(vectors.length-1)/2)*.25,0]);band.rotation.x=Math.PI/2;band.rotation.z=j*Math.PI*.6;return band;
  });
  const labelCanvas=document.createElement('canvas');labelCanvas.width=128;labelCanvas.height=64;const ink=labelCanvas.getContext('2d');ink.font='28px monospace';ink.fillStyle='#d8d5cf';ink.textAlign='center';ink.fillText(String(i+1).padStart(2,'0'),64,42);const labelTexture=new T.CanvasTexture(labelCanvas),label=new T.Sprite(new T.SpriteMaterial({map:labelTexture,transparent:true,depthWrite:false}));label.position.set(spec.position[0],.45,spec.position[2]);label.scale.set(.65,.325,1);root.add(label);
  const halo=add(root,new T.TorusGeometry(.6,.009,6,64),new T.MeshBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:.15}),[spec.position[0],.025,spec.position[2]]);halo.rotation.x=Math.PI/2;
  const gesture=add(anchor,new T.TorusGeometry(.65,.012,8,64),new T.MeshBasicMaterial({color:0xf2e3ff,transparent:true,opacity:0,depthWrite:false}));gesture.rotation.x=Math.PI/2;
  return {anchor,form,shell,core,bands,halo,gesture,labelTexture,spec};
 });
 const bridges=anatomy.bridges.filter(b=>b.visible).map(spec=>{
  const a=anatomy.bodies[spec.a].position,b=anatomy.bodies[spec.b].position;
  const curve=tube(root,[a,[(a[0]*2+b[0])/3,1.25,(a[2]*2+b[2])/3],[(a[0]+b[0]*2)/3,1.25,(a[2]+b[2]*2)/3],b],spec.radius,brass);
  return {curve,spec};
 });
 return {root,bodies,bridges,anatomy,dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});bodies.forEach(b=>b.labelTexture.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
/** Amplified response envelopes animate shell width and light, never edge flow. */
export function applyGroveScene(scene,{envelope=[]}={},holds=[]){
 for(const [i,body] of scene.bodies.entries()){
  const level=Math.max(0,envelope[i]??0),pulse=Math.min(.2,level*.6);
  const held=holds[i]??0;body.gesture.visible=held>0;body.gesture.material.opacity=held>0?.35+.5*held:0;body.gesture.scale.setScalar(1+.35*held);
  body.form.scale.set(body.spec.scale[0]*(1+pulse),body.spec.scale[1],body.spec.scale[2]*(1+pulse));
  body.shell.material.emissiveIntensity=.025+Math.min(.7,level*2);body.core.material.emissiveIntensity=.1+Math.min(1.2,level*3);body.halo.material.opacity=.15+Math.min(.65,level*2);
 }
}
