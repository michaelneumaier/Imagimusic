import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,PerspectiveCamera,Vector3} from '../vendor/three/build/three.module.js';
import {createInverseScene} from '../src/inverse/scene.js';
import {composeGrove} from '../src/score/grove.js';
import {frameGroveView} from '../src/grove/view-framing.js';
test('close framing retains actual bodies, bridges, halos and maximum touch marks across viewports, without response-driven camera changes',()=>{
 const original=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
 try{
  for(const seed of [3,7,11,19,31]){
   const scene=createInverseScene(composeGrove({seed}));
   try{
    const fixed=scene.playingBounds.clone();
    scene.update({strikes:[0,1,2].map(body=>({body,age:.299,envelope:[1,1,1]}))});scene.root.updateMatrixWorld(true);
    for(const body of scene.bodies)for(const part of [body.form,body.halo,body.label,body.strike])assert.ok(fixed.containsBox(new Box3().setFromObject(part)),`seed ${seed}: close frame contains response geometry`);
    for(const bridge of scene.bridges)assert.ok(fixed.containsBox(new Box3().setFromObject(bridge.curve)));
    assert.deepEqual(scene.playingBounds,fixed);
    assert.ok(fixed.getSize(new Vector3()).length()<scene.bounds.getSize(new Vector3()).length(),'support exclusion gives a tighter bound');
    for(const aspect of [.45,.79,1.2,2]){
     const camera=new PerspectiveCamera(42,aspect,.1,100);camera.zoom=Math.min(1,aspect/1.45);camera.updateProjectionMatrix();frameGroveView(camera,fixed);
     for(const x of [fixed.min.x,fixed.max.x])for(const y of [fixed.min.y,fixed.max.y])for(const z of [fixed.min.z,fixed.max.z]){const point=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(point.x)<=1+1e-10&&Math.abs(point.y)<=1+1e-10&&Math.abs(point.z)<=1);}
     const position=camera.position.clone();scene.update({strikes:[]});assert.deepEqual(camera.position,position);
    }
   }finally{scene.dispose();}
  }
 }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
