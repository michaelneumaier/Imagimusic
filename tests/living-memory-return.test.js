import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryReturnStudy,createMemoryReturnPerformance} from '../src/living/memory-return-study.js';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
const guests=[{frame:48000,strength:.025},{frame:52800,strength:.1},{frame:86400,strength:.05}];
function perform(factory,events=[],blockSize=128){
 const p=factory(42),out=new Float32Array(p.plan.frames);let next=0;p.start();
 while(p.state!=='ended'){
  while(events[next]?.frame===p.frame){assert.equal(p.tryGuest(events[next++].strength).admitted,true);}
  const end=Math.min(out.length,p.frame+blockSize,events[next]?.frame??Infinity);p.process(out.subarray(p.frame,end));
 }
 return {p,out,record:p.record()};
}
test('no participation preserves the complete established unattended score sample-for-sample',()=>{
 const original=perform(createContinuousReturnPerformance),memory=perform(createMemoryReturnPerformance);
 assert.deepEqual(memory.out,original.out);assert.deepEqual(memory.record,original.record);assert.deepEqual(memory.p.plan.events,original.p.plan.events);assert.equal(memory.p.memory.sealed,true);
});
test('early accepted rhythm returns twice without rewriting earlier commitments or the home gesture',()=>{
 const original=perform(createContinuousReturnPerformance,guests),memory=perform(createMemoryReturnPerformance,guests,1001),plan=memory.p.plan;
 assert.equal(plan.kind,'imagimusic-memory-return-study');assert.equal(plan.contributions.length,3);
 assert.deepEqual(memory.out.subarray(0,18.5*48000),original.out.subarray(0,18.5*48000));
 assert.notDeepEqual(memory.out.subarray(18.5*48000,19*48000),original.out.subarray(18.5*48000,19*48000));
 for(const [index,gain] of [[3,.65],[6,.85]])assert.deepEqual(plan.sections[index].events,guests.map(e=>({frame:(index*6+.5)*48000+e.frame-guests[0].frame,strength:e.strength*gain})));
 assert.deepEqual(plan.sections.at(-1),original.p.plan.sections.at(-1));
 assert.deepEqual(memory.record.events.filter(e=>e.origin==='score').map(({frame,strength})=>({frame,strength})),plan.events);
 assert.deepEqual(memory.out,renderContinuousTineRecord(memory.record).channels[0]);
 assert.deepEqual(memory.out,perform(createMemoryReturnPerformance,guests,4096).out);
});
test('only first three accepted guests before six seconds shape the later answer',()=>{
 const all=[...guests,{frame:96000,strength:.1},{frame:288000,strength:.05}],result=perform(createMemoryReturnPerformance,all);
 assert.equal(result.record.events.filter(e=>e.origin==='guest').length,5);assert.deepEqual(result.p.plan.contributions.map(e=>e.frame),guests.map(e=>e.frame));
 const late=perform(createMemoryReturnPerformance,[{frame:288000,strength:.05}]);assert.equal(late.p.plan.contributions.length,0);assert.equal(late.p.plan.events.length,25);
 const p=createMemoryReturnPerformance();p.start();p.tryGuest(.05);p.quiet();p.process(new Float32Array(1200));assert.equal(p.record().events.length,1);assert.equal(p.memory.sealed,false);
});
test('longer input spans compress uniformly and malformed memory is refused',()=>{
 const contributions=[{frame:0,strength:.05,index:0,origin:'guest'},{frame:48000,strength:-.1,index:2,origin:'guest'},{frame:240000,strength:.025,index:8,origin:'guest'}];
 const plan=createMemoryReturnStudy(42,{contributions});assert.equal(plan.timeScale,.6);assert.equal(plan.sections[3].events.at(-1).frame-plan.sections[3].events[0].frame,144000);
 contributions[0].strength=.1;assert.equal(plan.contributions[0].strength,.05);assert.ok(Object.isFrozen(plan.sections[3].events[0]));
 for(const bad of [[{...contributions[0],origin:'score'}],[{...contributions[0],frame:288000}],Array(4).fill(contributions[0]),[contributions[2],contributions[0]]])assert.throws(()=>createMemoryReturnStudy(42,{contributions:bad}));
});
test('tiny guest pressure cannot consume recording space needed by either complete score',()=>{
 for(const factory of [createContinuousReturnPerformance,createMemoryReturnPerformance]){
  const p=factory(42),block=new Float32Array(128);let accepted=0,refused=0;p.start();
  while(p.state!=='ended'){if(p.tryGuest(.000001).admitted)accepted++;else refused++;p.process(block);}
  const record=p.record();assert.ok(refused>0);assert.equal(record.events.length,4096);assert.equal(record.events.filter(e=>e.origin==='guest').length,accepted);
  assert.deepEqual(record.events.filter(e=>e.origin==='score').map(({frame,strength})=>({frame,strength})),p.plan.events);
 }
});
