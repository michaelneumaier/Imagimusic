import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {createKeeperProjection,applyKeepers} from '../src/stage/keepers.js';
import {createPerformance} from '../src/stage/performance.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {stagePosition} from '../src/stage/layout.js';

test('Keeper hands coincide with each assigned strike and seek without history',()=>{
 const passage=createPerformance(DEFAULT_PATCH),sample=createKeeperProjection(passage);
 for(const {family,voice} of passage.events.filter(e=>e.family!=='bellows')){
  const frame=sample(voice.noteOn),actor=frame.actors.find(a=>a.eventId===voice.id);
  if(!actor){assert.ok(frame.unplanned.some(e=>e.eventId===voice.id));continue;}
  const anchor=stagePosition(family,voice.slot),position=voice.position;
  const local=family==='garden'?[-.38,position*(3.35-voice.slot*.21),0]:[.2+position*passage.patch.geometry.lengthM*35,.78,0];
  assert.deepEqual(actor.hand,anchor.map((v,i)=>v+local[i]));assert.equal(actor.contact,1);
 }
 const first=passage.events.find(e=>e.family==='garden').voice;
 const approaching=sample(first.noteOn-.09).actors.find(a=>a.eventId===first.id),contact=sample(first.noteOn).actors.find(a=>a.eventId===first.id);
 assert.equal(approaching.shoulder[0],contact.shoulder[0]);assert.notDeepEqual(approaching.elbow,contact.elbow,'arm articulates instead of sliding as a rigid shape');
 const expected=sample(1.2);sample(30);sample(0);assert.deepEqual(sample(1.2),expected);
 const world={scene:new T.Scene()};applyKeepers(world,expected);const count=world.scene.children.length;
 applyKeepers(world,sample(2));assert.equal(world.scene.children.length,count);
 world.scene.updateMatrixWorld(true);for(const body of world.keepers.values())assert.ok(body.hand.matrixWorld.elements.every(Number.isFinite));
});

test('pump crossheads stay on actual bellows lids through attack, sustain, release and idle',async()=>{
 const {createProjection,stageBindings,applyStage}=await import('../src/stage/projection.js');
 const {collectState}=await import('../src/state.js');
 const {gardenBody,choirBody,tineBody}=await import('../src/stage/bodies.js');
 const passage=createPerformance(DEFAULT_PATCH),project=createProjection(DEFAULT_PATCH,{performance:passage});
 const world={scene:new T.Scene(),garden:Array.from({length:8},(_,i)=>gardenBody(i)),choir:Array.from({length:6},(_,i)=>choirBody(i)),tine:tineBody()};
 world.choir.forEach((body,i)=>{body.root.position.fromArray(stagePosition('bellows',i));world.scene.add(body.root);});
 const first=passage.snapshots.bellows.voices[0];
 for(const t of [0,first.noteOn+.01,first.noteOn+.2,first.noteOff+.1,passage.duration]){
  const frame=project(collectState(t,passage.snapshots));applyStage(frame,stageBindings({performers:true}),world);world.scene.updateMatrixWorld(true);
  for(let slot=0;slot<6;slot++){
   const top=new T.Box3().setFromObject(world.choir[slot].bellows).max.y;
   const bottom=new T.Box3().setFromObject(world.keepers.get(`bellows/${slot}`).hand).min.y;
   assert.ok(Math.abs(top-bottom)<1e-7,`lid contact at ${t}, slot ${slot}`);
  }
 }
});
