import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingArrangement} from '../src/living/arrangement.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {createLivingResponse} from '../src/living/response.js';
import {createTineDesign} from '../src/tine/address.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:24000,strength:.1},{frame:55200,strength:.025}],fadeStart:190800};
test('each body uses its own local event clock, clears at its ending and returns exactly',()=>{
 const plan=createLivingArrangement(source),view=createLivingArrangementView(plan),rate=plan.sampleRate;
 assert.equal(view.at(0).touches,0);assert.equal(view.at(.5-1/rate).bodies[0].touched,false);assert.equal(view.at(.5).bodies[0].touched,true);
 assert.deepEqual(view.at(.9).bodies[0],view.at(plan.returnStart/rate+.9).bodies[0]);
 for(const v of plan.voices){
  const exact=createLivingResponse(plan.bodies[v.body].design,rate);source.events.forEach(e=>exact.accept(e));
  const at=view.at((v.startFrame+30000)/rate);
  assert.deepEqual(at.bodies[v.body].points,exact.at(((v.startFrame+30000)/rate*rate-v.startFrame)/rate).points);
 }
 const overlap=view.at((plan.voices[3].startFrame+60000)/rate);assert.ok(overlap.bodies.every(b=>b.touched&&b.points));assert.equal(overlap.part,'answer');
 const gap=view.at(plan.returnStart/rate-.1);assert.ok(gap.bodies.every(b=>b.points===null&&!b.touched));
 const end=view.at(plan.frames/rate);assert.equal(end.touches,10);assert.ok(end.bodies.every(b=>b.points===null));assert.throws(()=>view.at(NaN));
});
