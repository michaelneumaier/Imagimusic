import test from 'node:test';
import assert from 'node:assert/strict';
import {solveKeeperArm} from '../src/stage/keeper-rig.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('keeper articulation preserves contact and both link lengths throughout a strike',()=>{
 for(let step=0;step<=100;step++){
  const shoulder=[-.8,.3,0],hand=[-.3+step/200,.5+Math.sin(step/100)*.2,0];
  const pose=solveKeeperArm(shoulder,hand,.6,.55);
  assert.ok(pose);assert.deepEqual(pose.hand,hand);
  assert.ok(Math.abs(distance(pose.shoulder,pose.elbow)-.6)<1e-12);
  assert.ok(Math.abs(distance(pose.hand,pose.elbow)-.55)<1e-12);
  assert.deepEqual(solveKeeperArm(shoulder,hand,.6,.55),pose);
 }
});
test('parallel bend hints resolve deterministically; unreachable contacts are explicit',()=>{
 const pose=solveKeeperArm([0,0,0],[0,1,0],.75,.75,[0,1,0]);
 assert.ok(pose.elbow.every(Number.isFinite));assert.ok(Math.abs(distance(pose.hand,pose.elbow)-.75)<1e-12);
 assert.equal(solveKeeperArm([0,0,0],[3,0,0],1,1),null);
 assert.equal(solveKeeperArm([0,0,0],[.1,0,0],1,.5),null);
 assert.equal(solveKeeperArm([0,0,0],[0,0,0],1,1),null);
 assert.throws(()=>solveKeeperArm([0,0,0],[1,0,0],-1,1));
});
