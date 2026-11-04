import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {createLivingJourneyView} from '../src/living/journey-view.js';
import {createLivingJourneyLayout} from '../src/living/journey-layout.js';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {livingStrikerPose} from '../src/living/striker-geometry.js';

test('held journey camera contains body bounds, sampled response veils and all contact heads',()=>{
 for(const make of [createLivingJourneyStudy,createLivingConnectedJourneyStudy,createLivingEvolvingJourneyStudy])for(const seed of [42,2950288811]){
  const journey=make(seed),view=createLivingJourneyView(journey),layout=createLivingJourneyLayout(view.allocation);
  assert.equal(new Set(layout.instances.map(i=>i.position.join(','))).size,layout.instances.length);
  for(const aspect of [16/10,1,.6]){
   const camera=new T.PerspectiveCamera(34,aspect,.1,220),vertical=34*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect);
   const target=new T.Vector3(...layout.camera.target),direction=new T.Vector3(...layout.camera.direction).normalize();
   camera.position.copy(target).addScaledVector(direction,layout.camera.radius/Math.sin(Math.min(vertical,horizontal)));camera.lookAt(target);camera.updateMatrixWorld();
   const check=(position,offset)=>{const p=new T.Vector3(...position).add(new T.Vector3(...offset)).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1,`outside framing: ${p.toArray()}`);};
   for(const instance of layout.instances)for(const x of [-3,instance.bodyMm/10])for(const y of [-.1,6])for(const z of [-1.2,1.6])check([x,y,z],instance.position);
   const moments=[...new Set(view.score.passes.flatMap(p=>p.touches.flatMap(e=>[e.frame/journey.sampleRate,(e.frame+4800)/journey.sampleRate])))];
   for(const seconds of moments){
    const frame=view.at(seconds);
    for(const actor of frame.performers){const pose=livingStrikerPose(actor.bodyMm,actor.down,actor.lane,actor.headRadius);for(const dx of [-actor.headRadius,actor.headRadius])for(const dy of [-actor.headRadius,actor.headRadius])for(const dz of [-actor.headRadius,actor.headRadius])check([pose.head[0]+dx,pose.head[1]+dy,pose.head[2]+dz],layout.instances[actor.body].position);}
    for(const instance of frame.instances)for(const point of instance.points??[])for(const sign of [-1,1])check([point.u*instance.bodyMm/10,3.5+sign*point.boundM*1e7,.51],layout.instances[instance.id].position);
   }
  }
 }
});
