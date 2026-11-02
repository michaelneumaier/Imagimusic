import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Box3} from '../vendor/three/build/three.module.js';
import {frameGroveView} from '../src/grove/view-framing.js';

test('all corners remain in the frustum across viewports and instrument positions',()=>{
 for(const aspect of [.45,1,1.67,3])for(const x of [-3.2,0,3.2]){
  const camera=new PerspectiveCamera(42,aspect,.1,100);
  camera.zoom=Math.min(1,aspect/1.45);camera.updateProjectionMatrix();
  const bounds=new Box3(new Vector3(x-1.8,0,-1.75),new Vector3(x+1.8,2.2,1.75)),before=bounds.clone();
  frameGroveView(camera,bounds);
  let largest=0;
  for(const px of [bounds.min.x,bounds.max.x])for(const py of [bounds.min.y,bounds.max.y])for(const pz of [bounds.min.z,bounds.max.z]){
   const p=new Vector3(px,py,pz).project(camera);
   assert.ok(Math.abs(p.x)<=1+1e-10&&Math.abs(p.y)<=1+1e-10&&Math.abs(p.z)<=1);
   largest=Math.max(largest,Math.abs(p.x),Math.abs(p.y));
  }
  assert.ok(largest>.999,'at least one side should fit tightly rather than leaving arbitrary empty space');
  assert.deepEqual(bounds,before);
  const center=bounds.getCenter(new Vector3()).project(camera);
  assert.ok(Math.abs(center.x)<1e-10&&Math.abs(center.y)<1e-10);
 }
});

test('invalid or depth-clipped framing refuses before moving the camera',()=>{
 const camera=new PerspectiveCamera(42,1,.1,10),before=camera.position.clone();
 for(const bounds of [new Box3(),new Box3(new Vector3(-100,-100,-100),new Vector3(100,100,100)),new Box3(new Vector3(0,0,0),new Vector3(Infinity,1,1))])assert.throws(()=>frameGroveView(camera,bounds));
 assert.throws(()=>frameGroveView(camera,new Box3(new Vector3(-1,-1,-1),new Vector3(1,1,1)),new Vector3()));
 assert.deepEqual(camera.position,before);
});

test('the actual three Grove scenes retain their complete geometry at maximum display deformation',async()=>{
 const {createGroveScene,applyGroveScene}=await import('../src/grove/scene.js');
 const {composeGrove}=await import('../src/score/grove.js');
 const {retuneGroveCluster}=await import('../src/score/grove-tuning.js');
 const original=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
 try{
  for(const [i,note] of [48,51,55].entries()){
   const scene=createGroveScene(retuneGroveCluster(composeGrove({seed:3}),note));
   try{
    scene.root.scale.setScalar(.47);scene.root.position.set((i-1)*3.2,.1,0);
    const bounds=new Box3().setFromObject(scene.root).expandByScalar(.12);
    applyGroveScene(scene,{envelope:[1e6,1e6,1e6],strikes:[0,1,2].map(body=>({body,age:.299,strikeU:1,velocity:1}))},[1,1,1],[0,0,0]);
    assert.ok(bounds.containsBox(new Box3().setFromObject(scene.root)),'response and hand marks fit the static framing margin');
   }finally{scene.dispose();}
  }
 }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
