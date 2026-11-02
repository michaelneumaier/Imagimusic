import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,MeshBasicMaterial,SphereGeometry,BoxGeometry,PerspectiveCamera,Vector3} from '../vendor/three/build/three.module.js';
import {createInversePicker} from '../src/inverse/picking.js';
function fixture(){
 const root=new Group(),material=new MeshBasicMaterial(),shellGeometry=new SphereGeometry(.3,16,12),coreGeometry=new SphereGeometry(.1,8,6),bridgeGeometry=new BoxGeometry(1.2,.12,.12);
 const bodies=[-1,1].map(x=>{const shell=new Mesh(shellGeometry,material),core=new Mesh(coreGeometry,material);shell.position.x=core.position.x=x;root.add(shell,core);return {shell,core};});
 const curve=new Mesh(bridgeGeometry,material);root.add(curve);
 const ornament=new Mesh(shellGeometry,material);ornament.position.y=1;root.add(ornament);
 return {root,bodies,bridges:[{curve,spec:{a:0,b:1,coupling:.02}}],dispose(){material.dispose();shellGeometry.dispose();coreGeometry.dispose();bridgeGeometry.dispose();}};
}
test('actual body and bridge hits have distinct stable identities; ornaments and off-canvas input never pick',()=>{
 const scene=fixture(),camera=new PerspectiveCamera(45,1,.1,100);camera.position.z=5;camera.updateMatrixWorld();
 const rect={left:20,top:30,width:400,height:400},canvas={getBoundingClientRect:()=>rect};
 const event=(x,y)=>{const p=new Vector3(x,y,0).project(camera);return {clientX:rect.left+(p.x+1)/2*rect.width,clientY:rect.top+(1-p.y)/2*rect.height};};
 let mounted=scene;const pick=createInversePicker({canvas,camera,getScene:()=>mounted});
 try{
  const body=pick(event(-1,0)),bridge=pick(event(0,0));assert.deepEqual(body,{kind:'body',body:0});assert.strictEqual(pick(event(-1,0)),body);
  assert.deepEqual(bridge,{kind:'bridge',index:0,a:0,b:1,coupling:.02});assert.strictEqual(pick(event(0,0)),bridge);assert.notStrictEqual(body,bridge);
  assert.equal(pick(event(0,1)),null);assert.equal(pick({clientX:19,clientY:40}),null);assert.equal(pick({clientX:NaN,clientY:40}),null);
  mounted=null;assert.equal(pick(event(-1,0)),null);
 }finally{scene.dispose();}
});
test('candidate replacement changes identities; current geometry, camera and viewport are used on every raycast',()=>{
 const first=fixture(),second=fixture(),camera=new PerspectiveCamera(45,1,.1,100);camera.position.z=5;camera.updateMatrixWorld();
 let rect={left:0,top:0,width:400,height:400},mounted=first;
 const pick=createInversePicker({canvas:{getBoundingClientRect:()=>rect},camera,getScene:()=>mounted});
 const center=()=>({clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2});
 try{
  const old=pick(center());mounted=second;const next=pick(center());assert.notStrictEqual(next,old);assert.deepEqual(next,old);
  rect={left:100,top:70,width:800,height:800};assert.strictEqual(pick(center()),next);
  second.bridges[0].curve.position.y=2;assert.equal(pick(center()),null);
  camera.position.x=1;camera.lookAt(1,0,0);assert.equal(pick(center()).body,1);
  rect.width=0;assert.equal(pick(center()),null);
 }finally{first.dispose();second.dispose();}
});
