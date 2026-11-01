import test from 'node:test';
import assert from 'node:assert/strict';
import {createLoomScene,loomSceneFrame,applyLoomScene,LOOM_BINDINGS} from '../src/loom/scene.js';
import {createLoomPerformance,loomPerformanceFrame} from '../src/loom/performance.js';
import {explainBinding} from '../src/bindings.js';
const pose=scene=>({bodies:scene.bodies.map(b=>[b.body.scale.x,b.body.material.emissiveIntensity,b.striker.position.y]),bridge:scene.bridge.material.opacity});
test('Loom declared bindings reproduce poses after arbitrary seeks and explain actual values',()=>{
 const p=createLoomPerformance(),scene=createLoomScene(),fresh=createLoomScene();
 const frame=t=>loomSceneFrame(loomPerformanceFrame(p,t),p.settings);
 for(const t of [0,.2,.35,.5,1,2,10,p.duration]){
  const state=frame(t),applied=applyLoomScene(state,scene);assert.ok(applied.every(b=>!b.missing));
  for(const binding of LOOM_BINDINGS){const explained=explainBinding(binding,state,{loom:p.settings});assert.equal(explained.value,applied.find(a=>a.id===binding.id).value);}
 }
 for(const t of [2,.35,.1,10,0]){applyLoomScene(frame(t),scene);applyLoomScene(frame(t),fresh);assert.deepEqual(pose(scene),pose(fresh));}
 const atStrike=frame(.35);assert.equal(atStrike.stage.loom.bodies[0].reach,1);
 applyLoomScene(atStrike,scene);assert.ok(Math.abs(scene.bodies[0].striker.position.y-2.47)<1e-12);
 applyLoomScene(loomSceneFrame(loomPerformanceFrame(p,.35),p.settings,{active:false}),scene);
 assert.deepEqual(pose(scene).bodies,[[.8,0,2.7],[.8,0,2.7]]);
});
test('zero coupling dims the bridge; fast exchange keeps its mean-level flag',()=>{
 const p=createLoomPerformance({coupling:0}),scene=createLoomScene();
 const state=loomSceneFrame(loomPerformanceFrame(p,.5),p.settings);applyLoomScene(state,scene);
 assert.equal(scene.bridge.material.opacity,.08);assert.equal(state.stage.loom.bodies[1].envelope,0);
 const fast=createLoomPerformance({detune:120});assert.equal(loomSceneFrame(loomPerformanceFrame(fast,.5),fast.settings).stage.loom.averaged,true);
});
