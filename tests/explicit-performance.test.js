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

test('per-note strike positions change mode weights without retuning the fixed body',async()=>{
 const {modesForVoice}=await import('../src/model.js');
 for(const family of ['garden','tine']){
  const event={id:'position',family,time:.35,velocity:.7,...(family==='garden'?{slot:2}:{})};
  const a=createPerformanceFromEvents(DEFAULT_PATCH,[{...event,position:.1}]).events[0].voice;
  const b=createPerformanceFromEvents(DEFAULT_PATCH,[{...event,position:.8}]).events[0].voice;
  assert.equal(a.position,.1);assert.equal(b.position,.8);
  assert.deepEqual(a.modes.map(m=>m.frequency),b.modes.map(m=>m.frequency));
  assert.notDeepEqual(a.modes.map(m=>m.amplitude),b.modes.map(m=>m.amplitude));
  const expected=modesForVoice(a.slot,DEFAULT_PATCH,48000,{position:.1,velocity:.7});
  assert.deepEqual(a.modes,expected.map(({frequency,amplitude,decay})=>({frequency,amplitude,decay})));
  assert.equal(createPerformanceFromEvents(DEFAULT_PATCH,[event]).events[0].voice.position,DEFAULT_PATCH.strikePosition);
  for(const position of [-.1,1.1,NaN,'0.5',null])assert.throws(()=>createPerformanceFromEvents(DEFAULT_PATCH,[{...event,position}]));
 }
});

test('explicit child timing places Loom and FM on the authored timeline and preserves natural tails',async()=>{
 const {attachComposition,DEFAULT_COMPOSITION}=await import('../src/stage/composition.js');
 const {DEFAULT_TENSIONER}=await import('../src/fm.js');
 const base=createPerformanceFromEvents(DEFAULT_PATCH,score);
 const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,fm:{enabled:true,settings:{...DEFAULT_TENSIONER}}};composition.loom.enabled=true;
 const overrides={loomScore:[{time:20,body:1,velocity:.5},{time:25,body:0,velocity:.3}],fmTime:30};
 const p=attachComposition(base,composition,overrides);
 assert.equal(p.fm.time,30);assert.deepEqual(p.loom.events.map(e=>[e.time,e.body,e.velocity]),[[20,1,.5],[25,0,.3]]);
 assert.equal(p.duration,Math.max(base.duration,p.loom.duration,p.fm.duration));
 overrides.loomScore[0].time=1;assert.equal(p.loom.events[0].time,20);
 for(const bad of [{fmTime:NaN},{fmTime:-1},{fmTime:null},{loomScore:[]},{loomScore:null},{typo:1}])assert.throws(()=>attachComposition(base,composition,bad));
});
