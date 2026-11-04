import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {createContinuousEnsembleReplayView} from '../src/living/continuous-ensemble-replay-view.js';
import {validateContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createContinuousTineKernel} from '../src/living/continuous-tine-kernel.js';
function fixture(sampleRate=48000){return {kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:[60,85,120].map((lengthMm,i)=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign({lengthMm,widthMm:[5,10,20][i],activation:[.25,.85,1][i],pickup:.5}),sampleRate,fadeStart:2*sampleRate,events:[{frame:0,strength:.02,origin:'guest'},{frame:0,strength:-.005,origin:'score'},{frame:sampleRate,strength:.01,origin:'guest'}]}))};}
test('saved design responses agree with streamed physical states at both rates, including simultaneous signed touches',()=>{
 for(const sampleRate of [44100,48000]){
  const record=validateContinuousEnsembleRecord(fixture(sampleRate)),view=createContinuousEnsembleReplayView(record),scratch=new Float32Array(1001);
  const references=record.records.map(r=>{const {geometry,options}=requestForTineDesign(r.design);return {kernel:createContinuousTineKernel(geometry,{...options,sampleRate}),model:createTineImpulse(geometry),next:0};});
  for(const target of [0,1,sampleRate/2,sampleRate,sampleRate+1,2*sampleRate,view.frames]){
   const actual=view.at(target/sampleRate);
   references.forEach(({kernel,model},body)=>{
    const events=record.records[body].events,ref=references[body];
    const advance=frame=>{while(kernel.frame<frame)kernel.process(scratch.subarray(0,Math.min(scratch.length,frame-kernel.frame)));};
    while(events[ref.next]?.frame<=target){const event=events[ref.next++];advance(event.frame);kernel.strike(event.strength);}advance(target);
    model.modes.forEach((m,i)=>{const s=kernel.snapshot().modes[i],expected=Math.hypot(s.displacementM,(s.velocityMPerS+m.gamma*s.displacementM)/m.omegaD);assert.ok(Math.abs(actual.instances[body].amplitudesM[i]-expected)<1e-15);});
   });
  }
  assert.equal(view.at(0).touches,6);assert.equal(view.at(view.duration).touches,9);assert.ok(view.at(view.duration).instances.every(x=>x.endingOpacity===0));
  assert.deepEqual(view.layout.instances.map(x=>[x.bodyMm,x.bodyWidthMm]),[[60,5],[85,10],[120,20]]);
 }
});
test('seeking has no stale state and markers follow the stored activation and audible time',()=>{
 const input=fixture();input.records.forEach(r=>r.events=r.events.slice(2));const view=createContinuousEnsembleReplayView(validateContinuousEnsembleRecord(input));
 const before=view.at(.99);assert.ok(before.instances.every(x=>x.points===null));
 assert.deepEqual(view.at(1).instances.map(x=>x.touchMarker.activation),[.25,.85,1]);assert.ok(view.at(1.12).instances.every(x=>x.touchMarker===null));
 view.at(view.duration);assert.deepEqual(view.at(.99),before);assert.equal(view.at(1).touches,3);
});
test('structural copy isolates inputs and refuses incompatible clocks, designs and times',()=>{
 const input=fixture(),view=createContinuousEnsembleReplayView(validateContinuousEnsembleRecord(input)),before=view.at(0);
 input.records[0].events[0].strength=.1;input.records[0].design={...input.records[0].design,lengthMm:100};assert.deepEqual(view.at(0),before);assert.ok(Object.isFrozen(view.record.records[0].events[0]));
 for(const mutate of [x=>x.mixGain=1,x=>x.records[1].sampleRate=44100,x=>x.records[2].fadeStart++,x=>x.records[0].design.lengthMm=61,x=>x.records[0].events[0].extra=true]){const bad=structuredClone(fixture());mutate(bad);assert.throws(()=>createContinuousEnsembleReplayView(bad));}
 for(const time of [-1,NaN,Infinity,view.duration+.01])assert.throws(()=>view.at(time));
});
test('held layout contains admitted body lengths and response envelope at narrow and wide aspects',()=>{
 const input=fixture();input.records.forEach(r=>r.design={...r.design,lengthMm:120,widthMm:20});const view=createContinuousEnsembleReplayView(validateContinuousEnsembleRecord(input)),height=.0001*100*view.magnification;
 for(const aspect of [1.6,1,.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect),target=new T.Vector3(...view.layout.camera.target),direction=new T.Vector3(...view.layout.camera.direction).normalize();
  camera.position.copy(target).addScaledVector(direction,view.layout.camera.radius/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
  for(const body of view.layout.instances)for(const x of [-3,12])for(const y of [0,3.5-height,3.5+height])for(const z of [-2,2]){const p=new T.Vector3(body.position[0]+x,body.position[1]+y,body.position[2]+z).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1);}
 }
});
