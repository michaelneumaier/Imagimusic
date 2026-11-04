import test from 'node:test';import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from '../vendor/three/build/three.module.js';
import {createLivingAttentionView} from '../src/living/attention-view.js';
import {createLivingChoreography} from '../src/living/choreography.js';
import {livingStrikerPose} from '../src/living/striker-geometry.js';
import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from '../src/living/study-fixtures.js';

// Independent perspective projection using the renderer's actual camera optics.
// A cube encloses each spherical head. All eight corners within the frustum
// establish screen containment, but say nothing about other geometry occluding it.
test('every fixture head stays framed through approach, touch and recovery across screen shapes',t=>{
 const fixtures=[...createLivingStudyFixtures(),...createLivingGeneratedStudyFixtures()];
 const positions=[[0,0,0],[-11,0,-4],[10,0,-4]];
 let corners=0,worst={margin:Infinity};
 for(const {id,source} of fixtures)for(const treatment of ['round','spaced']){
  const choreography=createLivingChoreography(source,treatment),plan=choreography.score,view=createLivingAttentionView(plan);
  for(const aspect of [16/9,1,9/16]){
   const camera=new PerspectiveCamera(34,aspect,.1,220),half=Math.min(34*Math.PI/360,Math.atan(Math.tan(34*Math.PI/360)*aspect));
   for(const [body,bodyPlan] of choreography.plans.entries())for(const actor of bodyPlan.actors)for(const assignment of actor.assignments){
    for(const offset of [-.18,-.09,0,.14,.28]){
     const seconds=Math.max(0,Math.min(plan.frames/plan.sampleRate,assignment.noteOn+offset));
     const frame=view.at(seconds),shot=frame.cameraShot,pose=choreography.at(seconds).find(p=>p.id===actor.id);
     assert.ok(body===0||frame.cameraOpen>0,`${id}: answering body hidden`);
     const target=new Vector3(...shot.target),distance=shot.radius/Math.sin(half);
     camera.position.copy(target).add(new Vector3(...shot.direction).normalize().multiplyScalar(distance));camera.lookAt(target);camera.updateMatrixWorld(true);
     const head=livingStrikerPose(plan.bodies[body].design.lengthMm,pose.down,pose.lane,pose.headRadius).head;
     for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
      const point=new Vector3(...head.map((v,k)=>v+positions[body][k]+[x,y,z][k]*pose.headRadius)).project(camera),margin=1-Math.max(Math.abs(point.x),Math.abs(point.y));corners++;
      if(margin<worst.margin)worst={margin,fixture:id,treatment,aspect,seconds,body};
      assert.ok(point.z>-1&&point.z<1,`${id}: near/far clipping`);
      assert.ok(margin>=.05,`${id}/${treatment}/${aspect}/${seconds}: head too close to edge (${margin})`);
     }
    }
   }
  }
 }
 t.diagnostic(JSON.stringify({corners,worst,scope:'Nine fixtures, both scores, three aspects, five sampled phases per assignment. Screen containment only; no occlusion or continuous-path guarantee.'}));
});
