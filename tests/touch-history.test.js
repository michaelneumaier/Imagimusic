import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchSession} from '../src/touch/session.js';
import {getLoomJourney} from '../src/listen/journeys.js';
import {prepareTouchRecord} from '../src/touch/return-preparation.js';
import {prepareTouchHistory,TOUCH_HISTORY_MAX_POINTS} from '../src/touch/history.js';
const session=(sampleRate=8000)=>createTouchSession(getLoomJourney('distant-cousins').settings,sampleRate);
test('history preserves exact gestures and one pair of boundary sides for simultaneous strikes',()=>{
 const s=session();s.strike({frame:0,body:0,velocity:.4});s.strike({frame:5704,body:0,velocity:.2});s.strike({frame:5704,body:1,velocity:.2});
 const source=s.finish(8000),before=structuredClone(source),h=prepareTouchHistory(source);
 assert.deepEqual(source,before);assert.deepEqual(h.record,source);assert.equal(h.duration,prepareTouchRecord(source).duration);
 const pair=h.points.filter(p=>p.time===5704/8000);assert.deepEqual(pair.map(p=>p.side),['before','at']);
 assert.deepEqual(pair[0].envelope,s.visual(5704/8000-1e-9).envelope);assert.deepEqual(pair[1].envelope,s.visual(5704/8000).envelope);
 assert.equal(h.gestures.length,3);assert.equal(h.gestures[1].time,h.gestures[2].time);
 assert.deepEqual(h.points.at(-1).envelope,[0,0]);assert.equal(h.points.at(-1).time,h.duration);
 h.record.events[0].velocity=1;h.gestures[1].body=1;assert.deepEqual(source,before);
});
test('saved Quiet preserves later gesture metadata without extending the output history',()=>{
 const s=session();s.strike({frame:0,body:0,velocity:.3});s.strike({frame:5704,body:1,velocity:.3});s.strike({frame:6400,body:0,velocity:.1});
 const record=s.finish(5600,200),h=prepareTouchHistory(record);
 assert.equal(h.duration,.725);assert.deepEqual(h.gestures.map(g=>g.withinOutput),[true,true,false]);
 assert.ok(h.points.some(p=>p.time===.7));assert.ok(h.points.some(p=>p.time===.713));assert.ok(h.points.every(p=>p.time<=.725));
 assert.deepEqual(h.points.at(-1).envelope,[0,0]);
});
test('longest gesture span has bounded samples and rejects unsupported rate or oversized return audio',()=>{
 const s=session();for(let i=0;i<128;i++)assert.equal(s.strike({frame:Math.round(i*120*8000/127),body:i%2,velocity:.05}).accepted,true);
 const record=s.snapshot(),h=prepareTouchHistory(record,{hz:120});
 assert.ok(h.points.length<TOUCH_HISTORY_MAX_POINTS);assert.equal(h.gestures.length,128);assert.ok(h.duration>120);
 for(let i=1;i<h.points.length;i++)assert.ok(h.points[i].time>=h.points[i-1].time);
 assert.throws(()=>prepareTouchHistory(record,{hz:Infinity}),/30, 60 or 120/);
 const high=structuredClone(record);high.sampleRate=192000;high.events=high.events.map(e=>({...e,frame:e.frame*24}));
 assert.throws(()=>prepareTouchHistory(high),/8 million/);
});
