import test from 'node:test';
import assert from 'node:assert/strict';
import {composeConversation,scheduledEvents,beatSeconds} from '../src/score/conversation.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createScorePerformance} from '../src/stage/score-performance.js';
import {createPerformance} from '../src/stage/performance.js';
import {inspectScoreEvents} from '../src/stage/score-inspection.js';
const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,loom:{...DEFAULT_COMPOSITION.loom,enabled:true},fm:{enabled:true,settings:DEFAULT_TENSIONER}};
const score=composeConversation(),passage=createScorePerformance(DEFAULT_PATCH,score,composition);
test('performer inspection resolves compiled identities to the exact authored event',()=>{
 for(const {family,voice} of passage.events){
  const rows=inspectScoreEvents(passage,'performer/example',voice.noteOn,{family,eventId:voice.id});
  assert.equal(rows.length,1);assert.equal(rows[0].id,voice.scoreId);
  const source=score.events.find(e=>e.id===voice.scoreId);
  assert.equal(rows[0].section,source.id.split(':')[1]);assert.equal(rows[0].anchor,source.anchor);assert.equal(rows[0].weight,source.weight);
 }
 assert.deepEqual(inspectScoreEvents(passage,'performer/example',10,{family:'garden',eventId:null}),[]);
});
test('body inspection includes only active or approaching events and handles child families',()=>{
 for(const {family,voice} of passage.events){
  assert.ok(inspectScoreEvents(passage,`${family}/slot${voice.slot}`,voice.noteOn).some(e=>e.id===voice.scoreId));
 }
 const loom=scheduledEvents(score).filter(e=>e.family==='loom');
 passage.loom.events.forEach((e,i)=>{
  assert.equal(e.time,beatSeconds(score,loom[i].beat));assert.equal(e.body,loom[i].body);
  assert.ok(inspectScoreEvents(passage,`loom/slot${e.body}`,e.time).some(row=>row.id===loom[i].id));
 });
 assert.equal(inspectScoreEvents(passage,'fm/carrier',passage.fm.time)[0].family,'fm');
 for(const target of ['garden/slot2','bellows/slot0','tine/slot8','loom/slot0','fm/carrier']){
  assert.deepEqual(inspectScoreEvents(passage,target,-1),[]);
  assert.deepEqual(inspectScoreEvents(passage,target,passage.duration+1),[]);
 }
 assert.deepEqual(inspectScoreEvents(createPerformance(DEFAULT_PATCH),'garden/slot2',1),[]);
});
