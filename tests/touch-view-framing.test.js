import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from '../vendor/three/build/three.module.js';
import {createTouchView,touchBodyBounds} from '../src/touch/view-framing.js';
test('Touch close framing fits full admitted response, remains stable and restores the chosen orbit',()=>{
 const camera=new PerspectiveCamera(42,1,.1,100);camera.position.set(2,4,11);
 const controls={target:new Vector3(0,1.1,1),enabled:true,minDistance:5,maxDistance:28,update(){camera.lookAt(this.target);camera.updateMatrixWorld();}};
 const view=createTouchView({camera,controls}),position=camera.position.clone(),target=controls.target.clone();
 for(const width of [280,1200])for(const focus of ['left','right']){
  assert.equal(view.update({focus,width,height:390}),true);
  const bounds=touchBodyBounds(focus==='left'?0:1);
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1.000001&&Math.abs(p.y)<=1.000001&&Math.abs(p.z)<1);
  }
  assert.equal(controls.enabled,false);
  const still=camera.position.clone();assert.equal(view.update({focus,width,height:390}),false);assert.deepEqual(camera.position,still);
 }
 view.update({focus:'both',width:1200,height:390});assert.deepEqual(camera.position,position);assert.deepEqual(controls.target,target);
 assert.equal(controls.enabled,true);assert.equal(controls.minDistance,5);assert.equal(controls.maxDistance,28);
 assert.equal(view.update({focus:'left',width:0,height:390}),false);assert.deepEqual(camera.position,position);
 assert.throws(()=>touchBodyBounds(2));
});

test('close bounds contain the actual Loom geometry at Touch admission maximum',async()=>{
 const {Box3}=await import('../vendor/three/build/three.module.js');
 const {createLoomScene,applyLoomScene,loomSceneFrame}=await import('../src/loom/scene.js');
 const {TOUCH_GAIN,TOUCH_HEADROOM}=await import('../src/touch/session.js');
 const scene=createLoomScene();
 applyLoomScene(loomSceneFrame({time:0,envelope:[TOUCH_HEADROOM/TOUCH_GAIN,TOUCH_HEADROOM/TOUCH_GAIN],displacement:[0,0],averaged:false,strikes:[]},{coupling:.004}),scene);
 scene.root.updateMatrixWorld(true);
 for(const i of [0,1])assert.ok(touchBodyBounds(i).containsBox(new Box3().setFromObject(scene.bodies[i].body.parent)));
});
