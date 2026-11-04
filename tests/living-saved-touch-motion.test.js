import test from 'node:test';
import assert from 'node:assert/strict';
import {createSavedTouchMotion,savedTouchPose,SAVED_TOUCH_MOTION} from '../src/living/saved-touch-motion.js';
import {createTineDesign} from '../src/tine/address.js';
import {validateContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
const fixture=()=>({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:[60,85,120].map((lengthMm,i)=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign({lengthMm,widthMm:[5,10,20][i],activation:[0,.25,1][i]}),sampleRate:48000,fadeStart:96000,events:[{frame:24000,strength:.01,origin:'score'}]}))});
test('cue contact meets the actual saved activation and blade surface across design limits',()=>{
 for(const lengthMm of [60,85,120])for(const activation of [0,.25,.85,1]){
  const design=createTineDesign({lengthMm,activation}),pose=savedTouchPose(design,1);
  assert.ok(Math.abs(pose.head[0]-activation*lengthMm/10)<1e-12);assert.ok(Math.abs(pose.head[1]-pose.headRadius-3.55)<1e-12);assert.equal(pose.head[2],0);
  assert.ok(savedTouchPose(design,0).head[1]>pose.head[1]);
 }
 for(const down of [-.1,1.1,NaN,Infinity])assert.throws(()=>savedTouchPose(createTineDesign(),down));
});
test('one bounded cue per body anticipates accepted saved touches and returns to rest',()=>{
 const source=validateContinuousEnsembleRecord(fixture()),motion=createSavedTouchMotion(source);
 assert.deepEqual(motion.at(.32),[]);assert.ok(motion.at(.32001).every(p=>p.opacity<.001));assert.equal(motion.at(.4).length,3);assert.ok(motion.at(.4).every(p=>p.down>0&&p.down<1));assert.ok(motion.at(.5).every(p=>p.down===1));assert.deepEqual(motion.at(.72),[]);
 assert.equal(motion.kind,SAVED_TOUCH_MOTION.kind);assert.deepEqual(motion.at(.4),motion.at(.4));assert.throws(()=>motion.at(-1));assert.throws(()=>motion.at(motion.duration+1));
});
test('dense and simultaneous histories stay bounded and continuous without inventing separate mechanisms',()=>{
 const source=fixture();source.records.forEach(body=>body.events=[{frame:24000,strength:.01,origin:'score'},{frame:24000,strength:-.005,origin:'guest'},{frame:28800,strength:.01,origin:'guest'}]);
 const admitted=structuredClone(validateContinuousEnsembleRecord(source)),motion=createSavedTouchMotion(admitted);assert.ok(motion.at(.5).every(p=>p.group.count===2&&p.group.firstIndex===0&&p.group.lastIndex===1));
 let previous=0;for(let frame=15000;frame<=40000;frame++){const poses=motion.at(frame/48000),down=poses[0]?.down??0;assert.ok(poses.length<=3);assert.ok(down>=0&&down<=1);assert.ok(Math.abs(down-previous)<.001);previous=down;}
 const before=motion.at(.5);admitted.records[0].events[0].frame=0;assert.deepEqual(motion.at(.5),before);
});
test('an immediate recorded ending fades cues without manufacturing later touches',()=>{
 const source=fixture();source.records.forEach(body=>{body.events=[{frame:0,strength:.01,origin:'guest'}];body.fadeStart=0;});const motion=createSavedTouchMotion(validateContinuousEnsembleRecord(source));
 assert.equal(motion.at(0).length,3);assert.ok(motion.at(.0125).every(p=>p.opacity>0&&p.opacity<.51));assert.deepEqual(motion.at(motion.duration),[]);
});
