import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {createContinuousEnsembleView} from '../src/living/continuous-ensemble-view.js';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {requestForTineDesign} from '../src/tine/address.js';
function evidence(){const p=createContinuousEnsemblePerformance(),events=[];p.start();while(p.state!=='ended')events.push(...p.process(new Float32Array(4096)));return events;}
test('three visible bodies agree with their uninterrupted streaming physical states',()=>{
 const p=createContinuousEnsemblePerformance(),view=createContinuousEnsembleView(),models=view.plan.bodies.map(b=>createTineImpulse(requestForTineDesign(b).geometry));p.start();
 for(let section=0;section<8;section++){
  const target=(section+1)*6*48000;while(p.frame<target)view.accept(p.process(new Float32Array(Math.min(1001,target-p.frame))));
  const frame=view.at(p.frame/48000),states=p.snapshot();
  frame.instances.forEach((body,i)=>{
   const expected=models[i].modes.map((m,j)=>{const s=states[i].body.modes[j];return Math.hypot(s.displacementM,(s.velocityMPerS+m.gamma*s.displacementM)/m.omegaD);});
   expected.forEach((amp,j)=>assert.ok(Math.abs(amp-body.amplitudesM[j])<1e-15));
   for(const point of body.points??[]){const bound=models[i].modes.reduce((sum,m,j)=>sum+Math.abs(m.shape(point.u))*expected[j],0);assert.ok(Math.abs(point.boundM-bound)<2e-15);}
  });
 }
 assert.equal(view.at(48).touches,25);assert.deepEqual(view.at(48).instances.map(x=>x.touches),[9,10,6]);assert.ok(view.at(48).instances.every(x=>x.endingOpacity===0));
});
test('prefetched accepted history shows only audible events, with separate expiring touch markers',()=>{
 const view=createContinuousEnsembleView();view.accept(evidence());
 assert.equal(view.at(.49).touches,0);assert.ok(view.at(.49).instances.every(x=>x.points===null));
 assert.ok(view.at(.5).instances[0].touchMarker);assert.equal(view.at(.62).instances[0].touchMarker,null);
 const echo=view.at(6.5);assert.ok(echo.instances[1].touchMarker);assert.equal(echo.instances[0].touchMarker,null);assert.equal(echo.instances[2].points,null);
 assert.ok(echo.instances[0].amplitudesM.some(x=>x>0));assert.ok(echo.instances[0].points);
});
test('wrong body, local index, order, origin or strength cannot partially commit a batch',()=>{
 const source=evidence();
 for(const mutate of [x=>x.body=0,x=>x.index++,x=>x.origin='guest',x=>x.frame++,x=>x.strength=.099]){
  const view=createContinuousEnsembleView(),events=structuredClone(source);mutate(events[4]);assert.throws(()=>view.accept(events),/score/);assert.deepEqual(view.accepted,[]);
  view.accept(source);assert.equal(view.accepted.length,25);assert.throws(()=>view.accept([source[0]]));
 }
 const view=createContinuousEnsembleView(),input=structuredClone(source.slice(0,1));view.accept(input);input[0].body=2;const copied=view.accepted;copied.length=0;assert.equal(view.accepted[0].body,0);
 assert.throws(()=>view.end(0));assert.throws(()=>view.at(NaN));assert.throws(()=>view.at(49));
});
test('Quiet fades the picture without damping the continuing modeled response',()=>{
 const p=createContinuousEnsemblePerformance(),view=createContinuousEnsembleView();p.start();while(p.frame<48000)view.accept(p.process(new Float32Array(Math.min(4096,48000-p.frame))));
 view.accept(p.quiet());const before=view.at(1.01).instances;view.end(48000);const after=view.at(1.01).instances;
 before.forEach((body,i)=>{assert.deepEqual(body.points,after[i].points);assert.ok(after[i].endingOpacity<1);});assert.ok(view.at(1.025).instances.every(x=>x.endingOpacity===0));
 assert.throws(()=>view.end(48001));
});
test('held camera contains all three bodies and declared response bounds at wide and narrow aspects',()=>{
 const view=createContinuousEnsembleView(),height=.0001*100*view.magnification;
 for(const aspect of [1.6,1,.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect),target=new T.Vector3(...view.layout.camera.target),direction=new T.Vector3(...view.layout.camera.direction).normalize();
  camera.position.copy(target).addScaledVector(direction,view.layout.camera.radius/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
  for(const body of view.layout.instances)for(const x of [-3,body.bodyMm/10])for(const y of [0,3.5-height,3.5+height])for(const z of [-2,2]){
   const point=new T.Vector3(body.position[0]+x,body.position[1]+y,body.position[2]+z).project(camera);assert.ok(Math.abs(point.x)<.95&&Math.abs(point.y)<.95&&point.z>-1&&point.z<1);
  }
 }
});

test('guest impulses remain on their chosen bodies with atomic due-score ordering',()=>{
 const p=createContinuousEnsemblePerformance(),view=createContinuousEnsembleView(),models=view.plan.bodies.map(b=>createTineImpulse(requestForTineDesign(b).geometry));p.start();
 view.accept(p.tryGuest(2,.05).events);view.accept(p.tryGuest(0,-.025).events);
 assert.equal(view.at(0).instances[2].touchMarker.origin,'guest');assert.equal(view.at(0).instances[0].touchMarker.origin,'guest');assert.equal(view.at(0).instances[1].points,null);
 const target=p.plan.sections[1].events[0].frame;while(p.frame<target)view.accept(p.process(new Float32Array(Math.min(4096,target-p.frame))));
 const accepted=p.tryGuest(0,.025).events,before=view.accepted;assert.throws(()=>view.accept(accepted.slice().reverse()),/due/);assert.deepEqual(view.accepted,before);view.accept(accepted);
 while(p.state!=='ended')view.accept(p.process(new Float32Array(1001)));
 const picture=view.at(48),snapshots=p.snapshot();assert.equal(picture.touches,28);
 picture.instances.forEach((body,i)=>models[i].modes.forEach((m,j)=>{const state=snapshots[i].body.modes[j],expected=Math.hypot(state.displacementM,(state.velocityMPerS+m.gamma*state.displacementM)/m.omegaD);assert.ok(Math.abs(body.amplitudesM[j]-expected)<1e-15);}));
 assert.equal(view.accepted.filter(e=>e.origin==='guest').length,3);
});
