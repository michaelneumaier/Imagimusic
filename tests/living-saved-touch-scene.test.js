import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {createSavedTouchCues} from '../src/living/saved-touch-scene.js';
import {savedTouchPose} from '../src/living/saved-touch-motion.js';
import {createTineDesign} from '../src/tine/address.js';
const layout={instances:[[0,0,5],[-13,0,-5],[13,0,-5]].map((position,id)=>({position,id}))};
const poses=down=>layout.instances.map((_,body)=>({body,opacity:(body+1)/3,...savedTouchPose(createTineDesign({lengthMm:[60,85,120][body],activation:[0,.25,1][body]}),down)}));
function resources(root){const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});return {meshes,geometries:new Set(meshes.map(o=>o.geometry)),materials:new Set(meshes.map(o=>o.material))};}
test('rendered cue heads meet computed saved positions with bounded reusable geometry',()=>{
 const cues=createSavedTouchCues(layout),before=resources(cues.objects);assert.equal(before.meshes.length,9);assert.equal(before.geometries.size,3);assert.equal(before.materials.size,3);
 for(let step=0;step<=100;step++){
  const ps=poses(step/100);cues.update(ps);cues.objects.updateMatrixWorld(true);
  for(const p of ps){const head=cues.objects.getObjectByName(`saved-cue-head-${p.body}`),expected=new T.Vector3(...p.head).add(new T.Vector3(...layout.instances[p.body].position));assert.ok(head.getWorldPosition(new T.Vector3()).distanceTo(expected)<1e-12);assert.equal(head.material.opacity,p.opacity);assert.equal(head.scale.x,p.headRadius);}
 }
 assert.deepEqual(resources(cues.objects),before);cues.update([]);assert.ok(cues.objects.children.every(o=>!o.visible));cues.dispose();
});
test('invalid batches leave the previously displayed cues untouched and disposal releases each resource once',()=>{
 const cues=createSavedTouchCues(layout),parent=new T.Group();parent.add(cues.objects);cues.update(poses(1));
 const before=cues.objects.toJSON();for(const bad of [[poses(0)[0],poses(0)[0]],[poses(0)[0],{...poses(0)[1],angle:NaN}],null]){assert.throws(()=>cues.update(bad));assert.deepEqual(cues.objects.toJSON(),before);}
 const {geometries,materials}=resources(cues.objects),counts=new Map();for(const r of [...geometries,...materials]){counts.set(r,0);r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));}
 cues.dispose();cues.dispose();assert.equal(parent.children.length,0);assert.ok([...counts.values()].every(n=>n===1));assert.throws(()=>cues.update([]),/disposed/);
});
test('cue geometry stays within the saved replay camera at wide and portrait aspects',()=>{
 const cues=createSavedTouchCues(layout);
 for(const aspect of [1.6,1,.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect),target=new T.Vector3(3,3.5,0);
  camera.position.copy(target).addScaledVector(new T.Vector3(5,8,18).normalize(),28/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
  for(const down of [0,.5,1]){cues.update(poses(down));const box=new T.Box3().setFromObject(cues.objects);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1);}}
 }
 cues.dispose();
});
