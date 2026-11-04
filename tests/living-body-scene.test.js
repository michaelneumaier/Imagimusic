import {createContinuousEnsembleReplayView} from '../src/living/continuous-ensemble-replay-view.js';
import {createTineDesign} from '../src/tine/address.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from '../vendor/three/build/three.module.js';
import {createLivingBody} from '../src/living/body-scene.js';
const materials=Object.fromEntries(['ceramic','bronze','steel','dark'].map(name=>[name,new T.MeshStandardMaterial()]));
const make=(length,widthMm)=>createLivingBody(length,{widthMm,materials,responseMagnification:1000});
function hash(root){const rows=[];root.traverse(o=>rows.push({type:o.type,name:o.name,position:o.position.toArray(),quaternion:o.quaternion.toArray(),scale:o.scale.toArray(),visible:o.visible,attributes:o.geometry?Object.fromEntries(Object.keys(o.geometry.attributes).sort().map(key=>[key,Array.from(o.geometry.attributes[key].array)])):null,index:o.geometry?.index?Array.from(o.geometry.index.array):null}));return createHash('sha256').update(JSON.stringify(rows)).digest('hex');}
test('default body meshes retain the pre-extraction vertex, index and transform fingerprints',()=>{
 // Captured from scene.js's original makeBody before extraction, excluding UUIDs/material identity.
 const expected={60:'515823819dcaf50bc3f8f5a9553b8e7996548e6d5412984a9c67556ac656d73f',80:'72b4bf7d7e927493142334daab3a4459a434d14226f4576713d66493c8a03ea7',95:'27e2beb47671f1101a597aadc8050736e0443d5c6a3c938c8bcc69f4245d91f9',120:'f25ce2789d79535a7bbb73970193492609ec6c96ec36d99b184352930ee3043c'};
 for(const [length,digest] of Object.entries(expected))assert.equal(hash(make(Number(length)).objects),digest);
});
test('renderable blades have actual saved width, response edges sit outside them, and clamps span them',()=>{
 for(const width of [5,10,20])for(const length of [60,85,120]){
  const body=make(length,width),bounds=new T.Box3().setFromObject(body.blade),size=bounds.getSize(new T.Vector3());
  assert.ok(Math.abs(size.z-width/10)<1e-7);assert.ok(Math.abs(bounds.max.x-length/10)<1e-6);assert.ok(Math.abs(size.y-.1)<1e-7);
  body.response(Array.from({length:81},(_,i)=>({u:i/80,boundM:.00001})));body.objects.updateMatrixWorld(true);
  const veils=[];body.objects.traverse(o=>{if(o.type==='Mesh'&&o.geometry?.attributes.position.count===162)veils.push(o);});assert.equal(veils.length,2);
  for(const veil of veils){const box=new T.Box3().setFromObject(veil);assert.ok(Math.abs(veil.position.z)>size.z/2);assert.ok(Math.abs(box.max.y-4.5)<1e-6);assert.ok(Math.abs(box.min.y-2.5)<1e-6);}
  const clamps=body.objects.children.filter(o=>o.material===materials.bronze&&o.geometry?.type==='ExtrudeGeometry');assert.equal(clamps.length,2);for(const clamp of clamps)assert.ok(new T.Box3().setFromObject(clamp).getSize(new T.Vector3()).z>size.z);
  body.acknowledgeTouch(true,.25);body.setLength(100);assert.ok(Math.abs(new T.Box3().setFromObject(body.blade).getSize(new T.Vector3()).z-width/10)<1e-7);
 }
});
test('invalid saved widths cannot create a misleading body',()=>{
 for(const width of [4,21,5.5,NaN,Infinity,'10'])assert.throws(()=>make(80,width),/width/);
});

test('saved replay camera contains actual wide-body geometry and maximum response veils',()=>{
 const record={kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:[0,1,2].map(()=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign({lengthMm:120,widthMm:20}),sampleRate:48000,fadeStart:0,events:[]}))},view=createContinuousEnsembleReplayView(record);
 const bounds=view.layout.instances.map(instance=>{const body=make(instance.bodyMm,instance.bodyWidthMm);body.objects.position.fromArray(instance.position);body.response(Array.from({length:81},(_,i)=>({u:i/80,boundM:.0001})));return new T.Box3().setFromObject(body.objects);});
 for(const aspect of [1.6,1,.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect),target=new T.Vector3(...view.layout.camera.target),direction=new T.Vector3(...view.layout.camera.direction).normalize();
  camera.position.copy(target).addScaledVector(direction,view.layout.camera.radius/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
  for(const box of bounds)for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1);}
 }
});
