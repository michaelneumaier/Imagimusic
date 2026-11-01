import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createAuthoredPerformance} from '../src/stage/authored-performance.js';
import {createStageFrames} from '../src/stage/frame.js';
const recipe={events:[{id:'garden:opening:1',family:'garden',slot:2,time:.35,velocity:.5,position:.25},{id:'bellows:exchange:1',family:'bellows',time:4,noteHz:196,noteOff:6,velocity:.4},{id:'tine:release:1',family:'tine',time:10,velocity:.25}],loomScore:[{time:8,body:0,velocity:.5},{time:12,body:1,velocity:.4}],fmTime:9,holdUntil:20};
const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,loom:{...DEFAULT_COMPOSITION.loom,enabled:true},fm:{enabled:true,settings:{...DEFAULT_TENSIONER}}};
test('authored recipe uses explicit child entrances and retains every natural tail before a final hold',()=>{
 for(const sr of [44100,48000]){
  const p=createAuthoredPerformance(DEFAULT_PATCH,recipe,composition,sr);
  assert.equal(p.fm.time,9);assert.deepEqual(p.loom.events.map(e=>e.time),[8,12]);
  assert.ok(p.duration>=Math.max(...p.events.map(e=>e.voice.end),p.fm.duration,p.loom.duration,20));
  const frames=createStageFrames(p),camera={mode:'manual',position:[9,6,12],target:[0,1,0]};
  const end=frames.sample(p.duration,camera);
  assert.equal(end.voices.length,0);assert.equal(end.stage.tensioner.amplitude,0);
  assert.ok(end.stage.loom.bodies.every(b=>b.envelope===0));
  const held=createAuthoredPerformance(DEFAULT_PATCH,{...recipe,holdUntil:p.duration+8},composition,sr);
  assert.equal(held.duration,p.duration+8);assert.deepEqual(held.events,p.events);
 }
});
test('disabled optional instruments cannot silently replace authored timing with the legacy patterns',()=>{
 const base=createAuthoredPerformance(DEFAULT_PATCH,{events:recipe.events,holdUntil:20});
 assert.equal(base.fm,undefined);assert.equal(base.loom,undefined);
 assert.throws(()=>createAuthoredPerformance(DEFAULT_PATCH,{events:recipe.events,holdUntil:20},composition),/explicit/);
 assert.throws(()=>createAuthoredPerformance(DEFAULT_PATCH,{...recipe,holdUntil:NaN},composition));
 assert.throws(()=>createAuthoredPerformance(DEFAULT_PATCH,{...recipe,extra:true},composition));
 const empty=createAuthoredPerformance(DEFAULT_PATCH,{events:[],holdUntil:8});assert.equal(empty.duration,8);
});
