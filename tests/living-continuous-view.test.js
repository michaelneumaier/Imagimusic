import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {createContinuousReturnView} from '../src/living/continuous-return-view.js';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {requestForTineDesign} from '../src/tine/address.js';
test('checkpoint envelope agrees with streaming physical state throughout a joined48second score',()=>{
 const p=createContinuousReturnPerformance(),view=createContinuousReturnView(),model=createTineImpulse(requestForTineDesign(view.plan.design).geometry),block=new Float32Array(128);p.start();
 for(let section=0;section<8;section++){
  if(section%2===0)view.accept(p.tryGuest(section===2?-.05:.025).events);
  const end=(section+1)*6*48000;while(p.frame<end)view.accept(p.process(block));
  const snapshot=p.snapshot().body,frame=view.at(p.frame/48000);
  const amplitudes=model.modes.map((m,i)=>{const s=snapshot.modes[i];return Math.hypot(s.displacementM,(s.velocityMPerS+m.gamma*s.displacementM)/m.omegaD);});
  for(const [i,value] of frame.amplitudesM.entries())assert.ok(Math.abs(value-amplitudes[i])<1e-15);
  for(const point of frame.instances[0].points){const expected=model.modes.reduce((sum,m,i)=>sum+Math.abs(m.shape(point.u))*amplitudes[i],0);assert.ok(Math.abs(point.boundM-expected)<2e-15);}
 }
 assert.equal(view.at(48).touches,29);assert.equal(view.at(48).instances[0].endingOpacity,0);
});
test('signed cancellation, future filtering and exact marker expiry survive checkpoint reconstruction',()=>{
 const view=createContinuousReturnView();view.accept([{index:0,frame:0,strength:.05,origin:'guest'},{index:1,frame:0,strength:-.05,origin:'guest'}]);
 assert.ok(view.at(0).amplitudesM.every(x=>x===0));assert.equal(view.at(0).touches,2);assert.equal(view.at(.12).instances[0].touchMarker,null);
 const score=view.plan.events[0];view.accept([{...score,index:2,origin:'score'}]);
 assert.equal(view.at((score.frame-1)/48000).touches,2);assert.equal(view.at(score.frame/48000).touches,3);
 assert.equal(view.at(score.frame/48000).instances[0].touchMarker.origin,'score');
});
test('invalid batches and endings are atomic and accepted snapshots cannot mutate checkpoints',()=>{
 const view=createContinuousReturnView(),first={...view.plan.events[0],index:0,origin:'score'};
 assert.throws(()=>view.accept([first,{...view.plan.events[1],strength:.099,index:1,origin:'score'}]));assert.equal(view.accepted.length,0);
 assert.throws(()=>view.accept([{index:0,frame:first.frame,strength:.05,origin:'guest'}]));
 view.accept([first]);first.strength=.1;assert.equal(view.accepted[0].strength,view.plan.events[0].strength);const copy=view.accepted;copy.length=0;assert.equal(view.accepted.length,1);
 assert.throws(()=>view.end(first.frame-1));assert.throws(()=>view.at(49));assert.throws(()=>view.at(NaN));
 const before=view.at(1).instances[0].points;view.end(48000);assert.deepEqual(view.at(1).instances[0].points,before);assert.equal(view.at(49199/48000).instances[0].endingOpacity,0);
 const full=createContinuousReturnView();full.accept([view.accepted[0]]);assert.deepEqual(view.at(1.01).instances[0].points,full.at(1.01).instances[0].points);
});
test('bounded history and held framing cover the admitted spatial bound at the declared magnification',()=>{
 const view=createContinuousReturnView();view.accept(Array.from({length:4096},(_,index)=>({frame:0,strength:1e-9,index,origin:'guest'})));
 assert.equal(view.at(.1).touches,4096);assert.throws(()=>view.accept([{frame:0,strength:1e-9,index:4096,origin:'guest'}]));
 const height=.0001*100*view.magnification,points=[[-3,0,-2],[8,6,2],[0,3.5-height,0],[8,3.5-height,0],[0,3.5+height,0],[8,3.5+height,0]];
 for(const aspect of [1.6,1,.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect),target=new T.Vector3(...view.layout.camera.target),direction=new T.Vector3(...view.layout.camera.direction).normalize();
  camera.position.copy(target).addScaledVector(direction,view.layout.camera.radius/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
  for(const point of points){const projected=new T.Vector3(...point).project(camera);assert.ok(Math.abs(projected.x)<.95&&Math.abs(projected.y)<.95&&projected.z>-1&&projected.z<1);}
 }
});
