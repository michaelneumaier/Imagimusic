import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleJourneyStudy} from '../src/living/ensemble-journey-study.js';
import {createEnsembleEndingView} from '../src/living/ensemble-ending-view.js';
import {createContinuousTineRelease} from '../src/living/continuous-tine-release.js';
import {createContinuousTineReleaseResponse} from '../src/living/continuous-tine-release-response.js';
import {TINE_PICKUP_GAIN} from '../src/tine/render.js';
const records=createEnsembleJourneyStudy().chapters.map(c=>c.record),releases=records.map((record,c)=>record.records.map(body=>createContinuousTineRelease(body,{startFrame:(c===2?42:45)*48000,addedDecayRate:1}))),checkpoints=JSON.parse(JSON.stringify(releases.map(chapter=>chapter.map(r=>r.checkpoint))));
test('serialized release checkpoint reproduces actual rendered pickup without rendering inside the view',()=>{
 const source=records[0].records[0],checkpoint=checkpoints[0][0],response=createContinuousTineReleaseResponse(source,checkpoint),samples=releases[0][0].render().channels[0];
 for(const frame of [45*48000,45*48000+1,46*48000,47*48000])assert.ok(Math.abs(samples[frame]-TINE_PICKUP_GAIN*response.at(frame/48000).pickupVelocityMPerS)<1e-9);
 const before=response.at(46);checkpoint.modes[0].q+=1;assert.deepEqual(response.at(46),before);checkpoint.modes[0].q-=1;
});
test('output fade leaves the physical picture unchanged; modeled loss follows its own states',()=>{
 const bundle={records,checkpoints:releases.map(c=>c.map(r=>r.checkpoint))},original=createEnsembleEndingView({...bundle,treatment:'original'}),fade=createEnsembleEndingView({...bundle,treatment:'gentler'}),modeled=createEnsembleEndingView({...bundle,treatment:'modeled'});
 for(const seconds of [0,2,44,46,48,94,96,142,144,10]){
  assert.deepEqual(fade.view.at(seconds),original.view.at(seconds));const frame=modeled.view.at(seconds),chapter=frame.chapter,local=seconds-chapter*48;
  frame.instances.forEach((body,i)=>{const release=releases[chapter][i];if(local*48000<release.startFrame)assert.deepEqual(body,original.view.at(seconds).instances[i]);else{const state=release.at(local);assert.deepEqual(body.points,state.points);assert.equal(body.energyJ,state.energyJ);assert.equal(body.releaseEngaged,true);}});
  assert.deepEqual(modeled.motion.at(seconds),original.motion.at(seconds));
 }
 const a=original.view.at(143),b=modeled.view.at(143);assert.ok(b.instances.every((body,i)=>body.points.every((p,j)=>p.boundM<a.instances[i].points[j].boundM||p.boundM===0)));
});
test('checkpoint shape, timing and energy guards reject misleading view states',()=>{
 const source=records[0].records[0],good=releases[0][0].checkpoint;
 for(const change of [c=>c.version=2,c=>c.startFrame=0,c=>c.modes.pop(),c=>c.modes[0].v=NaN,c=>c.modes[0].q=1,c=>c.addedDecayRate=-1]){const c=structuredClone(good);change(c);assert.throws(()=>createContinuousTineReleaseResponse(source,c));}
 assert.throws(()=>createEnsembleEndingView({records,treatment:'unknown'}));assert.throws(()=>createEnsembleEndingView({records,treatment:'modeled',checkpoints:[]}));
});
