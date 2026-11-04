import * as T from '../vendor/three/build/three.module.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createLivingSharedPhrasePass} from '../src/living/shared-phrase-pass.js';
import {createLivingSharedPhraseView} from '../src/living/shared-phrase-view.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:28800,strength:.1}],fadeStart:120000};
test('the single visible response matches the continuous streaming modal state after score and guest impulses',()=>{
 const pass=createLivingSharedPhrasePass(source),view=createLivingSharedPhraseView(source);pass.start();
 pass.process(new Float32Array(28800));pass.strike(.05);pass.process(new Float32Array(4800));
 const snapshot=pass.snapshot();view.accept(snapshot.applied.map((e,index)=>({...e,index})));
 const frame=view.at(pass.frame/48000),model=createTineImpulse(requestForTineDesign(source.design).geometry);
 assert.equal(frame.instances.length,1);assert.equal(frame.touches,3);assert.equal(frame.guestTouches,1);
 for(const point of frame.instances[0].points){
  const expected=model.modes.reduce((sum,m,i)=>{const state=snapshot.modes[i];const amplitude=Math.hypot(state.displacementM,(state.velocityMPerS+m.gamma*state.displacementM)/m.omegaD);return sum+Math.abs(m.shape(point.u))*amplitude;},0);
  assert.ok(Math.abs(point.boundM-expected)<1e-16,`${point.u}: ${point.boundM} versus ${expected}`);
 }
});
test('accepted events never appear ahead of their frame, and rejected batches leave no partial visual changes',()=>{
 const view=createLivingSharedPhraseView(source),batch=source.events.map((e,index)=>({...e,index,origin:'score'}));
 assert.throws(()=>view.accept([batch[0],{...batch[1],strength:.05}]),/differs/);assert.equal(view.accepted.length,0);
 assert.throws(()=>view.accept([{index:0,origin:'guest',frame:16800,strength:.05}]),/precede/);
 view.accept(batch);batch[0].strength=.1;assert.equal(view.accepted[0].strength,.025);
 assert.equal(view.at(.35-1/48000).touches,0);assert.equal(view.at(.35-1/48000).instances[0].points,null);
 assert.equal(view.at(.35).touches,1);assert.equal(view.at(.6).touches,2);
 assert.throws(()=>view.accept([{index:2,origin:'guest',frame:1,strength:.05}]),/Invalid/);assert.equal(view.accepted.length,2);
 const snapshot=view.accepted;snapshot.length=0;assert.equal(view.accepted.length,2);
});
test('Quiet changes presentation opacity, never the continuing mechanical envelope',()=>{
 const full=createLivingSharedPhraseView(source),early=createLivingSharedPhraseView(source);
 const batch=source.events.map((e,index)=>({...e,index,origin:'score'}));full.accept(batch);early.accept(batch);early.end(48000);
 const frame=48000+600,ended=early.at(frame/48000),unfaded=full.at(frame/48000);
 assert.deepEqual(ended.instances[0].points,unfaded.instances[0].points);assert.equal(ended.instances[0].endingOpacity,(49199-frame)/1199);
 assert.equal(early.at(49199/48000).instances[0].endingOpacity,0);assert.equal(early.at(49200/48000).instances[0].endingOpacity,0);
 assert.throws(()=>early.end(100),/ending/);assert.throws(()=>early.at(NaN),/time/);
 assert.deepEqual(early.layout,full.layout);
});

test('held single-body framing contains the body and a sampled maximum-strength coincident response',()=>{
 const strong={...source,events:Array.from({length:5},()=>({frame:0,strength:.1}))};
 const view=createLivingSharedPhraseView(strong);view.accept([...strong.events.map((e,index)=>({...e,index,origin:'score'})),...Array.from({length:3},(_,i)=>({index:i+5,frame:0,strength:.1,origin:'guest'}))]);
 const points=[[-3,0,-2],[8,6,2],...view.at(0).instances[0].points.flatMap(p=>[[-0+p.u*8,3.5+p.boundM*1e7,.51],[p.u*8,3.5-p.boundM*1e7,.51]])];
 for(const aspect of [1.6,1,.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect),target=new T.Vector3(...view.layout.camera.target),direction=new T.Vector3(...view.layout.camera.direction).normalize();
  camera.position.copy(target).addScaledVector(direction,view.layout.camera.radius/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
  for(const point of points){const p=new T.Vector3(...point).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1);}
 }
});

test('touch marker uses accepted timing and actual activation, expires and does not alter response',()=>{
 const selected={...source,design:createTineDesign({activation:.25})},view=createLivingSharedPhraseView(selected);
 view.accept(selected.events.map((e,index)=>({...e,index,origin:'score'})));
 assert.equal(view.at(.35-1/48000).instances[0].touchMarker,null);
 assert.deepEqual(view.at(.35).instances[0].touchMarker,{activation:.25,frame:16800,origin:'score'});
 assert.equal(view.at(.47).instances[0].touchMarker,null);
 const before=view.at(.6).instances[0].points;
 view.accept([{index:2,frame:33600,strength:.05,origin:'guest'}]);
 assert.deepEqual(view.at(.6).instances[0].points,before);
 assert.deepEqual(view.at(.7).instances[0].touchMarker,{activation:.25,frame:33600,origin:'guest'});
 view.end(33600);assert.equal(view.at(.725).instances[0].touchMarker,null);
});
