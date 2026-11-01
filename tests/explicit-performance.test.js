import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PATCH,frequency,NOTES,tineModes} from '../src/model.js';
import {createPerformanceFromEvents} from '../src/stage/performance.js';
import {createStageFrames} from '../src/stage/frame.js';
const score=[{id:'answer',family:'bellows',time:2,velocity:.4,noteHz:220,noteOff:3},{id:'opening',family:'garden',slot:2,time:.35,velocity:.6},{id:'turn',family:'tine',time:1,velocity:.3}];
test('explicit score compiles fixed resonators and pitched bellows into shared seekable state',()=>{
 for(const sr of [44100,48000]){
  const p=createPerformanceFromEvents(DEFAULT_PATCH,score,sr);
  assert.deepEqual(p.events.map(e=>e.voice.scoreId),['opening','turn','answer']);
  assert.equal(p.events[0].voice.noteHz,frequency(NOTES[2]));assert.equal(p.events[1].voice.noteHz,tineModes(DEFAULT_PATCH)[0].frequency);
  assert.equal(p.events[2].voice.noteHz,220);assert.equal(p.events[2].voice.id,1);
  const frames=createStageFrames(p),camera={mode:'follow',position:[9,6,12],target:[0,1,0]};
  assert.equal(frames.sample(p.duration,camera).voices.length,0);
  assert.ok(frames.sample(.35,camera).stage.performers.actors.some(a=>a.eventId));
  assert.deepEqual(createPerformanceFromEvents(DEFAULT_PATCH,score,sr),p);
 }
 assert.equal(score[0].id,'answer');
});
test('explicit bellows notes retain score IDs through deterministic six-slot stealing',()=>{
 const events=Array.from({length:8},(_,i)=>({id:`b${i}`,family:'bellows',time:1+i*.05,noteOff:3,velocity:.5,noteHz:220+i*20}));
 const p=createPerformanceFromEvents(DEFAULT_PATCH,events);
 assert.equal(p.snapshots.bellows.voices[0].stolenAt,1.3);
 assert.deepEqual(p.events.map(e=>e.voice.scoreId),events.map(e=>e.id));
 assert.deepEqual(p.events.map(e=>e.voice.slot),[0,1,2,3,4,5,0,1]);
});
test('explicit score rejects ambiguous pitch and malformed timing before constructing voices',()=>{
 for(const bad of [{...score[1],noteHz:440},{...score[2],slot:0},{...score[0],noteOff:1},{...score[1],slot:8},{...score[1],time:NaN},{...score[1],velocity:0},{...score[0],noteHz:24000}])assert.throws(()=>createPerformanceFromEvents(DEFAULT_PATCH,[bad]));
 assert.throws(()=>createPerformanceFromEvents(DEFAULT_PATCH,[score[1],score[1]]));
 assert.throws(()=>createPerformanceFromEvents(DEFAULT_PATCH,score,0));
 assert.equal(createPerformanceFromEvents(DEFAULT_PATCH,[]).duration,.05);
});
