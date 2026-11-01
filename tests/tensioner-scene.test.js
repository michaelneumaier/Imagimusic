import test from 'node:test';
import assert from 'node:assert/strict';
import {createTensionerScene,tensionerSceneFrame,applyTensionerScene,TENSIONER_BINDINGS} from '../src/tensioner/scene.js';
import {explainBinding} from '../src/bindings.js';
const state={tension01:.8,bandwidthEstimateHz:2500,amplitude:.15};
function pose(s){return {carriage:s.carriage.position.toArray(),halo:[...s.halo.scale.toArray(),s.halo.material.emissiveIntensity],wheel:[s.arm.rotation.z,s.arm.visible,s.disc.visible],rod:[...s.rod.position.toArray(),...s.rod.quaternion.toArray(),...s.rod.scale.toArray()]};}
test('FM scene replay is independent of seek history and every motion has a declared value',()=>{
 const a=createTensionerScene(),b=createTensionerScene();
 const sequence=[state,{...state,modulatorPhase01:.23},{...state,amplitude:0},{...state,tension01:0}];
 for(const s of sequence){const frame=tensionerSceneFrame(s),applied=applyTensionerScene(frame,a);assert.ok(applied.every(v=>!v.missing));for(const binding of TENSIONER_BINDINGS)assert.deepEqual(explainBinding(binding,frame).value,applied.find(v=>v.id===binding.id).value);}
 for(const s of [...sequence].reverse()){const frame=tensionerSceneFrame(s);applyTensionerScene(frame,a);applyTensionerScene(frame,b);assert.deepEqual(pose(a),pose(b));}
});
test('fast FM shows a static disc, slow phase moves its arm, and silence fully settles the mechanism',()=>{
 const scene=createTensionerScene();
 applyTensionerScene(tensionerSceneFrame(state),scene);
 assert.equal(scene.arm.visible,false);assert.equal(scene.disc.visible,true);assert.equal(scene.arm.rotation.z,0);
 applyTensionerScene(tensionerSceneFrame({...state,modulatorPhase01:.25}),scene);
 assert.equal(scene.disc.visible,false);assert.equal(scene.arm.visible,true);assert.equal(scene.arm.rotation.z,Math.PI/2);
 applyTensionerScene(tensionerSceneFrame(state,{active:false}),scene);
 assert.equal(scene.carriage.position.x,.8);assert.equal(scene.halo.material.emissiveIntensity,0);assert.equal(scene.halo.scale.x,.018);assert.equal(scene.disc.visible,false);assert.equal(scene.arm.visible,false);
});
test('control rod endpoints stay attached through slow phase and changing carriage travel',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),scene=createTensionerScene();
 for(const phase of [0,.25,.5,.75]){
  applyTensionerScene(tensionerSceneFrame({...state,tension01:phase,modulatorPhase01:phase}),scene);scene.root.updateMatrixWorld(true);
  const ends=[-.5,.5].map(y=>scene.rod.localToWorld(new T.Vector3(0,y,0)));
  const carriage=scene.carriage.getWorldPosition(new T.Vector3()),pin=scene.pin.getWorldPosition(new T.Vector3());
  assert.ok(ends[0].distanceTo(carriage)<1e-12);assert.ok(ends[1].distanceTo(pin)<1e-12);
 }
});
test('real FM model state drives every binding and settles at its sample-aligned audio endpoint',async()=>{
 const {DEFAULT_TENSIONER,validateTensioner,tensionerCore,tensionerEnd,tensionerState}=await import('../src/fm.js');
 const scene=createTensionerScene();
 for(const ratio of [.01,2,3.5]){
  const model=tensionerCore(validateTensioner({...DEFAULT_TENSIONER,ratio})),{endS}=tensionerEnd(model,48000);
  for(const t of [0,.13,.8,endS-.01,endS]){
   const frame=tensionerSceneFrame(tensionerState(t,model,endS)),applied=applyTensionerScene(frame,scene);
   assert.ok(applied.every(v=>!v.missing));
   assert.equal(frame.stage.tensioner.positiveInstantaneousFrequency,model.positiveInstantaneousFrequency);
   assert.equal(scene.arm.visible,t<endS&&ratio===.01);
  }
  assert.equal(scene.halo.material.emissiveIntensity,0);assert.equal(scene.carriage.position.x,.8);
 }
});
