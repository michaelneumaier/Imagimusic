import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,SphereGeometry,MeshBasicMaterial,PerspectiveCamera,Vector3} from '../vendor/three/build/three.module.js';
import {createBodyPicker} from '../src/grove/body-picking.js';

test('picker excludes hidden Groves and decorative meshes, and follows current viewport and camera',()=>{
 const geometry=new SphereGeometry(.2,12,8),material=new MeshBasicMaterial();
 function scene(z){
  const root=new Group();root.position.z=z;
  const bodies=[-.6,.6].map(x=>{const shell=new Mesh(geometry,material),core=new Mesh(geometry,material);shell.position.x=core.position.x=x;core.scale.setScalar(.5);root.add(shell,core);return {shell,core};});
  // A cue between the bodies must never be a playable hit.
  root.add(new Mesh(geometry,material));return {root,bodies};
 }
 const scenes=[scene(0),scene(1)],camera=new PerspectiveCamera(42,4/3,.1,100);
 camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 scenes[1].root.visible=false;
 let selected=0,rect={left:100,top:50,width:320,height:240};
 const picker=createBodyPicker({canvas:{getBoundingClientRect:()=>rect},camera,scenes,selectedPart:()=>selected});
 const eventAt=p=>{const n=p.clone().project(camera);return {clientX:rect.left+(n.x+1)*rect.width/2,clientY:rect.top+(1-n.y)*rect.height/2};};
 const hit=picker(eventAt(new Vector3(-.6,0,0)));
 assert.equal(hit.part,0);assert.equal(hit.body,0,'the closer hidden Grove cannot steal the hit');
 assert.equal(picker(eventAt(new Vector3(-.6,0,0))),hit,'stable identity across raycasts');
 assert.equal(picker(eventAt(new Vector3(0,0,0))),null,'decorative cue is excluded');
 assert.equal(picker({clientX:99,clientY:100}),null,'outside canvas');
 selected=null;assert.equal(picker(eventAt(new Vector3(-.6,0,0))),null,'Together has no direct hits');
 selected=1;assert.equal(picker(eventAt(new Vector3(.6,0,1))).body,1);
 rect={left:10,top:30,width:1000,height:280};camera.aspect=rect.width/rect.height;camera.position.x=1;camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const next=picker(eventAt(new Vector3(.6,0,1)));assert.equal(next.part,1);assert.equal(next.body,1,'new viewport and camera are read at each pick');
 geometry.dispose();material.dispose();
});
